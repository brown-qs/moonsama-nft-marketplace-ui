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
import { RawMint } from 'hooks/useRawMintFromList/useRawMintFromList';
import { CollectionMeta } from 'hooks/useFetchCollectionMeta/useFetchCollectionMeta';
import { MintCollectionInfo } from 'hooks/useFetchMintConditions/useFetchMintConditions';
import { ExternalLink, Media } from 'components';
import { getExplorerLink, truncateHexString } from 'utils';
import { useActiveWeb3React, useClasses } from 'hooks';
import { StringAssetType } from '../../utils/subgraph';
import { useMintCallback } from 'hooks/useMintCallback/useMintCallback';

import { MerkleTree } from '@kleros/merkle-tree';
import { keccak256 } from '@ethersproject/keccak256';
import { defaultAbiCoder } from '@ethersproject/abi';

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
  console.log('this runs', chainId);
  const [isCollectionExpanded, setExpanded] = useState(false);
  console.log('this runs', isCollectionExpanded);
  console.log(chainId, isCollectionExpanded);

  let leaves: string[] = collection.whitelist.map((member) =>
    MerkleTree.makeLeafNode(member.address, member.maxMint)
  );
  const tree = new MerkleTree(leaves);
  let merkleProof;
  try {
    merkleProof = tree.getHexProof(
      MerkleTree.makeLeafNode(account ?? '', userMaxMint)
    )[0];
  } catch (e) {
    console.log(e, 'merkle proof error');
  }

  const mintCallback = useMintCallback({
    tokenAddress: collection.address,
    userMaxMint,
    mintCost: mintInfo?.mintCost,
    merkleProof,
  });

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
            {mintInfo?.whitelistGuarded ? 'WhiteListed' : 'Public'}
          </Typography>
          <Typography paragraph className={collectionDescription}>
            Available Mints: {mintInfo?.mintedCount}/{mintInfo?.maxMintable}
            {}
          </Typography>
          {userMaxMint > 0 && (
            <Typography paragraph className={collectionDescription}>
              Available Mints For Account: {mintInfo?.mintedCountUser}/
              {userMaxMint}
              {}
            </Typography>
          )}
        </CardContent>

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
          Mint for {mintInfo?.mintCost} MOVR
        </Button>
      </Card>
    </Grid>
  );
};
