import DateFnsUtils from '@date-io/date-fns';
import { BigNumber } from '@ethersproject/bignumber';
import { parseEther } from '@ethersproject/units';
import { yupResolver } from '@hookform/resolvers/yup';
import {
  Box,
  Collapse,
  FormControl,
  Grid,
  IconButton,
  OutlinedInput,
  Switch,
} from '@material-ui/core';
import CircularProgress from '@material-ui/core/CircularProgress';
import Divider from '@material-ui/core/Divider';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  KeyboardDatePicker,
  MuiPickersUtilsProvider,
} from '@material-ui/pickers';
import { ExternalLink } from 'components/ExternalLink/ExternalLink';
import { AddressDisplayComponent } from 'components/form/AddressDisplayComponent';
import { CoinQuantityField, UNIT } from 'components/form/CoinQuantityField';
import 'date-fns';
import { useActiveWeb3React, useBidDialog } from 'hooks';
import {
  ApprovalState,
  useApproveCallback,
} from 'hooks/useApproveCallback/useApproveCallback';
import { OrderType, StringAssetType } from 'utils/subgraph';
import { AddressZero } from '@ethersproject/constants';
import {
  ChainId,
  PROTOCOL_FEE_BPS,
  FRACTION_TO_BPS,
  STRATEGY_SIMPLE,
} from '../../constants';
import { useBalances } from 'hooks/useBalances/useBalances';
import { useFees } from 'hooks/useFees/useFees';
import {
  CreateOrderCallbackState,
  useCreateOrderCallback,
} from 'hooks/marketplace/useCreateOrderCallback';
import {
  Asset,
  AssetType,
  calculateOrderHash,
  CreateOrderData,
  stringAssetTypeToAssetType,
} from 'utils/marketplace';
import { getExplorerLink, getRandomInt, TEN_POW_18 } from 'utils';
import { SuccessIcon } from 'icons';
import { useEffect, useMemo, useState } from 'react';
import { useSubmittedOrderTx } from 'state/transactions/hooks';
import { Button, Dialog } from 'ui';
import * as yup from 'yup';
import { appStyles } from '../../app.styles';
import { useStyles } from './BidDialog.styles';
import { Fraction } from 'utils/Fraction';

const makeBidFormDataSchema = (): yup.ObjectSchema<BidFormData> =>
  yup
    .object({
      quantity: yup.string().notRequired(),
      pricePerUnit: yup.string().notRequired(),
      allowPartialFills: yup.boolean(),
    })
    .required();

// type TransferFormData = yup.TypeOf<
//   ReturnType<typeof makeTransferFormDataSchema>
// >;
type BidFormData = {
  quantity?: string;
  pricePerUnit?: string;
};

