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
import { useFetchTokenUriCallback } from 'hooks/useFetchTokenUri.ts/useFetchTokenUriCallback';
import { PondsamaFilter } from 'ui/PondsamaFilter/PondsamaFilter';
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

const choosePondsamaAssets = (
  assetType: StringAssetType,
  assetAddress: string,
  offset: BigNumber,
  num: number,
  idsAndUris: { tokenURI: string; assetId: string }[],
  direction: SortOption
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

const choosePondsamaAssetsAll = (
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
  const priceRange = filter?.priceRange;
  const selectedOrderType = filter?.selectedOrderType;
  const fetchTokenStaticData = useCallback(
    async (num: number, offset: BigNumber, setCollection) => {
      if (!assetAddress || !assetType) {
        return [];
      }
      const owned: OwnedFilterType | undefined = filter?.owned;
      const PONDSAMA_CONTRACT_QUERY =
        QUERY_SUBSQUID_ERC721_CONTRACT_DATA(assetAddress);
      const contractData = await request(
        TOKEN_SUBSQUID_URLS[chainId ?? DEFAULT_CHAIN],
        PONDSAMA_CONTRACT_QUERY
      );
      let pondsamaTotalSupply = parseInt(
        contractData.erc721Contracts[0].totalSupply
      );
      let res = [],
        pondsamaQuery: any,
        res1;
      if (pondsamaTotalSupply < 1000) {
        if (!owned)
          pondsamaQuery = QUERY_SUBSQUID_ERC721_ACTIVE_ID(
            assetAddress,
            0,
            pondsamaTotalSupply
          );
        else if (owned === OwnedFilterType.OWNED && account)
          pondsamaQuery = QUERY_SUBSQUID_ERC721_OWNED_ID(
            assetAddress,
            0,
            pondsamaTotalSupply,
            account
          );
        else if (owned === OwnedFilterType.NOTOWNED && account)
          pondsamaQuery = QUERY_SUBSQUID_ERC721_NOTOWNED_ID(
            assetAddress,
            0,
            pondsamaTotalSupply,
            account
          );
        else
          pondsamaQuery = QUERY_SUBSQUID_ERC721_ACTIVE_ID(
            assetAddress,
            0,
            pondsamaTotalSupply
          );
        res1 = await request(
          TOKEN_SUBSQUID_URLS[chainId ?? DEFAULT_CHAIN],
          pondsamaQuery
        );
        res = res1.erc721Tokens;
      } else {
        let from = 0;
        while (from < pondsamaTotalSupply) {
          if (!owned)
            pondsamaQuery = QUERY_SUBSQUID_ERC721_ACTIVE_ID(
              assetAddress,
              from,
              1000
            );
          else if (owned === OwnedFilterType.OWNED && account)
            pondsamaQuery = QUERY_SUBSQUID_ERC721_OWNED_ID(
              assetAddress,
              from,
              1000,
              account
            );
          else if (owned === OwnedFilterType.NOTOWNED && account)
            pondsamaQuery = QUERY_SUBSQUID_ERC721_NOTOWNED_ID(
              assetAddress,
              from,
              1000,
              account
            );
          else
            pondsamaQuery = QUERY_SUBSQUID_ERC721_ACTIVE_ID(
              assetAddress,
              from,
              1000
            );
          let res1 = await request(
            TOKEN_SUBSQUID_URLS[chainId ?? DEFAULT_CHAIN],
            pondsamaQuery
          );
          for (let i = 0; i < res1.erc721Tokens.length; i++)
            res.push(res1.erc721Tokens[i]);
          from += 1000;
        }
      }
      let idsAndUris: { tokenURI: string; assetId: string }[] = [];

      for (let i = 0; i < res.length; i++) {
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
        let tokens:any[] = ress.erc721Tokens;

        if (sortBy === SortOption.TOKEN_ID_DESC) tokens = tokens.reverse();

        let staticData: StaticTokenData[] = [];
        if (tokens.length) {
          staticData = assets.map((ca) => {
            const tok = tokens.find(
              (t:any) => t.numericId === ca.assetId
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
        }
        return tokens.map((x, i) => {
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
        let chosenAssets = choosePondsamaAssetsAll(
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
      let totalLength =
        idsAndUris.length % 300
          ? Math.floor(idsAndUris.length / 300) + 1
          : Math.floor(idsAndUris.length / 300);
      let newMetas: any[] = [],
        totalStaicDatas: StaticTokenData[] = [];
      let pieces: {
        meta: TokenMeta | undefined;
        staticData: StaticTokenData;
      }[] = [];
      const offsetNum = BigNumber.from(offset).toNumber();
      // const to = offsetNum + num >= newMetas.length ? newMetas.length : offsetNum + num;
      if (filter && filter.dfRange && filter.dfRange.length === 2) {
        for (let k = 0; k < totalLength; k++) {
          let tempIds: { tokenURI: string; assetId: string }[] = [];
          if (k * 300 + 300 < res.length)
            tempIds = idsAndUris.slice(k * 300, k * 300 + 300);
          else if (k * 300 + 300 >= res.length)
            tempIds = idsAndUris.slice(k * 300, res.length);
          let chosenAssets = choosePondsamaAssetsAll(
            assetType,
            assetAddress,
            tempIds,
            sortBy
          );
          const staticData: StaticTokenData[] = chosenAssets.map((ca) => {
            return {
              asset: ca,
              decimals: contractData.contract.decimals,
              contractURI: contractData.contract.contractURI,
              name: contractData.contract.name,
              symbol: contractData.contract.symbol,
              totalSupply: contractData.contract.totalSupply,
              tokenURI: ca.tokenURI,
            };
          });
          const query = QUERY_SUBSQUID_ERC721_ID_IN(
            assetAddress,
            tempIds.map((a) => a.assetId)
          );
          const ress = await request(
            TOKEN_SUBSQUID_URLS[chainId ?? DEFAULT_CHAIN],
            query
          );
          const metas = ress.erc721Tokens.map((token : any) => token.meta);
          console.log('metas', metas);
          for (let i = 0; i < metas.length; i++) {
            let flag = true;
            let selectedPondTraits = filter.pondTraits;
            for (let j = 0; j < metas[i].attributes.length; j++) {
              if (
                metas[i].attributes[j].trait_type === 'HP' &&
                (metas[i].attributes[j].value < filter.hpRange[0] ||
                  metas[i].attributes[j].value > filter.hpRange[1])
              ) {
                flag = false;
                break;
              } else if (
                metas[i].attributes[j].trait_type === 'PW' &&
                (metas[i].attributes[j].value < filter?.pwRange[0] ||
                  metas[i].attributes[j].value > filter?.pwRange[1])
              ) {
                flag = false;
                break;
              } else if (
                metas[i].attributes[j].trait_type === 'SP' &&
                (metas[i].attributes[j].value < filter?.spRange[0] ||
                  metas[i].attributes[j].value > filter?.spRange[1])
              ) {
                flag = false;
                break;
              } else if (
                metas[i].attributes[j].trait_type === 'DF' &&
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

            if (flag === true && !selectedPondTraits.length) {
              newMetas.push(metas[i]);
              totalStaicDatas.push(staticData[i]);
              if (
                newMetas.length >= offsetNum &&
                newMetas.length < offsetNum + num
              ) {
                let piece = {
                  meta: metas[i],
                  staticData: staticData[i],
                };
                pieces.push(piece);
                setCollection(pieces);
              }
            }
          }
        }
      } else if (!ordersFetch.length && !flag) {
        const chosenAssets = choosePondsamaAssets(
          assetType,
          assetAddress,
          offset,
          num,
          idsAndUris,
          sortBy
        );
        const statics = await fetchStatics(chosenAssets);
        setCollection(statics);

        let totalLength = num === 1 ? num : idsAndUris.length;
        return totalLength;
      } else {
        let offsetNum = BigNumber.from(offset).toNumber();
        const to =
          offsetNum + num >= theAssets.length
            ? theAssets.length
            : offsetNum + num;
        let sliceAssets = theAssets.slice(offsetNum, to);
        let newOrders = orders.slice(offsetNum, to);
        const result = await fetchStatics(sliceAssets, newOrders);
        setCollection(result);
        let totalLength = num === 1 ? num : theAssets.length;
        return totalLength;
      }
      const totalLength1 = num === 1 ? num : newMetas.length;
      return totalLength1;
    },
    [
      chainId,
      assetType,
      assetAddress,
      JSON.stringify(priceRange),
      JSON.stringify(selectedOrderType),
      sortBy,
      filter,
    ]
  );

  return fetchTokenStaticData;
};
