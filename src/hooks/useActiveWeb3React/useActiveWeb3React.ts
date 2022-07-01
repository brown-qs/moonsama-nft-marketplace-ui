import { useWeb3React } from '@web3-react/core';
import { Web3ReactContextInterface } from '@web3-react/core/dist/types';
import { ChainId, NetworkContextName } from '../../constants';
import { Web3Provider } from '@ethersproject/providers';
import detectEthereumProvider from '@metamask/detect-provider';
import { useCallback } from 'react';

export function useActiveWeb3React(): Web3ReactContextInterface<Web3Provider> & {
  chainId?: ChainId;
} {
  const context = useWeb3React<Web3Provider>();
  const contextNetwork = useWeb3React<Web3Provider>(NetworkContextName);
  const fetchWeb3Data = useCallback(async () => {
    const provider:any = await detectEthereumProvider({ mustBeMetaMask: true});
    const id = await provider.request({ method: 'eth_chainId' })
    const accounts = await provider.request({ method: 'eth_requestAccounts' })
    console.log('useActiveWeb3React1', provider, id, accounts );
    return {id: id, account:accounts};
  }, []);
  let id = fetchWeb3Data();
  return context.active ? context : contextNetwork;
}
