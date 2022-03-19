import {
  Card,
  CardActions,
  CardContent,
  Collapse,
  IconButton,
  Typography,
} from '@mui/material';
import { Button, PriceBox } from 'ui';
import Grid from '@mui/material/Grid';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { appStyles } from '../../app.styles';
import { mintListStyles } from './MintListItem.style';
import {
  RawMint,
} from 'hooks/useRawMintFromList/useRawMintFromList';
import {
  CollectionMeta,
} from 'hooks/useFetchCollectionMeta/useFetchCollectionMeta';
import { ExternalLink, Media } from 'components';
import { getExplorerLink, truncateHexString } from 'utils';
import { useActiveWeb3React, useClasses } from 'hooks';
import { StringAssetType } from '../../utils/subgraph';

export type MintListItemProps = {
  collection: RawMint
  meta: CollectionMeta | undefined,
  salt: number
}

export const MintListItem = ({ collection, meta, salt }: MintListItemProps) => {
  const { chainId } = useActiveWeb3React();
  console.log('this runs', chainId)
  const [isCollectionExpanded, setExpanded] = useState(false);
  console.log('this runs', isCollectionExpanded)
  console.log(chainId, isCollectionExpanded)

  const handleExpandClick = () => {
    setExpanded(!isCollectionExpanded);
  };

  const { expand, expandOpen } = useClasses(appStyles);
  const {
    mediaContainer,
    cardTitle,
    collectionName,
    collectionSymbol,
    collectionType,
    card,
    collectionDescription,
  } = useClasses(mintListStyles);

  //console.warn('META', { meta });

  const isErc20 = collection.type.valueOf() === StringAssetType.ERC20.valueOf();
  const subcollection = collection.subcollections;
  const color = '#b90e0e';

  return (
    <Grid
      item
      key={`${collection?.address ?? 'collection'}-${salt}`}
      xl={3}
      md={4}
      sm={6}
      xs={12}
    >
      <Card className={card}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <div className={mediaContainer}>
            <Media uri={meta?.image} />
          </div>
        </div>
        <CardContent>
          <div className={collectionType}>{collection.display_name}</div>
        </CardContent>

        <CardContent style={{ padding: '8px 16px' }}>
          <Typography paragraph className={collectionDescription}>
            {meta?.description}
          </Typography>
        </CardContent>

        <CardContent style={{ padding: '8px 16px' }}>


          {/* <PriceBox margin={false} size="small" color={color}>
            1 MOVR
          </PriceBox> */}
          <Typography paragraph className={collectionDescription}>
            WhiteListed / Public
          </Typography>
          <Typography paragraph className={collectionDescription}>
            Available Mints  100/200
          </Typography>
        </CardContent>

        <Button
          variant="contained"
          color="primary"
          size="large"
          style={{ margin: '8px 16px' }}
          fullWidth
        >
          Mint for 1 MOVR
        </Button>
      </Card>
    </Grid>
  );
};
