import { BigNumber } from '@ethersproject/bignumber';
import { tryMultiCallCore } from 'hooks/useMulticall2/useMulticall2';
import { useMulticall2Contract } from 'hooks/useContracts/useContracts';
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
import { MoonsamaFilter } from 'ui/MoonsamaFilter/MoonsamaFilter';
import { useMoonsamaAttrIds } from 'hooks/useMoonsamaAttrIdsCallback/useMoonsamaAttrIdsCallback';
import { parseEther } from '@ethersproject/units';
import {
  QUERY_ACTIVE_ORDERS_FOR_FILTER,
  QUERY_ORDERS_FOR_TOKEN,
} from 'subgraph/orderQueries';
import {
  QUERY_ERC721_CONTRACT_DATA,
  QUERY_ERC721_OWNED_ID,
  QUERY_ERC721_NOTOWNED_ID,
} from 'subgraph/erc721Queries';
import request from 'graphql-request';
import { DEFAULT_CHAIN, MARKETPLACE_SUBGRAPH_URLS } from '../../constants';
import { TEN_POW_18 } from 'utils';
import { useRawcollection } from 'hooks/useRawCollectionsFromList/useRawCollectionsFromList';
import { SortOption } from 'ui/Sort/Sort';

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

const chooseMoonsamaAssets = (
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

    if (direction === SortOption.TOKEN_ID_ASC)
      chosenIds = ids.slice(offsetNum, to);
    else chosenIds = [...ids].reverse().slice(offsetNum, to);

    console.log('xxxx', { ids, offsetNum, num, to, chosenIds });
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

    console.log('INDICES', { rnum, num, offsetNum, ids, maxId });
    if (rnum === 0) {
      return [];
    }

    chosenAssets = Array.from({ length: rnum }, (_, i) => {
      let x;
      if (direction === SortOption.TOKEN_ID_ASC) x = offset.add(i).toString();
      else x = (maxId - (offsetNum - minId) - i).toString();

      return {
        assetId: x,
        assetType,
        assetAddress,
        id: getAssetEntityId(assetAddress, x),
      };
    });

    console.log('INDICES 2', { chosenAssets, len: chosenAssets.length });
  }

  return chosenAssets;
};

export const useMoonsamaTokenStaticDataCallbackArrayWithFilter = (
  { assetAddress, assetType }: TokenStaticCallbackInput,
  subcollectionId: string,
  filter: MoonsamaFilter | undefined,
  sortBy: SortOption
) => {
  console.log('useMoonsamaTokenStaticDataCallbackArrayWithFilter', {
    assetAddress,
    assetType,
    filter,
    subcollectionId,
  });
  const { chainId, account } = useActiveWeb3React();
  const multi = useMulticall2Contract();

  const fetchUri = useFetchTokenUriCallback();
  let ids = useMoonsamaAttrIds(filter?.traits);
  let coll = useRawcollection(assetAddress ?? '');
  if (!!subcollectionId && subcollectionId !== '0') {
    ids =
      coll?.subcollections?.find((c: any) => c.id === subcollectionId)
        ?.tokens ?? [];
  }
  const minId = subcollectionId !== '0' ? 0 : coll?.minId ?? 1;
  const maxId = coll?.maxId ?? 1000;

  if (!ids?.length) {
    for (let i = minId; i <= maxId; i++) ids.push(i);
  }

  // console.log('ids1', ids);
  // console.log('coll1', coll);

  const priceRange = filter?.priceRange;
  const selectedOrderType = filter?.selectedOrderType;
  let subgraph = coll ? coll?.subgraph : '';

  const fetchTokenStaticData = useCallback(
    async (
      num: number,
      offset: BigNumber,
      setTake?: (take: number) => void
    ) => {
      if (!assetAddress || !assetType) {
        console.log({ assetAddress, assetType });
        return [];
      }
      const owned: OwnedFilterType | undefined = filter?.owned;
      if (owned != undefined && owned != OwnedFilterType.All) {
        const moonsamaTotalyQuery = QUERY_ERC721_CONTRACT_DATA();
        const moonsamaTotalSupply1 = await request(
          subgraph,
          moonsamaTotalyQuery
        );
        let moonsamaTotalSupply = parseInt(
          moonsamaTotalSupply1.contract.totalSupply
        );
        let res = [],
          tempIds: number[] = [],
          moonsamaQuery: any,
          res1;
        if (moonsamaTotalSupply <= 1000) {
          if (owned === OwnedFilterType.OWNED && account)
            moonsamaQuery = QUERY_ERC721_OWNED_ID(
              0,
              moonsamaTotalSupply,
              account
            );
          else if (owned === OwnedFilterType.NOTOWNED && account)
            moonsamaQuery = QUERY_ERC721_NOTOWNED_ID(
              0,
              moonsamaTotalSupply,
              account
            );
          res1 = await request(subgraph, moonsamaQuery);
          res = res1.tokens;
        } else {
          let from = 0;
          while (from < moonsamaTotalSupply) {
            if (owned === OwnedFilterType.OWNED && account)
              moonsamaQuery = QUERY_ERC721_OWNED_ID(from, 1000, account);
            else if (owned === OwnedFilterType.NOTOWNED && account)
              moonsamaQuery = QUERY_ERC721_NOTOWNED_ID(from, 1000, account);
            let res1 = await request(subgraph, moonsamaQuery);
            for (let i = 0; i < res1.tokens.length; i++)
              res.push(res1.tokens[i]);
            from += 1000;
          }
        }
        for (let i = 0; i < res.length; i++) {
          if (ids.includes(parseInt(res[i].numericId))) tempIds.push(parseInt(res[i].numericId));
        }
        ids = tempIds;
      }

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

        console.log('yolo tryMultiCallCore res', results);
        const staticData = processTokenStaticCallResults(assets, results);
        console.log('staticData', { staticData });

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

      // if we don't have a price range, it's just business as usual
      if (
        sortBy === SortOption.TOKEN_ID_ASC ||
        sortBy === SortOption.TOKEN_ID_DESC
      ) {
        let chosenAssets = chooseMoonsamaAssets(
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
          chosenAssets = chooseMoonsamaAssets(
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
          console.log('statistics', statics);
          let totalLength = num === 1 ? num : ids.length;
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

          chosenAssets = chooseMoonsamaAssets(
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
          if (!chosenAssets || chosenAssets.length === 0) {
            canStop = true;
            setTake?.(pager.toNumber());
          }
        } while (!canStop);
      } else {
        let query = QUERY_ORDERS_FOR_TOKEN(
          assetAddress,
          sortBy === SortOption.PRICE_ASC || sortBy === SortOption.PRICE_DESC
            ? 'price'
            : 'id',
          sortBy === SortOption.PRICE_ASC,
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
          selectedOrderType === OrderType.BUY
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
      // console.log('final result', result);
      let totalLength1 = num === 1 ? num : orders.length;
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
