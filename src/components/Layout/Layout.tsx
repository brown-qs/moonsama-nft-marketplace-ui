import { useCallback, useState } from 'react';
import Container from '@material-ui/core/Container';
import Grid from '@material-ui/core/Grid';
import Box from '@material-ui/core/Box';
import { useMediaQuery } from 'beautiful-react-hooks'
import MenuIcon from '@mui/icons-material/Menu';
import IconButton from '@material-ui/core/IconButton';


import { Header, NavLink, Drawer, Footer } from 'ui';

import { LayoutProps } from './Layout.types';
import { useStyles } from './Layout.styles';

import WhiteLogo from 'assets/images/logo-white.svg';
import { Account } from 'components';

import { MAX_WIDTH_TO_SHOW_NAVIGATION } from '../../constants';

export const Layout = ({ children }: LayoutProps) => {
  const { logo, nav, navItem, buttonContainer, navItemDrawer } = useStyles();
  const showRegularMenu = useMediaQuery(
    `(max-width: ${MAX_WIDTH_TO_SHOW_NAVIGATION}px)`
  );
  const [isDrawerOpened, setIsDrawerOpened] = useState<boolean>(false);

  return (
    <>
      <Header>
        <Container maxWidth={false}>
          <Grid container alignItems="center" justifyContent="space-between">
            <Grid item xl={3} className={nav}>
              {showRegularMenu && <IconButton onClick={() => setIsDrawerOpened(true)}><MenuIcon /></IconButton>}
              <NavLink href="/" className={navItem}>
                <div className={logo}>
                  <img src={WhiteLogo} alt="" />
                </div>
              </NavLink>
            </Grid>
            <Grid item className={buttonContainer}>
              {!showRegularMenu ? (
                <Box style={{ display: 'flex ' }}>
                  {/*<NavLink href="/" className={navItem}>*/}
                  {/*  Welcome*/}
                  {/*</NavLink>*/}
                  <NavLink href="/collections" className={navItem}>
                    Collections
                  </NavLink>
                  <NavLink href="/freshoffers" className={navItem}>
                    Latest offers
                  </NavLink>
                  <NavLink href="/freshtrades" className={navItem}>
                    Latest trades
                  </NavLink>
                  <NavLink href="/myoffers" className={navItem}>
                    My offers
                  </NavLink>
                  <NavLink href="/mycollection" className={navItem}>
                    My collection
                  </NavLink>

                  {/*<NavLink href="/explore" className={navItem}>
                  Explore
                </NavLink>*/}
                </Box>
              ) : (
                <Drawer
                  open={isDrawerOpened}
                  onClose={() => setIsDrawerOpened(false)}
                  onOpen={() => setIsDrawerOpened(true)}
                >
                  <Box>
                    <NavLink href="/" className={navItemDrawer}>
                      Welcome
                    </NavLink>
                    <NavLink href="/collections" className={navItem}>
                      Collections
                    </NavLink>
                    <NavLink href="/freshoffers" className={navItemDrawer}>
                      Latest offers
                    </NavLink>
                    <NavLink href="/freshtrades" className={navItemDrawer}>
                      Latest trades
                    </NavLink>
                    <NavLink href="/myoffers" className={navItemDrawer}>
                      My offers
                    </NavLink>
                    <NavLink href="/mycollection" className={navItemDrawer}>
                      My collection
                    </NavLink>
                  </Box>
                </Drawer>
              )}

              <Account />
            </Grid>
          </Grid>
        </Container>
      </Header>
      <Container maxWidth="lg">{children}</Container>
      <Footer />
    </>
  );
};

