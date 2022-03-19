import Grid from '@mui/material/Grid';
import { TokenLootbox as TokenLootboxComponent } from '../../components';
import { LOOTBOX_CRAFTING } from '../../constants';
import { useClasses } from 'hooks';
import { Asset } from 'hooks/marketplace/types';
import { useTokenStaticData } from 'hooks/useTokenStaticData/useTokenStaticData';
import { useEffect, useState } from 'react';
import { GlitchText, Loader } from 'ui';
import {
  getAssetEntityId,
  StringAssetType
} from 'utils/subgraph';
import { styles } from './styles';
import { useBlueprint } from 'hooks/loot/useBlueprint';


const WorkbenchPage = () => {



  const [pageLoading, setPageLoading] = useState<boolean>(false);
  const {
    placeholderContainer,
    container
  } = useClasses(styles);


  //console.log('before FETCH', { searchSize, address, take, paginationEnded, searchCounter, filters });
  /*
  useEffect(() => {
    if (!!data) {
      setPageLoading(false)
    }
  }, [
    JSON.stringify(data),
  ]);
  */

  return (
    <>
      <div className={container}>
        <GlitchText variant="h1">Workbench</GlitchText>
      </div>
      <Grid container alignContent="center">
        <Grid
          item
          xs={12}
          md={6}
          lg={3}
        >
          <TokenLootboxComponent />
        </Grid>
      </Grid>
      {pageLoading && (
        <div className={placeholderContainer}>
          <Loader />
        </div>
      )}
    </>
  );
};

export default WorkbenchPage;
