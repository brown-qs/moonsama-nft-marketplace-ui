import { request } from 'graphql-request';
import { useBlockNumber } from 'state/application/hooks';
import { SUBGRAPH_MAX_BLOCK_DELAY, SUBGRAPH_URL } from '../../constants';
import { QUERY_LAST_TRADED_PRICE } from '../../subgraph/lastTradedPrice';
import { LastTradedPrice } from './types';
import { getAssetEntityId, parseLastTradedPrice } from '../../utils/subgraph';
import { useState, useCallback, useEffect } from 'react';

export interface LastTradedPriceQuery {
  assetAddress: string;
  assetId: string;
}

export const useLastTradedPrice = ({
  assetAddress,
  assetId,
}: LastTradedPriceQuery) => {
  const blockNumber = useBlockNumber();

  const [result, setResult] = useState<LastTradedPrice | undefined>(undefined);

  const fetchAssetOrders = useCallback(async () => {
    const assetEntityId = getAssetEntityId(assetAddress, assetId);

    const query = QUERY_LAST_TRADED_PRICE(assetEntityId);
    //console.error({query, SUBGRAPH_URL})
    const response = await request(SUBGRAPH_URL, query);

    //console.error('YOLO useLastTradedPrice', response);

    if (!response) {
      setResult(undefined);
      return;
    }

    if (
      (response?._meta?.block.number ?? 0) + SUBGRAPH_MAX_BLOCK_DELAY <
      (blockNumber ?? 0)
    ) {
      console.warn('Info fetched from subgraph might be stale');
    }

    const lastTradedPrice = parseLastTradedPrice(
      response.lastTradedPrice ?? undefined
    );
    console.error('YOLO useLastTradedPrice', lastTradedPrice);

    setResult(lastTradedPrice);
  }, [assetAddress, assetId, blockNumber]);

  useEffect(() => {
    fetchAssetOrders();
  }, [fetchAssetOrders, blockNumber]);

  return result;
};

export const useLastTradedPriceOnce = ({
  assetAddress,
  assetId,
}: LastTradedPriceQuery) => {
  const [result, setResult] = useState<LastTradedPrice | undefined>(undefined);

  const fetchAssetOrders = useCallback(async () => {
    const assetEntityId = getAssetEntityId(assetAddress, assetId);

    const query = QUERY_LAST_TRADED_PRICE(assetEntityId);
    //console.error({query, SUBGRAPH_URL})
    const response = await request(SUBGRAPH_URL, query);

    //console.error('YOLO useLastTradedPrice', response);

    if (!response) {
      setResult(undefined);
      return;
    }

    const lastTradedPrice = parseLastTradedPrice(
      response.lastTradedPrice ?? undefined
    );
    console.error('YOLO useLastTradedPrice', lastTradedPrice);

    setResult(lastTradedPrice);
  }, [assetAddress, assetId]);

  useEffect(() => {
    fetchAssetOrders();
  }, [fetchAssetOrders]);

  return result;
};
