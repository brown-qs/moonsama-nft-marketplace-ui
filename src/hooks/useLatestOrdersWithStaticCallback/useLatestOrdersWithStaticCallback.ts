import { DEFAULT_ORDERBOOK_PAGINATION, SUBGRAPH_URL } from '../../constants';
import { request } from 'graphql-request';
import { inferOrderTYpe, OrderType, parseOrder } from 'utils/subgraph';
import { useActiveWeb3React } from 'hooks/useActiveWeb3React/useActiveWeb3React';
import { useCallback } from 'react';
import { Asset, Order } from 'hooks/marketplace/types';
import {
  QUERY_LATEST_BUY_ORDERS,
  QUERY_LATEST_ORDERS,
  QUERY_LATEST_SELL_ORDERS,
} from 'subgraph/orderQueries';
import { useTokenStaticDataCallbackArray } from 'hooks/useTokenStaticDataCallback/useTokenStaticDataCallback';
import { AddressZero } from '@ethersproject/constants';

export const useLatestOrdersWithStaticCallback = () => {
  const { chainId } = useActiveWeb3React();
  const staticCallback = useTokenStaticDataCallbackArray();

  const fetchLatestOrdersWithStatic = useCallback(
    async (num: number, offset: number) => {
      const query = QUERY_LATEST_ORDERS(offset, num);
      const response = await request(SUBGRAPH_URL, query);

      console.debug('YOLO useLatestOrdersWithStaticCallback', response);

      if (!response) {
        return [];
      }

      let assets: Asset[] = [];
      const latestOrders: Order[] = (response.latestOrders ?? [])
        .map((x: any) => {
          const po = parseOrder(x);
          if (po) {
            const ot =
              inferOrderTYpe(chainId, po.sellAsset, po.buyAsset) ??
              OrderType.SELL;
            assets.push(ot === OrderType.BUY ? po.buyAsset : po.sellAsset);
          }
          return po;
        })
        .filter((item: Order | undefined) => !!item);

      const staticDatas = await staticCallback(assets);

      const datas = staticDatas.map((sd, i) => {
        return {
          meta: sd.meta,
          staticData: sd.staticData,
          order: latestOrders[i],
        };
      });
      return datas;
    },
    [chainId]
  );

  return fetchLatestOrdersWithStatic;
};

export const useLatestBuyOrdersWithStaticCallback = () => {
  const { chainId } = useActiveWeb3React();
  const staticCallback = useTokenStaticDataCallbackArray();

  const fetchLatestOrdersWithStatic = useCallback(
    async (num: number, offset: number) => {
      const query = QUERY_LATEST_BUY_ORDERS(`${AddressZero}-0`, offset, num);
      const response = await request(SUBGRAPH_URL, query);

      console.debug('YOLO useLatestBuyOrdersWithStaticCallback', response);

      if (!response) {
        return [];
      }

      let assets: Asset[] = [];
      const latestOrders: Order[] = (response.latestOrders ?? [])
        .map((x: any) => {
          const po = parseOrder(x);
          if (po) {
            const ot =
              inferOrderTYpe(chainId, po.sellAsset, po.buyAsset) ??
              OrderType.SELL;
            assets.push(ot === OrderType.BUY ? po.buyAsset : po.sellAsset);
          }
          return po;
        })
        .filter((item: Order | undefined) => !!item);

      const staticDatas = await staticCallback(assets);

      const datas = staticDatas.map((sd, i) => {
        return {
          meta: sd.meta,
          staticData: sd.staticData,
          order: latestOrders[i],
        };
      });
      return datas;
    },
    [chainId]
  );

  return fetchLatestOrdersWithStatic;
};

export const useLatestSellOrdersWithStaticCallback = () => {
  const { chainId } = useActiveWeb3React();
  const staticCallback = useTokenStaticDataCallbackArray();

  const fetchLatestOrdersWithStatic = useCallback(
    async (num: number, offset: number) => {
      const query = QUERY_LATEST_SELL_ORDERS(`${AddressZero}-0`, offset, num);
      const response = await request(SUBGRAPH_URL, query);

      console.debug('YOLO useLatestSellOrdersWithStaticCallback', response);

      if (!response) {
        return [];
      }

      let assets: Asset[] = [];
      const latestOrders: Order[] = (response.latestOrders ?? [])
        .map((x: any) => {
          const po = parseOrder(x);
          if (po) {
            const ot =
              inferOrderTYpe(chainId, po.sellAsset, po.buyAsset) ??
              OrderType.SELL;
            assets.push(ot === OrderType.BUY ? po.buyAsset : po.sellAsset);
          }
          return po;
        })
        .filter((item: Order | undefined) => !!item);

      const staticDatas = await staticCallback(assets);

      const datas = staticDatas.map((sd, i) => {
        return {
          meta: sd.meta,
          staticData: sd.staticData,
          order: latestOrders[i],
        };
      });
      return datas;
    },
    [chainId]
  );

  return fetchLatestOrdersWithStatic;
};
