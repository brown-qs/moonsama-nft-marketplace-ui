import { isAddress } from '@ethersproject/address';
import { BigNumber } from '@ethersproject/bignumber';
import SearchIcon from '@mui/icons-material/SearchSharp';
import { IconButton, InputAdornment, TextField } from '@mui/material';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import { TokenLootbox as TokenLootboxComponent } from 'components';
import { useClasses } from 'hooks';
import { Asset } from 'hooks/marketplace/types';
import { useFetchSubcollectionMeta } from 'hooks/useFetchCollectionMeta/useFetchCollectionMeta';
import { TokenMeta } from 'hooks/useFetchTokenUri.ts/useFetchTokenUri.types';
import { useRawcollection } from 'hooks/useRawCollectionsFromList/useRawCollectionsFromList';
import {
  StaticTokenData,
  useTokenStaticDataCallbackArrayWithFilter,
} from 'hooks/useTokenStaticDataCallback/useTokenStaticDataCallback';
import React, { useCallback, useEffect, useState } from 'react';
import { useBottomScrollListener } from 'react-bottom-scroll-listener';
import { useForm } from 'react-hook-form';
import { useParams } from 'react-router-dom';
import { Filters, GlitchText, Loader } from 'ui';
import { truncateHexString } from 'utils';
import {
  getAssetEntityId,
  StringAssetType,
  stringToStringAssetType,
} from 'utils/subgraph';
import { styles } from './styles';

const DEFAULT_PAGE_SIZE = 10;
const SEARCH_PAGE_SIZE = 50;

