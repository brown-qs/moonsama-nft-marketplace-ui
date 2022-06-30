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
  let isPondsamaCollection =
    address == '0xe4edcaaea73684b310fc206405ee80abcec73ee0'.toLowerCase();

  let isMoonsamaCollection =
    address == '0xb654611F84A8dc429BA3cb4FDA9Fad236C505a1a'.toLowerCase();

  return (
    <>
      <div>
        {isPondsamaCollection && <PondsamaCollectionPage />}
        {isMoonsamaCollection && <MoonsamaCollectionPage />}
        {!isPondsamaCollection && !isMoonsamaCollection && (
          <CollectionDefaultPage />
        )}
      </div>
    </>
  );
};

export default CollectionPage;
