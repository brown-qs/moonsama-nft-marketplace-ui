import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FilterIcon from '@mui/icons-material/FilterListSharp';
import { Chip, Stack, TextField } from '@mui/material';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Typography from '@mui/material/Typography';
import { useClasses } from 'hooks';
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Button, Drawer } from 'ui';
import { MOONSAMA_TRAITS, PONDSAMA_TRAITS } from 'utils/constants';
import { OrderType } from 'utils/subgraph';
import { styles } from './Filters.style';

export interface Filters {
  priceRange: number[];
  traits: string[];
  pondTraits: string[];
  selectedOrderType: OrderType | undefined;
  hpRange: number[];
  pwRange: number[];
  spRange: number[];
  dfRange: number[];
}

interface Props {
  onFiltersUpdate: (x: Filters) => void;
  assetAddress: string;
}

export const Filters = ({ onFiltersUpdate, assetAddress }: Props) => {
  const [isDrawerOpened, setIsDrawerOpened] = useState<boolean>(false);
  const [priceRange, setPriceRange] = useState<number[]>([1, 2500]);
  const [hpRange, setHpRange] = useState<number[]>([1, 100]);
  const [pwRange, setPwRange] = useState<number[]>([1, 100]);
  const [spRange, setSpRange] = useState<number[]>([1, 100]);
  const [dfRange, setDfRange] = useState<number[]>([1, 100]);
  const [selectedTraits, setSelectedTraits] = useState<string[]>([]);
  const [selectedPondTraits, setSelectedPondTraits] = useState<string[]>([]);
  const [selectedOrderType, setSelectedOrderType] = useState<
    OrderType | undefined
  >(undefined);
  const {
    filtersDrawerContent,
    applyFiltersButton,
    filterAccordion,
    accordionHeader,
    accordionContent,
    filterChip,
    priceRangeWrapper,
    priceInput,
    filtersTitle,
  } = useClasses(styles);

  const sampleLocation = useLocation();
  useEffect(() => {
    let path: string = sampleLocation.pathname;
    let pathSplit = path.split('/');
    if (pathSplit[7].length >= 1) {
      let newFilter: Filters = JSON.parse(pathSplit[7]);
      setSelectedOrderType(newFilter?.selectedOrderType);
      setPriceRange(newFilter?.priceRange);
      setSelectedTraits(newFilter?.traits);
      setHpRange(newFilter?.hpRange);
      setPwRange(newFilter?.pwRange);
      setSpRange(newFilter?.spRange);
      setDfRange(newFilter?.dfRange);
    }
  }, []);

  const isMoonsama =
    assetAddress.toLowerCase() ==
    '0xb654611F84A8dc429BA3cb4FDA9Fad236C505a1a'.toLowerCase();

  const isPondsama =
    assetAddress.toLowerCase() ==
    '0xe4edcaaea73684b310fc206405ee80abcec73ee0'.toLowerCase();

  const handleApplyFilters = () => {
    onFiltersUpdate({
      selectedOrderType,
      traits: selectedTraits,
      pondTraits: selectedPondTraits,
      priceRange,
      hpRange,
      pwRange,
      spRange,
      dfRange,
    });
    setIsDrawerOpened(false);
  };

  const handlePriceRangeChange = (
    event: Event,
    newValue: number | number[]
  ) => {
    console.log('click', newValue);
    setPriceRange(newValue as number[]);
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

    const newRange = to ? [priceRange[0], val] : [val, priceRange[1]];

    if (JSON.stringify(newRange) !== JSON.stringify(priceRange)) {
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
    const newRange = to ? [priceRange[0], val] : [val, priceRange[1]];
    if (JSON.stringify(newRange) !== JSON.stringify(priceRange)) {
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

    const newRange = to ? [priceRange[0], val] : [val, priceRange[1]];

    if (JSON.stringify(newRange) !== JSON.stringify(priceRange)) {
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

    const newRange = to ? [priceRange[0], val] : [val, priceRange[1]];

    if (JSON.stringify(newRange) !== JSON.stringify(priceRange)) {
      setDfRange(newRange);
    }
  };

  const handleOrderTypeClick = (orderType: OrderType | undefined) => {
    setSelectedOrderType(orderType);
  };

  const handleTraitClick = (trait: string) => {
    if (selectedTraits.includes(trait)) {
      setSelectedTraits(
        selectedTraits.filter((selectedTrait) => selectedTrait !== trait)
      );
      return;
    }
    setSelectedTraits([...selectedTraits, trait]);
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
                {/*
                <Slider
                  getAriaLabel={() => 'Price range'}
                  value={priceRange}
                  onChange={handlePriceRangeChange}
                  valueLabelDisplay="auto"
                  min={0}
                  max={5000}
                  sx={{
                    "& .MuiSlider-thumb":{
                      color: "#710021",
                    },
                    "& .MuiSlider-track": {
                      color: '#710021'
                    },
                    "& .MuiSlider-rail": {
                      color: '#c5c5c5'
                    }
                  }}
                />
                <div className={priceRangeWrapper}>
                  <div>{`${priceRange[0]} MOVR`}</div>
                  <div>{`${priceRange[1]} MOVR`}</div>
                </div>
                */}
              </AccordionDetails>
            </Accordion>
            {isPondsama && (
              <div>
                <Accordion defaultExpanded square className={filterAccordion}>
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls="panel2a-content"
                    id="panel2a-header"
                  >
                    <Typography className={accordionHeader}>
                      HP Range
                    </Typography>
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
                </Accordion>
                <Accordion defaultExpanded square className={filterAccordion}>
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls="panel2a-content"
                    id="panel2a-header"
                  >
                    <Typography className={accordionHeader}>
                      PW Range
                    </Typography>
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
                </Accordion>
                <Accordion defaultExpanded square className={filterAccordion}>
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls="panel2a-content"
                    id="panel2a-header"
                  >
                    <Typography className={accordionHeader}>
                      SP Range
                    </Typography>
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
                </Accordion>
                <Accordion defaultExpanded square className={filterAccordion}>
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls="panel2a-content"
                    id="panel2a-header"
                  >
                    <Typography className={accordionHeader}>
                      DF Range
                    </Typography>
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
                </Accordion>
                <Accordion defaultExpanded square className={filterAccordion}>
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls="panel2a-content"
                    id="panel2a-header"
                  >
                    <Typography className={accordionHeader}>Pondsama Traits</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <div className={accordionContent}>
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
            )}
            {isMoonsama && (
              <Accordion defaultExpanded square className={filterAccordion}>
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  aria-controls="panel2a-content"
                  id="panel2a-header"
                >
                  <Typography className={accordionHeader}>Traits</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <div className={accordionContent}>
                    {Object.keys(MOONSAMA_TRAITS).map((trait, i) => (
                      <Chip
                        label={trait}
                        key={`${trait}-${i}`}
                        variant="outlined"
                        onClick={() => handleTraitClick(trait)}
                        className={`${filterChip} ${
                          selectedTraits.includes(trait) && 'selected'
                        }`}
                      />
                    ))}
                  </div>
                </AccordionDetails>
              </Accordion>
            )}
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
