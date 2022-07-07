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
  QUERY_ERC721_ACTIVE_ID,
  QUERY_ERC721_CONTRACT_DATA,
  QUERY_ERC721_OWNED_ID,
  QUERY_ERC721_NOTOWNED_ID,
  QUERY_ERC721_ID_IN,
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

export type AssetWithUri = Asset & { tokenURI: string };

export type TokenSubgraphQueryResult = {
  uri: string;
  numericId: string;
  id: string;
};

export type TokenSubgraphQueryResults = {
  tokens: TokenSubgraphQueryResult[];
};

const chooseMoonsamaAssets = (
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

  const fetchUri = useFetchTokenUriCallback();
  let ids = useMoonsamaAttrIds(filter?.traits);
  let coll = useRawcollection(assetAddress ?? '');

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

      let idsAndUris: { tokenURI: string; assetId: string }[] = [];

      const owned: OwnedFilterType | undefined = filter?.owned;
      const moonsamaTotalyQuery = QUERY_ERC721_CONTRACT_DATA();
      const moonsamaTotalSupply1 = await request(subgraph, moonsamaTotalyQuery);
      let moonsamaTotalSupply = parseInt(
        moonsamaTotalSupply1.contract.totalSupply
      );
      let res = [],
        moonsamaQuery: any,
        res1;
      if (moonsamaTotalSupply <= 1000) {
        if (!owned)
          moonsamaQuery = QUERY_ERC721_ACTIVE_ID(0, moonsamaTotalSupply);
        else if (owned === OwnedFilterType.OWNED && account)
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
        else moonsamaQuery = QUERY_ERC721_ACTIVE_ID(0, moonsamaTotalSupply);
        res1 = await request(subgraph, moonsamaQuery);
        res = res1.tokens;
      } else {
        let from = 0;
        while (from < moonsamaTotalSupply) {
          if (!owned) moonsamaQuery = QUERY_ERC721_ACTIVE_ID(from, 1000);
          else if (owned === OwnedFilterType.OWNED && account)
            moonsamaQuery = QUERY_ERC721_OWNED_ID(from, 1000, account);
          else if (owned === OwnedFilterType.NOTOWNED && account)
            moonsamaQuery = QUERY_ERC721_NOTOWNED_ID(from, 1000, account);
          else moonsamaQuery = QUERY_ERC721_ACTIVE_ID(from, 1000);
          let res1 = await request(subgraph, moonsamaQuery);
          for (let i = 0; i < res1.tokens.length; i++) res.push(res1.tokens[i]);
          from += 1000;
        }
      }
      for (let i = 0; i < res.length; i++) {
        if (!ids.length || (ids.length && ids.includes(parseInt(res[i].numericId))))
          idsAndUris.push({ tokenURI: res[i].uri, assetId: res[i].numericId });
      }

      const CONTRACT_QUERY = QUERY_ERC721_CONTRACT_DATA();
      const contractData = await request(subgraph, CONTRACT_QUERY);
      const fetchStatics = async (assets: Asset[], orders?: Order[]) => {
        // console.log('fetch statistics');
        console.log('assets', assets);
        if (orders && orders.length !== assets.length) {
          throw new Error('Orders/assets length mismatch');
        }

        if (!assets) {
          return [];
        }

        const query = QUERY_ERC721_ID_IN(assets.map((a) => a.assetId));
        const ress = await request<TokenSubgraphQueryResults>(subgraph, query);
        const tokens = ress.tokens;

        // console.log('yolo tryMultiCallCore res', results);
        const staticData: StaticTokenData[] = assets.map((ca) => {
          const tok = tokens.find(
            (t) => t.numericId === ca.assetId
          ) as TokenSubgraphQueryResult;
          return {
            asset: ca,
            decimals: contractData.contract.decimals,
            contractURI: contractData.contract.contractURI,
            name: contractData.contract.name,
            symbol: contractData.contract.symbol,
            totalSupply: contractData.contract.totalSupply,
            tokenURI: tok.uri,
          };
        });
        // console.log('staticData', { staticData });

        const metas = await fetchUri(staticData);

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
          idsAndUris,
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
            idsAndUris,
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
            idsAndUris,
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
          idsAndUris,
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
            idsAndUris,
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
