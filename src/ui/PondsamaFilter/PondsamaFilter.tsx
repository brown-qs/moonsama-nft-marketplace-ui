import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FilterIcon from '@mui/icons-material/FilterListSharp';
import { Chip, Stack, TextField } from '@mui/material';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Typography from '@mui/material/Typography';
import { useClasses } from 'hooks';
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button, Drawer } from 'ui';
import { PONDSAMA_TRAITS } from 'utils/constants';
import { OrderType, OwnedFilterType, NeonOrOrganicType } from 'utils/subgraph';
import { styles } from './PondsamaFilter.style';
import { useActiveWeb3React } from 'hooks/useActiveWeb3React/useActiveWeb3React';

export interface PondsamaFilter {
  priceRange: number[];
  pondTraits: string[];
  selectedOrderType: OrderType | undefined;
  hpRange: number[];
  pwRange: number[];
  spRange: number[];
  dfRange: number[];
  owned: OwnedFilterType | undefined;
  neonOrOrganic: NeonOrOrganicType | undefined;
}

interface Props {
  onFiltersUpdate: (x: PondsamaFilter) => void;
}

export const PondsamaFilter = ({ onFiltersUpdate }: Props) => {
  const [isDrawerOpened, setIsDrawerOpened] = useState<boolean>(false);
  const [priceRange, setPriceRange] = useState<number[]>([1, 2500]);
  const [hpRange, setHpRange] = useState<number[]>([1, 100]);
  const [pwRange, setPwRange] = useState<number[]>([1, 100]);
  const [spRange, setSpRange] = useState<number[]>([1, 100]);
  const [dfRange, setDfRange] = useState<number[]>([1, 100]);
  const [selectedPondTraits, setSelectedPondTraits] = useState<string[]>([]);
  const [neonOrOrganic, setNeonOrOrganic] = useState<
    NeonOrOrganicType | undefined
  >(undefined);
  const [selectedOrderType, setSelectedOrderType] = useState<
    OrderType | undefined
  >(undefined);
  const [selectedOwnedType, setSelectedOwnedType] = useState<
    OwnedFilterType | undefined
  >(undefined);
  const {
    filtersDrawerContent,
    applyFiltersButton,
    filterAccordion,
    accordionHeader,
    accordionContent,
    filterChip,
    priceInput,
    filtersTitle,
    pondsamaFilterAccordion,
    pondsamaAccordionContent,
  } = useClasses(styles);

  const [searchParams] = useSearchParams();
  const { account } = useActiveWeb3React();
  const filter = searchParams.get('filter') ?? '';
  useEffect(() => {
    if (filter.length >= 1) {
      let newFilter: PondsamaFilter = JSON.parse(filter);
      setSelectedOrderType(newFilter?.selectedOrderType);
      setPriceRange(newFilter?.priceRange);
      setHpRange(newFilter?.hpRange);
      setPwRange(newFilter?.pwRange);
      setSpRange(newFilter?.spRange);
      setDfRange(newFilter?.dfRange);
      setSelectedOwnedType(newFilter?.owned);
      setSelectedPondTraits(newFilter?.pondTraits);
      setNeonOrOrganic(newFilter?.neonOrOrganic);
    }
  }, []);

  const handleApplyFilters = () => {
    onFiltersUpdate({
      selectedOrderType,
      pondTraits: selectedPondTraits,
      priceRange,
      hpRange,
      pwRange,
      spRange,
      dfRange,
      owned: selectedOwnedType,
      neonOrOrganic,
    });
    setIsDrawerOpened(false);
  };

  const handlePriceRangeChange2 = (event: any, to: boolean) => {
    // console.log(event.target.value);
    if (!event.target.value && event.target.value !== 0) {
      return;
    }

    const val = Number.parseFloat(event.target.value);

    if (!val && val !== 0) {
      return;
    }

    const newRange = to ? [priceRange[0], val] : [val, priceRange[1]];

    console.log('click', newRange);

    if (JSON.stringify(newRange) !== JSON.stringify(priceRange)) {
      setPriceRange(newRange);
    }
  };

  const handleHpRangeChange = (event: any, to: boolean) => {
    if (!event.target.value && event.target.value !== 0) {
      return;
    }

    const val = Number.parseFloat(event.target.value);

    if (!val && val !== 0) {
      return;
    }

    const newRange = to ? [hpRange[0], val] : [val, hpRange[1]];

    if (JSON.stringify(newRange) !== JSON.stringify(hpRange)) {
      setHpRange(newRange);
    }
  };

  const handlePwRangeChange = (event: any, to: boolean) => {
    if (!event.target.value && event.target.value !== 0) {
      return;
    }
    const val = Number.parseFloat(event.target.value);
    if (!val && val !== 0) {
      return;
    }
    const newRange = to ? [pwRange[0], val] : [val, pwRange[1]];
    if (JSON.stringify(newRange) !== JSON.stringify(pwRange)) {
      setPwRange(newRange);
    }
  };

  const handleSpRangeChange = (event: any, to: boolean) => {
    if (!event.target.value && event.target.value !== 0) {
      return;
    }

    const val = Number.parseFloat(event.target.value);

    if (!val && val !== 0) {
      return;
    }

    const newRange = to ? [spRange[0], val] : [val, spRange[1]];

    if (JSON.stringify(newRange) !== JSON.stringify(spRange)) {
      setSpRange(newRange);
    }
  };

  const handleDfRangeChange = (event: any, to: boolean) => {
    if (!event.target.value && event.target.value !== 0) {
      return;
    }

    const val = Number.parseFloat(event.target.value);

    if (!val && val !== 0) {
      return;
    }

    const newRange = to ? [dfRange[0], val] : [val, dfRange[1]];

    if (JSON.stringify(newRange) !== JSON.stringify(dfRange)) {
      setDfRange(newRange);
    }
  };

  const handleOrderTypeClick = (orderType: OrderType | undefined) => {
    setSelectedOrderType(orderType);
  };

  const handleOwnedTypeClick = (owned: OwnedFilterType | undefined) => {
    setSelectedOwnedType(owned);
  };

  const handlePondTraitClick = (trait: string) => {
    if (selectedPondTraits.includes(trait)) {
      setSelectedPondTraits(
        selectedPondTraits.filter(
          (selectedPondTrait) => selectedPondTrait !== trait
        )
      );
      return;
    }
    setSelectedPondTraits([...selectedPondTraits, trait]);
  };

  const handleNeonOrOrganicClick = (
    neonOrOrganicValue: NeonOrOrganicType | undefined
  ) => {
    setNeonOrOrganic(neonOrOrganicValue);
    if (neonOrOrganicValue == NeonOrOrganicType.ALL) {
      let tempPondTraits: string[] = [];
      selectedPondTraits.map((str) => {
        if (str != 'Neon' && str != 'Organic') tempPondTraits.push(str);
      });
      setSelectedPondTraits(tempPondTraits);
    }
    if (neonOrOrganicValue == NeonOrOrganicType.NEON) {
      let tempPondTraits: string[] = [];
      selectedPondTraits.map((str) => {
        if (str != 'Organic') tempPondTraits.push(str);
      });
      if (!tempPondTraits.includes('Neon')) tempPondTraits.push('Neon');
      setSelectedPondTraits(tempPondTraits);
    }
    if (neonOrOrganicValue == NeonOrOrganicType.ORGANIC) {
      let tempPondTraits: string[] = [];
      selectedPondTraits.map((str) => {
        if (str != 'Neon') tempPondTraits.push(str);
      });
      if (!tempPondTraits.includes('Organic')) tempPondTraits.push('Organic');
      setSelectedPondTraits(tempPondTraits);
    }
  };

  return (
    <>
      <Button
        onClick={() => setIsDrawerOpened(true)}
        startIcon={<FilterIcon />}
        variant="outlined"
        color="primary"
      >
        Filter
      </Button>
      <Drawer
        anchor="left"
        open={isDrawerOpened}
        onClose={() => setIsDrawerOpened(false)}
        onOpen={() => setIsDrawerOpened(true)}
        onBackdropClick={() => setIsDrawerOpened(false)}
      >
        <Typography variant="h6" className={filtersTitle}>
          Filters
        </Typography>
        <div className={filtersDrawerContent}>
          <div>
            <Accordion defaultExpanded square className={filterAccordion}>
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls="panel1a-content"
                id="panel1a-header"
              >
                <Typography className={accordionHeader}>Order Type</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <div className={accordionContent}>
                  <Chip
                    label="Active buy order"
                    variant="outlined"
                    onClick={() => handleOrderTypeClick(OrderType.BUY)}
                    className={`${filterChip} ${
                      selectedOrderType == OrderType.BUY && 'selected'
                    }`}
                  />
                  <Chip
                    label="Active sell order"
                    variant="outlined"
                    onClick={() => handleOrderTypeClick(OrderType.SELL)}
                    className={`${filterChip} ${
                      selectedOrderType == OrderType.SELL && 'selected'
                    }`}
                  />
                  <Chip
                    label="None"
                    variant="outlined"
                    onClick={() => handleOrderTypeClick(undefined)}
                    className={`${filterChip} ${
                      selectedOrderType == undefined && 'selected'
                    }`}
                  />
                </div>
              </AccordionDetails>
            </Accordion>
            <Accordion defaultExpanded square className={filterAccordion}>
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls="panel2a-content"
                id="panel2a-header"
              >
                <Typography className={accordionHeader}>Price</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={{ xs: 1, sm: 2, md: 8 }}
                  justifyContent="flex-end"
                  alignItems="center"
                >
                  <TextField
                    className={priceInput}
                    placeholder="Min"
                    variant="outlined"
                    onChange={(event: any) =>
                      handlePriceRangeChange2(event, false)
                    }
                    defaultValue={priceRange[0]}
                  />
                  <div>TO</div>
                  <TextField
                    className={priceInput}
                    placeholder="Max"
                    variant="outlined"
                    onChange={(event: any) =>
                      handlePriceRangeChange2(event, true)
                    }
                    defaultValue={priceRange[1]}
                  />
                </Stack>
              </AccordionDetails>
            </Accordion>
            <Accordion defaultExpanded square className={filterAccordion}>
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls="panel1a-content"
                id="panel1a-header"
              >
                <Typography className={accordionHeader}>Owned</Typography>
              </AccordionSummary>
              <AccordionDetails>
                {account ? (
                  <div className={accordionContent}>
                    <Chip
                      label="Owned"
                      variant="outlined"
                      onClick={() =>
                        handleOwnedTypeClick(OwnedFilterType.OWNED)
                      }
                      className={`${filterChip} ${
                        selectedOwnedType == OwnedFilterType.OWNED && 'selected'
                      }`}
                    />
                    <Chip
                      label="Not OWned"
                      variant="outlined"
                      onClick={() =>
                        handleOwnedTypeClick(OwnedFilterType.NOTOWNED)
                      }
                      className={`${filterChip} ${
                        selectedOwnedType == OwnedFilterType.NOTOWNED &&
                        'selected'
                      }`}
                    />
                    <Chip
                      label="All"
                      variant="outlined"
                      onClick={() => handleOwnedTypeClick(OwnedFilterType.All)}
                      className={`${filterChip} ${
                        selectedOwnedType == OwnedFilterType.All && 'selected'
                      }`}
                    />
                  </div>
                ) : (
                  <div className={accordionContent}>
                    <Typography className={accordionHeader}>
                      Please connect your wallet!
                    </Typography>
                  </div>
                )}
              </AccordionDetails>
            </Accordion>
            <Accordion defaultExpanded square className={filterAccordion}>
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls="panel1a-content"
                id="panel1a-header"
              >
                <Typography className={accordionHeader}>
                  Neon or Organic
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <div className={accordionContent}>
                  <Chip
                    label="Neon"
                    variant="outlined"
                    onClick={() =>
                      handleNeonOrOrganicClick(NeonOrOrganicType.NEON)
                    }
                    className={`${filterChip} ${
                      neonOrOrganic == NeonOrOrganicType.NEON && 'selected'
                    }`}
                  />
                  <Chip
                    label="Organic"
                    variant="outlined"
                    onClick={() =>
                      handleNeonOrOrganicClick(NeonOrOrganicType.ORGANIC)
                    }
                    className={`${filterChip} ${
                      neonOrOrganic == NeonOrOrganicType.ORGANIC && 'selected'
                    }`}
                  />
                  <Chip
                    label="All"
                    variant="outlined"
                    onClick={() =>
                      handleNeonOrOrganicClick(NeonOrOrganicType.ALL)
                    }
                    className={`${filterChip} ${
                      neonOrOrganic == NeonOrOrganicType.ALL && 'selected'
                    }`}
                  />
                </div>
              </AccordionDetails>
            </Accordion>
            <div>
              <Accordion
                defaultExpanded
                square
                className={pondsamaFilterAccordion}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  aria-controls="panel2a-content"
                  id="panel2a-header"
                >
                  <Typography className={accordionHeader}>HP Range</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={{ xs: 1, sm: 2, md: 8 }}
                    justifyContent="flex-end"
                    alignItems="center"
                  >
                    <TextField
                      className={priceInput}
                      placeholder="Min"
                      variant="outlined"
                      onChange={(event: any) =>
                        handleHpRangeChange(event, false)
                      }
                      defaultValue={hpRange[0]}
                    />
                    <div>TO</div>
                    <TextField
                      className={priceInput}
                      placeholder="Max"
                      variant="outlined"
                      onChange={(event: any) =>
                        handleHpRangeChange(event, true)
                      }
                      defaultValue={hpRange[1]}
                    />
                  </Stack>
                </AccordionDetails>
                <AccordionSummary
                  aria-controls="panel2a-content"
                  id="panel2a-header"
                >
                  <Typography className={accordionHeader}>PW Range</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={{ xs: 1, sm: 2, md: 8 }}
                    justifyContent="flex-end"
                    alignItems="center"
                  >
                    <TextField
                      className={priceInput}
                      placeholder="Min"
                      variant="outlined"
                      onChange={(event: any) =>
                        handlePwRangeChange(event, false)
                      }
                      defaultValue={pwRange[0]}
                    />
                    <div>TO</div>
                    <TextField
                      className={priceInput}
                      placeholder="Max"
                      variant="outlined"
                      onChange={(event: any) =>
                        handlePwRangeChange(event, true)
                      }
                      defaultValue={pwRange[1]}
                    />
                  </Stack>
                </AccordionDetails>
                <AccordionSummary
                  aria-controls="panel2a-content"
                  id="panel2a-header"
                >
                  <Typography className={accordionHeader}>SP Range</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={{ xs: 1, sm: 2, md: 8 }}
                    justifyContent="flex-end"
                    alignItems="center"
                  >
                    <TextField
                      className={priceInput}
                      placeholder="Min"
                      variant="outlined"
                      onChange={(event: any) =>
                        handleSpRangeChange(event, false)
                      }
                      defaultValue={spRange[0]}
                    />
                    <div>TO</div>
                    <TextField
                      className={priceInput}
                      placeholder="Max"
                      variant="outlined"
                      onChange={(event: any) =>
                        handleSpRangeChange(event, true)
                      }
                      defaultValue={spRange[1]}
                    />
                  </Stack>
                </AccordionDetails>
                <AccordionSummary
                  aria-controls="panel2a-content"
                  id="panel2a-header"
                >
                  <Typography className={accordionHeader}>DF Range</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={{ xs: 1, sm: 2, md: 8 }}
                    justifyContent="flex-end"
                    alignItems="center"
                  >
                    <TextField
                      className={priceInput}
                      placeholder="Min"
                      variant="outlined"
                      onChange={(event: any) =>
                        handleDfRangeChange(event, false)
                      }
                      defaultValue={dfRange[0]}
                    />
                    <div>TO</div>
                    <TextField
                      className={priceInput}
                      placeholder="Max"
                      variant="outlined"
                      onChange={(event: any) =>
                        handleDfRangeChange(event, true)
                      }
                      defaultValue={dfRange[1]}
                    />
                  </Stack>
                </AccordionDetails>
                <AccordionSummary
                  aria-controls="panel2a-content"
                  id="panel2a-header"
                >
                  <Typography className={accordionHeader}>
                    Pondsama Traits
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <div className={pondsamaAccordionContent}>
                    {Object.keys(PONDSAMA_TRAITS).map((trait, i) => (
                      <Chip
                        label={trait}
                        key={`${trait}-${i}`}
                        variant="outlined"
                        onClick={() => handlePondTraitClick(trait)}
                        className={`${filterChip} ${
                          selectedPondTraits.includes(trait) && 'selected'
                        }`}
                      />
                    ))}
                  </div>
                </AccordionDetails>
              </Accordion>
            </div>
            <Button
              className={applyFiltersButton}
              onClick={handleApplyFilters}
              variant="contained"
              color="primary"
            >
              Apply Filters
            </Button>
            <Button
              onClick={() => setIsDrawerOpened(false)}
              className={applyFiltersButton}
              variant="outlined"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Drawer>
    </>
  );
};
