import { Button } from 'ui';
import { HeaderBalance } from 'components/HeaderBalance/HeaderBalance';
import { UnsupportedChainIdError } from '@web3-react/core';
import { useAccountDialog, useActiveWeb3React, useClasses } from 'hooks';
import { truncateAddress } from 'utils';
import Identicon from 'components/Identicon/Identicon';
import { Activity } from 'react-feather';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWalletSharp';
import { styles } from './Account.styles';

export const Account = () => {
  const { account, error } = useActiveWeb3React();
  const { setAccountDialogOpen } = useAccountDialog();
  const theme = useTheme()
  const hideAddress = useMediaQuery(theme.breakpoints.down('sm'));

  const showError = error ? true : false;
  const errMessage =
    error instanceof UnsupportedChainIdError ? 'Wrong Network' : 'Error';

  const { button } = useClasses(styles);

  return (
      <Button
        className={button}
        size="medium"
        onClick={() => setAccountDialogOpen(true)}
      > 
        {account && <HeaderBalance />}

        {showError ? (
          <Activity />
        ) : account ? (
          !hideAddress && (
            <div style={{ fontSize: 0, margin: '0 8px' }}>
              <Identicon />
            </div>
          )
        ) : (
          <div style={{ fontSize: 0, margin: '0 8px 0 0' }}>
            <AccountBalanceWalletIcon />
          </div>
        )}
        {showError ? (
          errMessage
        ) : account ? (
          hideAddress ? (
            <Identicon />
          ) : (
            truncateAddress(account)
          )
        ) : (
          'Connect'
        )}
      </Button>
  );
};
