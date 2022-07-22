import { gql } from 'graphql-request';
import { META } from './common';

export const QUERY_USER_ERC721 = (account: string) => gql`
  query getUserTokens {
    ${META}
    owners(where: {id: "${account.toLowerCase()}"}) {
      id,
      ownedTokens {
        id,
        contract {
          address
        }
      }
    }
  }
`;

export const QUERY_ERC721_ACTIVE_ID = (from: number, count: number) => gql`
  query getUserActiveOrders {
    tokens(
      orderBy: numericId,
      skip: ${from},
      first: ${count},
      where: {owner_not: "0x0000000000000000000000000000000000000000"}
    ) {
      id
      numericId
      uri
    }
  }
`;

export const QUERY_ERC721_OWNED_ID = (
  from: number,
  count: number,
  owner: string
) => gql`
  query getUserActiveOrders {
    tokens(
      orderBy: numericId,
      skip: ${from},
      first: ${count},
      where: {owner: "${owner.toLowerCase()}"}
    ) {
      id
      numericId
      uri
    }
  }
`;

export const QUERY_ERC721_NOTOWNED_ID = (
  from: number,
  count: number,
  owner: string
) => gql`
  query getUserActiveOrders {
    tokens(
      orderBy: numericId,
      skip: ${from},
      first: ${count},
      where: {owner_not: "${owner.toLowerCase()}"}
    ) {
      id
      numericId
      uri
    }
  }
`;

export const QUERY_ERC721_ID_IN = (ids: (number | string)[]) => gql`
  query getTokensIdInArray {
    tokens(
      orderBy: numericId,
      where: {numericId_in: [${ids.map((id) =>
        typeof id === 'string' ? Number.parseInt(id) : id
      )}]}
    ) {
      id
      numericId
      uri
    }
  }
`;

export const QUERY_ERC721_CONTRACT_DATA = () => gql`
  query getUserActiveOrders {
    contract(id: "1") {
      totalSupply
      name
      symbol
      contractURI
      decimals
      address
    }
  }
`;

export const QUERY_SUBSQUID_META =  (ids: (number | string)[]) => gql`
  query getTokensMeata {
    tokens(
      orderBy: numericId_ASC,
      where: {numericId_in: [${ids.map((id) =>
        typeof id === 'string' ? Number.parseInt(id) : id
      )}]}
    ){
      meta {
        animationUrl
        attributes {
          display
          trait
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
