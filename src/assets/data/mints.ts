export const mints = {
  name: 'MoonSama List',
  timestamp: '2021-08-18T00:00:00.000Z',
  version: {
    major: 1,
    minor: 0,
    patch: 0,
  },
  keywords: [
    'susu',
    'carbonswap',
    'marketplace',
    'finance',
    'dex',
    'green',
    'sustainable',
  ],
  logoURI: 'https://',
  tags: {
    wrapped: {
      name: 'wrapped',
      description:
        'Assets that are a wrapped version of their original, holding the same value',
    },
    bridged: {
      name: 'bridged',
      description: 'Assets that are bridged over from another chain',
    },
    meme: {
      name: 'meme',
      description: 'Assets that were created with no specific purpose, for fun',
    },
    native: {
      name: 'native',
      description: 'Assets that are native to Moonriver',
    },
  },
  types: ['ERC20', 'ERC721', 'ERC1155'],
  indexing: ['none', 'sequential'],
  collections: [
    {
      chainId: 1285,
      address: '0xb654611F84A8dc429BA3cb4FDA9Fad236C505a1a',
      display_name: 'Moonsama',
      floorDisplay: true,
      minId: 1,
      maxId: 1000,
      idSearchOn: true,
      symbol: 'MSAMA',
      type: 'ERC721',
      contractURI: 'ipfs://QmPhFz5mKCtndGLLZBwGockGAWz7o7nef4Kgf37gYsTid5',
      subgraph:
        'https://moonriver-subgraph.moonsama.com/subgraphs/name/moonsama/nft',
      whitelist: [
        {
          address: '0x16b0Cc5A6B31F56331f2A19ec5cc770fEbFb7A72',
          maxMint: 1,
        },
      ]
    },
  ],
};

export default mints;
