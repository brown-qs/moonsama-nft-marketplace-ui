import { request } from 'graphql-request';
import { useBlockNumber } from 'state/application/hooks';
import {
  DEFAULT_ORDERBOOK_PAGINATION,
  SUBGRAPH_MAX_BLOCK_DELAY,
  SUBGRAPH_URL,
} from '../../constants';
import {
  QUERY_LATEST_ORDERS,
  QUERY_USER_ACTIVE_ORDERS,
} from '../../subgraph/orderQueries';
import { Order } from './types';
import { parseOrder } from '../../utils/subgraph';
import { useState, useCallback, useEffect } from 'react';
import { useActiveWeb3React } from 'hooks/useActiveWeb3React/useActiveWeb3React';
import { AddressZero } from '@ethersproject/constants';

export interface LatestOrdersQuery {
  from: number; // from which element we fetch,
  num?: number; // how many elements we fetch
}

export interface LatestOrdersResults {
  latestOrders?: Order[];
}

export const useLatestOrders = ({
  from = 0,
  num = DEFAULT_ORDERBOOK_PAGINATION,
}: LatestOrdersQuery) => {
  const blockNumber = useBlockNumber();
  const { account } = useActiveWeb3React();

  const [result, setResult] = useState<LatestOrdersResults>({});

  const fetchAssetOrders = useCallback(async () => {
    const query = QUERY_LATEST_ORDERS(from, num as number);
    const response = await request(SUBGRAPH_URL, query);

    //console.debug('YOLO useLatestOrders', response);

    if (!response) {
      setResult({});
      return;
    }

    if (
      (response?._meta?.block.number ?? 0) + SUBGRAPH_MAX_BLOCK_DELAY <
      (blockNumber ?? 0)
    ) {
      console.warn('Info fetched from subgraph might be stale');
    }

    const latestOrders: Order[] = (response.latestOrders ?? [])
      .map((x: any) => parseOrder(x))
      .filter((item: Order | undefined) => !!item);

    setResult({ latestOrders });
  }, [blockNumber, account]);

  useEffect(() => {
    fetchAssetOrders();
  }, [blockNumber, account]);

  return result;
};
