import { useCallback, useState } from 'react'
import { useActiveWeb3React } from 'hooks'
import { ChainId } from '../../constants'
import { SUPPORTED_METAMASK_NETWORKS } from '../../constants/networks'

export default function useAddNetworkToMetamaskCb(): { addNetwork: (chainId: ChainId) => void; success: boolean | undefined } {
  const { library } = useActiveWeb3React()

  const [success, setSuccess] = useState<boolean | undefined>()

  const { ethereum } = window;

  const addNetwork = useCallback(async (chainId: ChainId) => {
    // console.log('NETWORK called', chainId, library?.provider.isMetaMask)
    //if (library && library.provider.isMetaMask && library.provider.request) {
    if (ethereum && ethereum.request) {
      if (!chainId) {
        setSuccess(false)
        return
      }
      const network = SUPPORTED_METAMASK_NETWORKS[chainId]
      if (!network) {
        setSuccess(false)
        return
      }
      // console.log('NETWORK', network, chainId)
      try {
        console.debug('NETWORK check')
        await ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: network.chainId }]
          })
        console.debug('NETWORK exists')
        setSuccess(true)
      } catch (switchError) {
        console.debug('NETWORK does not exist', switchError)
        //if ((switchError as any)?.code === 4902) {
          try {
            console.debug('NETWORK add chain', switchError)
            await ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [network],
            });
            console.debug('NETWORK add chain done', switchError)
            setSuccess(true)
          } catch (addError) {
            setSuccess(false)
          }
        //}
      }
    } else {
      setSuccess(false)
    }
  }, [library, ethereum])

  return { addNetwork, success }
}
