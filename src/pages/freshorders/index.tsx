import { Chip, Stack } from '@mui/material';
import Grid from '@mui/material/Grid';
import { Order } from '../../hooks/marketplace/types';
import { TokenMeta } from '../../hooks/useFetchTokenUri.ts/useFetchTokenUri.types';
import {
  useLatestBuyOrdersForTokenWithStaticCallback,
  useLatestSellOrdersForTokenWithStaticCallback,
} from 'hooks/useLatestOrdersWithStaticCallback/useLatestOrdersWithStaticCallback';
import { useRawCollectionsFromList } from '../../hooks/useRawCollectionsFromList/useRawCollectionsFromList';
import { StaticTokenData } from '../../hooks/useTokenStaticDataCallback/useTokenStaticDataCallback';
import { useWhitelistedAddresses } from '../../hooks/useWhitelistedAddresses/useWhitelistedAddresses';
import { useCallback, useEffect, useState } from 'react';
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

type Anchor = 'top' | 'left' | 'bottom' | 'right';
type SortDirection = 'asc' | 'desc';

const PAGE_SIZE = 10;
const ExtendedTableHeader = ({ handleSort, sortDirection, sortBy }:
  { handleSort: ((sortBy: string) => void), sortDirection: SortDirection, sortBy: string }) => {

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
        <TableCell sortDirection={sortBy === 'quantity' ? sortDirection : false}>
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
  const { chainId } = useActiveWeb3React();

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

  const [selectedIndex, setSelectedIndex] = useState<number>(
    collections.findIndex((x) => (x.display_name = 'Moonsama')) ?? 0
  );
  const [take, setTake] = useState<number>(0);
  const [paginationEnded, setPaginationEnded] = useState<boolean>(false);
  const [pageLoading, setPageLoading] = useState<boolean>(false);
  const [isDrawerOpened, setIsDrawerOpened] = useState<boolean>(false);

  useEffect(() => {
    if (chainId) {
      setBuyOrders([]);
      setSellOrders([]);
      setSelectedIndex(collections.findIndex((x) => (x.display_name = 'Moonsama')) ?? 0)
      setTake(0)
      setPaginationEnded(false)
      setPageLoading(false)
      setIsDrawerOpened(false)
    }
  }, [chainId, JSON.stringify(collections)])

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

  const handleSortUpdate = (_sortBy: string) => {
    setBuyOrders([]);
    setSellOrders([]);
    setTake(0);
    setPaginationEnded(false);
    if (_sortBy != sortBy) {
      setSortBy(_sortBy)
      setSortDirection('asc');
    } else {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    }
  }

  const handleSelection = (i: number) => {
    if (i !== selectedIndex) {
      setBuyOrders([]);
      setSellOrders([]);
      setSelectedIndex(i);
      setTake(0);
      setPaginationEnded(false);
    }
  };

  const handleScrollToBottom = useCallback(() => {
    if (pageLoading) return;
    setTake((state) => (state += PAGE_SIZE));
  }, []);

  useBottomScrollListener(handleScrollToBottom, { offset: 400, debounce: 1000 });

  const [sortBy, setSortBy] = useState("time");
  const [sortDirection, setSortDirection] = useState('desc' as SortDirection);

  useEffect(() => {
    const getCollectionById = async () => {
      setPageLoading(true);

      let buyData = await getPaginatedBuyOrders(
        selectedTokenAddress,
        PAGE_SIZE,
        take,
        sortBy,
        sortDirection,
      );
      let sellData = await getPaginatedSellOrders(
        selectedTokenAddress,
        PAGE_SIZE,
        take,
        sortBy,
        sortDirection,
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

        return;
      }

      setSellOrders((state) => state.concat(sellData));
      setBuyOrders((state) => state.concat(buyData));
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
          tabs={[
            {
              label: 'Sell Offers',
              view: (
                <Table isExpandable style={{ whiteSpace: 'nowrap' }}>
                  <ExtendedTableHeader handleSort={handleSortUpdate} sortDirection={sortDirection} sortBy={sortBy}/>
                  {getTableBody(sellOrders?.filter(order => orderFilter(order.order)))}
                </Table>
              ),
            },
            {
              label: 'Buy Offers',
              view: (
                <Table isExpandable style={{ whiteSpace: 'nowrap' }}>
                  <ExtendedTableHeader handleSort={handleSortUpdate} sortDirection={sortDirection} sortBy={sortBy}/>
                  {getTableBody(buyOrders?.filter(order => orderFilter(order.order)))}
                </Table>
              ),
            },
          ]}
        />
        <div style={{ marginTop: 40, width: '100%' }} />
      </Grid>

      {pageLoading && (
        <div className={placeholderContainer}>
          <Loader />
        </div>
      )}
    </>
  );
};

export default FreshOrdersPage;
