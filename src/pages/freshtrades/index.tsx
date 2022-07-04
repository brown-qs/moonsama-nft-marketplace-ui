import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Pagination from '@mui/material/Pagination';
import Stack from '@mui/material/Stack';
import { TokenTrade } from 'components/TokenTrade/TokenTrade';
import { useActiveWeb3React, useClasses } from 'hooks';
import { FillWithOrder } from 'hooks/marketplace/types';
import { TokenMeta } from 'hooks/useFetchTokenUri.ts/useFetchTokenUri.types';
import {
  useLatestTradesWithStaticCallback,
  useLatestTradesTotalCountWithStaticCallback,
} from 'hooks/useLatestTradesWithStaticCallback/useLatestTradesWithStaticCallback';
import { useRawCollectionsFromList } from 'hooks/useRawCollectionsFromList/useRawCollectionsFromList';
import { StaticTokenData } from 'hooks/useTokenStaticDataCallback/useTokenStaticDataCallback';
import { useWhitelistedAddresses } from 'hooks/useWhitelistedAddresses/useWhitelistedAddresses';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useBottomScrollListener } from 'react-bottom-scroll-listener';
import { GlitchText, Loader } from 'ui';
import { styles } from './styles';
import { SortSharp } from '@mui/icons-material';
import MenuItem from '@mui/material/MenuItem';
import { Select } from 'ui/Select/Select';
import { styles as sortStyles } from 'ui/Sort/Sort.style';

const PAGE_SIZE = 10;

