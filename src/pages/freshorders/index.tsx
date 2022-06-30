import { Chip, Stack } from '@mui/material';
import Grid from '@mui/material/Grid';
import Pagination from '@mui/material/Pagination';
import { Order } from '../../hooks/marketplace/types';
import { TokenMeta } from '../../hooks/useFetchTokenUri.ts/useFetchTokenUri.types';
import {
  useLatestBuyOrdersForTokenWithStaticCallback,
  useLatestSellOrdersForTokenWithStaticCallback,
} from 'hooks/useLatestOrdersWithStaticCallback/useLatestOrdersWithStaticCallback';
import { useRawCollectionsFromList } from '../../hooks/useRawCollectionsFromList/useRawCollectionsFromList';
import { StaticTokenData } from '../../hooks/useTokenStaticDataCallback/useTokenStaticDataCallback';
import { useWhitelistedAddresses } from '../../hooks/useWhitelistedAddresses/useWhitelistedAddresses';
import { SetStateAction, useCallback, useEffect, useState } from 'react';
import {
  useParams,
  useLocation,
  useNavigate,
  useSearchParams,
} from 'react-router-dom';
import { useBottomScrollListener } from 'react-bottom-scroll-listener';
import {
  Drawer,
  GlitchText,
  Loader,
  Table,
  TableBody,
  TableCell,
  TableSortLabel,
  TableHeader,
  TableRow,
  Tabs,
} from 'ui';
import { orderFilter } from '../../utils/marketplace';
import { TokenOrder } from '../../components/TokenOrder/TokenOrder';
import { useActiveWeb3React, useClasses } from '../../hooks';
import { styles } from './styles';

type SortDirection = 'asc' | 'desc';

const PAGE_SIZE = 10;
const ExtendedTableHeader = ({
  handleSort,
  sortDirection,
  sortBy,
}: {
  handleSort: (sortBy: string) => void;
  sortDirection: SortDirection;
  sortBy: string;
}) => {
  return (
    <TableHeader>
      <TableRow>
        <TableCell>Item</TableCell>
        <TableCell sortDirection={sortBy === 'price' ? sortDirection : false}>
          <TableSortLabel
            active={sortBy === 'price'}
            direction={sortBy === 'price' ? sortDirection : 'asc'}
            onClick={() => {
              handleSort('price');
            }}
          >
            Unit Price
          </TableSortLabel>
        </TableCell>
        <TableCell
          sortDirection={sortBy === 'quantity' ? sortDirection : false}
        >
          <TableSortLabel
            active={sortBy === 'quantity'}
            direction={sortBy === 'quantity' ? sortDirection : 'asc'}
            onClick={() => {
              handleSort('quantity');
            }}
          >
            Quantity
          </TableSortLabel>
        </TableCell>
        <TableCell>From</TableCell>
        <TableCell>Strategy</TableCell>
        <TableCell sortDirection={sortBy === 'time' ? sortDirection : false}>
          <TableSortLabel
            active={sortBy === 'time'}
            direction={sortBy === 'time' ? sortDirection : 'asc'}
            onClick={() => {
              handleSort('time');
            }}
          >
            Created
          </TableSortLabel>
        </TableCell>
        <TableCell>Expiration</TableCell>
        <TableCell></TableCell>
      </TableRow>
    </TableHeader>
  );
};

