import { parseEther } from '@ethersproject/units';
import { appStyles } from '../../app.styles';

import { useEffect, useState } from 'react';
import Typography from '@material-ui/core/Typography';
import Divider from '@material-ui/core/Divider';
import CircularProgress from '@material-ui/core/CircularProgress';

import { usePurchaseDialog } from '../../hooks/usePurchaseDialog/usePurchaseDialog';
import { Dialog, Button } from 'ui';
import { useStyles } from './PurchaseDialog.styles';
import { SuccessIcon } from 'icons';
import { ChainId, FRACTION_TO_BPS, PROTOCOL_FEE_BPS } from '../../constants';
import { useActiveWeb3React } from 'hooks';
import {
  getQuantity,
  getUnitPrice,
  OrderType,
  StringAssetType,
} from 'utils/subgraph';
import { BigNumber } from '@ethersproject/bignumber';
import {
  ApprovalState,
  useApproveCallback,
} from 'hooks/useApproveCallback/useApproveCallback';
import { useSubmittedFillTx } from 'state/transactions/hooks';
import { ExternalLink } from 'components/ExternalLink/ExternalLink';
import { getExplorerLink, TEN_POW_18 } from 'utils';
import {
  FillOrderCallbackState,
  useFillOrderCallback,
} from 'hooks/marketplace/useFillOrderCallback';
import { useBalances } from 'hooks/useBalances/useBalances';
import { Box, Grid } from '@material-ui/core';
import { AddressDisplayComponent } from 'components/form/AddressDisplayComponent';
import { CoinQuantityField, UNIT } from 'components/form/CoinQuantityField';
import { Fraction } from 'utils/Fraction';
import { AddressZero } from '@ethersproject/constants';
import { Fee, useFees } from 'hooks/useFees/useFees';
import { Asset } from 'hooks/marketplace/types';

