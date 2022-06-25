import { useLocation } from 'react-router-dom';
import CollectionDefaultPage from 'components/CollectionDefaultPage';
import PondsamaCollectionPage from 'components/PondsamaCollectionPage';

const CollectionPage = () => {
  const sampleLocation = useLocation();
  let path: string = sampleLocation.pathname;
  let pathSplit = path.split('/');
  let isPondsamaCollection =
    pathSplit[3] == '0xe4edcaaea73684b310fc206405ee80abcec73ee0'.toLowerCase();

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
