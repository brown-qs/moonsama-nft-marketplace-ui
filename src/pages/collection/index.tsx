import { useParams } from 'react-router-dom';
import CollectionDefaultPage from 'components/CollectionDefaultPage';
import PondsamaCollectionPage from 'components/PondsamaCollectionPage';

const CollectionPage = () => {
  const { address, type, subcollectionId } = useParams() as {
    address: string;
    type: string;
    subcollectionId: string;
  };
  let isPondsamaCollection =
    address == '0xe4edcaaea73684b310fc206405ee80abcec73ee0'.toLowerCase();

  return (
    <>
      <div>
        {isPondsamaCollection && <PondsamaCollectionPage />}
        {!isPondsamaCollection && <CollectionDefaultPage />}
      </div>
    </>
  );
};

export default CollectionPage;