export const PurchaseDialog = () => {
  const [orderLoaded, setOrderLoaded] = useState<boolean>(false);
  const [approvalSubmitted, setApprovalSubmitted] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [finalTxSubmitted, setFinalTxSubmitted] = useState<boolean>(false);
  const { isPurchaseDialogOpen, setPurchaseDialogOpen, purchaseData } =
    usePurchaseDialog();

  const [inputAmountText, setInputAmountText] = useState<string | undefined>(
    undefined
  );

  const { chainId, account } = useActiveWeb3React();

  const { dialogContainer, loadingContainer, successIcon, successContainer } =
    useStyles();

  const handleClose = () => {
    setLoading(false);
    setPurchaseDialogOpen(false);
    setOrderLoaded(false);
    setApprovalSubmitted(false);
    setFinalTxSubmitted(false);
    setInputAmountText(undefined);
  };

  const order = purchaseData?.order;
  const orderType = purchaseData?.orderType;

  if (!orderLoaded && account && order && orderType) {
    setOrderLoaded(true);
  }

  const title = 'Take offer';
  let symbol: string | undefined = 'MSAMA';
  let assetAddress: string | undefined;
  let assetId: string | undefined;
  let assetType: StringAssetType | undefined;
  let action: string;
  let usergive: BigNumber;
  let userget: BigNumber;
  let inputAmount: BigNumber;
  let sendAmount: BigNumber;
  let sendAmountError: string | undefined;
  let displayTotal: string | undefined;
  let userGetDisplay: string | undefined;
  let inputUnit: UNIT;
  let unitOptions: (string | number)[][];
  let fee: Fee;
  let feeAsset: Asset | undefined;
  let royaltyFee: BigNumber;
  let protocolFee: BigNumber;
  let showFee = false;
  let availableLabel: string;
  let netto: BigNumber | undefined;

  const {
    askPerUnitNominator,
    askPerUnitDenominator,
    quantityLeft: quantity,
  } = order ?? {};

  const orderHash = order?.id;

  const partialAllowed = order?.partialAllowed;
  const ppu = getUnitPrice(
    order?.askPerUnitNominator,
    order?.askPerUnitDenominator
  );
  const displayppu = ppu ? Fraction.from(ppu.toString(), 18)?.toFixed(5) : '?';
  const symbolString = symbol ? ` ${symbol.toString()}` : '';

  const userAsset = order?.buyAsset;
  const getAsset = order?.sellAsset;

  const isGetAssetErc20OrNative =
    getAsset?.assetType?.valueOf() === StringAssetType.ERC20.valueOf() ||
    getAsset?.assetType?.valueOf() === StringAssetType.NATIVE.valueOf();
  const isGiveAssetErc20OrNative =
    userAsset?.assetType?.valueOf() === StringAssetType.ERC20.valueOf() ||
    userAsset?.assetType?.valueOf() === StringAssetType.NATIVE.valueOf();

  const total = getQuantity(
    orderType,
    quantity,
    askPerUnitNominator,
    askPerUnitDenominator
  );

  useEffect(() => {
    if (total) {
      if (!partialAllowed) {
        //console.warn('SETT');
        setInputAmountText(total?.toString());
      }

      if (total.eq('1')) {
        //console.warn('SETT');
        setInputAmountText(total?.toString());
      }
    }
  }, [partialAllowed, total]);

  if (orderType === OrderType.BUY) {
    action = 'SELL';

    availableLabel = 'Total requested';

    assetAddress = userAsset?.assetAddress;
    assetId = userAsset?.assetId;
    assetType = userAsset?.assetType;

    // user asset desides
    [inputUnit, unitOptions] = isGiveAssetErc20OrNative
      ? [UNIT.ETHER, [[1, 'in ether']]]
      : [UNIT.WEI, [[2, 'in units']]];

    // we sell our erc20 into a buy order
    if (isGiveAssetErc20OrNative) {
      // how much we want to sell from our erc20 in ether
      try {
        sendAmount = parseEther(inputAmountText ?? '0');
        sendAmountError = undefined;
      } catch {
        sendAmount = BigNumber.from('0');
        sendAmountError = 'Invalid quantity value';
      }
      displayTotal = Fraction.from(total?.toString(), 18)?.toFixed(5);

      sendAmount = ppu?.mul(sendAmount).div(TEN_POW_18) ?? BigNumber.from('0');
      usergive = sendAmount ?? BigNumber.from('0');

      userget = sendAmount ?? BigNumber.from('0');
      userGetDisplay = Fraction.from(userget?.toString(), 18)?.toFixed(5);
    } else {
      try {
        sendAmount = BigNumber.from(inputAmountText ?? '0');
        sendAmountError = undefined;
      } catch {
        sendAmount = BigNumber.from('0');
        sendAmountError = 'Invalid quantity value';
      }
      displayTotal = total?.toString();
      usergive = sendAmount;
      sendAmount = ppu?.mul(sendAmount) ?? BigNumber.from('0');
      //usergive = sendAmount
      userget = sendAmount ?? BigNumber.from('0');
      userGetDisplay = isGetAssetErc20OrNative
        ? Fraction.from(userget?.toString(), 18)?.toFixed(5)
        : userget?.toString();

      // we give an NFT and we check the royalty of it
      feeAsset = userAsset;
      showFee = true;
    }
  } else {
    action = 'BUY';

    availableLabel = 'Total available';

    assetAddress = getAsset?.assetAddress;
    assetId = getAsset?.assetId;
    assetType = getAsset?.assetType;

    // other asset decides
    [inputUnit, unitOptions] = isGetAssetErc20OrNative
      ? [UNIT.ETHER, [[1, 'in ether']]]
      : [UNIT.WEI, [[2, 'in wei']]];

    // we buy into a sell order, which is an erc20 token
    if (isGetAssetErc20OrNative) {
      // input amount to buy is in ether
      try {
        inputAmount = parseEther(inputAmountText ?? '0');
        sendAmountError = undefined;
      } catch {
        inputAmount = BigNumber.from('0');
        sendAmountError = 'Invalid quantity value';
      }
      displayTotal = Fraction.from(total?.toString(), 18)?.toFixed(5);

      userget = inputAmount ?? BigNumber.from('0');
      usergive = ppu?.mul(inputAmount).div(TEN_POW_18) ?? BigNumber.from('0');

      sendAmount = userget;

      //usergive = sendAmount
      userGetDisplay = userget?.toString();

      // we buy into a sell order, which is an NFT
    } else {
      // input is in wei
      try {
        inputAmount = BigNumber.from(inputAmountText ?? '0');
        sendAmountError = undefined;
      } catch {
        inputAmount = BigNumber.from('0');
        sendAmountError = 'Invalid quantity value';
      }
      displayTotal = total?.toString();

      userget = inputAmount ?? BigNumber.from('0');
      sendAmount = userget;
      usergive = ppu?.mul(sendAmount) ?? BigNumber.from('0');
      //usergive = sendAmount
      userGetDisplay = userget?.toString();
    }
  }

  const [approvalState, approveCallback] = useApproveCallback({
    assetAddress: userAsset?.assetAddress,
    assetId: userAsset?.assetId,
    assetType: userAsset?.assetType,
    amountToApprove: usergive,
  });

  const userAssetBalance = useBalances([
    {
      assetAddress: userAsset?.assetAddress,
      assetId: userAsset?.assetId,
      assetType: userAsset?.assetType,
      id: userAsset?.assetId,
    },
  ])?.[0];

  const hasEnough = userAssetBalance?.gte(usergive);

  const displayBalance = isGiveAssetErc20OrNative
    ? Fraction.from(userAssetBalance?.toString(), 18)?.toFixed(5)
    : userAssetBalance?.toString();

  useEffect(() => {
    if (approvalState === ApprovalState.PENDING) {
      setApprovalSubmitted(true);
    }
  }, [approvalState, approvalSubmitted]);

  /*
  console.warn('FILL', {
    hasEnough,
    buyer: account?.toString(),
    quantity: quantity?.toString(),
    usergive: usergive?.toString(),
    userget: userget?.toString(),
    sendAmount: sendAmount?.toString(),
    ppu: ppu?.toString(),
    askPerUnitDenominator: askPerUnitDenominator?.toString(),
    askPerUnitNominator: askPerUnitNominator?.toString(),
    isGetAssetErc20OrNative,
    isGiveAssetErc20OrNative,
  });
  */

  fee = useFees([feeAsset])?.[0];
  royaltyFee =
    fee?.value?.mul(userget).div(FRACTION_TO_BPS) ?? BigNumber.from('0');
  protocolFee = userget.mul(PROTOCOL_FEE_BPS).div(FRACTION_TO_BPS);

  if (showFee) {
    netto = userget.sub(protocolFee).sub(royaltyFee);
  }

  const {
    state: fillOrderState,
    callback: fillOrderCallback,
    error,
  } = useFillOrderCallback(
    orderHash,
    {
      buyer: account,
      quantity: sendAmount,
    },
    {
      native:
        userAsset?.assetAddress === AddressZero &&
        userAsset?.assetType.valueOf() === StringAssetType.NATIVE,
      usergive,
    }
  );

  const { fillSubmitted, fillTx } = useSubmittedFillTx(order?.id);

  const showApproveFlow =
    approvalState === ApprovalState.NOT_APPROVED ||
    approvalState === ApprovalState.PENDING;

  const {
    divider,
    borderStyleDashed,
    infoContainer,
    button,
    //
    row,
    col,
    //
    formBox,
    formLabel,
    formValue,
    formValueGive,
    formValueGet,
    formValueTokenDetails,
    formSubheader,
    fieldError,
    formButton,
  } = appStyles();

  const renderBody = () => {
    if (!orderLoaded) {
      return (
        <div className={loadingContainer}>
          <CircularProgress />
          <div>
            <Typography>Loading order details</Typography>
            <Typography color="textSecondary" variant="h5">
              Should be a jiffy
            </Typography>
          </div>
        </div>
      );
    }

    if (finalTxSubmitted && !fillSubmitted) {
      return (
        <>
          <div className={loadingContainer}>
            <CircularProgress />
            <div>
              <Typography>Placing your fill...</Typography>
              <Typography color="textSecondary" variant="h5">
                Check your wallet for action
              </Typography>
            </div>
          </div>
        </>
      );
    }
    if (finalTxSubmitted && fillSubmitted) {
      return (
        <div className={successContainer}>
          <SuccessIcon className={successIcon} />
          <Typography>{`Fill placed`}</Typography>
          <Typography color="primary">{orderHash}</Typography>

          {fillTx && (
            <ExternalLink
              href={getExplorerLink(
                chainId ?? ChainId.MOONRIVER,
                fillTx.hash,
                'transaction'
              )}
            >
              {fillTx.hash}
            </ExternalLink>
          )}
          <Button
            className={button}
            onClick={handleClose}
            variant="outlined"
            color="primary"
          >
            Close
          </Button>
        </div>
      );
    }

    return (
      <>
        <form>
          <Box className={formBox}>
            <div className={infoContainer}>
              <Typography className={formSubheader}>Action</Typography>
              <Typography className={formValue}>
                {action} {assetType}
              </Typography>
            </div>

            <Divider variant="fullWidth" className={divider} />

            <Typography className={formSubheader}>Token Details</Typography>

            <div className={row}>
              <div className={col}>
                <div className={formLabel}>Address</div>
                <AddressDisplayComponent
                  className={`${formValue} ${formValueTokenDetails}`}
                  charsShown={5}
                >
                  {assetAddress ?? '?'}
                </AddressDisplayComponent>
              </div>
              <div className={col}>
                <div className={formLabel}>ID</div>
                <div className={`${formValue} ${formValueTokenDetails}`}>
                  {assetId}
                </div>
              </div>
              <div className={col}>
                <div className={formLabel}>Price per unit</div>
                <div
                  className={`${formValue} ${formValueTokenDetails}`}
                  style={{
                    justifyContent: 'flex-end',
                  }}
                >
                  {displayppu} MOVR
                </div>
              </div>
              <div className={col}>
                <div className={formLabel}>{availableLabel}</div>
                <div
                  className={`${formValue} ${formValueTokenDetails}`}
                  style={{
                    justifyContent: 'flex-end',
                  }}
                >
                  {displayTotal ?? '?'} {symbolString}
                </div>
              </div>
            </div>
            <Divider
              variant="fullWidth"
              className={`${divider} ${borderStyleDashed}`}
            />

            {orderType?.valueOf() === OrderType.BUY && (
              <>
                <div className={infoContainer}>
                  <Typography className={formLabel}>Your balance</Typography>
                  <Typography className={formValue}>
                    {displayBalance ?? '?'} {symbolString}
                  </Typography>
                </div>

                {partialAllowed && total && total.gt('1') ? (
                  <div className={infoContainer}>
                    <Typography className={formLabel}>You sell</Typography>

                    <CoinQuantityField
                      id="input-amount"
                      className={formValue}
                      value={inputAmountText}
                      unitOptions={unitOptions}
                      unit={inputUnit}
                      setValue={setInputAmountText}
                      setMaxValue={() => {}}
                      withMaxButton={true}
                      // onChange={handleInputAmountChange}
                      // inputProps={{ min: 0, max: total?.toNumber() }}
                    ></CoinQuantityField>
                  </div>
                ) : (
                  <div className={infoContainer}>
                    <Typography className={formLabel}>You sell</Typography>
                    <Typography className={formValue}>
                      {displayTotal} {symbolString}
                    </Typography>
                  </div>
                )}

                {sendAmountError && (
                  <div className={fieldError}>{sendAmountError}</div>
                )}

                <div className={infoContainer}>
                  <Typography className={formLabel}>You get brutto</Typography>
                  <Typography className={formValueGet}>
                    {userGetDisplay} MOVR
                  </Typography>
                </div>

                {showFee && protocolFee && (
                  <div className={infoContainer}>
                    <Typography className={formLabel}>Protocol fee</Typography>
                    <Typography className={`${formValue}`}>
                      {Fraction.from(protocolFee?.toString(), 18)?.toFixed(5)}{' '}
                      MOVR
                    </Typography>
                  </div>
                )}

                {showFee && royaltyFee && (
                  <div className={infoContainer}>
                    <Typography className={formLabel}>Royalty fee</Typography>
                    <Typography className={`${formValue}`}>
                      {Fraction.from(royaltyFee.toString(), 18)?.toFixed(5)}{' '}
                      MOVR
                    </Typography>
                  </div>
                )}

                {showFee && netto && (
                  <div className={infoContainer}>
                    <Typography className={formLabel}>You get netto</Typography>
                    <Typography className={`${formValueGet}`}>
                      {Fraction.from(netto.toString(), 18)?.toFixed(5)} MOVR
                    </Typography>
                  </div>
                )}
              </>
            )}

            {orderType?.valueOf() === OrderType.SELL && (
              <>
                {partialAllowed && total && total.gt('1') ? (
                  <div className={infoContainer}>
                    <Typography className={formLabel}>You buy</Typography>
                    <CoinQuantityField
                      id="input-amount"
                      className={formValue}
                      value={inputAmountText}
                      unitOptions={unitOptions}
                      unit={inputUnit}
                      setValue={setInputAmountText}
                      setMaxValue={() => {}}
                      withMaxButton={true}
                      symbolString={symbolString}
                      // onChange={handleInputAmountChange}
                      // inputProps={{ min: 0, max: total?.toNumber() }}
                    ></CoinQuantityField>
                  </div>
                ) : (
                  <div className={infoContainer}>
                    <Typography className={formLabel}>You buy</Typography>
                    <Typography className={formValue}>
                      {displayTotal} {symbolString}
                    </Typography>
                  </div>
                )}

                {sendAmountError && (
                  <div className={fieldError}>{sendAmountError}</div>
                )}

                <div className={infoContainer}>
                  <Typography className={formLabel}>Your balance</Typography>
                  <Typography className={formValue}>
                    {displayBalance ?? '?'} MOVR
                  </Typography>
                </div>

                <div className={infoContainer}>
                  <Typography className={formValueGive}>You give</Typography>
                  <Typography className={formValue}>
                    {Fraction.from(usergive?.toString(), 18)?.toFixed(5)} MOVR
                  </Typography>
                </div>
              </>
            )}
          </Box>
        </form>

        {showApproveFlow ? (
          <Button
            onClick={() => {
              approveCallback();
              setApprovalSubmitted(true);
            }}
            className={button}
            variant="contained"
            color="primary"
            disabled={approvalState === ApprovalState.PENDING || !hasEnough}
          >
            Approve
          </Button>
        ) : (
          <Button
            onClick={() => {
              fillOrderCallback?.();
              setFinalTxSubmitted(true);
            }}
            className={button}
            variant="contained"
            color="primary"
            disabled={
              fillOrderState !== FillOrderCallbackState.VALID || !hasEnough
            }
          >
            Take offer
          </Button>
        )}

        <Button
          className={button}
          onClick={handleClose}
          variant="outlined"
          color="primary"
        >
          Cancel
        </Button>
      </>
    );
  };

  return (
    <Dialog
      maxWidth="sm"
      fullWidth={true}
      open={isPurchaseDialogOpen}
      onClose={loading ? undefined : handleClose}
      title={loading ? 'Follow steps' : title}
    >
      <div className={dialogContainer}>{renderBody()}</div>
    </Dialog>
  );
};
