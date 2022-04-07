import { useMemo } from 'react';
import { calculateGasMargin } from '../../utils';

import { useMintDistributorContract } from '../useContracts/useContracts';
import { useActiveWeb3React } from '..';
import { useTransactionAdder } from '../../state/transactions/hooks';
import { BigNumber } from '@ethersproject/bignumber';

export enum MintCallbackState {
  INVALID,
  LOADING,
  VALID,
}

export type MintData = {
  tokenAddress: string;
  userMaxMint: number;
  merkleProof?: string[];
  mintCost?: number;
};

export function useMintCallback(craftData: MintData): {
  state: MintCallbackState;
  callback: null | (() => Promise<string>);
  error: string | null;
} {
  const { account, chainId, library } = useActiveWeb3React();

  //console.log('YOLO', { account, chainId, library });
  const contract = useMintDistributorContract(true);

  const addTransaction = useTransactionAdder();

  const { tokenAddress, userMaxMint, merkleProof, mintCost } = craftData;

  //console.warn('YOLO ORDER', { inputParams, inputOptions });

  return useMemo(() => {
    if (!library || !account || !chainId || !contract) {
      return {
        state: MintCallbackState.INVALID,
        callback: null,
        error: 'Missing dependencies',
      };
    }

    return {
      state: MintCallbackState.VALID,
      callback: async function onClaim(): Promise<string> {
        const args = [tokenAddress, userMaxMint, merkleProof];
        const methodName = 'claim';
        const inputOptions = { value: mintCost };

        const call = {
          contract: contract.address,
          parameters: args,
          methodName,
        };

        console.log(call);

        const gasEstimate = await contract.estimateGas[methodName](
          ...args,
          inputOptions
        ).catch((gasError: any) => {
          console.debug(
            'Gas estimate failed, trying eth_call to extract error',
            call
          );

          return contract.callStatic[methodName](...args, inputOptions)
            .then((result: any) => {
              console.debug(
                'Unexpected successful call after failed estimate gas',
                call,
                gasError,
                result
              );
              throw new Error(
                'Unexpected issue with estimating the gas. Please try again.'
              );
            })
            .catch((callError: any) => {
              console.debug('Call threw error', call, callError);
              let errorMessage = `The transaction cannot succeed due to error: ${callError.reason}`;
              throw new Error(errorMessage);
            });
        });

        if (!gasEstimate) {
          throw new Error(
            'Unexpected error. Please contact support: none of the calls threw an error'
          );
        }

        return contract[methodName](...args, {
          gasLimit: calculateGasMargin(gasEstimate),
          from: account,
          ...inputOptions,
        })
          .then((response: any) => {
            const sum = `Minted usig Distributor. NFT: ${tokenAddress}`;
            // addTransaction(response, {
            //   summary: sum,
            //   mint: {
            //     tokenAddress,
            //   },
            // });
            return response.hash;
          })
          .catch((error: any) => {
            // if the user rejected the tx, pass this along
            if (error?.code === 4001) {
              throw new Error('Transaction rejected.');
            } else {
              // otherwise, the error was unexpected and we need to convey that
              console.error(`Create order failed`, error, methodName, args);
              throw new Error(`Create order failed: ${error.message}`);
            }
          });
      },
      error: null,
    };
  }, [
    library,
    account,
    chainId,
    tokenAddress,
    userMaxMint,
    merkleProof,
    mintCost,
    addTransaction,
  ]);
}
