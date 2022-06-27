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
} from 'utils/subgraph';
import { useActiveWeb3React } from 'hooks/useActiveWeb3React/useActiveWeb3React';
import { useCallback } from 'react';
import { Asset, Order } from 'hooks/marketplace/types';
import { useFetchTokenUriCallback } from 'hooks/useFetchTokenUri.ts/useFetchTokenUriCallback';
import {
  getTokenStaticCalldata,
  processTokenStaticCallResults,
} from 'utils/calls';
import { Filters } from 'ui/Filters/Filters';
import { PondsamaFilter } from 'ui/PondsamaFilter/PondsamaFilter';
import { useMoonsamaAttrIds } from 'hooks/useMoonsamaAttrIdsCallback/useMoonsamaAttrIdsCallback';
import { parseEther } from '@ethersproject/units';
import { QUERY_USER_ERC721 } from 'subgraph/erc721Queries';
import { QUERY_USER_ERC1155 } from 'subgraph/erc1155Queries';
import {
  QUERY_ACTIVE_ORDERS_FOR_FILTER,
  QUERY_ORDERS_FOR_TOKEN,
  QUERY_ASSETS_BY_PRICE,
  QUERY_PONDSAMA_ACTIVE_ID,
  QUERY_PONDSAMA_TotalSupply,
} from 'subgraph/orderQueries';
import request from 'graphql-request';
import { DEFAULT_CHAIN, MARKETPLACE_SUBGRAPH_URLS } from '../../constants';
import { TEN_POW_18 } from 'utils';
import { useRawcollection } from 'hooks/useRawCollectionsFromList/useRawCollectionsFromList';
import { SortOption } from 'ui/Sort/Sort';
import React, { useEffect, useState } from 'react';
import { browserVersion } from 'react-device-detect';

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

export const useTokenStaticDataCallback = ({
  assetAddress,
  assetType,
}: TokenStaticCallbackInput) => {
  const { chainId } = useActiveWeb3React();
  const multi = useMulticall2Contract();

  const fetchUri = useFetchTokenUriCallback();

  const fetchTokenStaticData = useCallback(
    async (num: number, offset: BigNumber) => {
      if (!assetAddress || !assetType || !num) {
        return [];
      }

      // just because Indexes can be super huge
      const assets: Asset[] = Array.from({ length: num }, (_, i) => {
        const x = offset.add(i).toString();
        return {
          assetId: x,
          assetType,
          assetAddress,
          id: getAssetEntityId(assetAddress, x),
        };
      });

      let calls: any[] = [];
      assets.map((asset, i) => {
        calls = [...calls, ...getTokenStaticCalldata(asset)];
      });

      const results = await tryMultiCallCore(multi, calls);

      if (!results) {
        return [];
      }

      //console.log('yolo tryMultiCallCore res', results);
      const staticData = processTokenStaticCallResults(assets, results);

      const metas = await fetchUri(staticData);

      return metas.map((x, i) => {
        return {
          meta: x,
          staticData: staticData[i],
        };
      });
    },
    [chainId, assetAddress, assetType]
  );

  return fetchTokenStaticData;
};

export const useTokenStaticDataCallbackArray = () => {
  const { chainId } = useActiveWeb3React();
  const multi = useMulticall2Contract();

  const fetchUri = useFetchTokenUriCallback();

  const fetchTokenStaticData = useCallback(
    async (assets: Asset[]) => {
      if (!assets) {
        return [];
      }

      let calls: any[] = [];
      assets.map((asset, i) => {
        calls = [...calls, ...getTokenStaticCalldata(asset)];
      });

      const results = await tryMultiCallCore(multi, calls);

      if (!results) {
        return [];
      }

      //console.log('yolo tryMultiCallCore res', results);
      const staticData = processTokenStaticCallResults(assets, results);

      const metas = await fetchUri(staticData);

      return metas.map((x, i) => {
        return {
          meta: x,
          staticData: staticData[i],
        };
      });
    },
    [chainId]
  );

  return fetchTokenStaticData;
};

const chooseAssets = (
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

    console.log('xxxx', { ids, offsetNum, num, to, chosenIds });
    chosenAssets = chosenIds.map((x) => {
      return {
        assetId: x.toString(),
        assetType,
        assetAddress,
        id: getAssetEntityId(assetAddress, x),
      };
    });
  } else {
    const rnum =
      maxId && offsetNum + num < maxId ? num : maxId ? maxId - offsetNum : num;

    console.log('INDICES', { rnum, num, offsetNum, ids, maxId });
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

    console.log('INDICES 2', { chosenAssets, len: chosenAssets.length });
  }

  return chosenAssets;
};

