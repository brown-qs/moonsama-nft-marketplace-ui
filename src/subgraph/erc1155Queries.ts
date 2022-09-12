import { gql } from 'graphql-request';
import { META } from './common';

// export const QUERY_USER_ERC1155 = (account: string) => gql`
//   query getUserTokens {
//     ${META}
//     tokenOwners(where: {owner: "${account.toLowerCase()}"}) {
//       id,
//       balance
//       token {
//         id
//         contract {
//           id
//         }
//       }
//     }
//   }
// `;

export const QUERY_SUBSQUID_USER_ERC1155 = (account: string) => gql`
  query getUserTokens {
    erc1155TokenOwners(where: {owner: {id_eq: "${account.toLowerCase()}"}}) {
      id,
      balance
      token {
        id
        contract {
          id
        }
      }
    }
  }
`;

export const QUERY_SUBSQUID_ERC1155_ACTIVE_ID = (
  address: string,
  from: number,
  count: number
) => gql`
  query getUserActiveOrders {
    erc1155Tokens(orderBy: numericId_ASC, where: {contract: {address_eq: "${address.toLowerCase()}"}}, limit: ${count}, offset:  ${from}) {
      id
      numericId
      tokenUri
      totalSupply
      metadata {
        attributes {
          displayType
          traitType
          value
        }
        description
        id
        image
        name
        type
      }
    }
  }
`;

export const QUERY_SUBSQUID_ERC1155_OWNED_ID = (
  address: string,
  from: number,
  count: number,
  owner: string
) => gql`
  query getUserActiveOrders {
    erc1155Tokens(
      where: {
        contract: { address_eq: "${address.toLowerCase()}" }
      }
      orderBy: numericId_ASC
      offset: ${from}
      limit: ${count}
    ) {
      id
      numericId
      tokenUri
      totalSupply
      metadata {
        attributes {
          displayType
          traitType
          value
        }
        description
        id
        image
        name
        type
      }
    }
  }
`;

export const QUERY_SUBSQUID_ERC1155_NOTOWNED_ID = (
  address: string,
  from: number,
  count: number,
  owner: string
) => gql`
  query getUserActiveOrders {
    erc1155Tokens(
      where: {
        contract: { address_eq: "${address.toLowerCase()}" }
      }
      orderBy: numericId_ASC
      offset: ${from}
      limit: ${count}
    ) {
      id
      numericId
      tokenUri
      totalSupply
      metadata {
        attributes {
          displayType
          traitType
          value
        }
        description
        id
        image
        name
        type
      }
    }
  }
`;

export const QUERY_SUBSQUID_ERC1155_ID_IN = (
  address: string,
  ids: (number | string)[]
) => gql`
  query getTokensIdInArray {
    erc1155Tokens(
      orderBy: numericId_ASC,
      where: { 
        contract: { address_eq: "${address.toLowerCase()}" }
        numericId_in: [${ids.map((id) =>
          typeof id === 'string' ? Number.parseInt(id) : id
        )}]
      }
    ) {
      id
      numericId
      tokenUri
      totalSupply
      metadata {
        attributes {
          displayType
          traitType
          value
        }
        description
        id
        image
        name
        type
      }
    }
  }
`;

export const QUERY_SUBSQUID_ERC1155_CONTRACT_DATA = (address: string) => gql`
query getUserActiveOrders {
  erc1155Contracts(where: {address_eq: "${address.toLowerCase()}"}) {
    name
    symbol
    totalSupply
    decimals
    contractURI
    address
  }
}
`;