export const BidDialog = () => {
  const [finalTxSubmitted, setFinalTxSubmitted] = useState<boolean>(false);
  const { isBidDialogOpen, setBidDialogOpen, bidData } = useBidDialog();
  const [orderLoaded, setOrderLoaded] = useState<boolean>(false);
  const [approvalSubmitted, setApprovalSubmitted] = useState<boolean>(false);
  const [onlyTo, setOnlyTo] = useState<string>(AddressZero);
  const [startsAt, setStartsAt] = useState<BigNumber>(BigNumber.from('0'));
  const [expiresAt, setExpiresAt] = useState<BigNumber>(BigNumber.from('0'));

  const [quantityText, setQuantityText] = useState<string | undefined>(
    undefined
  );
  const [partialAllowed, setPartialAllowed] = useState<boolean>(true);
  const [ppuText, setPPUText] = useState<string | undefined>(undefined);

  const {
    divider,
    infoContainer,
    button,
    //
    row,
    col,
    verticalDashedLine,
    formBox,
    formLabel,
    formValue,
    formValueTokenDetails,
    formValueGive,
    formValueGet,
    spaceOnLeft,
    fieldError,
    formButton,
    expand,
    expandOpen,
  } = appStyles();

  const [UIAdvancedSectionExpanded, setExpanded] = useState(false);
  const UIHandleExpandClick = () => {
    setExpanded(!UIAdvancedSectionExpanded);
  };

  const [selectedDate, setSelectedDate] = useState<Date | undefined | null>(
    undefined
  );

  const handleDateChange = (date: Date | null) => {
    if (date) {
      setSelectedDate(date);
      const v = BigNumber.from(date.valueOf()).div('1000');
      if (!v.eq(expiresAt)) {
        setExpiresAt(v);
      }
    }
  };

  const {
    dialogContainer,
    loadingContainer,
    successContainer,
    successIcon,
    inputContainer,
  } = useStyles();

  const { chainId, account } = useActiveWeb3React();

  const handleClose = () => {
    setBidDialogOpen(false);
    setOrderLoaded(false);
    setFinalTxSubmitted(false);
    setExpiresAt(BigNumber.from('0'));
    setPartialAllowed(true);
    setOnlyTo(AddressZero);
    setFinalTxSubmitted(false);
    setFinalTxSubmitted(false);
    setQuantityText(undefined);
    setPPUText(undefined);
  };

  if (!orderLoaded && bidData?.asset && bidData?.orderType) {
    setOrderLoaded(true);
  }

  let title: string;
  const name = 'yadabada';
  let symbol: string | undefined = 'MSAMA';
  let sellAssetType: StringAssetType | undefined;
  let action: string;
  let orderAmount: BigNumber;
  let brutto: BigNumber;
  let protocolFee: BigNumber;
  let royaltyFee: BigNumber;
  let askPerUnitNominator: BigNumber;
  let askPerUnitDenominator: BigNumber;
  let amountToApprove: BigNumber;
  let ppu: BigNumber;
  let quantity: BigNumber;
  let displayQuantity: string | undefined;
  let quantityError: string | undefined;
  let ppuError: string | undefined;

  let sellAssetContract: Asset;
  let buyAssetContract: Asset;

  let netto: BigNumber;

  let availableLabel: string;

  const assetAddress = bidData?.asset?.assetAddress;
  const assetId = bidData?.asset?.assetId;
  const assetType = bidData?.asset?.assetType;

  const fee = useFees([bidData?.asset])?.[0];
  const symbolString = symbol ? ` ${symbol.toString()}` : '';

  const orderType = bidData?.orderType;

  const isAssetNative =
    assetType?.valueOf() === StringAssetType.NATIVE.valueOf();

  const [quantityUnit, unitOptions] = useMemo(() => {
    return isAssetNative
      ? [UNIT.ETHER, [[1, 'in ether']]]
      : [UNIT.WEI, [[2, 'units']]];
  }, [isAssetNative]);

  // buy- PPU is always in ether!
  try {
    ppu = ppuText ? parseEther(ppuText) : BigNumber.from('0');
    ppuError = undefined;
  } catch {
    ppu = BigNumber.from('0');
    ppuError = 'Invalid price value';
  }

  if (ppu.lt('0')) {
    ppu = BigNumber.from('0')
    ppuError = 'Invalid price value';
  }

  if (orderType === OrderType.BUY) {
    title = 'Create buy offer';
    action = 'buy';
    availableLabel = 'Total requested';

    sellAssetContract = {
      addr: AddressZero,
      id: '0',
      assetType: AssetType.NATIVE,
    };

    sellAssetType = StringAssetType.NATIVE;

    buyAssetContract = {
      addr: assetAddress ?? AddressZero,
      id: assetId ?? '0',
      assetType: stringAssetTypeToAssetType(assetType),
    };

    // buy- quantity input field is Ether
    if (isAssetNative) {
      // buy quantity is the amount of ERC20 to buy in ether
      try {
        quantity = quantityText
          ? parseEther(quantityText)
          : BigNumber.from('0');
        quantityError = undefined;
      } catch {
        quantity = BigNumber.from('0');
        quantityError = 'Invalid quantity value';
      }

      if (quantity.lt('0')) {
        quantity = BigNumber.from('0')
        quantityError = 'Invalid quantity value';
      }

      orderAmount =
        ppu && quantity
          ? ppu.mul(quantity).div(TEN_POW_18)
          : BigNumber.from('0');

      amountToApprove = orderAmount;

      brutto = orderAmount;

      askPerUnitNominator = BigNumber.from('1');
      askPerUnitDenominator = ppu ?? BigNumber.from('1');

      royaltyFee =
        fee?.value?.mul(orderAmount).div(FRACTION_TO_BPS) ??
        BigNumber.from('0');
      protocolFee = orderAmount.mul(PROTOCOL_FEE_BPS).div(FRACTION_TO_BPS);

      netto = orderAmount.sub(royaltyFee).sub(protocolFee);

      displayQuantity = Fraction.from(quantity?.toString(), 18)?.toFixed(0);
      //displayQuantity = quantity?.toString()
      //orderAmount = orderAmount.mul(TEN_POW_18)

      // buy- quantity input field is Wei
    } else {
      // buy - quantity is the amount of NFT to buy in wei
      try {
        quantity = BigNumber.from(quantityText ?? '0');
        quantityError = undefined;
      } catch {
        quantity = BigNumber.from('0');
        quantityError = 'Invalid quantity value';
      }

      if (quantity.lt('0')) {
        quantity = BigNumber.from('0')
        quantityError = 'Invalid quantity value';
      }

      // order amount in MOVR
      orderAmount = ppu && quantity ? ppu.mul(quantity) : BigNumber.from('0');
      amountToApprove = orderAmount;

      brutto = orderAmount;

      askPerUnitNominator = BigNumber.from('1');
      askPerUnitDenominator = ppu ?? BigNumber.from('1');

      royaltyFee =
        fee?.value?.mul(orderAmount).div(FRACTION_TO_BPS) ??
        BigNumber.from('0');
      protocolFee = orderAmount.mul(PROTOCOL_FEE_BPS).div(FRACTION_TO_BPS);

      netto = orderAmount.sub(royaltyFee).sub(protocolFee);
      displayQuantity = quantity?.toString();
    }
  } else {
    title = 'Create sell offer';
    action = 'sell';
    availableLabel = 'Total available';

    sellAssetContract = {
      addr: assetAddress ?? AddressZero,
      id: assetId ?? '0',
      assetType: stringAssetTypeToAssetType(assetType),
    };

    sellAssetType = assetType;

    buyAssetContract = {
      addr: AddressZero,
      id: '0',
      assetType: AssetType.NATIVE,
    };

    // sell- quantity input field is Ether
    if (isAssetNative) {
      // sell- quantity the amount of ERC20 to sell in ether
      try {
        quantity = quantityText
          ? parseEther(quantityText)
          : BigNumber.from('0');
        quantityError = undefined;
      } catch {
        quantity = BigNumber.from('0');
        quantityError = 'Invalid quantity value';
      }

      if (quantity.lt('0')) {
        quantity = BigNumber.from('0')
        quantityError = 'Invalid quantity value';
      }

      orderAmount = quantity;
      amountToApprove = orderAmount;
      brutto =
        ppu && quantity
          ? ppu.mul(quantity).div(TEN_POW_18)
          : BigNumber.from('0');

      askPerUnitNominator = ppu ?? BigNumber.from('1');
      askPerUnitDenominator = BigNumber.from('1');

      royaltyFee =
        fee?.value?.mul(brutto).div(FRACTION_TO_BPS) ?? BigNumber.from('0');
      protocolFee = brutto.mul(PROTOCOL_FEE_BPS).div(FRACTION_TO_BPS);

      netto = brutto.sub(royaltyFee).sub(protocolFee);
      displayQuantity = Fraction.from(quantity?.toString(), 18)?.toFixed(0);
    } else {
      // sell - quantity is the amount of NFT to sell in wei
      try {
        quantity = BigNumber.from(quantityText ?? '0');
        quantityError = undefined;
      } catch {
        quantity = BigNumber.from('0');
        quantityError = 'Invalid quantity value';
      }

      if (quantity.lt('0')) {
        quantity = BigNumber.from('0')
        quantityError = 'Invalid quantity value';
      }

      orderAmount = quantity;
      amountToApprove = orderAmount;
      brutto = ppu && quantity ? ppu.mul(quantity) : BigNumber.from('0');

      askPerUnitNominator = ppu ?? BigNumber.from('1');
      askPerUnitDenominator = BigNumber.from('1');

      royaltyFee =
        fee?.value?.mul(brutto).div(FRACTION_TO_BPS) ?? BigNumber.from('0');
      protocolFee = brutto.mul(PROTOCOL_FEE_BPS).div(FRACTION_TO_BPS);

      netto = brutto.sub(royaltyFee).sub(protocolFee);
      displayQuantity = quantity?.toString();
    }
  }

  const sellBalance = useBalances([
    {
      assetAddress: sellAssetContract.addr,
      assetId: sellAssetContract.id,
      assetType: sellAssetType,
      id: '1',
    },
  ])?.[0];

  const displaySellBalance =
    sellAssetType?.valueOf() === StringAssetType.ERC20
      ? Fraction.from(sellBalance, 18)?.toFixed(5)
      : sellBalance?.toString();
  const hasEnough = sellBalance?.gte(amountToApprove);

  const [approvalState, approveCallback] = useApproveCallback({
    assetAddress: sellAssetContract.addr,
    assetId: sellAssetContract.id,
    assetType: sellAssetType,
    amountToApprove: amountToApprove,
  });

  // this is needed so that we do no create a new order hash with each render
  const salt = useMemo(() => {
    return getRandomInt();
  }, [isBidDialogOpen]);

  //console.log("SALT", salt)

  const orderData: CreateOrderData = {
    buyAsset: buyAssetContract,
    sellAsset: sellAssetContract,
    seller: account ?? AddressZero,
    salt: salt.toString(),
    strategy: STRATEGY_SIMPLE,
  };

  const orderHash = calculateOrderHash(orderData);
  //console.log({ expiresAt, partialAllowed });

  /* */
  console.warn('ORDER', {
    askPerUnitDenominator: askPerUnitDenominator.toString(),
    askPerUnitNominator: askPerUnitNominator.toString(),
    expiresAt: expiresAt.toString(),
    startsAt: startsAt.toString(),
    quantity: orderAmount?.toString(),
    onlyTo,
    partialAllowed,
    amountToApprove: amountToApprove?.toString(),
    hasEnough,
  });
  

  const { state: createOrderState, callback: createOrderCallback } =
    useCreateOrderCallback(orderData, {
      askPerUnitDenominator,
      askPerUnitNominator,
      expiresAt: expiresAt,
      startsAt: startsAt,
      quantity: orderAmount,
      onlyTo,
      partialAllowed,
    });

  const { orderSubmitted, orderTx } = useSubmittedOrderTx(orderHash);

  /*
  console.warn('CREATE ORDER STATE', {
    orderSubmitted,
    orderTx,
    orderHash,
    finalTxSubmitted,
    createOrderState,
  });
  */

  useEffect(() => {
    if (approvalState === ApprovalState.PENDING) {
      setApprovalSubmitted(true);
    }
  }, [approvalState, approvalSubmitted]);

  const showApproveFlow =
    approvalState === ApprovalState.NOT_APPROVED ||
    approvalState === ApprovalState.PENDING;
  console.log('APPROVE FLOW', { showApproveFlow, approvalState, hasEnough });

  const renderBody = () => {
    if (!orderLoaded) {
      return (
        <div className={loadingContainer}>
          <CircularProgress />
          <div>
            <Typography>Loading asset details</Typography>
            <Typography color="textSecondary" variant="h5">
              Should be a jiffy
            </Typography>
          </div>
        </div>
      );
    }

    if (finalTxSubmitted && !orderSubmitted) {
      return (
        <>
          <div className={loadingContainer}>
            <CircularProgress />
            <div>
              <Typography>Placing your offer...</Typography>
              <Typography color="textSecondary" variant="h5">
                Check your wallet for action
              </Typography>
            </div>
          </div>
        </>
      );
    }
    if (finalTxSubmitted && orderSubmitted) {
      return (
        <div className={successContainer}>
          <SuccessIcon className={successIcon} />
          <Typography>{`Order placed`}</Typography>
          <Typography color="primary">{orderHash}</Typography>

          {orderTx && (
            <ExternalLink
              href={getExplorerLink(
                chainId ?? ChainId.MOONRIVER,
                orderTx.hash,
                'transaction'
              )}
            >
              {orderTx.hash}
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
        <Grid container spacing={1} justifyContent="center">
          <Grid item md={12} xs={12}>
            <Box className={formBox}>
              <Typography className="form-subheader">Token Details</Typography>
              <div className={row}>
                <div className={col}>
                  <div className={formLabel}>Address</div>
                  <AddressDisplayComponent
                    className={`${formValue} ${formValueTokenDetails}`}
                    charsShown={5}
                  >
                    {bidData?.asset?.assetAddress ?? '?'}
                  </AddressDisplayComponent>
                </div>
                <div className={col}>
                  <div className={formLabel}>ID</div>
                  <div className={`${formValue} ${formValueTokenDetails}`}>
                    {assetId}
                  </div>
                </div>
                <div className={col}>
                  <div className={formLabel}>Type</div>
                  <div className={`${formValue} ${formValueTokenDetails}`}>
                    {assetType}
                  </div>
                </div>
              </div>

              <Divider variant="fullWidth" className={divider} />

              <div className={inputContainer}>
                <Typography className={formLabel}>
                  Quantity to {action} *
                </Typography>
                <CoinQuantityField
                  id="quantity-amount"
                  className={formValue}
                  value={quantityText}
                  setValue={setQuantityText}
                  assetType={assetType}
                  unit={quantityUnit}
                  unitOptions={unitOptions}
                ></CoinQuantityField>
              </div>
              {quantityError && (
                <div className={fieldError}>{quantityError}</div>
              )}

              <div className={inputContainer}>
                <Typography className={formLabel}>Price per unit *</Typography>
                <Grid
                  container
                  spacing={1}
                  alignItems="center"
                  style={{ width: 'auto' }}
                  className={`${formValue}`}
                >
                  <Grid item>
                    <Typography className={formLabel}>MOVR</Typography>
                  </Grid>
                  <Grid item>
                    <TextField
                      id="ppa-amount"
                      variant="outlined"
                      className={formValue}
                      value={ppuText}
                      onChange={(event) => setPPUText(event.target.value)}
                    />
                  </Grid>
                </Grid>
              </div>
              {ppuError && <div className={fieldError}>{ppuError}</div>}

              <div className={infoContainer}>
                <Typography className={formLabel}>
                  Partial fills allowed
                </Typography>
                <Switch
                  checked={partialAllowed}
                  // onChange={(event) =>
                  //   setPartialAllowed(event.target.checked)
                  // }
                  name="partialAllowed"
                  onChange={(event) => setPartialAllowed(event.target.checked)}
                />
              </div>
            </Box>
          </Grid>

          <Grid item md={6} xs={12}>
            <Box className={formBox}>
              <Grid
                container
                spacing={1}
                justifyContent="space-between"
                alignItems="center"
              >
                <Grid item>
                  <Typography className="form-subheader">Advanced</Typography>
                </Grid>
                <Grid item>
                  <IconButton
                    className={UIAdvancedSectionExpanded ? expandOpen : expand}
                    onClick={UIHandleExpandClick}
                    aria-expanded={UIAdvancedSectionExpanded}
                    aria-label="show more"
                  >
                    <ExpandMoreIcon />
                  </IconButton>
                </Grid>
              </Grid>

              <Collapse
                in={UIAdvancedSectionExpanded}
                timeout="auto"
                unmountOnExit
              >
                <div className={infoContainer}>
                  <Typography className={formLabel}>Expiration</Typography>
                  <MuiPickersUtilsProvider utils={DateFnsUtils}>
                    <FormControl
                      className={`${formValue} ${spaceOnLeft}`}
                      variant="outlined"
                    >
                      <KeyboardDatePicker
                        disableToolbar
                        format="MM/dd/yyyy"
                        margin="normal"
                        value={selectedDate}
                        onChange={handleDateChange}
                        // onChange={(event) =>
                        //   inputToBigNum(event.target.value, setExpiresAt)
                        // }
                        id="datetime-picker"
                        KeyboardButtonProps={{
                          'aria-label': 'change date',
                        }}
                      />
                    </FormControl>
                  </MuiPickersUtilsProvider>
                </div>
                <div className={infoContainer}>
                  <Typography>Exclusive to</Typography>

                  <FormControl className={formValue} variant="outlined">
                    {/* <Controller */}
                    {/* control={control} */}
                    {/* render={({ field: { onChange, onBlur, value, ref } }) => ( */}
                    <OutlinedInput
                      id="exlusive-to-address"
                      type="text"
                      labelWidth={0}
                      // onChange={onChange}
                      // onChange={(event) => setOnlyTo(event.target.value)}
                      // onBlur={onBlur}
                      // value={value}
                      placeholder={'0x0...'}
                    />
                    {/* )} */}
                    {/* /> */}
                  </FormControl>
                </div>
              </Collapse>
            </Box>
          </Grid>

          {/* <Grid item className={verticalDashedLine}></Grid> */}
          <Grid item md={6} xs={12}>
            <Box className={formBox}>
              {orderType?.valueOf() === OrderType.SELL && (
                <>
                  <div className={infoContainer}>
                    <Typography className={formLabel}>You have</Typography>
                    <Typography className={`${formValue} ${spaceOnLeft}`}>
                      {displaySellBalance ?? '?'} {symbolString}
                    </Typography>
                  </div>

                  <div className={infoContainer}>
                    <Typography className={formLabel}>You give</Typography>
                    <Typography className={`${formValueGive} ${spaceOnLeft}`}>
                      {displayQuantity} {symbolString}
                    </Typography>
                  </div>
                  <div className={infoContainer}>
                    <Typography className={formLabel}>
                      You get brutto
                    </Typography>
                    <Typography className={`${formValueGet} ${spaceOnLeft}`}>
                      {Fraction.from(brutto.toString(), 18)?.toFixed(5)} MOVR
                    </Typography>
                  </div>

                  {protocolFee && (
                    <div className={infoContainer}>
                      <Typography className={formLabel}>
                        Protocol fee
                      </Typography>
                      <Typography className={`${formValue} ${spaceOnLeft}`}>
                        {Fraction.from(protocolFee?.toString(), 18)?.toFixed(5)}{' '}
                        MOVR
                      </Typography>
                    </div>
                  )}

                  {royaltyFee && (
                    <div className={infoContainer}>
                      <Typography className={formLabel}>Royalty fee</Typography>
                      <Typography className={`${formValue} ${spaceOnLeft}`}>
                        {Fraction.from(royaltyFee.toString(), 18)?.toFixed(5)}{' '}
                        MOVR
                      </Typography>
                    </div>
                  )}

                  <div className={infoContainer}>
                    <Typography className={formLabel}>You get netto</Typography>
                    <Typography className={`${formValueGet} ${spaceOnLeft}`}>
                      {Fraction.from(netto.toString(), 18)?.toFixed(5)} MOVR
                    </Typography>
                  </div>
                </>
              )}

              {orderType?.valueOf() === OrderType.BUY && (
                <>
                  <div className={infoContainer}>
                    <Typography className={formLabel}>You have</Typography>
                    <Typography className={`${formValue} ${spaceOnLeft}`}>
                      {Fraction.from(sellBalance?.toString(), 18)?.toFixed(5) ??
                        '?'}{' '}
                      MOVR
                    </Typography>
                  </div>

                  <div className={infoContainer}>
                    <Typography className={formLabel}>You get</Typography>
                    <Typography className={`${formValueGet} ${spaceOnLeft}`}>
                      {displayQuantity} {symbolString}
                    </Typography>
                  </div>
                  <div className={infoContainer}>
                    <Typography className={formLabel}>
                      You give brutto
                    </Typography>
                    <Typography className={`${formValue} ${spaceOnLeft}`}>
                      {Fraction.from(orderAmount.toString(), 18)?.toFixed(5)}{' '}
                      MOVR
                    </Typography>
                  </div>

                  {protocolFee && (
                    <div className={infoContainer}>
                      <Typography className={formLabel}>
                        Protocol fee
                      </Typography>
                      <Typography className={`${formValue} ${spaceOnLeft}`}>
                        {Fraction.from(protocolFee?.toString(), 18)?.toFixed(5)}{' '}
                        MOVR
                      </Typography>
                    </div>
                  )}

                  {royaltyFee && (
                    <div className={infoContainer}>
                      <Typography className={formLabel}>Royalty fee</Typography>
                      <Typography className={`${formValue} ${spaceOnLeft}`}>
                        {Fraction.from(royaltyFee.toString(), 18)?.toFixed(5)}{' '}
                        MOVR
                      </Typography>
                    </div>
                  )}

                  <div className={infoContainer}>
                    <Typography className={formLabel}>
                      You give netto
                    </Typography>
                    <Typography className={`${formValueGive} ${spaceOnLeft}`}>
                      {Fraction.from(netto.toString(), 18)?.toFixed(5)} MOVR
                    </Typography>
                  </div>
                </>
              )}
            </Box>
          </Grid>
        </Grid>

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
              createOrderCallback?.();
              setFinalTxSubmitted(true);
            }}
            className={formButton}
            variant="contained"
            color="primary"
            disabled={
              createOrderState !== CreateOrderCallbackState.VALID || !hasEnough
            }
          >
            Place offer
          </Button>
        )}
        <Button className={formButton} onClick={handleClose} color="primary">
          Cancel
        </Button>
      </>
    );
  };
  return (
    <Dialog
      open={isBidDialogOpen}
      onClose={handleClose}
      title={title}
      maxWidth="md"
    >
      <div className={dialogContainer}>{renderBody()}</div>
    </Dialog>
  );
};
