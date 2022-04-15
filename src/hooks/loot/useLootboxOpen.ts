import {useMemo} from 'react'
import { useActiveWeb3React } from '../../hooks';
import axios, { AxiosError } from 'axios';
import { StringAssetType } from 'utils/subgraph';
import { useFetchTokenUriCallback  } from 'hooks/useFetchTokenUri.ts/useFetchTokenUriCallback';


export type OpenData = {
    lootboxId: string
}

export type Reward = {
    assetAddress: string
    assetId: string
    amount: string
    assetType: StringAssetType;
    tokenURI: string;
    meta?: any;
    name?: string;
    rarity?: string;
}

export enum LootboxOpenStatus {
    MINT_IN_PROGRESS = 'MINT_IN_PROGRESS',
    BUSY = 'BUSY',
}

export type RewardData = {
    rewards: Reward[],
    status: LootboxOpenStatus
}

export function useLootboxOpen(
  data: OpenData,
): {
  callback: undefined | (() => Promise<[RewardData | undefined, Error | undefined]>);
} {
  const { account, chainId } = useActiveWeb3React();

  const tokenURICB = useFetchTokenUriCallback()

  const {lootboxId} = data

  return useMemo(() => {
    if (!account || !chainId || !lootboxId) {
      return {
        callback: undefined
      };
    }

    if (!lootboxId) {
      return {
        callback: undefined
      };
    }

    return {
      callback: async function onOpen(): Promise<[RewardData | undefined, Error | undefined]> {
        try {
            const resp = await axios.request<RewardData>({
                method: 'put',
                // url: `${process.env.REACT_APP_BACKEND_API_URL}/lootbox/open`,
                url: `${'https://samabox-api.moonsama.com/api/v1'}/lootbox/open`,
                data: {
                    lootboxId,
                    amount: '1',
                    recipient: account,
                    difficulty: '745944601324485'
                }
            });
            console.log(resp.data)

            const metas = await tokenURICB(resp.data.rewards)
            resp.data.rewards = resp.data.rewards.map((x,i) => {
              return {
                meta: metas[i],
                ...x
              }
            })
            return [resp.data as RewardData, undefined]
        } catch(e) {
            const err = e as AxiosError;
            console.error('Error opening the box. Try again later.')
            return [undefined, new Error(err.response?.data?.message ?? 'Error')]
        }
      }
    };
  }, [
    lootboxId,
    account,
    chainId,
  ]);
}