const FreshOrdersPage = () => {
  const { chainId, account } = useActiveWeb3React();

  const [buyOrders, setBuyOrders] = useState<
    {
      meta: TokenMeta | undefined;
      staticData: StaticTokenData;
      order: Order;
    }[]
  >([]);

  const [sellOrders, setSellOrders] = useState<
    {
      meta: TokenMeta | undefined;
      staticData: StaticTokenData;
      order: Order;
    }[]
  >([]);

  const collections = useRawCollectionsFromList();
  let navigate = useNavigate();
  const sampleLocation = useLocation();
  const [searchParams] = useSearchParams();
  const sortByParam = searchParams.get('sortBy') ?? 'time';
  const tabParamRes = searchParams.get('tab');
  const tabParam = tabParamRes ? parseInt(tabParamRes) : 0;
  const sortDirectionParam = searchParams.get('sortDirection') ?? 'desc';
  const selectedIndexParamRes = searchParams.get('collIndex');
  const tempIndx =
    collections.findIndex((x) => (x.display_name = 'Moonsama')) ?? 0;
  const selectedIndexParam = selectedIndexParamRes
    ? parseInt(selectedIndexParamRes)
    : tempIndx;
  const pageParamRes = searchParams.get('page');
  const pageParam = pageParamRes ? parseInt(pageParamRes) : 1;
  const [selectedIndex, setSelectedIndex] =
    useState<number>(selectedIndexParam);
  const [take, setTake] = useState<number>(0);
  const [paginationEnded, setPaginationEnded] = useState<boolean>(false);
  const [pageLoading, setPageLoading] = useState<boolean>(false);
  const [isDrawerOpened, setIsDrawerOpened] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState(sortByParam);
  const [sortDirection, setSortDirection] = useState(
    sortDirectionParam as SortDirection
  );
  const [page, setPage] = useState<number>(pageParam);
  const [currentTab, setCurrentTab] = useState<number>(tabParam);

  const {
    placeholderContainer,
    container,
    pageContainer,
    tabsContainer,
    tabs,
    select,
    selectLabel,
    dropDown,
    filterControls,
    filterChip,
  } = useClasses(styles);
  const whitelist = useWhitelistedAddresses(); // REMOVEME later

  const getPaginatedSellOrders =
    useLatestSellOrdersForTokenWithStaticCallback();
  const getPaginatedBuyOrders = useLatestBuyOrdersForTokenWithStaticCallback();

  const selectedTokenAddress =
    collections[selectedIndex]?.address?.toLowerCase();

  useEffect(() => {
    if (chainId) {
      setBuyOrders([]);
      setSellOrders([]);
      setSelectedIndex(
        collections.findIndex((x) => (x.display_name = 'Moonsama')) ?? 0
      );
      // setTake((page - 1) * PAGE_SIZE);
      setTake(0);
      setPaginationEnded(false);
      setPageLoading(false);
      setIsDrawerOpened(false);
      let newPath =
        sampleLocation.pathname +
        '?collIndex=' +
        selectedIndex +
        '&tab=' +
        currentTab +
        '&sortBy=' +
        sortByParam +
        '&sortDirection=' +
        sortDirection;
      navigate(newPath);
    }
  }, [chainId, JSON.stringify(collections)]);

  const handleSortUpdate = (_sortBy: string) => {
    setBuyOrders([]);
    setSellOrders([]);
    setTake(0);
    setPaginationEnded(false);
    let newPath;
    if (_sortBy != sortBy) {
      newPath =
        sampleLocation.pathname +
        '?collIndex=' +
        selectedIndex +
        '&tab=' +
        currentTab +
        '&sortBy=' +
        _sortBy +
        '&sortDirection=asc';
      setSortBy(_sortBy);
      setSortDirection('asc');
    } else {
      let tempSortDirection: SortDirection =
        sortDirection === 'asc' ? 'desc' : 'asc';
      setSortDirection(tempSortDirection);
      newPath =
        sampleLocation.pathname +
        '?collIndex=' +
        selectedIndex +
        '&tab=' +
        currentTab +
        '&sortBy=' +
        _sortBy +
        '&sortDirection=' +
        tempSortDirection;
    }
    navigate(newPath);
  };

  const handleTabChange = (newValue: number) => {
    setCurrentTab(newValue);
    let newPath =
      sampleLocation.pathname +
      '?collIndex=' +
      selectedIndex +
      '&tab=' +
      newValue +
      '&sortBy=' +
      sortByParam +
      '&sortDirection=' +
      sortDirection;
    navigate(newPath);
  };
  const handleSelection = (i: number) => {
    if (i !== selectedIndex) {
      setBuyOrders([]);
      setSellOrders([]);
      setSelectedIndex(i);
      setTake(0);
      setPaginationEnded(false);
      let newPath =
        sampleLocation.pathname +
        '?collIndex=' +
        i +
        '&tab=' +
        currentTab +
        '&sortBy=' +
        sortByParam +
        '&sortDirection=' +
        sortDirection;
      navigate(newPath);
    }
  };

  const handleScrollToBottom = useCallback(() => {
    if (pageLoading) return;
    setTake((state) => (state += PAGE_SIZE));
  }, []);

  useBottomScrollListener(handleScrollToBottom, {
    offset: 400,
    debounce: 1000,
  });

  // const handlePageChange = useCallback(
  //   (event: React.ChangeEvent<unknown>, value: number) => {
  //     // let href = window.location.href;
  //     // let temp = href.split('?');
  //     // let path = '?' + temp[1];
  //     // let newPath = sampleLocation.pathname;
  //     // let ind = path.search('&page=');
  //     // if (ind != -1) {
  //     //   newPath = newPath + path.slice(0, ind);
  //     //   ind += 3;
  //     //   for (; ind < path.length; ind++) {
  //     //     if (path[ind] == '&') break;
  //     //   }
  //     //   newPath = newPath + '&page=' + value + path.slice(ind, path.length);
  //     // } else newPath = newPath + path + '&page=' + value;
  //     // navigate(newPath);
  //     setPage(value);
  //     setTake((state) => (state = PAGE_SIZE * (value - 1)));
  //   },
  //   []
  // );

  useEffect(() => {
    const getCollectionById = async () => {
      setPageLoading(true);
      let buyData = await getPaginatedBuyOrders(
        selectedTokenAddress,
        PAGE_SIZE,
        take,
        sortBy,
        sortDirection
      );
      let sellData = await getPaginatedSellOrders(
        selectedTokenAddress,
        PAGE_SIZE,
        take,
        sortBy,
        sortDirection
      );

      buyData = buyData.filter((x) =>
        whitelist.includes(x.order.buyAsset.assetAddress.toLowerCase())
      ); // REMOVEME later
      sellData = sellData.filter((x) =>
        whitelist.includes(x.order.sellAsset.assetAddress.toLowerCase())
      ); // REMOVEME later

      setPageLoading(false);

      const isEnd =
        buyData.some(({ meta }) => !meta) || sellData.some(({ meta }) => !meta);

      if (isEnd) {
        const buyPieces = buyData.filter(({ meta }) => !!meta);
        const sellPieces = sellData.filter(({ meta }) => !!meta);

        setPaginationEnded(true);

        setSellOrders((state) => state.concat(sellPieces));
        setBuyOrders((state) => state.concat(buyPieces));
        // setSellOrders(sellPieces);
        // setBuyOrders(buyPieces);
        return;
      }
      setSellOrders((state) => state.concat(sellData));
      setBuyOrders((state) => state.concat(buyData));
      // setSellOrders(sellData);
      // setBuyOrders(buyData);
    };
    if (!paginationEnded) {
      getCollectionById();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [take, paginationEnded, selectedTokenAddress, sortBy, sortDirection]);

  const getTableBody = (
    filteredCollection:
      | {
          meta: TokenMeta | undefined;
          staticData: StaticTokenData;
          order: Order;
        }[]
      | undefined
      | null
  ) => {
    return (
      <TableBody>
        {filteredCollection && filteredCollection.length > 0 ? (
          filteredCollection.map(
            (token, i) =>
              token && (
                <TokenOrder
                  key={`${token.staticData.asset.id}-${i}`}
                  {...token}
                />
              )
          )
        ) : (
          <TableRow>
            <TableCell style={{ textAlign: 'center' }} colSpan={7}>
              No records available...
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    );
  };

  return (
    <>
      <div className={container}>
        <GlitchText variant="h1">Latest offers</GlitchText>
      </div>

      <Drawer
        anchor="left"
        open={isDrawerOpened}
        onClose={() => setIsDrawerOpened(false)}
        onOpen={() => setIsDrawerOpened(true)}
      >
        Filters
      </Drawer>

      <Grid container className={pageContainer} justifyContent="center">
        <Stack
          direction={{ xs: 'row' }}
          flexWrap={{ xs: 'wrap' }}
          justifyContent="center"
          alignItems="center"
        >
          {collections.map((collection, i) => {
            return (
              <Chip
                key={`${collection.address}-${i}`}
                label={collection.display_name}
                variant="outlined"
                onClick={() => handleSelection(i)}
                className={`${filterChip}${
                  selectedIndex === i ? ' selected' : ''
                }`}
              />
            );
          })}
        </Stack>
        <Tabs
          containerClassName={tabsContainer}
          tabsClassName={tabs}
          currentTab={currentTab}
          onTabChanged={(value: number) => {
            setCurrentTab(value);
            handleTabChange(value);
          }}
          tabs={[
            {
              label: 'Sell Offers',
              view: (
                <Table isExpandable style={{ whiteSpace: 'nowrap' }}>
                  <ExtendedTableHeader
                    handleSort={handleSortUpdate}
                    sortDirection={sortDirection}
                    sortBy={sortBy}
                  />
                  {getTableBody(
                    sellOrders?.filter((order) =>
                      orderFilter(order.order, account)
                    )
                  )}
                </Table>
              ),
            },
            {
              label: 'Buy Offers',
              view: (
                <Table isExpandable style={{ whiteSpace: 'nowrap' }}>
                  <ExtendedTableHeader
                    handleSort={handleSortUpdate}
                    sortDirection={sortDirection}
                    sortBy={sortBy}
                  />
                  {getTableBody(
                    buyOrders?.filter((order) =>
                      orderFilter(order.order, account)
                    )
                  )}
                </Table>
              ),
            },
          ]}
        />
        {/* <div style={{ marginTop: 40, width: '100%' }} /> */}
      </Grid>
      {pageLoading && (
        <div className={placeholderContainer}>
          <Loader />
        </div>
      )}
      {/* <div className={placeholderContainer}>
        <Pagination
          count={100}
          siblingCount={0}
          boundaryCount={2}
          color="primary"
          size="large"
          page={page}
          onChange={handlePageChange}
          showFirstButton
          showLastButton
        />
      </div> */}
    </>
  );
};

export default FreshOrdersPage;
