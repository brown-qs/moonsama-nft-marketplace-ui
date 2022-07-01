import { useParams } from 'react-router-dom';
import CollectionDefaultPage from 'components/CollectionDefaultPage';
import PondsamaCollectionPage from 'components/PondsamaCollectionPage';
import MoonsamaCollectionPage from 'components/MoonsamaCollectionPage';

const CollectionPage = () => {
  const { address, type, subcollectionId } = useParams() as {
    address: string;
    type: string;
    subcollectionId: string;
  };
  let navigateCollectionPage = 0; //defaultPage
  if (address.toLowerCase() == '0xb654611F84A8dc429BA3cb4FDA9Fad236C505a1a'.toLowerCase())
    // Moonsama
    navigateCollectionPage = 1;
  else if (
    address.toLowerCase() == '0xe4edcaaea73684b310fc206405ee80abcec73ee0'.toLowerCase()
  )
    //Pondsama
    navigateCollectionPage = 2;
  return (
    <>
      <div>
        {navigateCollectionPage == 1 && <MoonsamaCollectionPage />}
        {navigateCollectionPage == 2 && <PondsamaCollectionPage />}
        {navigateCollectionPage == 0 && <CollectionDefaultPage />}
      </div>
    </>
  );
};

export default CollectionPage;
