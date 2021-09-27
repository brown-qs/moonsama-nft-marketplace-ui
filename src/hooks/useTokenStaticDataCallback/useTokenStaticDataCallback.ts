import { BigNumber } from '@ethersproject/bignumber';
import { tryMultiCallCore } from 'hooks/useMulticall2/useMulticall2';
import {
  useERC20Contract,
  useMulticall2Contract,
} from 'hooks/useContracts/useContracts';
import { getAssetEntityId, OrderType, parseOrder, StringAssetType } from 'utils/subgraph';
import { useActiveWeb3React } from 'hooks/useActiveWeb3React/useActiveWeb3React';
import { useCallback } from 'react';
import { Asset, Order } from 'hooks/marketplace/types';
import { useFetchTokenUriCallback } from 'hooks/useFetchTokenUri.ts/useFetchTokenUriCallback';
import {
  getTokenStaticCalldata,
  processTokenStaticCallResults,
} from 'utils/calls';
import { Filters } from 'ui/Filters/Filters';
import { useMoonsamaAttrIds } from 'hooks/useMoonsamaAttrIdsCallback/useMoonsamaAttrIdsCallback';
import { parseEther } from '@ethersproject/units';
import { QUERY_ACTIVE_ORDERS_FOR_FILTER } from 'subgraph/orderQueries';
import request from 'graphql-request';
import { SUBGRAPH_URL } from '../../constants';
import { integerPropType } from '@mui/utils';

export interface StaticTokenData {
  asset: Asset;
  name?: string;
  symbol?: string;
  decimals?: number;
  totalSupply?: BigNumber;
  tokenURI?: string;
  contractURI?: string;
}

export type TokenStaticCallbackInput = {
  assetAddress?: string;
  assetType?: StringAssetType;
};

export type TokenStaticFetchInput = {
  num: number;
  offset: BigNumber;
};

export const useTokenStaticDataCallback = ({
  assetAddress,
  assetType,
}: TokenStaticCallbackInput) => {
  const { chainId } = useActiveWeb3React();
  const multi = useMulticall2Contract();

  const fetchUri = useFetchTokenUriCallback();

  const fetchTokenStaticData = useCallback(
    async (num: number, offset: BigNumber) => {
      if (!assetAddress || !assetType || !num) {
        return [];
      }

      // just because Indexes can be super huge
      const assets: Asset[] = Array.from({ length: num }, (_, i) => {
        const x = offset.add(i).toString();
        return {
          assetId: x,
          assetType,
          assetAddress,
          id: getAssetEntityId(assetAddress, x),
        };
      });

      let calls: any[] = [];
      assets.map((asset, i) => {
        calls = [...calls, ...getTokenStaticCalldata(asset)];
      });

      const results = await tryMultiCallCore(multi, calls);

      if (!results) {
        return [];
      }

      const staticData = processTokenStaticCallResults(assets, results);

      const metas = await fetchUri(staticData);

      return metas.map((x, i) => {
        return {
          meta: x,
          staticData: staticData[i],
        };
      });
    },
    [chainId, assetAddress, assetType]
  );

  return fetchTokenStaticData;
};

export const useTokenStaticDataCallbackArray = () => {
  const { chainId } = useActiveWeb3React();
  const multi = useMulticall2Contract();

  const fetchUri = useFetchTokenUriCallback();

  const fetchTokenStaticData = useCallback(
    async (assets: Asset[]) => {
      if (!assets) {
        return [];
      }

      let calls: any[] = [];
      assets.map((asset, i) => {
        calls = [...calls, ...getTokenStaticCalldata(asset)];
      });

      const results = await tryMultiCallCore(multi, calls);

      if (!results) {
        return [];
      }

      const staticData = processTokenStaticCallResults(assets, results);

      const metas = await fetchUri(staticData);

      return metas.map((x, i) => {
        return {
          meta: x,
          staticData: staticData[i],
        };
      });
    },
    [chainId]
  );

  return fetchTokenStaticData;
};


