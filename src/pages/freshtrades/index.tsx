import Grid from '@material-ui/core/Grid';
import { TokenOrder } from '../../components/TokenOrder/TokenOrder';
import { GlitchText, Loader } from 'ui';
import React, { ChangeEvent, SyntheticEvent, useCallback, useEffect, useRef, useState } from 'react';
import { FillWithOrder, Order } from 'hooks/marketplace/types';
import { StaticTokenData } from 'hooks/useTokenStaticDataCallback/useTokenStaticDataCallback';
import { TokenMeta } from 'hooks/useFetchTokenUri.ts/useFetchTokenUri.types';
import { useBottomScrollListener } from 'react-bottom-scroll-listener';
import { useStyles } from './styles';
import { useLatestTradesWithStaticCallback } from 'hooks/useLatestTradesWithStaticCallback/useLatestTradesWithStaticCallback';
import { TokenTrade } from 'components/TokenTrade/TokenTrade';

const PAGE_SIZE = 10;

const FreshTradesPage = () => {
  const [collection, setCollection] = useState<{
    meta: TokenMeta | undefined;
    staticData: StaticTokenData;
    fill: FillWithOrder
  }[]>([]);
  const [take, setTake] = useState<number>(0)
  const [paginationEnded, setPaginationEnded] = useState<boolean>(false)
  const [pageLoading, setPageLoading] = useState<boolean>(false)
  const { placeholderContainer, container, scene, canvas, poster, glass, nftWrapper } = useStyles()

  const sceneRef = useRef(null);
  const canvasRef = useRef(null);
  const posterRef = useRef(null);
  const glassRef = useRef(null);

  const getPaginatedItems = useLatestTradesWithStaticCallback()

  const handleScrollToBottom = useCallback(() => {
    setTake((state) => (state += PAGE_SIZE));
  }, []);

  useBottomScrollListener(handleScrollToBottom, { offset: 400 });

  useEffect(() => {
    const getCollectionById = async () => {
      setPageLoading(true);
      let data = await getPaginatedItems(PAGE_SIZE, take);
      data = data.filter(x => x.staticData.asset.assetAddress.toLowerCase() === '0xb654611F84A8dc429BA3cb4FDA9Fad236C505a1a'.toLowerCase()) // REMOVEME later
      setPageLoading(false);
      const isEnd = data.some(({ meta }) => !meta);
      

      //console.log('IS END', {paginationEnded, isEnd, pieces, data})

      //console.log('FRESH', {data, PAGE_SIZE, take, isEnd})

      if (isEnd) {
        const pieces = data.filter(({ meta }) => !!meta);
        setPaginationEnded(true);
        setCollection((state) => state.concat(pieces));
        return;
      }
      setCollection((state) => state.concat(data));
    };
    if (!paginationEnded) {
      getCollectionById();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [take, paginationEnded]);

  const handleTouchMove = (event: any): void => {
    event.preventDefault();

    const x = event.touches[0].pageX;
    const y = event.touches[0].pageY;

    updateRotation(x, y);
  };

  const handleMouseMove = (event: any): void => {
    const x = event.pageX;
    const y = event.pageY;
    console.log(event);
    updateRotation(x, y);
  };

  const updateRotation = (x: number, y: number) => {
    console.log(x, y);
    if(!!glassRef.current && !!canvasRef.current) {
      const yAxisRotation = (x - (window.innerWidth / 8)) * (80 / window.innerWidth);
      const xAxisRotation = (y - (window.innerHeight / 8)) * (-80 / window.innerHeight);

      const transformations = [
        'translate(-50%, -50%)',
        'rotateY(' + yAxisRotation + 'deg)',
        'rotateX(' + xAxisRotation + 'deg)'
      ];

      // @ts-ignore
      glassRef.current.style.backgroundPosition = (500 - yAxisRotation * 5 + 'px ') + (xAxisRotation * 5 + 'px');
      // @ts-ignore
      canvasRef.current.style.transform = transformations.join(' ');
    }
  };

  return (
    <>
      <div className={container}>
        <GlitchText fontSize={48}>Latest trades</GlitchText>
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
        }}
      ></div>
      <Grid container spacing={1} style={{ marginTop: 12 }}>
        {collection
          .map(
            (token, i) =>
              token && (
                <Grid
                  item
                  key={`${token.staticData.asset.id}-${i}`}
                  xl={3}
                  md={4}
                  sm={6}
                  xs={12}
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
    </>
  );
};

export default FreshTradesPage;
