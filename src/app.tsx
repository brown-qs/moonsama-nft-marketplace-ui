import { AppProviders } from 'providers/AppProvider';
import { AccountDialog, PurchaseDialog, BidDialog } from 'components';
import { Routing } from 'pages';
import { CancelDialog } from 'components/CancelDialog/CancelDialog';
import { TransferDialog } from 'components/TransferDiaog/TransferDialog';

function MyApp() {
  return (
    <AppProviders>
      <AccountDialog />
       <Routing />
    </AppProviders>
  );
}

export default MyApp;
