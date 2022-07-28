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
import { parseEther } from '@ethersproject/units';
import {
  QUERY_ACTIVE_ORDERS_FOR_FILTER,
  QUERY_ORDERS_FOR_TOKEN,
} from 'subgraph/orderQueries';
import {
  QUERY_SUBSQUID_ERC721_ACTIVE_ID,
  QUERY_SUBSQUID_ERC721_CONTRACT_DATA,
  QUERY_SUBSQUID_ERC721_ID_IN,
} from 'subgraph/erc721Queries';
import {
  QUERY_SUBSQUID_ERC1155_ACTIVE_ID,
  QUERY_SUBSQUID_ERC1155_CONTRACT_DATA,
  QUERY_SUBSQUID_ERC1155_ID_IN,
} from 'subgraph/erc1155Queries';
import request from 'graphql-request';
import {
  DEFAULT_CHAIN,
  MARKETPLACE_SUBGRAPH_URLS,
  TOKEN_SUBSQUID_URLS,
} from '../../constants';
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

export type AssetWithUri = Asset & { tokenURI: string };

export type TokenSubgraphQueryResult = {
  uri: string;
  numericId: string;
  id: string;
};

export type TokenSubgraphQueryResults = {
  tokens: TokenSubgraphQueryResult[];
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
  let ids: number[] = [];
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
          let totalLength = num == 1 ? num : ids.length;
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
      // console.log('final result', result);
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
    ]
  );

  return fetchTokenStaticData;
};

const chooseTokenAssets = (
  assetType: StringAssetType,
  assetAddress: string,
  offset: BigNumber,
  num: number,
  idsAndUris: { tokenURI: string; assetId: string }[],
  direction: SortOption
) => {
  let offsetNum = BigNumber.from(offset).toNumber();
  let chosenAssets: AssetWithUri[];

  // in this case offsetnum should be substracted one
  if (idsAndUris?.length > 0) {
    //console.log('xxxx')
    if (offsetNum >= idsAndUris.length) {
      return [];
    }
    const to =
      offsetNum + num >= idsAndUris.length
        ? idsAndUris.length
        : offsetNum + num;
    let chosenIds = [];

    if (direction === SortOption.TOKEN_ID_ASC)
      chosenIds = idsAndUris.slice(offsetNum, to);
    else chosenIds = [...idsAndUris].reverse().slice(offsetNum, to);

    chosenAssets = chosenIds.map((x) => {
      return {
        assetId: x.assetId,
        assetType,
        assetAddress,
        id: getAssetEntityId(assetAddress, x.assetId),
        tokenURI: x.tokenURI,
      };
    });
  } else {
    return [];
  }

  return chosenAssets;
};

const chooseTokenAssetsAll = (
  assetType: StringAssetType,
  assetAddress: string,
  idsAndUris: { tokenURI: string; assetId: string }[],
  direction: SortOption
) => {
  let chosenAssets: AssetWithUri[];
  if (idsAndUris?.length > 0) {
    let chosenIds = [];

    if (direction === SortOption.TOKEN_ID_ASC) chosenIds = idsAndUris;
    else chosenIds = [...idsAndUris].reverse();

    chosenAssets = chosenIds.map((x) => {
      return {
        assetId: x.assetId,
        assetType,
        assetAddress,
        id: getAssetEntityId(assetAddress, x.assetId),
        tokenURI: x.tokenURI,
      };
    });
  } else {
    return [];
  }

  return chosenAssets;
};

