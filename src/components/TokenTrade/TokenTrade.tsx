import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import { Media } from 'components';
import { ExternalLink } from 'components/ExternalLink/ExternalLink';
import { useActiveWeb3React } from 'hooks';
import { FillWithOrder, Order } from 'hooks/marketplace/types';
import { TokenMeta } from 'hooks/useFetchTokenUri.ts/useFetchTokenUri.types';
import { StaticTokenData } from 'hooks/useTokenStaticDataCallback/useTokenStaticDataCallback';
import { useHistory } from 'react-router-dom';
import { GlitchText, PriceBox } from 'ui';
import { getExplorerLink, truncateHexString } from 'utils';
import { Fraction } from 'utils/Fraction';
import {
  getUnitPrice,
  inferOrderTYpe,
  OrderType,
  StringAssetType,
} from 'utils/subgraph';
import { useStyles } from './TokenTrade.styles';
import LootBox from '../../assets/images/loot-box.png';

export const TokenTrade = ({
  fill,
  meta,
  staticData,
}: {
  meta: TokenMeta | undefined;
  staticData: StaticTokenData;
  fill: FillWithOrder;
}) => {
  const {
    container,
    image,
    imageContainer,
    nameContainer,
    stockContainer,
    tokenName,
    mr,
    lastPriceContainer,
    smallText,
  } = useStyles();
  const { push } = useHistory();

  const { chainId } = useActiveWeb3React();
  const ot = inferOrderTYpe(chainId, fill.order.sellAsset, fill.order.buyAsset);
  const asset =
    ot == OrderType.BUY ? fill.order.buyAsset : fill.order.sellAsset;
  const action = ot == OrderType.BUY ? 'BUY' : 'SELL';
  const actionColor = ot == OrderType.BUY ? 'green' : '#b90e0e';

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
    fill.order?.askPerUnitNominator,
    fill.order?.askPerUnitDenominator
  );

  const unit =
    ot == OrderType.BUY
      ? fill.buyerSendsAmountFull
      : fill.order?.askPerUnitDenominator
          .mul(fill.buyerSendsAmountFull)
          .div(fill.order?.askPerUnitNominator);

  const ppuDisplay = ppu
    ? `${Fraction.from(ppu.toString(), 18)?.toFixed(0)} MOVR`
    : action;

  return (
    <Paper className={container}>
      <div
        role="button"
        className={imageContainer}
        onClick={handleImageClick}
        onKeyPress={handleImageClick}
        tabIndex={0}
      >
        <Media uri={meta?.image} className={image} />
        {/*<img src={LootBox} style={{width: '100%', height: 'auto'}}/>*/}
      </div>
      <div className={nameContainer}>
        <GlitchText className={tokenName}>
          {meta?.name ?? truncateHexString(asset.assetId)}
        </GlitchText>
        <PriceBox margin={false} size="small" color={actionColor}>
          {ppuDisplay}
        </PriceBox>
      </div>
      <div className={stockContainer}>
        {staticData?.symbol && (
          <Typography color="textSecondary">{staticData.symbol}</Typography>
        )}
        {totalSupplyString && (
          <Typography color="textSecondary">{totalSupplyString}</Typography>
        )}
      </div>
      <div className={lastPriceContainer}>
        <ExternalLink href={getExplorerLink(chainId, fill.id, 'transaction')}>
          <Typography className={smallText} noWrap>
            {unit?.toString()} taken
          </Typography>
        </ExternalLink>
        <Typography color="textSecondary" noWrap className={mr}>
          by
        </Typography>
        {/*<Typography color="textSecondary" noWrap>
          {truncateHexString(order.seller)}
        </Typography>*/}
        <ExternalLink href={getExplorerLink(chainId, fill.buyer, 'address')}>
          <Typography className={smallText} noWrap>
            {truncateHexString(fill.buyer)}
          </Typography>
        </ExternalLink>
      </div>
    </Paper>
  );
};
