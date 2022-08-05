import { BigNumber } from '@ethersproject/bignumber';
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
import { MoonsamaFilter } from 'ui/MoonsamaFilter/MoonsamaFilter';
import { useMoonsamaAttrIds } from 'hooks/useMoonsamaAttrIdsCallback/useMoonsamaAttrIdsCallback';
import { parseEther } from '@ethersproject/units';
import {
  QUERY_ACTIVE_ORDERS_FOR_FILTER,
  QUERY_ORDERS_FOR_TOKEN,
} from 'subgraph/orderQueries';
import {
  QUERY_SUBSQUID_ERC721_ACTIVE_ID,
  QUERY_SUBSQUID_ERC721_CONTRACT_DATA,
  QUERY_SUBSQUID_ERC721_OWNED_ID,
  QUERY_SUBSQUID_ERC721_NOTOWNED_ID,
  QUERY_SUBSQUID_ERC721_ID_IN,
} from 'subgraph/erc721Queries';
import { useRawcollection } from 'hooks/useRawCollectionsFromList/useRawCollectionsFromList';
import request from 'graphql-request';
import {
  DEFAULT_CHAIN,
  MARKETPLACE_SUBGRAPH_URLS,
  TOKEN_SUBSQUID_URLS,
} from '../../constants';
import { TEN_POW_18 } from 'utils';
import { SortOption } from 'ui/Sort/Sort';
import { TokenMeta } from 'hooks/useFetchTokenUri.ts/useFetchTokenUri.types';

