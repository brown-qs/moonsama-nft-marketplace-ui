
import { GlitchText, NavLink, Dialog } from 'ui';
import { truncateHexString } from 'utils';
import { styles } from './TokenLootbox.styles';
import { Fraction } from 'utils/Fraction';
import { useActiveWeb3React, useClasses } from 'hooks';
import { useTokenStaticData } from 'hooks/useTokenStaticData/useTokenStaticData';
import { useTokenBasicData } from 'hooks/useTokenBasicData.ts/useTokenBasicData';
import { useFetchTokenUri } from 'hooks/useFetchTokenUri.ts/useFetchTokenUri';
import { useDecimalOverrides } from 'hooks/useDecimalOverrides/useDecimalOverrides';
import {
  StringAssetType,
} from '../../utils/subgraph';
import { useBlueprint } from 'hooks/loot/useBlueprint'
import { Asset } from 'hooks/marketplace/types';
import { useState, useRef, SyntheticEvent } from 'react';
import { useAllowances } from 'hooks/useApproveCallback/useApproveCallback';
import { useLootboxOpen, OpenData, RewardData } from 'hooks/loot/useLootboxOpen';
import { WORKBENCH_ADDRESSES, ChainId } from '../../constants';
import { BigNumber } from '@ethersproject/bignumber';
import { CraftCallbackState, useCraftCallback } from 'hooks/loot/useCraftCallback';
import { Box, Button, Grow, Link, Paper, Typography, useTheme } from '@mui/material';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import { Media, MintResourceApproveItem } from 'components';
import { DoDisturb } from '@mui/icons-material';
import DialogUI from '@mui/material/Dialog';

import { LootboxDataType, LOOTBOXES } from '../../assets/data/lootboxes'