export const useERC721TokenStaticDataCallbackArrayWithFilter = (
  { assetAddress, assetType }: TokenStaticCallbackInput,
  subcollectionId: string,
  filter: Filters | undefined,
  sortBy: SortOption
) => {
  console.log('useERC721TokenStaticDataCallbackArrayWithFilter', {
    assetAddress,
    assetType,
    filter,
    subcollectionId,
  });
  const { chainId } = useActiveWeb3React();

  let ids: number[] = [];
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

      let idsAndUris: { tokenURI: string; assetId: string }[] = [];

      const CONTRACT_QUERY = QUERY_SUBSQUID_ERC721_CONTRACT_DATA(assetAddress);
      const contractData = await request(
        TOKEN_SUBSQUID_URLS[chainId ?? DEFAULT_CHAIN],
        CONTRACT_QUERY
      );
      let moonsamaTotalSupply = parseInt(
        contractData.erc721Contracts[0].totalSupply
      );
      let res = [],
        moonsamaQuery: any,
        res1;
      if (moonsamaTotalSupply <= 1000) {
        moonsamaQuery = QUERY_SUBSQUID_ERC721_ACTIVE_ID(
          assetAddress,
          0,
          moonsamaTotalSupply
        );
        res1 = await request(
          TOKEN_SUBSQUID_URLS[chainId ?? DEFAULT_CHAIN],
          moonsamaQuery
        );
        res = res1.erc721Tokens;
      } else {
        let from = 0;
        while (from < moonsamaTotalSupply) {
          moonsamaQuery = QUERY_SUBSQUID_ERC721_ACTIVE_ID(
            assetAddress,
            from,
            1000
          );
          let res1 = await request(
            TOKEN_SUBSQUID_URLS[chainId ?? DEFAULT_CHAIN],
            moonsamaQuery
          );
          for (let i = 0; i < res1.erc721Tokens.length; i++)
            res.push(res1.erc721Tokens[i]);
          from += 1000;
        }
      }
      for (let i = 0; i < res.length; i++) {
        if (
          !ids.length ||
          (ids.length && ids.includes(parseInt(res[i].numericId)))
        )
          idsAndUris.push({ tokenURI: res[i].uri, assetId: res[i].numericId });
      }

      const fetchStatics = async (assets: Asset[], orders?: Order[]) => {
        console.log('assets', assets);
        if (orders && orders.length !== assets.length) {
          throw new Error('Orders/assets length mismatch');
        }

        if (!assets.length) {
          return [];
        }

        const query = QUERY_SUBSQUID_ERC721_ID_IN(
          assetAddress,
          assets.map((a) => a.assetId)
        );

        const ress = await request(
          TOKEN_SUBSQUID_URLS[chainId ?? DEFAULT_CHAIN],
          query
        );
        let tokens = ress.erc721Tokens;

        if (sortBy === SortOption.TOKEN_ID_DESC) tokens = tokens.reverse();

        let staticData: StaticTokenData[] = [];
        if (tokens.length) {
          staticData = assets.map((ca) => {
            const tok = tokens.find(
              (t: any) => t.numericId === ca.assetId
            ) as TokenSubgraphQueryResult;
            return {
              asset: ca,
              decimals: contractData.erc721Contracts[0].decimals,
              contractURI: contractData.erc721Contracts[0].contractURI,
              name: contractData.erc721Contracts[0].name,
              symbol: contractData.erc721Contracts[0].symbol,
              totalSupply: contractData.erc721Contracts[0].totalSupply,
              tokenURI: tok.uri,
            };
          });
        }

        return tokens.map((x: any, i: any) => {
          return {
            meta: x.meta,
            staticData: staticData[i],
            order: orders?.[i],
          };
        });
      };
      let ordersFetch: any[] = [];
      let flag = 0;
      if (
        !(
          !priceRange ||
          priceRange.length === 0 ||
          priceRange.length !== 2 ||
          !selectedOrderType
        ) &&
        (sortBy === SortOption.TOKEN_ID_ASC ||
          sortBy === SortOption.TOKEN_ID_DESC)
      ) {
        flag = 1;
        let chosenAssets = chooseTokenAssetsAll(
          assetType,
          assetAddress,
          idsAndUris,
          sortBy
        );
        const rangeInWei = priceRange.map((x) =>
          parseEther(x.toString()).mul(TEN_POW_18)
        );

        let indexer = 0;
        while (1) {
          let tempChosenAssets = chosenAssets.slice(indexer, indexer + 1000);
          if (!tempChosenAssets || tempChosenAssets.length === 0) {
            break;
          }
          indexer += 1000;

          const sgAssets = tempChosenAssets.map((x) => {
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
          // console.log('YOLO getOrders', result);
          const orders = result?.orders;

          if (orders && orders.length > 0) {
            ordersFetch = ordersFetch.concat(orders);
          }
        }
      } else if (
        sortBy === SortOption.PRICE_ASC ||
        sortBy === SortOption.PRICE_DESC
      ) {
        let index = 0;
        flag = 1;
        // console.log('ordersFetch0', ordersFetch);
        while (1) {
          let query = QUERY_ORDERS_FOR_TOKEN(
            assetAddress,
            sortBy === SortOption.PRICE_ASC || sortBy === SortOption.PRICE_DESC
              ? 'price'
              : 'id',
            sortBy === SortOption.PRICE_ASC,
            index,
            1000
          );

          const result = await request(
            MARKETPLACE_SUBGRAPH_URLS[chainId ?? DEFAULT_CHAIN],
            query
          );

          if (!result || !result?.orders.length) {
            break;
          }
          index += 1000;
          let orders: any[] = result?.orders;
          if (orders && orders.length > 0) {
            ordersFetch = ordersFetch.concat(orders);
          }
        }
      }
      const theAssets: Asset[] = [];
      const theAssetNumber: string[] = [];
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
        theAssetNumber.push(a?.assetId);
        return o;
      });

      let tempIdsAndUris: { tokenURI: string; assetId: string }[] = [];
      idsAndUris.map((idsAndUri, i) => {
        if (
          !theAssetNumber.length ||
          theAssetNumber.includes(idsAndUri.assetId)
        )
          tempIdsAndUris.push(idsAndUri);
      });
      idsAndUris = tempIdsAndUris;
      if (!ordersFetch.length && !flag) {
        const chosenAssets = chooseTokenAssets(
          assetType,
          assetAddress,
          offset,
          num,
          idsAndUris,
          sortBy
        );
        const statics = await fetchStatics(chosenAssets);
        let totalLength = num === 1 ? num : idsAndUris.length;
        return { data: statics, length: totalLength };
      } else {
        let offsetNum = BigNumber.from(offset).toNumber();
        const to =
          offsetNum + num >= theAssets.length
            ? theAssets.length
            : offsetNum + num;
        let sliceAssets = theAssets.slice(offsetNum, to);
        let newOrders = orders.slice(offsetNum, to);
        const result = await fetchStatics(sliceAssets, newOrders);
        let totalLength1 = num === 1 ? num : theAssets.length;
        return { data: result, length: totalLength1 };
      }
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


export const useERC1155TokenStaticDataCallbackArrayWithFilter = (
  { assetAddress, assetType }: TokenStaticCallbackInput,
  subcollectionId: string,
  filter: Filters | undefined,
  sortBy: SortOption
) => {
  console.log('useERC1155TokenStaticDataCallbackArrayWithFilter', {
    assetAddress,
    assetType,
    filter,
    subcollectionId,
  });
  const { chainId } = useActiveWeb3React();

  let ids: number[] = [];
  let coll = useRawcollection(assetAddress ?? '');
  if (!!subcollectionId && subcollectionId !== '0') {
    ids =
      coll?.subcollections?.find((c: any) => c.id === subcollectionId)
        ?.tokens ?? [];
  }
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

      let idsAndUris: { tokenURI: string; assetId: string }[] = [];

      const CONTRACT_QUERY =  QUERY_SUBSQUID_ERC1155_CONTRACT_DATA(assetAddress);
      console.log("CONTRACT_QUERY", CONTRACT_QUERY)
      const contractData = await request(
        TOKEN_SUBSQUID_URLS[chainId ?? DEFAULT_CHAIN],
        CONTRACT_QUERY
      );
      let moonsamaTotalSupply = parseInt(
        contractData.erc1155Contracts[0].totalSupply
      );
      let res = [],
        moonsamaQuery: any,
        res1;
      if (moonsamaTotalSupply <= 1000) {
        moonsamaQuery = QUERY_SUBSQUID_ERC1155_ACTIVE_ID(
          assetAddress,
          0,
          moonsamaTotalSupply
        );
      console.log("CONTRACT_QUERY1", moonsamaQuery)

        res1 = await request(
          TOKEN_SUBSQUID_URLS[chainId ?? DEFAULT_CHAIN],
          moonsamaQuery
        );
        res = res1.erc1155Tokens;
      } else {
        let from = 0;
        while (from < moonsamaTotalSupply) {
          moonsamaQuery = QUERY_SUBSQUID_ERC1155_ACTIVE_ID(
            assetAddress,
            from,
            1000
          );
      console.log("CONTRACT_QUERY1", moonsamaQuery)

          let res1 = await request(
            TOKEN_SUBSQUID_URLS[chainId ?? DEFAULT_CHAIN],
            moonsamaQuery
          );
          for (let i = 0; i < res1.erc1155Tokens.length; i++)
            res.push(res1.erc1155Tokens[i]);
          from += 1000;
        }
      }
      for (let i = 0; i < res.length; i++) {
        if (
          !ids.length ||
          (ids.length && ids.includes(parseInt(res[i].numericId)))
        )
          idsAndUris.push({ tokenURI: res[i].uri, assetId: res[i].numericId });
      }

      const fetchStatics = async (assets: Asset[], orders?: Order[]) => {
        console.log('assets', assets);
        if (orders && orders.length !== assets.length) {
          throw new Error('Orders/assets length mismatch');
        }

        if (!assets.length) {
          return [];
        }

        const query = QUERY_SUBSQUID_ERC1155_ID_IN(
          assetAddress,
          assets.map((a) => a.assetId)
        );
        console.log("CONTRACT_QUERY2", query)

        const ress = await request(
          TOKEN_SUBSQUID_URLS[chainId ?? DEFAULT_CHAIN],
          query
        );
        let tokens = ress.erc1155Tokens;

        if (sortBy === SortOption.TOKEN_ID_DESC) tokens = tokens.reverse();

        let staticData: StaticTokenData[] = [];
        if (tokens.length) {
          staticData = assets.map((ca) => {
            const tok = tokens.find(
              (t: any) => t.numericId === ca.assetId
            ) as TokenSubgraphQueryResult;
            return {
              asset: ca,
              decimals: contractData.erc1155Contracts[0].decimals,
              contractURI: contractData.erc1155Contracts[0].contractURI,
              name: contractData.erc1155Contracts[0].name,
              symbol: contractData.erc1155Contracts[0].symbol,
              totalSupply: contractData.erc1155Contracts[0].totalSupply,
              tokenURI: tok.uri,
            };
          });
        }

        return tokens.map((x: any, i: any) => {
          return {
            meta: x.meta,
            staticData: staticData[i],
            order: orders?.[i],
          };
        });
      };
      let ordersFetch: any[] = [];
      let flag = 0;
      if (
        !(
          !priceRange ||
          priceRange.length === 0 ||
          priceRange.length !== 2 ||
          !selectedOrderType
        ) &&
        (sortBy === SortOption.TOKEN_ID_ASC ||
          sortBy === SortOption.TOKEN_ID_DESC)
      ) {
        flag = 1;
        let chosenAssets = chooseTokenAssetsAll(
          assetType,
          assetAddress,
          idsAndUris,
          sortBy
        );
        // console.log('SEARCH', {
        //   assetAddress,
        //   assetType,
        //   idsAndUris,
        //   num,
        //   offset: offset?.toString(),
        //   chosenAssets,
        // });
        const rangeInWei = priceRange.map((x) =>
          parseEther(x.toString()).mul(TEN_POW_18)
        );

        let indexer = 0;
        while (1) {
          let tempChosenAssets = chosenAssets.slice(indexer, indexer + 1000);
          if (!tempChosenAssets || tempChosenAssets.length === 0) {
            break;
          }
          indexer += 1000;

          const sgAssets = tempChosenAssets.map((x) => {
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

          if (orders && orders.length > 0) {
            ordersFetch = ordersFetch.concat(orders);
          }
        }
      } else if (
        sortBy === SortOption.PRICE_ASC ||
        sortBy === SortOption.PRICE_DESC
      ) {
        let index = 0;
        flag = 1;
        console.log('ordersFetch0', ordersFetch);
        while (1) {
          let query = QUERY_ORDERS_FOR_TOKEN(
            assetAddress,
            sortBy === SortOption.PRICE_ASC || sortBy === SortOption.PRICE_DESC
              ? 'price'
              : 'id',
            sortBy === SortOption.PRICE_ASC,
            index,
            1000
          );

          const result = await request(
            MARKETPLACE_SUBGRAPH_URLS[chainId ?? DEFAULT_CHAIN],
            query
          );

          if (!result || !result?.orders.length) {
            break;
          }
          index += 1000;
          let orders: any[] = result?.orders;
          if (orders && orders.length > 0) {
            ordersFetch = ordersFetch.concat(orders);
          }
        }
      }
      const theAssets: Asset[] = [];
      const theAssetNumber: string[] = [];
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
        theAssetNumber.push(a?.assetId);
        return o;
      });

      let tempIdsAndUris: { tokenURI: string; assetId: string }[] = [];
      idsAndUris.map((idsAndUri, i) => {
        if (
          !theAssetNumber.length ||
          theAssetNumber.includes(idsAndUri.assetId)
        )
          tempIdsAndUris.push(idsAndUri);
      });
      idsAndUris = tempIdsAndUris;
      if (!ordersFetch.length && !flag) {
        const chosenAssets = chooseTokenAssets(
          assetType,
          assetAddress,
          offset,
          num,
          idsAndUris,
          sortBy
        );
        const statics = await fetchStatics(chosenAssets);
        let totalLength = num === 1 ? num : idsAndUris.length;
        return { data: statics, length: totalLength };
      } else {
        let offsetNum = BigNumber.from(offset).toNumber();
        const to =
          offsetNum + num >= theAssets.length
            ? theAssets.length
            : offsetNum + num;
        let sliceAssets = theAssets.slice(offsetNum, to);
        let newOrders = orders.slice(offsetNum, to);
        const result = await fetchStatics(sliceAssets, newOrders);
        let totalLength1 = num === 1 ? num : theAssets.length;
        return { data: result, length: totalLength1 };
      }
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
