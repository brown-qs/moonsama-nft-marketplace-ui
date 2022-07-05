import { BigNumber } from '@ethersproject/bignumber';
import { tryMultiCallCore } from 'hooks/useMulticall2/useMulticall2';
import {
  useERC20Contract,
  useMulticall2Contract,
} from 'hooks/useContracts/useContracts';
import {
  getAssetEntityId,
  OrderType,
  parseOrder,
  StringAssetType,
  OwnedFilterType,
} from 'utils/subgraph';
import { useActiveWeb3React } from 'hooks/useActiveWeb3React/useActiveWeb3React';
import { useCallback } from 'react';
import { Asset, Order } from 'hooks/marketplace/types';
import { useFetchTokenUriCallback } from 'hooks/useFetchTokenUri.ts/useFetchTokenUriCallback';
import {
  getTokenStaticCalldata,
  processTokenStaticCallResults,
} from 'utils/calls';
import { PondsamaFilter } from 'ui/PondsamaFilter/PondsamaFilter';
import { parseEther } from '@ethersproject/units';
import {
  QUERY_ACTIVE_ORDERS_FOR_FILTER,
  QUERY_ORDERS_FOR_TOKEN,
  QUERY_PONDSAMA_ACTIVE_ID,
  QUERY_PONDSAMA_TotalSupply,
  QUERY_PONDSAMA_OWNED_ID,
  QUERY_PONDSAMA_NOTOWNED_ID,
} from 'subgraph/orderQueries';
import request from 'graphql-request';
import { DEFAULT_CHAIN, MARKETPLACE_SUBGRAPH_URLS } from '../../constants';
import { TEN_POW_18 } from 'utils';
import { useRawcollection } from 'hooks/useRawCollectionsFromList/useRawCollectionsFromList';
import { SortOption } from 'ui/Sort/Sort';
import React, { useEffect, useState } from 'react';

export interface StaticTokenData {
  asset: Asset;
  name?: string;
  symbol?: string;
  decimals?: number;
  totalSupply?: BigNumber;
  tokenURI?: string;
  contractURI?: string;
}

export type TokenStaticCallbackInput = {
  assetAddress?: string;
  assetType?: StringAssetType;
};

export type TokenStaticFetchInput = {
  num: number;
  offset: BigNumber;
};

const choosePondsamaAssets = (
  assetType: StringAssetType,
  assetAddress: string,
  offset: BigNumber,
  num: number,
  ids: number[],
  minId: number,
  maxId: number,
  direction: SortOption
) => {
  let offsetNum = BigNumber.from(offset).toNumber();
  let chosenAssets: Asset[];

  // in this case offsetnum should be substracted one
  if (ids?.length > 0) {
    //console.log('xxxx')
    if (offsetNum >= ids.length) {
      return [];
    }
    const to = offsetNum + num >= ids.length ? ids.length : offsetNum + num;
    let chosenIds = [];

    if (direction == SortOption.TOKEN_ID_ASC)
      chosenIds = ids.slice(offsetNum, to);
    else chosenIds = [...ids].reverse().slice(offsetNum, to);

    // console.log('xxxx', { ids, offsetNum, num, to, chosenIds });
    chosenAssets = chosenIds.map((x) => {
      return {
        assetId: x.toString(),
        assetType,
        assetAddress,
        id: getAssetEntityId(assetAddress, x),
      };
    });
  } else if (!ids.length) {
    return [];
  } else {
    const rnum =
      maxId && offsetNum + num < maxId ? num : maxId ? maxId - offsetNum : num;

    // console.log('INDICES', { rnum, num, offsetNum, ids, maxId });
    if (rnum == 0) {
      return [];
    }

    chosenAssets = Array.from({ length: rnum }, (_, i) => {
      let x;
      if (direction == SortOption.TOKEN_ID_ASC) x = offset.add(i).toString();
      else x = (maxId - (offsetNum - minId) - i).toString();

      return {
        assetId: x,
        assetType,
        assetAddress,
        id: getAssetEntityId(assetAddress, x),
      };
    });

    // console.log('INDICES 2', { chosenAssets, len: chosenAssets.length });
  }

  return chosenAssets;
};