const FreshTradesPage = () => {
  const { chainId } = useActiveWeb3React();
  const [collection, setCollection] = useState<
    {
      meta: TokenMeta | undefined;
      staticData: StaticTokenData;
      fill: FillWithOrder;
    }[]
  >([]);
  const { sortElement } = useClasses(sortStyles);
  let navigate = useNavigate();
  const sampleLocation = useLocation();
  const [searchParams] = useSearchParams();
  const sortByParam = searchParams.get('sortBy') ?? 'time';
  const sortDirectionParam = searchParams.get('sortDirection') ?? 'desc';
  const collIndexRes = searchParams.get('collIndex');
  const collIndexParam = collIndexRes ? parseInt(collIndexRes) : -1;
  const pageParamRes = searchParams.get('page');
  const pageParam = pageParamRes ? parseInt(pageParamRes) : 1;
  const [take, setTake] = useState<number>((pageParam - 1) * PAGE_SIZE);
  const [paginationEnded, setPaginationEnded] = useState<boolean>(false);
  const [pageLoading, setPageLoading] = useState<boolean>(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(collIndexParam);
  const [searchCounter, setSearchCounter] = useState<number>(0);
  const [sortBy, setSortBy] = useState(sortByParam);
  const [sortDirection, setSortDirection] = useState(sortDirectionParam);
  const [page, setPage] = useState<number>(pageParam);
  const { placeholderContainer, container, filterChip } = useClasses(styles);
  const [totalCount, setTotalCount] = useState<number>(1);

  const getPaginatedItems = useLatestTradesWithStaticCallback();
  const getTotalItems = useLatestTradesTotalCountWithStaticCallback();
  const collections = useRawCollectionsFromList();

  useEffect(() => {
    if (chainId) {
      setCollection([]);
      // setSelectedIndex(-1);
      // setTake(0);
      setSearchCounter(0);
      setPaginationEnded(false);
      setPageLoading(false);
      let newPath =
        sampleLocation.pathname +
        '?collIndex=' +
        selectedIndex +
        '&page=' +
        page +
        '&sortBy=' +
        sortBy +
        '&sortDirection=' +
        sortDirection;
      navigate(newPath);
    }
  }, [chainId]);

  // const handleScrollToBottom = useCallback(() => {
  //   if (pageLoading) return;
  //   setTake((state) => (state += PAGE_SIZE));
  //   setSearchCounter((state) => (state += 1));
  // }, []);

  // useBottomScrollListener(handleScrollToBottom, {
  //   offset: 400,
  //   debounce: 1000,
  // });

  const whitelist = useWhitelistedAddresses(); // REMOVEME later

  useEffect(() => {
    const getCollectionById = async () => {
      const selectedTokenAddress =
      selectedIndex === -1
        ? undefined
        : collections[selectedIndex]?.address?.toLowerCase();
      setPageLoading(true);
      let count = await getTotalItems(sortBy, sortDirection, selectedTokenAddress);
      count = count %10 ? Math.floor(count / 10) + 1 : Math.floor(count / 10);
      setTotalCount(count);
      let data = await getPaginatedItems(
        PAGE_SIZE,
        take,
        sortBy,
        sortDirection,
        selectedTokenAddress,
        setTake
      );
      data = data.filter((x) =>
        whitelist.includes(x.staticData.asset.assetAddress.toLowerCase())
      ); // REMOVEME later
      setPageLoading(false);
      const isEnd = data.some(({ meta }) => !meta);

      //console.log('IS END', {paginationEnded, isEnd, pieces, data})
      //console.log('FRESH', {data, PAGE_SIZE, take, isEnd})

      if (isEnd) {
        const pieces = data.filter(({ meta }) => !!meta);
        setPaginationEnded(true);
        // setCollection((state) => state.concat(pieces));
        setCollection(pieces);
        return;
      }
      // setCollection((state) => state.concat(data));
      setCollection(data);
    };
    if (!paginationEnded) {
      getCollectionById();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchCounter, paginationEnded, selectedIndex, sortBy, sortDirection]);

  const handleCollectionSelection = (i: number) => {
    if (i !== selectedIndex) {
      setCollection([]);
      setSelectedIndex(i);
      setTake(0);
      setSearchCounter(0);
      setPage(1);
      setPaginationEnded(false);
      // let newPath =
      //   sampleLocation.pathname +
      //   '?collIndex=' +
      //   i +
      //   '&page=' +
      //   page +
      //   '&sortBy=' +
      //   sortBy +
      //   '&sortDirection=' +
      //   sortDirection;
      // navigate(newPath);
      let href = window.location.href;
      let temp = href.split('?');
      let path = '?' + temp[1];
      let tempPath = '';
      let newPath = sampleLocation.pathname;
      let ind = path.search('collIndex=');
      if (ind != -1) {
        tempPath = path.slice(0, ind);
        ind += 3;
        for (; ind < path.length; ind++) {
          if (path[ind] == '&') break;
        }
        tempPath = tempPath + 'collIndex=' + i + path.slice(ind, path.length);
      } else tempPath = path + 'collIndex=' + i;

      path = tempPath;
      ind = path.search('&page=');
      if (ind != -1) {
        newPath = newPath+  path.slice(0, ind);
        ind += 3;
        for (; ind < path.length; ind++) {
          if (path[ind] == '&') break;
        }
        newPath = newPath + '&page=1' + path.slice(ind, path.length);
      } else newPath = newPath + path + '&page=1';
      navigate(newPath);
    }
  };

  const handleSortChange = (event: any) => {
    setCollection([]);
    setTake(0);
    setSearchCounter(0);
    setPaginationEnded(false);
    const value = event.target.value.split(',');
    setSortBy(value[0]);
    setPage(1);
    setSortDirection(value[1]);
    // let newPath =
    //   sampleLocation.pathname +
    //   '?collIndex=' +
    //   selectedIndex +
    //   '&page=' +
    //   page +
    //   '&sortBy=' +
    //   value[0] +
    //   '&sortDirection=' +
    //   value[1];
    // navigate(newPath);
    let href = window.location.href;
    let temp = href.split('?');
    let path = '?' + temp[1];
    let newPath = sampleLocation.pathname;
    let tempPath = "";
    let ind = path.search('&sortBy=');
    if (ind != -1) {
      tempPath = path.slice(0, ind);
      ind += 3;
      for (; ind < path.length; ind++) {
        if (path[ind] == '&') break;
      }
      tempPath = tempPath + '&sortBy=' + value[0] + path.slice(ind, path.length);
    } else tempPath = path + '&sortBy=' + value[0];

    path = tempPath;
    ind = path.search('&sortDirection=');
    if (ind != -1) {
      tempPath =  path.slice(0, ind);
      ind += 3;
      for (; ind < path.length; ind++) {
        if (path[ind] == '&') break;
      }
      tempPath = tempPath + '&sortDirection=' + value[1] + path.slice(ind, path.length);
    } else tempPath = path + '&sortDirection=' + value[1];

    path = tempPath;
    ind = path.search('&page=');
    if (ind != -1) {
      newPath = newPath+  path.slice(0, ind);
      ind += 3;
      for (; ind < path.length; ind++) {
        if (path[ind] == '&') break;
      }
      newPath = newPath + '&page=1' + path.slice(ind, path.length);
    } else newPath = newPath + path + '&page=1';
    navigate(newPath);
  };

  const handlePageChange = useCallback(
    (event: React.ChangeEvent<unknown>, value: number) => {
      if (!pageLoading) {
        setPage(value);
        setTake((state) => (state = PAGE_SIZE * (value - 1)));
        setSearchCounter((state) => (state += 1));
        // let newPath =
        //   sampleLocation.pathname +
        //   '?collIndex=' +
        //   selectedIndex +
        //   '&page=' +
        //   value +
        //   '&sortBy=' +
        //   sortByParam +
        //   '&sortDirection=' +
        //   sortDirection;
        // console.log('pageLoading1', { pageLoading, newPath });
        // navigate(newPath);
        let href = window.location.href;
        let temp = href.split('?');
        let path = '?' + temp[1];
        let newPath = sampleLocation.pathname;
        let ind = path.search('&page=');
        if (ind != -1) {
          newPath = newPath + path.slice(0, ind);
          ind += 3;
          for (; ind < path.length; ind++) {
            if (path[ind] == '&') break;
          }
          newPath = newPath + '&page=' + value + path.slice(ind, path.length);
        } else newPath = newPath + path + '&page=' + value;
        navigate(newPath);
      }
    },
    []
  );

  return (
    <>
      <div className={container}>
        <GlitchText variant="h1">Latest trades</GlitchText>
      </div>
      <Grid container display="flex" justifyContent="center">
        <Stack
          direction={{ xs: 'row' }}
          flexWrap={{ xs: 'wrap' }}
          justifyContent="center"
          alignItems="center"
        >
          <Chip
            key={`all`}
            label={'All'}
            variant="outlined"
            onClick={() => handleCollectionSelection(-1)}
            className={`${filterChip}${
              selectedIndex === -1 ? ' selected' : ''
            }`}
          />
          {collections.map((collection, i) => {
            return (
              <Chip
                key={`${collection.address}-${i}`}
                label={collection.display_name}
                variant="outlined"
                onClick={() => handleCollectionSelection(i)}
                className={`${filterChip}${
                  selectedIndex === i ? ' selected' : ''
                }`}
              />
            );
          })}
        </Stack>
      </Grid>
      <Grid container display="flex" justifyContent="flex-end">
        <Select
          className={sortElement}
          variant="outlined"
          color="primary"
          IconComponent={SortSharp}
          defaultValue={sortBy + ',' + sortDirection}
          inputProps={{
            name: 'sort',
            id: 'uncontrolled-native',
          }}
          onChange={handleSortChange}
        >
          <MenuItem value={'time,asc'}>Time ascending</MenuItem>
          <MenuItem value={'time,desc'}>Time descending</MenuItem>
          <MenuItem value={'price,asc'}>Price ascending</MenuItem>
          <MenuItem value={'price,desc'}>Price descending</MenuItem>
        </Select>
      </Grid>
      <Grid container spacing={1}>
        {collection
          .map(
            (token, i) =>
              token && (
                <Grid
                  item
                  key={`${token.staticData.asset.id}-${i}`}
                  xs={12}
                  md={6}
                  lg={3}
                >
                  <TokenTrade {...token} />
                </Grid>
              )
          )
          .filter((x) => !!x)}
      </Grid>
      {pageLoading && (
        <div className={placeholderContainer}>
          <Loader />
        </div>
        // <div className={nftWrapper}>
        //   <div ref={sceneRef} className={scene} onTouchMove={handleTouchMove} onMouseMove={handleMouseMove}>
        //     <div ref={canvasRef} className={canvas}>
        //       <div ref={posterRef} className={poster}>
        //           efwefw
        //       </div>
        //       <div ref={glassRef} className={glass}>
        //
        //       </div>
        //     </div>
        //   </div>
        // </div>
      )}
      <div className={placeholderContainer}>
        <Pagination
          count={totalCount}
          siblingCount={0}
          boundaryCount={2}
          color="primary"
          size="large"
          page={page}
          onChange={handlePageChange}
          showFirstButton
          showLastButton
        />
      </div>
    </>
  );
};

export default FreshTradesPage;