export interface StaticTokenData {
  asset: Asset;
  name?: string;
  symbol?: string;
  decimals?: number;
  totalSupply?: BigNumber;
  tokenURI?: string;
  contractURI?: string;
  metadata?: TokenMeta | undefined;
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
  direction: boolean
) => {
  let offsetNum = BigNumber.from(offset).toNumber();
  let chosenAssets: AssetWithUri[];

  if (idsAndUris?.length > 0) {
    if (offsetNum >= idsAndUris.length) {
      return [];
    }
    const to =
      offsetNum + num >= idsAndUris.length
        ? idsAndUris.length
        : offsetNum + num;
    let chosenIds = [];

    if (direction) chosenIds = idsAndUris.slice(offsetNum, to);
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

const chooseMoonsamaAssetsAll = (
  assetType: StringAssetType,
  assetAddress: string,
  idsAndUris: { tokenURI: string; assetId: string }[],
  direction: boolean
) => {
  let chosenAssets: AssetWithUri[];
  if (idsAndUris?.length > 0) {
    let chosenIds = [];

    // if (direction) chosenIds = idsAndUris;
    // else chosenIds = [...idsAndUris].reverse();
    chosenIds = idsAndUris;

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

  let ids = useMoonsamaAttrIds(filter?.traits);
  const priceRange = filter?.priceRange;
  const selectedOrderType = filter?.selectedOrderType;
  const recognizedCollection = useRawcollection(assetAddress ?? '');
  const subsquid = recognizedCollection?.subsquid ?? '';
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
      const CONTRACT_QUERY = QUERY_SUBSQUID_ERC721_CONTRACT_DATA(assetAddress);
      const contractData = await request(subsquid, CONTRACT_QUERY);
      let moonsamaTotalSupply = parseInt(
        contractData.erc721Contracts[0].totalSupply
      );
      let res = [],
        moonsamaQuery: any,
        res1;
      if (moonsamaTotalSupply <= 1000) {
        if (!owned)
          moonsamaQuery = QUERY_SUBSQUID_ERC721_ACTIVE_ID(
            assetAddress,
            0,
            moonsamaTotalSupply
          );
        else if (owned === OwnedFilterType.OWNED && account)
          moonsamaQuery = QUERY_SUBSQUID_ERC721_OWNED_ID(
            assetAddress,
            0,
            moonsamaTotalSupply,
            account
          );
        else if (owned === OwnedFilterType.NOTOWNED && account)
          moonsamaQuery = QUERY_SUBSQUID_ERC721_NOTOWNED_ID(
            assetAddress,
            0,
            moonsamaTotalSupply,
            account
          );
        else
          moonsamaQuery = QUERY_SUBSQUID_ERC721_ACTIVE_ID(
            assetAddress,
            0,
            moonsamaTotalSupply
          );
        res1 = await request(subsquid, moonsamaQuery);
        res = res1.erc721Tokens;
      } else {
        let from = 0;
        while (from < moonsamaTotalSupply) {
          if (!owned)
            moonsamaQuery = QUERY_SUBSQUID_ERC721_ACTIVE_ID(
              assetAddress,
              from,
              1000
            );
          else if (owned === OwnedFilterType.OWNED && account)
            moonsamaQuery = QUERY_SUBSQUID_ERC721_OWNED_ID(
              assetAddress,
              from,
              1000,
              account
            );
          else if (owned === OwnedFilterType.NOTOWNED && account)
            moonsamaQuery = QUERY_SUBSQUID_ERC721_NOTOWNED_ID(
              assetAddress,
              from,
              1000,
              account
            );
          else
            moonsamaQuery = QUERY_SUBSQUID_ERC721_ACTIVE_ID(
              assetAddress,
              from,
              1000
            );
          let res1 = await request(subsquid, moonsamaQuery);
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
        console.log('assets', { assets, orders });
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

        const ress = await request(subsquid, query);
        let tokens: any[] = ress.erc721Tokens;
        console.log('tokens', tokens);

        let staticData: StaticTokenData[] = [];
        if (tokens.length) {
          staticData = assets.map((ca) => {
            let token = tokens.find((t: any) => t.numericId === ca.assetId);
            return {
              asset: ca,
              decimals: contractData.erc721Contracts[0].decimals,
              contractURI: contractData.erc721Contracts[0].contractURI,
              name: contractData.erc721Contracts[0].name,
              symbol: contractData.erc721Contracts[0].symbol,
              totalSupply: contractData.erc721Contracts[0].totalSupply,
              tokenURI: token.uri,
              metadata: token.meta,
            };
          });
        }
        return staticData.map((x, i) => {
          return {
            meta: x.metadata,
            staticData: x,
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
        let chosenAssets = chooseMoonsamaAssetsAll(
          assetType,
          assetAddress,
          idsAndUris,
          sortBy === SortOption.TOKEN_ID_ASC
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
        while (1) {
          let query = QUERY_ORDERS_FOR_TOKEN(
            assetAddress,
            'price',
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
      if (theAssetNumber.length) {
        theAssetNumber.map((number) => {
          let tempIdsAndUri = idsAndUris.find((idsAndUri) => {
            return idsAndUri.assetId == number;
          });
          if (tempIdsAndUri) tempIdsAndUris.push(tempIdsAndUri);
        });
        idsAndUris = tempIdsAndUris;
      }
      if (theAssetNumber.length) {
        let offsetNum = BigNumber.from(offset).toNumber();
        const to =
          offsetNum + num >= idsAndUris.length
            ? idsAndUris.length
            : offsetNum + num;
        let newOrders = orders.slice(offsetNum, to);
        const chosenAssets = chooseMoonsamaAssets(
          assetType,
          assetAddress,
          offset,
          num,
          idsAndUris,
          sortBy === SortOption.TOKEN_ID_ASC || sortBy === SortOption.PRICE_ASC
        );
        const statics = await fetchStatics(chosenAssets, newOrders);
        let totalLength = num === 1 ? num : idsAndUris.length;
        return { data: statics, length: totalLength };
      } else {
        const chosenAssets = chooseMoonsamaAssets(
          assetType,
          assetAddress,
          offset,
          num,
          idsAndUris,
          sortBy === SortOption.TOKEN_ID_ASC || sortBy === SortOption.PRICE_ASC
        );
        const statics = await fetchStatics(chosenAssets);
        let totalLength = num === 1 ? num : idsAndUris.length;
        return { data: statics, length: totalLength };
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