const chooseAssets = (assetType: StringAssetType, assetAddress: string, offset: BigNumber, num: number, ids: number[], maxId?: number) => {
  const offsetNum = BigNumber.from(offset).toNumber();
  let chosenAssets: Asset[];

  if (ids?.length > 0) {
    if (offsetNum >= ids.length) {
      return [];
    }
    const to = offsetNum + num >= ids.length ? ids.length : offsetNum + num;
    const chosenIds = ids.slice(offsetNum, to);

    chosenAssets = chosenIds.map((x) => {
      return {
        assetId: x.toString(),
        assetType,
        assetAddress,
        id: getAssetEntityId(assetAddress, x),
      };
    });
  } else {
    const rnum = maxId && offsetNum + num < maxId ? num : (maxId ? maxId - offsetNum : num)

    if (rnum == 0) {
      return []
    }

    chosenAssets = Array.from({ length: rnum }, (_, i) => {
      const x = offset.add(i).toString();
      return {
        assetId: x,
        assetType,
        assetAddress,
        id: getAssetEntityId(assetAddress, x),
      };
    });
  }

  return chosenAssets
}

export const useTokenStaticDataCallbackArrayWithFilter = (
  { assetAddress, assetType }: TokenStaticCallbackInput,
  filter?: Filters,
  maxId?: number
) => {
  const { chainId } = useActiveWeb3React();
  const multi = useMulticall2Contract();

  const fetchUri = useFetchTokenUriCallback();
  const ids = useMoonsamaAttrIds(filter?.traits) ?? [];

  const priceRange = filter?.priceRange
  const selectedOrderType = filter?.selectedOrderType

  const fetchTokenStaticData = useCallback(
    async (num: number, offset: BigNumber, setTake?: (take: number) => void) => {
      if (!assetAddress || !assetType) {
        return [];
      }

      let chosenAssets = chooseAssets(assetType, assetAddress, offset, num, ids, maxId)

      const fetchStatics = async (assets: Asset[], orders?: Order[]) => {
        if (orders && orders.length !== assets.length) {
          throw new Error('Orders/assets length mismatch')
        }
        let calls: any[] = [];
        assets.map((asset, i) => {
          calls = [...calls, ...getTokenStaticCalldata(asset)];
        });

        const results = await tryMultiCallCore(multi, calls);

        if (!results) {
          return [];
        }

        const staticData = processTokenStaticCallResults(assets, results);

        const metas = await fetchUri(staticData);

        return metas.map((x, i) => {
          return {
            meta: x,
            staticData: staticData[i],
            order: orders?.[i]
          };
        });
      }

      // if we don't have a price range, it's just business as usual
      if (!priceRange || priceRange.length === 0 || priceRange.length !== 2 || !selectedOrderType) {
        const statics = await fetchStatics(chosenAssets)
        return statics
      }

      const rangeInWei = priceRange.map(x => parseEther(x.toString()))

      let canStop = false
      let ordersFetch: any[] = []
      let pager = offset
      do {
        const sgAssets = chosenAssets.map(x => {
          return x.id
        })

        let query = QUERY_ACTIVE_ORDERS_FOR_FILTER(selectedOrderType, JSON.stringify(sgAssets), rangeInWei[0].toString(), rangeInWei[1].toString())

        const result = await request(
          SUBGRAPH_URL,
          query
        );
        //console.debug('YOLO getOrders', result);

        const orders = result?.orders;

        //console.debug('YOLO getOrders', { orders });

        if (orders && orders.length > 0) {
          ordersFetch = ordersFetch.concat(orders)
        }

        if (ordersFetch.length >= num) {
          canStop = true
          setTake?.(pager.toNumber())
          continue
        }

        pager = pager.add(BigNumber.from(num))
        chosenAssets = chooseAssets(assetType, assetAddress, pager, num, ids, maxId)

        //chosenAssets = []
        if (!chosenAssets || chosenAssets.length == 0) {
          canStop = true
          setTake?.(pager.toNumber())
        }

      } while (!canStop)

      const theAssets: Asset[] = []
      const orders = ordersFetch.map(x => {
        const o = parseOrder(x) as Order
        const a = selectedOrderType == OrderType.BUY ? o?.buyAsset as Asset : o?.sellAsset as Asset
        theAssets.push({
          assetId: a?.assetId,
          assetType: assetType,
          assetAddress: assetAddress,
          id: getAssetEntityId(assetAddress, a?.assetId)
        })
        return o
      })

      const result = await fetchStatics(theAssets, orders)
      
      return result.sort((a,b)=> Number.parseInt(a.staticData.asset.assetId) - Number.parseInt(b.staticData.asset.assetId))
    },
    [chainId, assetType, assetAddress, JSON.stringify(ids), JSON.stringify(priceRange), JSON.stringify(selectedOrderType)]
  );

  return fetchTokenStaticData;
};
