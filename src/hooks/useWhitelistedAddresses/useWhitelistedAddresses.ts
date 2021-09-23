import { NFT_SUBGRAPH_URL } from '../../constants';
import { BigNumber } from '@ethersproject/bignumber';
import { request } from 'graphql-request';
import { useActiveWeb3React } from 'hooks/useActiveWeb3React/useActiveWeb3React';
import { useCallback, useMemo } from 'react';
import { Asset } from 'hooks/marketplace/types';
import { useTokenStaticDataCallbackArray } from 'hooks/useTokenStaticDataCallback/useTokenStaticDataCallback';
import { QUERY_USER_ERC721 } from 'subgraph/erc721Queries';
import { getAssetEntityId, StringAssetType } from 'utils/subgraph';
import { useRawCollectionsFromList } from 'hooks/useRawCollectionsFromList/useRawCollectionsFromList';

export interface OwnedTokens {
  id: string;
  ownedTokens: { id: string; contract: { id: string } }[];
}

export const useWhitelistedAddresses = () => {
  const { chainId } = useActiveWeb3React();

  const collections = useRawCollectionsFromList()

  return useMemo(() => {
    return collections.map(x => x.address.toLowerCase())
  }, [chainId])
};
