import Grid from '@mui/material/Grid';
import { GlitchText } from 'ui';
import {
  useRawMintFromList,
  RawMint,
} from 'hooks/useRawMintFromList/useRawMintFromList';
import { useFetchCollectionMeta } from 'hooks/useFetchCollectionMeta/useFetchCollectionMeta';
import { useFetchMintConditions } from 'hooks/useFetchMintConditions/useFetchMintConditions';
import { useActiveWeb3React, useClasses } from 'hooks';
import { StringAssetType } from '../../utils/subgraph';
import { NETWORK_NAME } from '../../constants';
import { MintListItem } from 'components/MintListItem/MintListItem';

export const MintListPage = () => {
  const { chainId } = useActiveWeb3React();
  const rawCollections = useRawMintFromList();
  const metas = useFetchCollectionMeta(rawCollections);
  const mintConditions = useFetchMintConditions(rawCollections);
  const collections: RawMint[] = rawCollections ?? [];

  console.log('this runs', collections);
  return collections && collections.length > 0 ? (
    <>
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
        <GlitchText variant="h1">Mint List</GlitchText>
      </div>
      <Grid container spacing={2} style={{ marginTop: 12 }}>
        {collections.map((collection: RawMint, i) => {
          return (
            <MintListItem
              collection={collection}
              salt={i}
              meta={metas[i]}
              mintInfo={mintConditions[i]}
            />
          );
        })}
      </Grid>
    </>
  ) : (
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
      <GlitchText variant="h1">
        {chainId
          ? `No collections found on ${NETWORK_NAME[chainId]}`
          : 'No collections found'}
      </GlitchText>
    </div>
  );
};
