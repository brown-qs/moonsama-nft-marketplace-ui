import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import { Media } from 'components';
import { useLastTradedPriceOnce } from 'hooks/marketplace/useLastTradedPrice';
import { useHistory } from 'react-router-dom';
import { GlitchText, PriceBox } from 'ui';
import { truncateHexString } from 'utils';
import { Fraction } from 'utils/Fraction';
import { OrderType, StringAssetType, StringOrderType, stringToOrderType } from 'utils/subgraph';
import { useStyles } from './Token.styles';
import LootBox from '../../assets/images/loot-box.png';
import { width } from '@mui/system';
import { TokenMeta } from 'hooks/useFetchTokenUri.ts/useFetchTokenUri.types';
import { StaticTokenData } from 'hooks/useTokenStaticDataCallback/useTokenStaticDataCallback';
import { Order } from 'hooks/marketplace/types';
import { useEffect, useState } from 'react';
import { useOrder } from 'hooks/marketplace/useOrder';
import { useAssetOrders, useAssetOrdersCallback } from 'hooks/marketplace/useAssetOrders';

export interface TokenData {
  meta: TokenMeta | undefined;
  staticData: StaticTokenData;
  order?: Order | undefined;
}

export const Token = ({ meta, staticData, order }: TokenData) => {
  const {
    container,
    image,
    imageContainer,
    nameContainer,
    stockContainer,
    tokenName,
    mr,
    lastPriceContainer,
  } = useStyles();
  const { push } = useHistory();
  const [fetchedOrder, setFetchedOrer] = useState<Order | undefined>(undefined)

  const asset = staticData.asset;

  const handleImageClick = () => {
    push(`/token/${asset.assetType}/${asset.assetAddress}/${asset.assetId}`);
  };

  /*
  const ltp = useLastTradedPriceOnce({
    assetAddress: asset.assetAddress,
    assetId: asset.assetId,
  });
  */

  const getOrderCB = useAssetOrdersCallback(asset.assetAddress, asset.assetId, false, true)

  useEffect(() => {
    const fetch = async () => {
      const os: Order[] = await getOrderCB()
      const o: Order | undefined = os.reduce((prev: Order| undefined, current: Order| undefined) => {
        if (prev && current) {
          if (prev.pricePerUnit.lt(current.pricePerUnit)) {
            return current
          } else {
            return prev
          }
        }
        return current
      }, undefined)
      if(o) {
        setFetchedOrer(o)
      }
    }
    if (!order) {
        fetch()
    }
  }, [])

  const finalOrder = order ?? fetchedOrder

  const orderType = stringToOrderType(finalOrder?.orderType)

  /*
  const color =
    ltp?.orderType.valueOf() === StringOrderType.BUY.valueOf()
      ? 'green'
      : '#b90e0e';
  */

  const color =
    orderType === OrderType.BUY
      ? 'green'
      : '#b90e0e';

  const isErc721 =
    asset.assetType.valueOf() === StringAssetType.ERC721.valueOf();
  const sup = staticData?.totalSupply?.toString();
  const totalSupplyString = isErc721
    ? 'unique'
    : sup
    ? `${sup} pieces`
    : undefined;

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
        {finalOrder?.pricePerUnit && (
          <PriceBox margin={false} size="small" color={color}>
            {Fraction.from(finalOrder?.pricePerUnit.toString(), 18)?.toFixed(0)} MOVR
          </PriceBox>
        )}
      </div>
      <div className={stockContainer}>
        {staticData?.symbol && (
          <Typography color="textSecondary">{staticData.symbol}</Typography>
        )}

        {totalSupplyString && (
          <Typography color="textSecondary">{totalSupplyString}</Typography>
        )}
      </div>
      {/*{ltp && <div className={lastPriceContainer}>
        <Typography color="textSecondary" noWrap className={mr}>
          Last trade
        </Typography>
        <PriceBox margin={true} size="small" color='white'>
          {Fraction.from(ltp.unitPrice, 18)?.toFixed(2)} MOVR
        </PriceBox>
      </div>}*/}
    </Paper>
  );
};
