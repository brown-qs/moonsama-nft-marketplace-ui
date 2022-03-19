import { useActiveWeb3React } from 'hooks';
import { useMemo } from 'react';

import mintList from '../../assets/data/mints';

import * as yup from 'yup';
import { StringAssetType } from 'utils/subgraph';

const enum Indexing {
  Sequential = 'sequential',
  None = 'none',
}

export type RawSubcollection = {
  id: string;
  uri: string;
  tokens: number[];
};

export type AuctionParams = {
  ids: string[];
  deadline: string;
};

export type RawMint = {
  chainId: number;
  address: string;
  display_name: string;
  symbol: string;
  type: StringAssetType;
  indexing: Indexing;
  contractURI: string;
  tags: string[];
  min_items: number;
  subgraph: string;
  decimals?: number;
  maxId?: number;
  minId: number;
  idSearchOn: boolean;
  subcollections?: RawSubcollection[];
  auction?: AuctionParams;
  plot?: boolean;
  plotMap?: string;
  floorDisplay?: boolean;
  ordersDisabled?: boolean;
  transferDisabled?: boolean;
};

export type RawMintList = {
  name: string;
  collections: RawMint[];
};

const collectionListSchema = yup.object<RawMintList>({
  name: yup.string().required(),
  collections: yup
    .array()
    .of(
      yup
        .object<RawMint>({
          min_items: yup.number().required(),
          chainId: yup.number().required(),
          floorDisplay: yup.boolean().notRequired().default(false),
          address: yup
            .string()
            .isAddress('Expected a valid Ethereum address.')
            .required(),
          display_name: yup.string().required(),
          symbol: yup.string().required(),
          type: yup
            .mixed<StringAssetType>()
            .oneOf([
              StringAssetType.ERC20,
              StringAssetType.ERC1155,
              StringAssetType.ERC721,
            ])
            .required(),
          indexing: yup
            .mixed<Indexing>()
            .oneOf([Indexing.Sequential, Indexing.None])
            .required(),
          contractURI: yup.string().required(),
          tags: yup.array().of(yup.string().required()).required(),
          subgraph: yup.string(),
          decimals: yup.number().optional(),
          minId: yup.number().required(),
          maxId: yup.number().optional(),
          subcollections: yup.array(),
          idSearchOn: yup.boolean().required(),
          ordersDisabled: yup.boolean().optional().default(false),
          transferDisabled: yup.boolean().optional().default(false),
          plot: yup.boolean().optional(),
          auction: yup
            .object<AuctionParams>({
              deadline: yup.string(),
              ids: yup.array().of(yup.string().required()).required(),
            })
            .optional(),
        })
        .required()
    )
    .required(),
});



export function useRawMintFromList(): RawMint[] {
  const { chainId } = useActiveWeb3React();
  const list = useMemo(() => {
    if (!chainId) {
      return [];
    }
    const rawList = collectionListSchema.cast(mintList);
    return rawList?.collections.filter((x) => x.chainId === chainId) ?? [];
  }, [chainId]);

  return list;
}



