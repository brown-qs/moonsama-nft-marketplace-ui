import {
  Card,
  CardActions,
  CardContent,
  Collapse,
  IconButton,
  Typography,
} from '@mui/material';
import { Button } from 'ui';
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
          <Typography
            className={cardTitle}
            variant="body2"
            color="textSecondary"
            component="div"
          >
            <div className={collectionName}>{collection.display_name}</div>
            {/* <div className={collectionSymbol}>{collection.symbol}</div> */}
          </Typography>
          {/* <div className={collectionType}>{collection.type}</div> */}
          {/* {collection?.address && chainId && (
            <ExternalLink
              href={getExplorerLink(chainId, collection.address, 'address')}
            >
              {truncateHexString(collection.address)}↗
            </ExternalLink>
          )} */}
        </CardContent>

        {/* <Collapse in={isCollectionExpanded} timeout="auto" unmountOnExit> */}
        <CardContent style={{ padding: '8px 16px' }}>
          <Typography paragraph className={collectionDescription}>
            {meta?.description}
          </Typography>
          {/* {meta?.external_link && (
              <ExternalLink href={meta?.external_link}>
                External site↗
              </ExternalLink>
            )} */}
        </CardContent>
        {/* </Collapse> */}
        {/* <CardActions disableSpacing style={{ maxHeight: 0 }}>
          <IconButton
            className={isCollectionExpanded ? expandOpen : expand}
            onClick={() => handleExpandClick()}
            aria-expanded={isCollectionExpanded}
            aria-label="show more"
            style={{ marginTop: '-32px' }}
          >
            <ExpandMoreIcon />
          </IconButton>
        </CardActions> */}

        <CardContent style={{ padding: '8px 16px' }}>
          <Typography paragraph className={collectionDescription}>
            Mint condition description
          </Typography>
          {/* {meta?.external_link && (
              <ExternalLink href={meta?.external_link}>
                External site↗
              </ExternalLink>
            )} */}
        </CardContent>

        <Button
            variant="contained"
            color="primary"
            size="large"
            style={{ margin: '8px 16px'}}
            fullWidth
          >
            Mint
          </Button>
      </Card>
    </Grid>
  );
};
