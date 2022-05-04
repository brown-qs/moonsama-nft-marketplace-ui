import Grid from '@mui/material/Grid';
import { GlitchText } from 'ui';
import {
  useRawCollectionsFromList,
  RawCollection,
} from 'hooks/useRawCollectionsFromList/useRawCollectionsFromList';
import {
  useFetchCollectionMeta,
} from 'hooks/useFetchCollectionMeta/useFetchCollectionMeta';
import { useActiveWeb3React, useClasses } from 'hooks';
import { StringAssetType } from '../../utils/subgraph';
import { NETWORK_NAME } from '../../constants';
import { CollectionListItem } from 'components/CollectionListItem/CollectionListItem';

export const CollectionListPage = () => {
  const { chainId } = useActiveWeb3React()
  const rawCollections = useRawCollectionsFromList();
  const metas = useFetchCollectionMeta(rawCollections);
  const collections: RawCollection[] = rawCollections ?? [];

  // console.log('this runs', collections)
  return collections && collections.length > 0 ? (
    <>
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
        <GlitchText variant="h1">Featured collections</GlitchText>
      </div>
      <Grid container spacing={2} style={{ marginTop: 12 }}>
        {collections.map((collection: RawCollection, i) => {
          return <CollectionListItem collection={collection} salt={i} meta={metas[i]} />
        })}
      </Grid>
    </>
  ) : (
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
      <GlitchText variant="h1">{chainId ? `No collections found on ${NETWORK_NAME[chainId]}` : 'No collections found'}</GlitchText>
    </div>
  )
};
