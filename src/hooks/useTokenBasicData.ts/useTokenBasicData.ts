import { BigNumber } from '@ethersproject/bignumber';
import { Interface } from '@ethersproject/abi';
import { ChainId, WMOVR_ADDRESS } from '../../constants';
import { tryMultiCallCore } from 'hooks/useMulticall2/useMulticall2';
import {
  useERC1155Contract,
  useERC20Contract,
  useERC721Contract,
  useMulticall2Contract,
} from 'hooks/useContracts/useContracts';
import { StringAssetType } from 'utils/subgraph';
import { useActiveWeb3React } from 'hooks/useActiveWeb3React/useActiveWeb3React';
import { useCallback, useEffect, useState } from 'react';
import { Asset } from 'hooks/marketplace/types';

export interface BasicTokenData {
  asset: Asset;
  userBalance: BigNumber;
  totalSupply?: BigNumber;
  owner?: string;
}

export const processResults = (
  assets: Asset[],
  results: any[],
  account: string | null | undefined
) => {
  let res: BasicTokenData[] = [];
  let offset = 0;
  assets.map((x, i) => {
    if (x.assetType.valueOf() === StringAssetType.ERC20) {
      res.push({
        asset: x,
        userBalance: results[i + offset]?.[0],
        totalSupply: results[i + offset + 1]?.[0],
      });
      offset += 1;
      return;
    }

    if (x.assetType.valueOf() === StringAssetType.ERC721) {
      res.push({
        asset: x,
        userBalance:
          results[i + offset]?.[0] === account
            ? BigNumber.from('1')
            : BigNumber.from('0'),
        totalSupply: results[i + offset + 1]?.[0],
        owner: results[i + offset]?.[0],
      });
      offset += 1;
      return;
    }

    if (x.assetType.valueOf() === StringAssetType.ERC1155) {
      res.push({
        asset: x,
        userBalance: results[i + offset]?.[0],
        totalSupply: results[i + offset + 1]?.[0],
      });
      offset += 1;
      return;
    }
  });
  return res;
};

export const useTokenBasicData = (assets: Asset[]) => {
  const { chainId, account } = useActiveWeb3React();
  const multi = useMulticall2Contract();

  const [datas, setBasicDatas] = useState<BasicTokenData[] | undefined>();

  const erc20 = useERC20Contract(
    WMOVR_ADDRESS[ChainId.MOONRIVER] as string,
    true
  );
  const erc1155 = useERC1155Contract(
    WMOVR_ADDRESS[ChainId.MOONRIVER] as string,
    true
  );
  const erc721 = useERC721Contract(
    WMOVR_ADDRESS[ChainId.MOONRIVER] as string,
    true
  );

  const getCalldata = (asset: Asset) => {
    if (
      !asset ||
      !asset.assetAddress ||
      !asset.assetId ||
      !asset.assetType ||
      !account
    ) {
      return [];
    }
    if (asset.assetType?.valueOf() === StringAssetType.ERC20) {
      return [
        [
          [erc20?.interface.getFunction('balanceOf')],
          asset.assetAddress,
          'balanceOf',
          [account],
        ],
        [
          [erc20?.interface.getFunction('totalSupply')],
          asset.assetAddress,
          'totalSupply',
          [],
        ],
      ];
    }

    if (asset.assetType?.valueOf() === StringAssetType.ERC721) {
      return [
        [
          [erc721?.interface.getFunction('ownerOf')],
          asset.assetAddress,
          'ownerOf',
          [asset.assetId],
        ],
        [
          [
            new Interface([
              'function totalSupply() view returns (uint256)',
            ]).getFunction('totalSupply'),
          ],
          asset.assetAddress,
          'totalSupply',
          [],
        ],
      ];
    }

    if (asset.assetType?.valueOf() === StringAssetType.ERC1155) {
      return [
        [
          [erc1155?.interface.getFunction('balanceOf')],
          asset.assetAddress,
          'balanceOf',
          [account, asset.assetId],
        ],
        [
          [
            new Interface([
              'function totalSupply(uint256 id) view returns (uint256)',
            ]).getFunction('totalSupply'),
          ],
          asset.assetAddress,
          'totalSupply',
          [asset.assetId],
        ],
      ];
    }

    return [];
  };

  const fetchBasicDatas = useCallback(async () => {
    let calls: any[] = [];
    assets.map((asset, i) => {
      calls = [...calls, ...getCalldata(asset)];
    });

    const results = await tryMultiCallCore(multi, calls);

    if (!results) {
      setBasicDatas([]);
      return;
    }
    const x = processResults(assets, results, account);

    setBasicDatas(x);
  }, [chainId, multi, account, JSON.stringify(assets)]);

  useEffect(() => {
    if (chainId && multi && account) {
      fetchBasicDatas();
    }
  }, [chainId, multi, account, JSON.stringify(assets)]);

  return datas;
};
