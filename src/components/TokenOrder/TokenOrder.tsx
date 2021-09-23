import Typography from '@material-ui/core/Typography';
import { Media } from 'components';
import { ExternalLink } from 'components/ExternalLink/ExternalLink';
import { useActiveWeb3React, usePurchaseDialog } from 'hooks';
import { Order } from 'hooks/marketplace/types';
import { TokenMeta } from 'hooks/useFetchTokenUri.ts/useFetchTokenUri.types';
import { StaticTokenData } from 'hooks/useTokenStaticDataCallback/useTokenStaticDataCallback';
import { useHistory } from 'react-router-dom';
import { Button, PriceBox, TableCell, TableRow } from 'ui';
import { getExplorerLink, truncateHexString } from 'utils';
import { Fraction } from 'utils/Fraction';
import {
  formatExpirationDateString,
  getUnitPrice,
  inferOrderTYpe,
  OrderType, StrategyMap,
  StringAssetType,
} from 'utils/subgraph';
import { useStyles } from './TokenOrder.styles';

export const TokenOrder = ({
  order,
  meta,
  staticData,
}: {
  meta: TokenMeta | undefined;
  staticData: StaticTokenData;
  order: Order;
}) => {
  const {
    image,
    imageContainer,
    tokenName,
    smallText
  } = useStyles();
  const { push } = useHistory();

  const { chainId } = useActiveWeb3React();
  const { setPurchaseData, setPurchaseDialogOpen } = usePurchaseDialog();

  const ot = inferOrderTYpe(chainId, order.sellAsset, order.buyAsset);
  const asset = ot == OrderType.BUY ? order.buyAsset : order.sellAsset;
  const action = ot == OrderType.BUY ? 'BUY' : 'SELL';
  const actionColor = ot == OrderType.BUY ? 'green' : '#b90e0e';

  //const buttonLabel = ot == OrderType.BUY ? 'sell' : 'buy';

  const handleImageClick = () => {
    push(`/token/${asset.assetType}/${asset.assetAddress}/${asset.assetId}`);
  };

  const isErc721 =
    asset.assetType.valueOf() === StringAssetType.ERC721.valueOf();
  const sup = staticData?.totalSupply?.toString();
  const totalSupplyString = isErc721
    ? 'unique'
    : sup
    ? `${sup} pieces`
    : undefined;
  const ppu = getUnitPrice(
    order.strategy?.askPerUnitNominator,
    order.strategy?.askPerUnitDenominator
  );

  const ppuDisplay = ppu
    ? `${Fraction.from(ppu.toString(), 18)?.toFixed(0)} MOVR`
    : action;

  const expiration = formatExpirationDateString(order.strategy?.expiresAt);
  const strategyType = StrategyMap[order.strategyType.toLowerCase()];

  return (
    <TableRow>
      <TableCell>
        <div
          role="button"
          className={imageContainer}
          onClick={handleImageClick}
          onKeyPress={handleImageClick}
          tabIndex={0}
        >
          <Media uri={meta?.image} className={image} />
        </div>
        <Typography className={tokenName}>{meta?.name ?? truncateHexString(asset.assetId)}</Typography>
      </TableCell>
      <TableCell>
        <PriceBox margin={false} size="small" color={actionColor}>
          {ppuDisplay}
        </PriceBox>
      </TableCell>
      {/*TODO: Update Quantity*/}
      <TableCell>1</TableCell>
      <TableCell>
        <ExternalLink href={getExplorerLink(chainId, order?.seller, 'address')}>
          <Typography noWrap className={smallText}>
            {truncateHexString(order.seller)}
          </Typography>
        </ExternalLink>
      </TableCell>
      <TableCell>{strategyType}</TableCell>
      <TableCell>{expiration}</TableCell>
      <TableCell>
        <Button
          onClick={() => {
            setPurchaseDialogOpen(true);
            setPurchaseData({ order, orderType: ot });
          }}
          variant="contained"
          color="primary"
        >
          Take offer
        </Button>
      </TableCell>
    </TableRow>
  );
};
function setPurchaseDialogOpen(arg0: boolean) {
  throw new Error('Function not implemented.');
}

