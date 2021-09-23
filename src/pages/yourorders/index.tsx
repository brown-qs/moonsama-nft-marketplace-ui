import { AddressZero } from '@ethersproject/constants';
import { Typography } from '@material-ui/core';
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import DoneOutlineIcon from '@mui/icons-material/DoneOutline';
import MoneyIcon from '@mui/icons-material/Money';
import SyncAltIcon from '@mui/icons-material/SyncAlt';
import { AddressDisplayComponent } from 'components/form/AddressDisplayComponent';
import { useActiveWeb3React, useBidDialog } from 'hooks';
import { LastTradedPrice, Order } from 'hooks/marketplace/types';
import { useTokenPageOrders } from 'hooks/marketplace/useTokenPageOrders';
import { useFetchTokenUri } from 'hooks/useFetchTokenUri.ts/useFetchTokenUri';
import { useTokenBasicData } from 'hooks/useTokenBasicData.ts/useTokenBasicData';
import { useTokenStaticData } from 'hooks/useTokenStaticData/useTokenStaticData';
import { useTransferDialog } from 'hooks/useTransferDialog/useTransferDialog';
import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Button,
  GlitchText,
  PriceBox,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
  Tabs,
} from 'ui';
import { getExplorerLink, truncateHexString } from 'utils';
import {
  getAssetEntityId,
  getDisplayQuantity,
  inferOrderTYpe,
  StrategyMap,
  StringAssetType,
  stringToStringAssetType,
} from 'utils/subgraph';
import { appStyles } from '../../app.styles';
import { ExternalLink, Media } from '../../components';
import { ChainId } from '../../constants';
import { useCancelDialog } from '../../hooks/useCancelDialog/useCancelDialog';
import { usePurchaseDialog } from '../../hooks/usePurchaseDialog/usePurchaseDialog';
import {
  formatExpirationDateString,
  getUnitPrice,
  OrderType,
} from '../../utils/subgraph';
import { useStyles } from './styles';
import { useLastTradedPrice } from 'hooks/marketplace/useLastTradedPrice';
import { Fraction } from 'utils/Fraction';
import { useCurrencyLogo } from 'hooks/useCurrencyLogo/useCurrencyLogo';
import { useUserOrders } from 'hooks/marketplace/useUserOrders';

const geTableHeader = () => {
  return (
    <TableHeader>
      <TableRow>
        <TableCell>ID</TableCell>
        <TableCell>Asset</TableCell>
        <TableCell>Action</TableCell>
        <TableCell>Unit Price</TableCell>
        <TableCell>Quantity</TableCell>
        <TableCell>Expiration</TableCell>
        <TableCell>Strategy</TableCell>
        <TableCell></TableCell>
      </TableRow>
    </TableHeader>
  );
};

