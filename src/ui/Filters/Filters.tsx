import React, { useState } from 'react';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Slider from '@mui/material/Slider';
import { Button, Drawer } from 'ui';
import { useStyles } from './Filters.style';
import { Chip, IconButton, InputAdornment, TextField } from '@material-ui/core';
import { MOONSAMA_TRAITS } from 'utils/constants';
import FilterIcon from '@mui/icons-material/FilterListSharp';
import { OrderType } from 'utils/subgraph';
import { useMediaQuery } from 'beautiful-react-hooks';
import { MOBILE_BREAKPOINT } from '../../constants';
import Stack from '@mui/material/Stack';
import SearchIcon from '@mui/icons-material/SearchSharp';

export interface Filters {
  priceRange: number[];
  traits: string[];
  selectedOrderType: OrderType | undefined;
}

interface Props {
  onFiltersUpdate: (x: Filters) => void;
}

export const Filters = ({ onFiltersUpdate }: Props) => {
  const [isDrawerOpened, setIsDrawerOpened] = useState<boolean>(false);
  const [priceRange, setPriceRange] = useState<number[]>([1, 400]);
  const [selectedTraits, setSelectedTraits] = useState<string[]>([]);
  const [selectedOrderType, setSelectedOrderType] = useState<OrderType | undefined>(undefined);
  const {
    filtersDrawerContent,
    applyFiltersButton,
    filterAccordion,
    accordionHeader,
    accordionContent,
    filterChip,
    priceRangeWrapper,
    filtersTitle,
    priceInput,
  } = useStyles();

  const isMobile = useMediaQuery(
    `(max-width: ${MOBILE_BREAKPOINT}px)`
  );

  const handleApplyFilters = () => {
    onFiltersUpdate({
      selectedOrderType,
      traits: selectedTraits,
      priceRange,
    });
    setIsDrawerOpened(false);
  };

  const handlePriceRangeChange = (
    event: Event,
    newValue: number | number[]
  ) => {
    setPriceRange(newValue as number[]);
  };

  const handleOrderTypeClick = (orderType: OrderType | undefined) => {
    setSelectedOrderType(orderType)
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

  return (
    <>
      {/*<Button*/}
      {/*  onClick={() => setIsDrawerOpened(true)}*/}
      {/*  startIcon={<FilterIcon />}*/}
      {/*  variant="outlined"*/}
      {/*  color="primary"*/}
      {/*>*/}
      {/*  Filter*/}
      {/*</Button>*/}
      {/*<Drawer*/}
      {/*  anchor="left"*/}
      {/*  hideBackdrop*/}
      {/*  open={isDrawerOpened}*/}
      {/*  onClose={() => setIsDrawerOpened(false)}*/}
      {/*  onOpen={() => setIsDrawerOpened(true)}*/}
      {/*>*/}
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
                    className={`${filterChip} ${selectedOrderType == OrderType.BUY && 'selected'}`} />
                  <Chip
                    label="Active sell order"
                    variant="outlined"
                    onClick={() => handleOrderTypeClick(OrderType.SELL)}
                    className={`${filterChip} ${selectedOrderType == OrderType.SELL && 'selected'}`} />
                  <Chip
                    label="None"
                    variant="outlined"
                    onClick={() => handleOrderTypeClick(undefined)}
                    className={`${filterChip} ${selectedOrderType == undefined && 'selected'}`} />
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
                  />
                  <div>TO</div>
                  <TextField
                    className={priceInput}
                    placeholder="Max"
                    variant="outlined"
                  />
                </Stack>
                {/*<Slider*/}
                {/*  getAriaLabel={() => 'Price range'}*/}
                {/*  value={priceRange}*/}
                {/*  onChange={handlePriceRangeChange}*/}
                {/*  valueLabelDisplay="auto"*/}
                {/*  min={0}*/}
                {/*  max={400}*/}
                {/*  sx={{*/}
                {/*    "& .MuiSlider-thumb":{*/}
                {/*      color: "#710021",*/}
                {/*    },*/}
                {/*    "& .MuiSlider-track": {*/}
                {/*      color: '#710021'*/}
                {/*    },*/}
                {/*    "& .MuiSlider-rail": {*/}
                {/*      color: '#c5c5c5'*/}
                {/*    }*/}
                {/*  }}*/}
                {/*/>*/}
                {/*<div className={priceRangeWrapper}>*/}
                {/*  <div>{`${priceRange[0]} MOVR`}</div>*/}
                {/*  <div>{`${priceRange[1]} MOVR`}</div>*/}
                {/*</div>*/}
              </AccordionDetails>
            </Accordion>
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
                  {Object.keys(MOONSAMA_TRAITS).map((trait) => (
                    <Chip
                      label={trait}
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
            <Button
              className={applyFiltersButton}
              onClick={handleApplyFilters}
              variant="contained"
              color="primary"
            >
              Apply Filters
            </Button>
          </div>
        </div>
      {/*</Drawer>*/}
    </>
  );
};