const MintListPage = () => {
  const [collection, setCollection] = useState<
    {
      meta: TokenMeta | undefined;
      staticData: StaticTokenData;
    }[]
  >([]);
  // const { address, type, subcollectionId } =
  //   useParams<{ address: string; type: string; subcollectionId: string }>();
  const address = "0x9984440FB82f1aF013865141909276d26B86E303";
  const type = "ERC1155";
  const subcollectionId = "0";
  const assetType = stringToStringAssetType(type);
  const asset: Asset = {
    assetAddress: address?.toLowerCase(),
    assetType: assetType,
    assetId: '0',
    id: getAssetEntityId(address?.toLowerCase(), '0'),
  };
  const recognizedCollection = useRawcollection(asset.assetAddress);
  const maxId = recognizedCollection?.maxId ?? 1000;
  const searchBarOn = recognizedCollection?.idSearchOn ?? true;
  const subcollection = recognizedCollection?.subcollections?.find(
    (x) => x.id === subcollectionId
  );
  const submeta = useFetchSubcollectionMeta(
    subcollection ? [subcollection] : undefined
  );

  //console.log('SUBMETA', submeta)
  const isSubcollection = subcollectionId !== '0';

  const minId = isSubcollection ? 0 : recognizedCollection?.minId ?? 1;

  const [take, setTake] = useState<number>(minId);
  const [filters, setFilters] = useState<Filters | undefined>(undefined);
  const [paginationEnded, setPaginationEnded] = useState<boolean>(false);
  const [pageLoading, setPageLoading] = useState<boolean>(false);
  const [searchCounter, setSearchCounter] = useState<number>(0);
  const {
    placeholderContainer,
    collectionStats,
    statItem,
    container,
    select,
    selectLabel,
    dropDown,
  } = useClasses(styles);
  const { register, handleSubmit } = useForm();

  const displayFilters = assetType === StringAssetType.ERC721;

  // TODO: wire it to search result

  const collectionName = recognizedCollection
    ? recognizedCollection.display_name
    : `Collection ${truncateHexString(address)}`;

  const getItemsWithFilter = useTokenStaticDataCallbackArrayWithFilter(
    asset,
    filters,
    maxId,
    subcollectionId
  ); //useTokenStaticDataCallback(asset)//
  /*
  const f = x(['Black Bird', 'White Shades'])
  console.log('MSATTR', f)
  const m = searchItems(
    f.map(num => {
      return {
        assetAddress: asset.assetAddress,
        assetType: assetType,
        assetId: num.toString(),
        id: '000'
      }
    }
  ))
  console.log('MSATTR', m)
  */

  const searchSize =
    filters?.selectedOrderType == undefined
      ? DEFAULT_PAGE_SIZE
      : SEARCH_PAGE_SIZE;

  const handleScrollToBottom = useCallback(() => {
    console.log('SCROLLBOTTOM');
    setTake((state) => (state += searchSize));
    setSearchCounter((state) => (state += 1));
  }, [searchSize]);

  const handleTokenSearch = useCallback(
    async ({ tokenID }) => {
      if (!!tokenID) {
        setPaginationEnded(true);
        setPageLoading(true);
        const data = await getItemsWithFilter(
          1,
          BigNumber.from(tokenID),
          setTake
        );
        setPageLoading(false);
        setCollection(data);
      } else {
        setPaginationEnded(false);
        setPageLoading(true);
        const data = await getItemsWithFilter(
          searchSize,
          BigNumber.from(take),
          setTake
        );
        setPageLoading(false);
        setCollection(data);
      }
    },
    [searchSize]
  );

  useBottomScrollListener(handleScrollToBottom, { offset: 400, debounce: 300 });

  //console.log('before FETCH', { searchSize, address, take, paginationEnded, searchCounter, filters });
  useEffect(() => {
    const getCollectionById = async () => {
      setPageLoading(true);
      console.log('FETCH', { searchSize, address, take, paginationEnded });
      const data = await getItemsWithFilter(
        searchSize,
        BigNumber.from(take),
        setTake
      );
      const isEnd = !data || data.length == 0;
      const pieces = data.filter(({ meta }) => !!meta);
      setPageLoading(false);

      //console.log('IS END', {paginationEnded, isEnd, pieces, data})

      if (isEnd) {
        setPaginationEnded(true);
        setCollection((state) => state.concat(pieces));
        return;
      }
      setCollection((state) => state.concat(pieces));
    };
    if (!paginationEnded) {
      getCollectionById();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    address,
    searchCounter,
    paginationEnded,
    searchSize,
    JSON.stringify(filters?.traits),
  ]);

  if (assetType.valueOf() === StringAssetType.UNKNOWN) {
    throw Error('Asset type was not recognized');
  }
  if (!isAddress(address)) {
    throw Error('Address format is incorrect');
  }

  const handleFiltersUpdate = useCallback(async (filters: Filters) => {
    console.log('FILTER', filters);
    setCollection([]);
    setTake(minId);
    setFilters(filters);
    setPageLoading(true);
    setPaginationEnded(false);
    setSearchCounter((state) => (state += 1));
  }, []);

  return (
    <>
      <div className={container}>
        <GlitchText variant="h1">{collectionName}</GlitchText>
        {isSubcollection && !!submeta?.[0]?.name && (
          <GlitchText variant="h2">{submeta?.[0].name}</GlitchText>
        )}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={{ xs: 1, sm: 2, md: 4 }}
          sx={{
            marginTop: '10px',
            padding: '16px',
          }}
          justifyContent="flex-end"
          alignItems="center"
        >
          {searchBarOn && (
            <div>
              <TextField
                placeholder="Search by token ID"
                variant="outlined"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="start">
                      <IconButton
                        onClick={handleSubmit(handleTokenSearch)}
                        onMouseDown={handleSubmit(handleTokenSearch)}
                      >
                        <SearchIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                {...register('tokenID')}
              />
            </div>
          )}

          {displayFilters && (
            <div>
              <Filters
                onFiltersUpdate={handleFiltersUpdate}
                assetAddress={asset.assetAddress}
              />
            </div>
          )}
        </Stack>
      </div>
      <Grid container alignContent="center">
        {collection.map(
          (token, i) =>
            token && (
              <Grid
                item
                key={`${token.staticData.asset.id}-${i}`}
                xs={12}
                md={6}
                lg={3}
              >
                <TokenLootboxComponent {...token} />
              </Grid>
            )
        )}
      </Grid>
      {pageLoading && (
        <div className={placeholderContainer}>
          <Loader />
        </div>
      )}
    </>
  );
};

export default MintListPage;