export const TokenLootbox = () => {
  const styleClasses = useClasses(styles)
  const {
    container,
    image,
    imageContainer,
    price,
    buttonsContainer,
    name,
    newSellButton,
    transferButton,
    dialogContainer,
    lootCardContainer,
    lootboxResultContainer,
  } = styleClasses;

  const defaultBoxIndex = LOOTBOXES.length - 1

  const theme = useTheme();

  const [approveDialogOpen, setApproveDialogOpen] = useState(false)
  const [openBoxDialogOpen, setOpenBoxDialogOpen] = useState(false)
  const { chainId, account } = useActiveWeb3React();
  const decimalOverrides = useDecimalOverrides();

  const [tabValue, setTabValue] = useState<number>(defaultBoxIndex);
  const [lootboxData, setLootboxData] = useState<LootboxDataType>(LOOTBOXES[defaultBoxIndex]);

  const handleTabValueChange = (event: SyntheticEvent, newTabValue: number) => {
    setTabValue(newTabValue);
    setLootboxData(LOOTBOXES[newTabValue])
  };

  const blueprint = useBlueprint(lootboxData.blueprintId); // 2 for prod
  const craftCallback = useCraftCallback({ amount: '1', blueprintId: lootboxData.blueprintId })

  let asset: Asset = lootboxData.blueprintOutput

  const openCallback = useLootboxOpen({ lootboxId: lootboxData.lootboxId })

  const balanceData = useTokenBasicData([asset as Asset]);
  const decimals = decimalOverrides[asset?.assetAddress] ?? balanceData?.[0]?.decimals ?? 0;
  const isFungible = decimals > 0;

  let userBalanceString = isFungible
    ? Fraction.from(
      balanceData?.[0]?.userBalance?.toString() ?? '0',
      decimals
    )?.toFixed(2) ?? '0'
    : balanceData?.[0]?.userBalance?.toString() ?? '0';
  userBalanceString = account ? userBalanceString : '0';

  let totalSupplyString = balanceData?.[0]?.totalSupply
    ? isFungible
      ? Fraction.from(
        balanceData?.[0]?.totalSupply?.toString() ?? '0',
        decimals
      )?.toFixed(2) ?? '0'
      : balanceData?.[0]?.totalSupply?.toString()
    : asset?.assetType.valueOf() === StringAssetType.ERC721
      ? '1'
      : undefined;

  const availableToMint = blueprint?.availableToMint?.toString() ?? '0'

  const lootboxStaticData = useTokenStaticData([asset as Asset]);
  const lootboxMeta = useFetchTokenUri(lootboxStaticData)?.[0];


  const inputAssets = blueprint?.inputs.map(input => ({
    id: input.assetAddress + input.assetId,
    assetId: input.assetId,
    assetType: input.assetType,
    assetAddress: input.assetAddress.toLowerCase(),
    amount: input.amount,
  }))

  const inputsStaticData = useTokenStaticData(inputAssets ?? []);
  const inputMetas = useFetchTokenUri(inputsStaticData);
  const inputsBalanceData = useTokenBasicData(inputAssets ?? []);

  const items = inputAssets?.map((asset, i) => {
    const decimals = decimalOverrides[asset.assetAddress] ?? inputsBalanceData?.[i]?.decimals ?? 0;
    //console.log({ decimals })
    const isFungible = decimals > 0;
    const target = isFungible
      ? Fraction.from(
        asset.amount?.toString() ?? '0',
        decimals
      )?.toSignificant(5) ?? '0'
      : asset.amount?.toString() ?? '0';
    const name = inputMetas[i]?.name ? inputMetas[i]?.name : '';
    return {
      asset,
      target,
      name,
      decimals
    }
  }) ?? []

  const allowances = useAllowances(
    inputAssets?.map(x => {
      return { ...x, operator: WORKBENCH_ADDRESSES[chainId ?? ChainId.MOONRIVER] }
    }) ?? [],
    account ?? undefined
  )

  let approvalNeeded = false
  allowances?.map((allowance, i) => {
    if (BigNumber.from(inputAssets?.[i]?.amount ?? '0').gt(allowance ?? '0')) {
      //console.log('YOLO', inputAssets?.[i].amount, x)
      approvalNeeded = true
      return
    }
  })

  let userHasEnough = true
  inputsBalanceData?.map((inputBalanceData, i) => {
    if (BigNumber.from(inputAssets?.[i]?.amount ?? '0').gt(inputBalanceData?.userBalance ?? '0')) {
      userHasEnough = false
      return
    }
  })

  console.log('lootbox debug', { userHasEnough, inputsBalanceData, approvalNeeded, allowances, items, inputAssets })


  const { callback } = useLootboxOpen({ lootboxId: lootboxData.lootboxId } as OpenData);
  const openVidRef = useRef<any>(null)
  const [videoPlay, setvideoPlay] = useState(false)
  const [openError, setOpenError] = useState<string | undefined>(undefined)
  const [openResult, setOpenResult] = useState<RewardData | undefined>(undefined)
  const [confirmButtonShow, setConfirmButtonShow] = useState(false)

  const rarityClass0 = styleClasses[`${openResult?.rewards[0].rarity ?? 'common'}Loot`]
  const rarityClass1 = styleClasses[`${openResult?.rewards[1].rarity ?? 'common'}Loot`]
  const rarityClass2 = styleClasses[`${openResult?.rewards[2].rarity ?? 'common'}Loot`]


  //console.log({ openError })

  return (
    <Paper className={container}>
      <Tabs
        onChange={handleTabValueChange}
        value={tabValue}
        variant="scrollable"
        scrollButtons="auto"
        aria-label="moonsama workbench blueprints tab"
      >
        {LOOTBOXES.map(lootboxdata => {
          return <Tab key={lootboxdata.lootboxId} label={lootboxdata.name} />
        })}
      </Tabs>


      <div role="button" className={imageContainer} tabIndex={0}>
        <Media uri={lootboxMeta?.image} className={image} />
      </div>

      <GlitchText
        variant="h1"
        className={name}
      >
        {lootboxMeta?.name ??
          lootboxMeta?.title ??
          truncateHexString(asset?.assetAddress)}
      </GlitchText>

      <Box className={price} style={{ justifyContent: 'space-around' }}>
        {
          <Typography color="textSecondary" variant="subtitle1">
            {`Owned ${userBalanceString}${totalSupplyString ? ` of ${totalSupplyString}` : ''
              }`}
          </Typography>
        }
      </Box>

      <Box
        className={buttonsContainer}
        style={{ justifyContent: 'space-around' }}
      >
        <Button
          variant="contained"
          color="warning"
          onClick={() => {
            if (callback)
              callback().then((res) => {
                console.log(res)
                setOpenBoxDialogOpen(true)
              })
          }}
          disabled={userBalanceString === '0'}
        >
          {lootboxData.openText}
        </Button>
      </Box>

      <div>
        <GlitchText
          variant="h1"
          className={name}
        >
          Get a box
        </GlitchText>


        <Box className={price}>
          {
            <Typography color="textSecondary" variant="subtitle1">
              {`Sacrifice:`}
            </Typography>
          }
        </Box>

        {items?.map((item, index) => <Box
          key={index}
          className={price}
          style={{ justifyContent: 'space-around' }}
        >
          <Typography color="textSecondary" variant="subtitle1" key={index}>
            {`${item?.target} ${item?.name}`}
          </Typography>
        </Box>
        )}
      </div>

      <Dialog
        fullWidth={true}
        open={approveDialogOpen}
        onClose={() => {
          setApproveDialogOpen(false)
        }}
        title={"Approve Resources"}
      >
        <div className={dialogContainer}>
          {items?.map((item, index) => {
            return (
              <MintResourceApproveItem
                key={index}
                {...item.asset}
                assetName={item.name}
                decimals={item.decimals}
              />
            );
          })
          }
        </div>
      </Dialog>

      <Box className={price}>
        {
          <Typography color="textSecondary" variant="subtitle1">
            {`Still available:`}
          </Typography>
        }
      </Box>

      <Box className={price} style={{ justifyContent: 'space-around' }}>
        {
          <Typography color="textSecondary" variant="subtitle1">
            {`${availableToMint} boxes`}
          </Typography>
        }
      </Box>

      <div>
        {
          !userHasEnough ? <NavLink href={lootboxData.notEnoughLink}>
            <Box
              className={buttonsContainer}
              style={{ justifyContent: 'space-around' }}
            >
              <Button
                startIcon={<DoDisturb />}
                variant="outlined"
                color="primary"
                className={newSellButton}
              >
                {`${lootboxData.notEnoughText}↗`}
              </Button>
            </Box>
          </NavLink>
            : approvalNeeded ?
              <Box
                className={buttonsContainer}
                style={{ justifyContent: 'space-around' }}
              >
                <Button
                  onClick={() => {
                    setApproveDialogOpen(true);
                  }}
                  variant="contained"
                  color="primary"
                  className={transferButton}
                >
                  Approve
                </Button>
              </Box>
              :
              <Box
                className={buttonsContainer}
                style={{ justifyContent: 'space-around' }}
              >
                <Button
                  style={{ background: 'green' }}
                  variant="contained"
                  color="primary"
                  onClick={async () => {
                    try {
                      await craftCallback?.callback?.()
                    } catch (err) {
                      console.error('Craft trasaction failiure', err)
                    }
                  }}
                  disabled={craftCallback.state === CraftCallbackState.INVALID || availableToMint === '0'}
                >
                  {lootboxData.craftText}
                </Button>
              </Box>
        }
      </div>

      <DialogUI
        className={dialogContainer}
        fullWidth={true}
        open={openBoxDialogOpen}
        onClose={() => {
          setvideoPlay(false)
          setOpenBoxDialogOpen(false)
          setConfirmButtonShow(false)
          setOpenError(undefined)
          setOpenResult(undefined)
        }}
        maxWidth="lg"
      >
        <video ref={openVidRef} style={{ width: '100%' }} playsInline src={lootboxData.video} poster={lootboxData.imageUnopened}>
        </video>
        {!videoPlay && !openResult ?
          <div style={{ position: 'absolute', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', flexDirection: 'column' }}
          >
            {!openError && <Button
              onClick={async () => {
                let rewardData
                let error: Error | undefined
                try {
                  if (openCallback?.callback) {
                    const res = await openCallback?.callback?.()
                    rewardData = res[0]
                    error = res[1]
                  } else {
                    rewardData = undefined
                    error = new Error('Sama box could not be opened')
                  }
                } catch (err) {
                  error = new Error('Sama box could not be opened')
                }

                console.error(error, openError)
                if (!error) {
                  setOpenResult(rewardData)
                  openVidRef?.current?.play();
                  setvideoPlay(true)
                  setTimeout(() => {
                    setConfirmButtonShow(true)
                  }, 5500)
                } else {
                  setOpenError(error?.message)
                }
              }}
            >
              <GlitchText
                style={{ width: '100%', color: 'white' }}
                variant="h1">
                {lootboxData.openDialogText}
              </GlitchText>
            </Button>}
            {openError && <Box style={{ display: 'flex', padding: theme.spacing(2) }}><Typography variant="body2">{openError}</Typography></Box>}
          </div> :

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'absolute', textAlign: 'center', height: '100%', flexDirection: 'column' }}>
            <div className={lootboxResultContainer} style={{ width: '60%' }}>


              <Grow style={{ marginLeft: 30, transitionDelay: `5000ms` }} in={true}>
                <div className={`${lootCardContainer} ${rarityClass0}`}>
                  <Link target={'_blank'} href={`/token/${openResult?.rewards[0].assetType}/${openResult?.rewards[0].assetAddress}/${openResult?.rewards[0].assetId}`}>
                    <img className={imageContainer} src={openResult?.rewards[0].meta?.image} alt='loot in slot 0'/>
                  </Link>
                  <span className="name">{openResult?.rewards[0].meta?.name}</span>
                  <span className="asset-id">{`#${openResult?.rewards[0].assetId}`}</span>
                </div>
              </Grow>
              <Grow style={{ marginLeft: 30, transitionDelay: `5200ms` }} in={true}>
                <div className={`${lootCardContainer} ${rarityClass1}`}>
                  <Link target={'_blank'} href={`/token/${openResult?.rewards[1].assetType}/${openResult?.rewards[1].assetAddress}/${openResult?.rewards[1].assetId}`}>
                    <img className={imageContainer} src={openResult?.rewards[1].meta?.image} alt='loot in slot 1'/>
                  </Link>
                  <span className="name">{openResult?.rewards[1].meta?.name}</span>
                  <span className="asset-id">{`#${openResult?.rewards[1].assetId}`}</span>
                </div>
              </Grow>
              <Grow style={{ marginLeft: 30, transitionDelay: `5400ms` }} in={true}>
                <div className={`${lootCardContainer} ${rarityClass2}`}>
                  <Link target={'_blank'} href={`/token/${openResult?.rewards[2].assetType}/${openResult?.rewards[2].assetAddress}/${openResult?.rewards[2].assetId}`}>
                    <img className={imageContainer} src={openResult?.rewards[2].meta?.image} alt='loot in slot 2'/>
                  </Link>
                  <span className="name">{openResult?.rewards[2].meta?.name}</span>
                  <span className="asset-id">{`#${openResult?.rewards[2].assetId}`}</span>
                </div>
              </Grow>
            </div>
            {confirmButtonShow && <>
              <Box style={{ display: 'flex', padding: theme.spacing(2) }}><Typography variant="body2">Loot landing in your wallet soon. You will not be able to open a new box in the meantime.</Typography></Box>
              <Button onClick={() => {
                setvideoPlay(false)
                setOpenBoxDialogOpen(false)
                setConfirmButtonShow(false)
                setOpenError(undefined)
                setOpenResult(undefined)
              }} variant="contained"
                color="primary"
                style={{ padding: theme.spacing(2) }}
              ><Typography variant="body1">Nice!</Typography></Button>

            </>}
          </div>
        }
      </DialogUI>
    </Paper >
  );
};