const choosePondsamaAssets = (
  assetType: StringAssetType,
  assetAddress: string,
  offset: BigNumber,
  num: number,
  ids: number[],
  minId: number,
  maxId: number,
  direction: SortOption,
  collectionNameFilter = 2
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

    console.log('xxxx', { ids, offsetNum, num, to, chosenIds });
    chosenAssets = chosenIds.map((x) => {
      return {
        assetId: x.toString(),
        assetType,
        assetAddress,
        id: getAssetEntityId(assetAddress, x),
      };
    });
  } else if (!ids.length && collectionNameFilter == 2) {
    return [];
  } else {
    const rnum =
      maxId && offsetNum + num < maxId ? num : maxId ? maxId - offsetNum : num;

    console.log('INDICES', { rnum, num, offsetNum, ids, maxId });
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

    console.log('INDICES 2', { chosenAssets, len: chosenAssets.length });
  }

  return chosenAssets;
};

export const useTokenStaticDataCallbackArrayWithFilter = (
  { assetAddress, assetType }: TokenStaticCallbackInput,
  subcollectionId: string,
  filter: Filters | undefined,
  sortBy: SortOption
) => {
  console.log('useTokenStaticDataCallbackArrayWithFilter', {
    assetAddress,
    assetType,
    filter,
    subcollectionId,
  });
  const { chainId } = useActiveWeb3React();
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
      // console.log('ids', ids);
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

      // let assetIdsJSONString = JSON.stringify(ids);

      // if (coll?.type === 'ERC721') {
      //   const query = QUERY_USER_ERC721(assetIdsJSONString);
      //   const response = await request(coll?.subgraph, query);
      //   return response;
      // }
      // if (coll?.type === 'ERC1155') {
      //   const query = QUERY_USER_ERC1155(assetIdsJSONString);
      //   const response = await request(coll?.subgraph, query);
      //   return response;
      // }
      // return [];

      // if we don't have a price range, it's just business as usual
      if (
        sortBy == SortOption.TOKEN_ID_ASC ||
        sortBy == SortOption.TOKEN_ID_DESC
      ) {
        let chosenAssets = chooseAssets(
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
          chosenAssets = chooseAssets(
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
          return statics;
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

          chosenAssets = chooseAssets(
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
      console.log('final rfesult', result);
      return result;
    },
    [
      chainId,
      assetType,
      assetAddress,
      JSON.stringify(ids),
      JSON.stringify(priceRange),
      JSON.stringify(selectedOrderType),
      sortBy,
    ]
  );

  return fetchTokenStaticData;
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
  const { chainId } = useActiveWeb3React();
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
        console.log({ assetAddress, assetType });
        return [];
      }
      const pondsamaTotalyQuery = QUERY_PONDSAMA_TotalSupply(assetAddress);
      const pondsamaTotalSupply1 = await request(subgraph, pondsamaTotalyQuery);
      let pondsamaTotalSupply = parseInt(
        pondsamaTotalSupply1.contract.totalSupply
      );
      let res = [],
        pondsamaQuery,
        res1;
      if (pondsamaTotalSupply < 1000) {
        pondsamaQuery = QUERY_PONDSAMA_ACTIVE_ID(0, pondsamaTotalSupply);
        res1 = await request(subgraph, pondsamaQuery);
        res = res1.tokens;
      } else {
        let from = 0;
        while (from < pondsamaTotalSupply) {
          pondsamaQuery = QUERY_PONDSAMA_ACTIVE_ID(from, 1000);
          let res1 = await request(subgraph, pondsamaQuery);
          for (let i = 0; i < res1.tokens.length; i++) res.push(res1.tokens[i]);
          from += 1000;
        }
      }
      let ids: number[] = [];
      let ponsIdsMeta: number[] = [];
      for (let i = 0; i < res.length; i++) ids.push(res[i].numericId);
      console.log('id1', ids);
      let totalLength =
        res.length % 300 ? res.length / 300 + 1 : res.length / 300;
      if (filter && filter.dfRange && filter.dfRange.length == 2) {
        for (let i = 0; i < totalLength; i++) {
          let tempIds = ids.slice(i*300, 300)
          let chosenAssets = choosePondsamaAssets(
            assetType,
            assetAddress,
            offset,
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
                  (e) => e !== metas[i].attributes[j].value
                );
              }
            }

            if (flag == true && !selectedPondTraits.length) {
              ponsIdsMeta.push(ids[i]);
            }
          }
          ids = ponsIdsMeta;
        }
      }
      console.log('ids', ids, ponsIdsMeta);
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
          console.log('statistics', statics);
          return statics;
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
      console.log('final rfesult', result);
      return result;
    },
    [
      chainId,
      assetType,
      assetAddress,
      JSON.stringify(ids),
      JSON.stringify(priceRange),
      JSON.stringify(selectedOrderType),
      sortBy,
    ]
  );

  return fetchTokenStaticData;
};
