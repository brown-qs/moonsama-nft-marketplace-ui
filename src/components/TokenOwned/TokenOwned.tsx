import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import { Media } from 'components';
import { useActiveWeb3React } from 'hooks';
import { Asset } from 'hooks/marketplace/types';
import { TokenMeta } from 'hooks/useFetchTokenUri.ts/useFetchTokenUri.types';
import { StaticTokenData } from 'hooks/useTokenStaticDataCallback/useTokenStaticDataCallback';
import { useHistory } from 'react-router-dom';
import { GlitchText } from 'ui';
import { truncateHexString } from 'utils';
import { StringAssetType } from 'utils/subgraph';
import { useStyles } from './TokenOwned.styles';
import LootBox from '../../assets/images/loot-box.png';

export const TokenOwned = ({
  meta,
  staticData,
  asset,
}: {
  meta: TokenMeta | undefined;
  staticData: StaticTokenData;
  asset: Asset;
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
  } = useStyles();
  const { push } = useHistory();

  const { chainId } = useActiveWeb3React();

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
      </div>
      <div className={stockContainer}>
        {staticData?.symbol && (
          <Typography color="textSecondary">{staticData.symbol}</Typography>
        )}
        {totalSupplyString && (
          <Typography color="textSecondary">{totalSupplyString}</Typography>
        )}
      </div>
    </Paper>
  );
};
