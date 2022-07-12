import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Pagination from '@mui/material/Pagination';
import Stack from '@mui/material/Stack';
import { TokenTrade } from 'components/TokenTrade/TokenTrade';
import { useActiveWeb3React, useClasses } from 'hooks';
import { FillWithOrder } from 'hooks/marketplace/types';
import { TokenMeta } from 'hooks/useFetchTokenUri.ts/useFetchTokenUri.types';
import { useLatestTradesWithStaticCallback } from 'hooks/useLatestTradesWithStaticCallback/useLatestTradesWithStaticCallback';
import { useRawCollectionsFromList } from 'hooks/useRawCollectionsFromList/useRawCollectionsFromList';
import { StaticTokenData } from 'hooks/useTokenStaticDataCallback/useTokenStaticDataCallback';
import { useWhitelistedAddresses } from 'hooks/useWhitelistedAddresses/useWhitelistedAddresses';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { GlitchText, Loader } from 'ui';
import {
  QUERY_MARKETPLACE_STATE,
  QUERY_COLLECTION_STATE,
} from 'subgraph/common';
import { DEFAULT_CHAIN, MARKETPLACE_SUBGRAPH_URLS } from '../../constants';
import { request } from 'graphql-request';
import { styles } from './styles';
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
  let navigate = useNavigate();
  const sampleLocation = useLocation();
  const [searchParams] = useSearchParams();
  const collIndexRes = searchParams.get('collIndex');
  const collIndexParam = collIndexRes ? parseInt(collIndexRes) : -1;
  const pageParamRes = searchParams.get('page');
  const pageParam = pageParamRes ? parseInt(pageParamRes) : 1;
  const [take, setTake] = useState<number>((pageParam - 1) * PAGE_SIZE);
  const [paginationEnded, setPaginationEnded] = useState<boolean>(false);
  const [pageLoading, setPageLoading] = useState<boolean>(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(collIndexParam);
  const [searchCounter, setSearchCounter] = useState<number>(0);
  const [page, setPage] = useState<number>(pageParam);
  const { placeholderContainer, container, filterChip } = useClasses(styles);
  const [totalCount, setTotalCount] = useState<number>(1);

  const getPaginatedItems = useLatestTradesWithStaticCallback();
  const collections = useRawCollectionsFromList();

  useEffect(() => {
    if (chainId) {
      setCollection([]);
      setSearchCounter(0);
      setPaginationEnded(false);
      setPageLoading(false);
      let newPath =
        sampleLocation.pathname +
        '?collIndex=' +
        selectedIndex +
        '&page=' +
        page;
      navigate(newPath);
    }
  }, [chainId]);

  const whitelist = useWhitelistedAddresses(); // REMOVEME later

  useEffect(() => {
    const getCollectionById = async () => {
      const selectedTokenAddress =
        selectedIndex === -1
          ? undefined
          : collections[selectedIndex]?.address?.toLowerCase();
      setPageLoading(true);
      let count;
      if (selectedTokenAddress === undefined) {
        let query = QUERY_MARKETPLACE_STATE();
        const response = await request(
          MARKETPLACE_SUBGRAPH_URLS[chainId ?? DEFAULT_CHAIN],
          query
        );
        count =
          parseInt(response.marketplaceStat.buyOrderFillNum) +
          parseInt(response.marketplaceStat.sellOrderFillNum);
      } else if (
        selectedTokenAddress.toLowerCase() !==
        '0xa17a550871e5f5f692a69a3abe26e8dbd5991b75'
      ) {
        let query = QUERY_COLLECTION_STATE(
          selectedTokenAddress.toLowerCase() +
            '-0x0000000000000000000000000000000000000000'
        );
        const response = await request(
          MARKETPLACE_SUBGRAPH_URLS[chainId ?? DEFAULT_CHAIN],
          query
        );
        count = parseInt(response.collectionStat.tradeCount);
      } else {
        let query = QUERY_COLLECTION_STATE(
          '0xa17a550871e5f5f692a69a3abe26e8dbd5991b75-0x088fe6e0e1caca1ee45e8de96abe79e4e139f4ab'
        );
        let response = await request(
          MARKETPLACE_SUBGRAPH_URLS[chainId ?? DEFAULT_CHAIN],
          query
        );
        count = parseInt(response.collectionStat.tradeCount);
        
        query = QUERY_COLLECTION_STATE(
          '0xa17a550871e5f5f692a69a3abe26e8dbd5991b75-0x77709c42d43f2e53c24b8fa623a207abdc89857c'
        );
        response = await request(
          MARKETPLACE_SUBGRAPH_URLS[chainId ?? DEFAULT_CHAIN],
          query
        );
        count += parseInt(response.collectionStat.tradeCount);

        query = QUERY_COLLECTION_STATE(
          '0xa17a550871e5f5f692a69a3abe26e8dbd5991b75-0x8ce2bdc6e0319cea87337d027382f09b715c9601'
        );
        response = await request(
          MARKETPLACE_SUBGRAPH_URLS[chainId ?? DEFAULT_CHAIN],
          query
        );
        count += parseInt(response.collectionStat.tradeCount);

        query = QUERY_COLLECTION_STATE(
          '0xa17a550871e5f5f692a69a3abe26e8dbd5991b75-0x9e403aa2dfef9ba2a2b82286d13864a64d90bf36'
        );
        response = await request(
          MARKETPLACE_SUBGRAPH_URLS[chainId ?? DEFAULT_CHAIN],
          query
        );
        count += parseInt(response.collectionStat.tradeCount);
      }
      count = count % 10 ? Math.floor(count / 10) + 1 : Math.floor(count / 10);
      setTotalCount(count);
      let data = await getPaginatedItems(
        PAGE_SIZE,
        take,
        'time',
        'desc',
        selectedTokenAddress,
        setTake
      );
      console.log('data', data);
      data = data.filter((x) =>
        whitelist.includes(x.staticData.asset.assetAddress.toLowerCase())
      ); // REMOVEME later
      setPageLoading(false);
      const isEnd = data.some(({ meta }) => !meta);

      if (isEnd) {
        const pieces = data.filter(({ meta }) => !!meta);
        setPaginationEnded(true);
        setCollection(pieces);
        return;
      }
      setCollection(data);
    };
    if (!paginationEnded) {
      getCollectionById();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchCounter, paginationEnded, selectedIndex]);

  const handleCollectionSelection = (i: number) => {
    if (i !== selectedIndex) {
      setCollection([]);
      setSelectedIndex(i);
      setTake(0);
      setSearchCounter(0);
      setPage(1);
      setPaginationEnded(false);
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
        newPath = newPath + path.slice(0, ind);
        ind += 3;
        for (; ind < path.length; ind++) {
          if (path[ind] == '&') break;
        }
        newPath = newPath + '&page=1' + path.slice(ind, path.length);
      } else newPath = newPath + path + '&page=1';
      navigate(newPath);
    }
  };

  const handlePageChange = useCallback(
    (event: React.ChangeEvent<unknown>, value: number) => {
      if (!pageLoading) {
        setPage(value);
        setTake((state) => (state = PAGE_SIZE * (value - 1)));
        setSearchCounter((state) => (state += 1));
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