// TEST URL: http://localhost:3000/token/0xff3e85e33a8cfc73fe08f437bfaeadff7c95e285/0
export const MyOrdersPage = () => {
  const { chainId, account } = useActiveWeb3React();

  const { formBox, formLabel, formValue, formValueTokenDetails } = appStyles();

  const {
    image,
    imageContainer,
    pageContainer,
    name,
    card,
    price,
    buttonsContainer,
    tabsContainer,
    tabs,
    externals,
    subHeader,
    subItemTitleCell,
    assetActionsBidTokenAmount,
    transferButton,
    newSellButton,
    tradeContainer,
    tradeRow,
    copyAddressButton,
  } = useStyles();

  const { setPurchaseData, setPurchaseDialogOpen } = usePurchaseDialog();
  const { setCancelData, setCancelDialogOpen } = useCancelDialog();

  const ordersMap = useUserOrders({
    from: 0,
    num: 1000,
  });

  const getTableBody = (
    orders: Order[] | undefined | null,
    orderType?: OrderType
  ) => {
    return (
      <TableBody>
        {orders && orders.length > 0 ? (
          orders.map((order) => {
            const {
              id,
              seller,
              createdAt,
              strategyType,
              strategy,
              sellAsset,
              buyAsset,
            } = order;
            const {
              quantityLeft,
              askPerUnitDenominator,
              askPerUnitNominator,
              expiresAt,
              onlyTo,
              partialAllowed,
            } = strategy || {};

            const unitPrice = getUnitPrice(
              askPerUnitNominator,
              askPerUnitDenominator
            );
            const expiration = formatExpirationDateString(expiresAt);
            const sellerShort = truncateHexString(seller);
            const ot =
              orderType ?? inferOrderTYpe(chainId, sellAsset, buyAsset);
            const orderAsset = ot === OrderType.BUY ? buyAsset : sellAsset;

            const qty =
              sellAsset.assetType.valueOf() == StringAssetType.ERC20 &&
              buyAsset.assetType.valueOf() == StringAssetType.ERC20
                ? quantityLeft
                : getDisplayQuantity(
                    ot,
                    quantityLeft,
                    askPerUnitNominator,
                    askPerUnitDenominator
                  );

            const displayUnitPrice = Fraction.from(unitPrice, 18)?.toFixed(5);

            return (
              <TableRow
                key={id}
                renderExpand={() => {
                  return (
                    <div>
                      <Typography className={subHeader}>
                        Order Details
                      </Typography>

                      <Grid container spacing={2}>
                        <Grid item xs={12}>
                          <Grid container spacing={2}>
                            <Grid item className={subItemTitleCell}>
                              Order ID
                            </Grid>
                            <Grid item>{id}</Grid>
                          </Grid>
                          <Grid container spacing={2}>
                            <Grid item className={subItemTitleCell}>
                              Maker
                            </Grid>
                            <Grid item>{seller}</Grid>
                          </Grid>
                          <Grid container spacing={2}>
                            <Grid item className={subItemTitleCell}>
                              Created at
                            </Grid>
                            <Grid item>
                              {formatExpirationDateString(createdAt)}
                            </Grid>
                          </Grid>
                          <Grid container spacing={2}>
                            <Grid item className={subItemTitleCell}>
                              Available to
                            </Grid>
                            <Grid item>
                              {onlyTo === AddressZero ? 'everyone' : onlyTo}
                            </Grid>
                          </Grid>
                          <Grid container spacing={2}>
                            <Grid item className={subItemTitleCell}>
                              Partial fills allowed
                            </Grid>
                            <Grid item>
                              {partialAllowed ? (
                                <DoneOutlineIcon aria-label="yes" />
                              ) : (
                                'no'
                              )}
                            </Grid>
                          </Grid>
                          <Grid container spacing={2}>
                            <Grid item className={subItemTitleCell}>
                              Asset type
                            </Grid>
                            <Grid item>{orderAsset?.assetType}</Grid>
                          </Grid>
                          <Grid container spacing={2}>
                            <Grid item className={subItemTitleCell}>
                              Asset address
                            </Grid>
                            <Grid item>{orderAsset?.assetAddress}</Grid>
                          </Grid>
                          <Grid container spacing={2}>
                            <Grid item className={subItemTitleCell}>
                              Asset ID
                            </Grid>
                            <Grid item>{orderAsset?.assetId}</Grid>
                          </Grid>
                        </Grid>
                      </Grid>
                    </div>
                  );
                }}
              >
                <TableCell title={id}>{truncateHexString(id)}</TableCell>
                <TableCell title={orderAsset?.id}>
                  <Link
                    to={`/token/${orderAsset?.assetType}/${orderAsset?.assetAddress}/${orderAsset?.assetId}`}
                  >
                    {truncateHexString(orderAsset?.id, 5)}
                  </Link>
                </TableCell>
                <TableCell>
                  {ot ? (OrderType.BUY === ot ? 'BUY' : 'SELL') : '?'}
                </TableCell>
                <TableCell>{displayUnitPrice?.toString()}</TableCell>
                <TableCell>{qty?.toString()}</TableCell>
                <TableCell>{expiration}</TableCell>

                <TableCell>{StrategyMap[strategyType.toLowerCase()]}</TableCell>
                <TableCell>
                  {seller.toLowerCase() === account?.toLowerCase() ? (
                    <Button
                      onClick={() => {
                        setCancelDialogOpen(true);
                        setCancelData({ orderHash: order.id });
                      }}
                      variant="contained"
                      color="secondary"
                    >
                      Cancel
                    </Button>
                  ) : (
                    <Button
                      onClick={() => {
                        setPurchaseDialogOpen(true);
                        setPurchaseData({ order, orderType: ot });
                      }}
                      variant="contained"
                      color="primary"
                    >
                      Fill
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })
        ) : (
          <TableRow>
            <TableCell style={{ textAlign: 'center' }} colSpan={7}>
              No records available...
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    );
  };

  return (
    <Grid container className={pageContainer} justifyContent="center">
      <Tabs
        containerClassName={tabsContainer}
        tabsClassName={tabs}
        tabs={[
          {
            label: 'Your Offers',
            view: (
              <Table isExpandable style={{ whiteSpace: 'nowrap' }}>
                {geTableHeader()}
                {getTableBody(ordersMap?.userOrders)}
              </Table>
            ),
          },
        ]}
      />
      <div style={{ marginTop: 40, width: '100%' }} />
    </Grid>
  );
};

export default MyOrdersPage;
