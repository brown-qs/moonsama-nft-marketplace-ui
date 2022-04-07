import { Card, CardContent, Typography } from '@mui/material';
import { Button } from 'ui';
import Grid from '@mui/material/Grid';
import { useState } from 'react';
import { mintListStyles } from './MintListItem.style';
import { RawMint } from 'hooks/useRawMintFromList/useRawMintFromList';
import { CollectionMeta } from 'hooks/useFetchCollectionMeta/useFetchCollectionMeta';
import { MintCollectionInfo } from 'hooks/useFetchMintConditions/useFetchMintConditions';
import { Media } from 'components';
import { useActiveWeb3React, useClasses } from 'hooks';
import { StringAssetType } from '../../utils/subgraph';
import { useMintCallback } from 'hooks/useMintCallback/useMintCallback';

import { MerkleTree } from '@kleros/merkle-tree';
import { Fraction } from 'utils/Fraction';

export type MintListItemProps = {
  collection: RawMint;
  meta: CollectionMeta | undefined;
  salt: number;
  mintInfo: MintCollectionInfo | undefined;
};

export const MintListItem = ({
  collection,
  meta,
  salt,
  mintInfo,
}: MintListItemProps) => {
  const { chainId, account } = useActiveWeb3React();
  let userMaxMint = 0;
  if (chainId && account) {
    const me = collection.whitelist.find((member) => member.address == account);
    if (me) userMaxMint = me.maxMint;
    else userMaxMint = mintInfo?.whitelistGuarded ? 0 : 1;
  }

  let leaves: string[] = collection.whitelist.map((member) =>
    MerkleTree.makeLeafNode(member.address, member.maxMint)
  );
  const tree = new MerkleTree(leaves);
  let merkleProof;
  try {
    merkleProof = tree.getHexProof(
      MerkleTree.makeLeafNode(account ?? '', userMaxMint)
    );
  } catch (e) {
    console.log(e, 'merkle proof error');
  }

  const mintCallback = useMintCallback({
    tokenAddress: collection.address,
    userMaxMint,
    mintCost: mintInfo?.mintCost,
    merkleProof,
  });

  const { mediaContainer, collectionType, card, collectionDescription } =
    useClasses(mintListStyles);

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
          <Typography paragraph className={collectionDescription}>
            {mintInfo?.whitelistGuarded ? 'WhiteListed' : 'Public'}
          </Typography>
          <Typography paragraph className={collectionDescription}>
            Available Mints: {mintInfo?.mintedCount.toString()}/
            {mintInfo?.maxMintable.toString()}
            {}
          </Typography>
          {userMaxMint > 0 && (
            <Typography paragraph className={collectionDescription}>
              Available Mints For Account:{' '}
              {mintInfo?.mintedCountUser.toString()}/{userMaxMint}
              {}
            </Typography>
          )}
        </CardContent>

        {userMaxMint > 0 &&
        mintInfo?.mintedCountUser?.toString()! <= userMaxMint.toString() ? (
          <Button
            variant="contained"
            color="primary"
            size="large"
            style={{ margin: '8px 16px' }}
            fullWidth
            onClick={() => {
              mintCallback.callback?.();
            }}
          >
            Mint for {Fraction.from(mintInfo?.mintCost, 18)?.toFixed(2)} MOVR
          </Button>
        ) : userMaxMint > 0 ? (
          <Typography paragraph className={collectionType}  style={{ padding: '8px 16px' }}>
            You reached max count!
          </Typography>
        ) : (
          <Typography paragraph className={collectionType}  style={{ padding: '8px 16px' }}>
            You are not in whitelist!
          </Typography>
        )}
      </Card>
    </Grid>
  );
};
