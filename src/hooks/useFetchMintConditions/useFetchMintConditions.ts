import { useCallback, useEffect, useState } from 'react';
import { RawCollection } from 'hooks/useRawCollectionsFromList/useRawCollectionsFromList';
import { useFetchUrlCallback } from 'hooks/useFetchUrlCallback/useFetchUrlCallback';
import uriToHttp from 'utils/uriToHttp';
import { useActiveWeb3React } from 'hooks/useActiveWeb3React/useActiveWeb3React';
import { useMintDistributorContract } from 'hooks/useContracts/useContracts';

export type MintCollectionInfo = {
  mintCost: number,
  whitelistGuarded: boolean,
  maxMintable: number,
  mintedCount: number,
  mintedCountUser: number,
};

// returns a variable indicating the state of the approval and a function which approves if necessary or early returns
export function useFetchMintConditions(
  uris: { address: string }[] | undefined
): (MintCollectionInfo | undefined)[] {
  //const {chainId} = useActiveWeb3React()
  const [metas, setMetas] = useState<(MintCollectionInfo | undefined)[]>([]);

  const cb = useFetchUrlCallback();
  const stringifiedUris = JSON.stringify(uris);
  const contract = useMintDistributorContract();

  const fetchMetas = useCallback(async () => {
    if (!uris || !contract) {
      setMetas([]);
      return;
    }
    const promises = uris.map(async (uri) => {
      let [mintCost, whitelistGuarded, mintedCount, maxMintable, mintedCountUser] = await contract.getCollectionInfo(
        uri.address
      );
      return { mintCost, whitelistGuarded, mintedCount, maxMintable, mintedCountUser };
    });

    const metas = await Promise.all(promises);

    setMetas(metas);
  }, [stringifiedUris, contract]);

  useEffect(() => {
    if (uris) {
      fetchMetas();
    }
  }, [stringifiedUris]);

  return metas;
}
