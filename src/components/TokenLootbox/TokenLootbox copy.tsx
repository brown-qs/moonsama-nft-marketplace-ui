import { Paper, Typography, Button } from '@mui/material';
import { Media } from 'components';
import { useHistory } from 'react-router-dom';
import { GlitchText, PriceBox } from 'ui';
import { truncateHexString } from 'utils';
import { Fraction } from 'utils/Fraction';
import {
  getDisplayUnitPrice,
  OrderType,
  StringAssetType,
  stringToOrderType,
} from 'utils/subgraph';
import { styles } from './TokenLootbox.styles';
import { TokenMeta } from 'hooks/useFetchTokenUri.ts/useFetchTokenUri.types';
import { StaticTokenData } from 'hooks/useTokenStaticDataCallback/useTokenStaticDataCallback';
import { Order } from 'hooks/marketplace/types';
import { useEffect, useState } from 'react';
import { useAssetOrdersCallback } from 'hooks/marketplace/useAssetOrders';
import { useDecimalOverrides } from 'hooks/useDecimalOverrides/useDecimalOverrides';
import { useApprovedPaymentCurrency } from 'hooks/useApprovedPaymentCurrencies/useApprovedPaymentCurrencies';
import { useClasses } from 'hooks';

export interface TokenData {
  meta: TokenMeta | undefined;
  staticData: StaticTokenData;
  order?: Order | undefined;
}

export const TokenLootbox = ({ meta, staticData, order }: TokenData) => {
  const {
    container,
    image,
    imageContainer,
    nameContainer,
    stockContainer,
    tokenName,
    mr,
    lastPriceContainer,
  } = useClasses(styles);
  const { push } = useHistory();
  const [fetchedOrder, setFetchedOrer] = useState<Order | undefined>(undefined);
  const decimalOverrides = useDecimalOverrides();

  const asset = staticData.asset;

  const handleImageClick = () => {
    push(`/token/${asset.assetType}/${asset.assetAddress}/${asset.assetId}`);
  };

  const getOrderCB = useAssetOrdersCallback(
    asset.assetAddress,
    asset.assetId,
    false,
    true
  );
  const currency = useApprovedPaymentCurrency(asset);

  useEffect(() => {
    console.log('useEffect run!');
    const fetch = async () => {
      const os: Order[] = await getOrderCB();
      const o: Order | undefined = os.reduce(
        (prev: Order | undefined, current: Order | undefined) => {
          if (prev && current) {
            if (prev.pricePerUnit.lt(current.pricePerUnit)) {
              return prev;
            } else {
              return current;
            }
          }
          return current;
        },
        undefined
      );
      console.log('useEffect run fetch', { os, o });
      if (o) {
        setFetchedOrer(o);
      }
    };
    if (!order) {
      fetch();
    }
  }, []);

  const finalOrder = order ?? fetchedOrder;

  const orderType = stringToOrderType(finalOrder?.orderType);

  const color = orderType === OrderType.BUY ? 'green' : '#b90e0e';

  const decimals =
    decimalOverrides[staticData?.asset?.assetAddress?.toLowerCase()] ??
    staticData?.decimals ??
    0;
  const isErc721 =
    asset.assetType.valueOf() === StringAssetType.ERC721.valueOf();

  const sup = Fraction.from(
    staticData?.totalSupply?.toString() ?? '0',
    decimals
  )?.toFixed(0);

  const displayPPU = getDisplayUnitPrice(
    decimals,
    5,
    orderType,
    finalOrder?.askPerUnitNominator,
    finalOrder?.askPerUnitDenominator,
    true
  );

  let displayName = truncateHexString(asset.assetId)
  if (meta?.name) {
    if(asset.assetAddress.toLowerCase() === '0xfEd9e29b276C333b2F11cb1427142701d0D9f7bf'.toLowerCase()) {
      displayName = `${meta?.name} #${truncateHexString(asset.assetId)}`
    } else if (asset.assetAddress.toLowerCase() === '0xa17A550871E5F5F692a69a3ABE26e8DBd5991B75'.toLowerCase()) {
      displayName = `Plot #${truncateHexString(asset.assetId)}`
    } else {
      displayName = `${meta?.name}`
    }
  }

  const totalSupplyString =
    isErc721 || sup?.toString() === '1'
      ? 'unique'
      : sup
      ? `${sup} pieces`
      : undefined;

  return (
    <Paper className={container}>
      <div
        onClick={handleImageClick}
        onKeyPress={handleImageClick}
        style={{ cursor: 'pointer' }}
      >
        <div role="button" className={imageContainer} tabIndex={0}>
          <Media uri={meta?.image} className={image} />
        </div>
        <div className={nameContainer}>
          <GlitchText
            className={tokenName}
            variant="h1"
            style={{ margin: '12px 0' }}
          >
            {/** FIXME BLACKLIST */}
            {displayName}
          </GlitchText>
          {displayPPU && displayPPU !== '?' && (
            <PriceBox margin={false} size="small" color={color}>
              {displayPPU} {currency.symbol}
            </PriceBox>
          )}
        </div>
        <div className={stockContainer}>
          {staticData?.symbol && (
            <Typography color="textSecondary">{`${staticData.symbol} #${asset.assetId}`}</Typography>
          )}
          {totalSupplyString && (
            <Typography color="textSecondary">{totalSupplyString}</Typography>
          )}
        </div>
        <Button
          variant="contained"
          color="primary"
        >
          Make an offer
        </Button>
      </div>
    </Paper>
  );
};