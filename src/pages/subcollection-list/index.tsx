import {
  Card,
  CardActions,
  CardContent,
  CardMedia,
  Collapse,
  IconButton,
  Typography,
} from '@material-ui/core';
import Grid from '@material-ui/core/Grid';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { GlitchText } from 'ui';
import { appStyles } from '../../app.styles';
import { collectionListStyles } from './subcollection-list.styles';
import {
  useRawCollectionsFromList,
  RawCollection,
  useRawcollection,
  RawSubcollection,
} from 'hooks/useRawCollectionsFromList/useRawCollectionsFromList';
import {
  CollectionMeta,
  useFetchCollectionMeta,
  useFetchSubcollectionMeta,
} from 'hooks/useFetchCollectionMeta/useFetchCollectionMeta';
import { ExternalLink, Media } from 'components';
import { getExplorerLink, truncateHexString } from 'utils';
import { useActiveWeb3React } from 'hooks';
import { StringAssetType } from 'utils/subgraph';

export const SubcollectionListPage = () => {

  let { address } =
    useParams<{ address: string }>();


  const collection = useRawcollection(address)
  const subcollections = collection?.subcollections ?? []
  const metas = useFetchSubcollectionMeta(subcollections);

  //console.warn('HERE', { rawCollections, metas });

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
        <GlitchText fontSize={48}>{collection?.display_name}</GlitchText>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <GlitchText fontSize={24}>Subcollections</GlitchText>
      </div>

      <Grid container spacing={2} style={{ marginTop: 12 }}>
        {subcollections.map((subcollection, i) => {
          return SubcollectionListItem(collection, collection?.subcollections?.[i], metas[i], i);
        })}
      </Grid>
    </>
  );
};

const SubcollectionListItem = (
  collection: RawCollection | undefined,
  subcollection: RawSubcollection | undefined,
  meta: CollectionMeta | undefined,
  i: number
) => {
  const [isCollectionExpanded, setExpanded] = useState(false);

  const { chainId } = useActiveWeb3React();

  const handleExpandClick = () => {
    setExpanded(!isCollectionExpanded);
  };

  const { expand, expandOpen } = appStyles();
  const {
    mediaContainer,
    cardTitle,
    collectionName,
    collectionSymbol,
    collectionType,
    card,
    collectionDescription,
  } = collectionListStyles();

  //console.warn('META', { meta });

  const isErc20 = collection?.type.valueOf() === StringAssetType.ERC20.valueOf();
  
  const itemsize = subcollection?.tokens.length
  const itemstring = !!itemsize && itemsize > 0 ? `${itemsize} items` : ''

  return (
      <Grid
        item
        key={`${collection?.address ?? 'collection'}-${subcollection?.id}-${i}`}
        xl={3}
        md={4}
        sm={6}
        xs={12}
      >
        <Card className={card}>
          <Link
            style={{
              display: 'flex',
              justifyContent: 'center',
            }}
            to={
              isErc20
                ? `/token/${collection?.type}/${collection?.address}/0`
                : `/collection/${collection?.type}/${collection?.address}/${subcollection?.id ?? '0'}`
            }
          >
            <div className={mediaContainer}>
              <Media uri={meta?.image} />
            </div>
            {/*<CardMedia
              className={cardMediaImage}
              src={WHITE_SUSU}
              title={collection.display_name}
            />*/}
          </Link>
          <CardContent>
            <Typography
              className={cardTitle}
              variant="body2"
              color="textSecondary"
              component="div"
            >
              <div className={collectionName}>{meta?.name}</div>
              <div className={collectionSymbol}>{itemstring}</div>
            </Typography>
            {/*<div className={collectionType}>By {meta?.artist}</div>*/}
            {meta?.external_link && meta?.artist && (
                <ExternalLink href={meta.external_link}>
                  {meta.artist}
                </ExternalLink>
              )}
            {/*
            {collection?.address && chainId && (
              <ExternalLink
                href={getExplorerLink(chainId, collection.address, 'address')}
              >
                {truncateHexString(collection.address)}↗
              </ExternalLink>
            )}
            */}
          </CardContent>

          <Collapse in={isCollectionExpanded} timeout="auto" unmountOnExit>
            <CardContent style={{ padding: '8px 16px' }}>
              <Typography paragraph className={collectionDescription}>
                {meta?.description}
              </Typography>
            </CardContent>
          </Collapse>
          <CardActions disableSpacing style={{ maxHeight: 0 }}>
            <IconButton
              className={isCollectionExpanded ? expandOpen : expand}
              onClick={handleExpandClick}
              aria-expanded={isCollectionExpanded}
              aria-label="show more"
              style={{ marginTop: '-32px' }}
            >
              <ExpandMoreIcon />
            </IconButton>
          </CardActions>
        </Card>
      </Grid>
  );
};