export const usePondsamaTokenStaticDataCallbackArrayWithFilter = (
  { assetAddress, assetType }: TokenStaticCallbackInput,
  subcollectionId: string,
  filter: PondsamaFilter | undefined,
  sortBy: SortOption
) => {
  console.log('usePondsamaTokenStaticDataCallbackArrayWithFilter', {
    assetAddress,
    assetType,
    filter,
    subcollectionId,
  });
  const { account, chainId } = useActiveWeb3React();
  const multi = useMulticall2Contract();
  const fetchUri = useFetchTokenUriCallback();

  let ids: number[] = [];
  let coll = useRawcollection(assetAddress ?? '');
  let subgraph = coll ? coll?.subgraph : '';

  const minId = subcollectionId !== '0' ? 0 : coll?.minId ?? 1;
  const maxId = coll?.maxId ?? 1000;

  const priceRange = filter?.priceRange;
  const selectedOrderType = filter?.selectedOrderType;
  const fetchTokenStaticData = useCallback(
    async (
      num: number,
      offset: BigNumber,
      setTake?: (take: number) => void
    ) => {
      if (!assetAddress || !assetType) {
        // console.log({ assetAddress, assetType });
        return [];
      }
      const owned: OwnedFilterType | undefined = filter?.owned;
      const pondsamaTotalyQuery = QUERY_PONDSAMA_TotalSupply(assetAddress);
      const pondsamaTotalSupply1 = await request(subgraph, pondsamaTotalyQuery);
      let pondsamaTotalSupply = parseInt(
        pondsamaTotalSupply1.contract.totalSupply
      );
      let res = [],
        pondsamaQuery: any,
        res1;
      if (pondsamaTotalSupply < 1000) {
        if (!owned)
          pondsamaQuery = QUERY_PONDSAMA_ACTIVE_ID(0, pondsamaTotalSupply);
        else if (owned == OwnedFilterType.OWNED && account)
          pondsamaQuery = QUERY_PONDSAMA_OWNED_ID(
            0,
            pondsamaTotalSupply,
            account
          );
        else if (owned == OwnedFilterType.NOTOWNED && account)
          pondsamaQuery = QUERY_PONDSAMA_NOTOWNED_ID(
            0,
            pondsamaTotalSupply,
            account
          );
        else pondsamaQuery = QUERY_PONDSAMA_ACTIVE_ID(0, pondsamaTotalSupply);
        res1 = await request(subgraph, pondsamaQuery);
        res = res1.tokens;
      } else {
        let from = 0;
        while (from < pondsamaTotalSupply) {
          if (!owned) pondsamaQuery = QUERY_PONDSAMA_ACTIVE_ID(from, 1000);
          else if (owned == OwnedFilterType.OWNED && account)
            pondsamaQuery = QUERY_PONDSAMA_OWNED_ID(from, 1000, account);
          else if (owned == OwnedFilterType.NOTOWNED && account)
            pondsamaQuery = QUERY_PONDSAMA_NOTOWNED_ID(from, 1000, account);
          else pondsamaQuery = QUERY_PONDSAMA_ACTIVE_ID(from, 1000);
          let res1 = await request(subgraph, pondsamaQuery);
          for (let i = 0; i < res1.tokens.length; i++) res.push(res1.tokens[i]);
          from += 1000;
        }
      }
      let ids: number[] = [];
      let ponsIdsMeta: number[] = [];
      for (let i = 0; i < res.length; i++) ids.push(res[i].numericId);
      let totalLength =
        res.length % 300
          ? Math.floor(res.length / 300) + 1
          : Math.floor(res.length / 300);
      // console.log('ids1', ids);
      if (filter && filter.dfRange && filter.dfRange.length == 2) {
        for (let k = 0; k < totalLength; k++) {
          let tempIds: number[] = [];
          if (k * 300 + 300 < res.length)
            tempIds = ids.slice(k * 300, k * 300 + 300);
          else if (k * 300 + 300 >= res.length)
            tempIds = ids.slice(k * 300, res.length);
          let chosenAssets = choosePondsamaAssets(
            assetType,
            assetAddress,
            BigNumber.from(0),
            res.length,
            tempIds,
            minId,
            maxId,
            sortBy
          );
          let calls: any[] = [];
          chosenAssets.map((asset, i) => {
            calls = [...calls, ...getTokenStaticCalldata(asset)];
          });
          const results = await tryMultiCallCore(multi, calls);
          if (!results) return [];
          const staticData = processTokenStaticCallResults(
            chosenAssets,
            results
          );
          const metas = await fetchUri(staticData);
          // console.log('metas', metas);
          for (let i = 0; i < metas.length; i++) {
            let flag = true;
            let selectedPondTraits = filter.pondTraits;
            for (let j = 0; j < metas[i].attributes.length; j++) {
              if (
                metas[i].attributes[j].trait_type == 'HP' &&
                (metas[i].attributes[j].value < filter.hpRange[0] ||
                  metas[i].attributes[j].value > filter.hpRange[1])
              ) {
                flag = false;
                break;
              } else if (
                metas[i].attributes[j].trait_type == 'PW' &&
                (metas[i].attributes[j].value < filter?.pwRange[0] ||
                  metas[i].attributes[j].value > filter?.pwRange[1])
              ) {
                flag = false;
                break;
              } else if (
                metas[i].attributes[j].trait_type == 'SP' &&
                (metas[i].attributes[j].value < filter?.spRange[0] ||
                  metas[i].attributes[j].value > filter?.spRange[1])
              ) {
                flag = false;
                break;
              } else if (
                metas[i].attributes[j].trait_type == 'DF' &&
                (metas[i].attributes[j].value < filter?.dfRange[0] ||
                  metas[i].attributes[j].value > filter?.dfRange[1])
              ) {
                flag = false;
                break;
              } else if (selectedPondTraits.length) {
                selectedPondTraits = selectedPondTraits.filter(
                  (e) => e != metas[i].attributes[j].value
                );
              }
            }
            
            if (flag == true && !selectedPondTraits.length) {
              ponsIdsMeta.push(ids[i + k*300]);
            }
          }
        }
        ids = ponsIdsMeta;
      }
      console.log('ids11', ids, ponsIdsMeta);
      const fetchStatics = async (assets: Asset[], orders?: Order[]) => {
        // console.log('fetch statistics');
        console.log('assets', assets);
        if (orders && orders.length !== assets.length) {
          throw new Error('Orders/assets length mismatch');
        }
        let calls: any[] = [];
        assets.map((asset, i) => {
          calls = [...calls, ...getTokenStaticCalldata(asset)];
        });

        const results = await tryMultiCallCore(multi, calls);

        if (!results) {
          return [];
        }

        // console.log('yolo tryMultiCallCore res', results);
        const staticData = processTokenStaticCallResults(assets, results);
        // console.log('staticData', { staticData });

        const metas = await fetchUri(staticData);

        console.log('metas', metas);

        return metas.map((x, i) => {
          return {
            meta: x,
            staticData: staticData[i],
            order: orders?.[i],
          };
        });
      };

      let ordersFetch: any[] = [];

      if (
        sortBy == SortOption.TOKEN_ID_ASC ||
        sortBy == SortOption.TOKEN_ID_DESC
      ) {
        let chosenAssets = choosePondsamaAssets(
          assetType,
          assetAddress,
          offset,
          num,
          ids,
          minId,
          maxId,
          sortBy
        );

        if (
          !priceRange ||
          priceRange.length === 0 ||
          priceRange.length !== 2 ||
          !selectedOrderType
        ) {
          console.log('DEFAULT SEARCH', {
            assetAddress,
            assetType,
            ids,
            num,
            offset: offset?.toString(),
            chosenAssets,
          });

          // console.log('no price range');
          chosenAssets = choosePondsamaAssets(
            assetType,
            assetAddress,
            offset,
            num,
            ids,
            minId,
            maxId,
            sortBy
          );
          const statics = await fetchStatics(chosenAssets);
          let totalLength = num == 1 ? num : ids.length;
          // console.log('totalLength', totalLength, statics);
          return { data: statics, length: totalLength };
        }

        console.log('SEARCH', {
          assetAddress,
          assetType,
          ids,
          num,
          offset: offset?.toString(),
          chosenAssets,
        });

        const rangeInWei = priceRange.map((x) =>
          parseEther(x.toString()).mul(TEN_POW_18)
        );

        let canStop = false;
        let pager = offset;
        do {
          const sgAssets = chosenAssets.map((x) => {
            return x.id;
          });

          let query = QUERY_ACTIVE_ORDERS_FOR_FILTER(
            selectedOrderType,
            JSON.stringify(sgAssets),
            rangeInWei[0].toString(),
            rangeInWei[1].toString()
          );

          const result = await request(
            MARKETPLACE_SUBGRAPH_URLS[chainId ?? DEFAULT_CHAIN],
            query
          );
          console.log('YOLO getOrders', result);
          const orders = result?.orders;

          //console.debug('YOLO getOrders', { orders });

          if (orders && orders.length > 0) {
            ordersFetch = ordersFetch.concat(orders);
          }

          console.log('INDICES 3', {
            orders,
            ordersLength: orders.length,
            ordersFetch,
            ordersFetchLength: ordersFetch.length,
            sgAssets,
            num,
            pager: pager.toString(),
            ids,
            maxId,
          });

          if (ordersFetch.length >= num) {
            canStop = true;
            setTake?.(pager.toNumber());
            continue;
          }
          pager = pager.add(BigNumber.from(num));

          chosenAssets = choosePondsamaAssets(
            assetType,
            assetAddress,
            pager,
            num,
            ids,
            minId,
            maxId,
            sortBy
          );

          //chosenAssets = []
          if (!chosenAssets || chosenAssets.length == 0) {
            canStop = true;
            setTake?.(pager.toNumber());
          }
        } while (!canStop);
      } else {
        let query = QUERY_ORDERS_FOR_TOKEN(
          assetAddress,
          sortBy == SortOption.PRICE_ASC || sortBy == SortOption.PRICE_DESC
            ? 'price'
            : 'id',
          sortBy == SortOption.PRICE_ASC,
          offset.toNumber(),
          num
        );

        const result = await request(
          MARKETPLACE_SUBGRAPH_URLS[chainId ?? DEFAULT_CHAIN],
          query
        );
        console.log('YOLO getOrders', result);
        const orders = result?.orders;

        //console.debug('YOLO getOrders', { orders });

        if (orders && orders.length > 0) {
          ordersFetch = ordersFetch.concat(orders);
        }
      }

      const theAssets: Asset[] = [];
      const orders = ordersFetch.map((x) => {
        const o = parseOrder(x) as Order;
        const a =
          selectedOrderType == OrderType.BUY
            ? (o?.buyAsset as Asset)
            : (o?.sellAsset as Asset);
        theAssets.push({
          assetId: a?.assetId,
          assetType: assetType,
          assetAddress: assetAddress,
          id: getAssetEntityId(assetAddress, a?.assetId),
        });
        return o;
      });

      const result = await fetchStatics(theAssets, orders);
      let totalLength1 = num == 1 ? num : orders.length;
      return { data: result, length: totalLength1 };
    },
    [
      chainId,
      assetType,
      assetAddress,
      JSON.stringify(ids),
      JSON.stringify(priceRange),
      JSON.stringify(selectedOrderType),
      sortBy,
      filter,
    ]
  );

  return fetchTokenStaticData;
};
