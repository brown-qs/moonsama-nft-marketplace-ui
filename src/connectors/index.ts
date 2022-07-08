import { AbstractConnector } from '@web3-react/abstract-connector';
import { ExternalProvider, Web3Provider } from '@ethersproject/providers';
import { UnsupportedChainIdError } from '@web3-react/core';
import {
  InjectedConnector,
  NoEthereumProviderError,
  UserRejectedRequestError as UserRejectedRequestErrorInjected,
} from '@web3-react/injected-connector';
import { NetworkConnector } from './NetworkConnector';
import {
  WalletConnectConnector,
  UserRejectedRequestError as UserRejectedRequestErrorWalletConnect,
} from '@web3-react/walletconnect-connector';
import { DEFAULT_CHAIN, PERMISSIONED_CHAINS, POLLING_INTERVAL, RPC_URLS } from '../constants';

import MetamaskIcon from '../assets/images/metamask.png';
import InjectedIcon from '../assets/images/arrow-right.svg'
import NovaIcon from '../assets/images/nova.png'
// if (typeof RPC_URL === 'undefined') {
//   throw new Error(`REACT_APP_RPC_URL must be a defined environment variable`);
// }

export const getConnectorErrorMessage = (error: Error) => {
  if (error instanceof NoEthereumProviderError) {
    return 'No Ethereum browser extension detected, install MetaMask on desktop or visit from a dApp browser on mobile.';
  } else if (error instanceof UnsupportedChainIdError) {
    return "You're connected to an unsupported network.";
  } else if (
    error instanceof UserRejectedRequestErrorInjected ||
    error instanceof UserRejectedRequestErrorWalletConnect
  ) {
    return 'Please authorize this website to access your Ethereum account.';
  } else {
    console.error(error);
    return 'An unknown error occurred. Check the console for more details.';
  }
};

export const getLibrary = (provider: ExternalProvider) => {
  const library = new Web3Provider(provider, 'any');
  library.pollingInterval = POLLING_INTERVAL;
  return library;
};

export const injected = new InjectedConnector({
  supportedChainIds: PERMISSIONED_CHAINS,
});

export const network = new NetworkConnector({
  urls: RPC_URLS,
  defaultChainId: DEFAULT_CHAIN
});

export const walletconnect = new WalletConnectConnector({
  rpc: RPC_URLS,
  qrcode: true,
  pollingInterval: 5000,
  bridge: 'https://bridge.walletconnect.org',
  //chainId: CHAIN_ID,
  supportedChainIds: PERMISSIONED_CHAINS,
});

export interface WalletInfo {
  connector?: AbstractConnector;
  name: string;
  iconName: string;
  description: string;
  href: string | null;
  color: string;
  primary?: true;
  mobile?: true;
  mobileOnly?: true;
  icon: string
}

export const SUPPORTED_WALLETS: { [key: string]: WalletInfo } = {
  INJECTED: {
    connector: injected,
    name: 'Injected',
    iconName: 'arrow-right.svg',
    description: 'Injected web3 provider.',
    href: null,
    color: '#010101',
    primary: true,
    //mobile: true,
    icon: InjectedIcon
  },
  METAMASK: {
    connector: injected,
    name: 'MetaMask',
    iconName: 'metamask.png',
    description: 'Easy-to-use browser extension.',
    href: null,
    color: '#E8831D',
    mobile: true,
    icon: MetamaskIcon
  },
  NOVA: {
    connector: injected,
    name: 'Nova',
    iconName: 'nova.png',
    description: 'Nova mobile wallet.',
    href: null,
    color: '#E8831D',
    mobile: true,
    mobileOnly: true,
    icon: NovaIcon
  },
  // WALLET_CONNECT: {
  //   connector: walletconnect,
  //   name: 'WalletConnect',
  //   iconName: 'walletConnectIcon.svg',
  //   description: 'Connect to Trust Wallet, Rainbow Wallet and more...',
  //   href: null,
  //   color: '#4196FC',
  //   mobile: true,
  // },
};
