import { useSearchParams } from 'react-router-dom';
import CollectionDefaultPage from 'components/CollectionDefaultPage';
import PondsamaCollectionPage from 'components/PondsamaCollectionPage';

const CollectionPage = () => {
  const [searchParams] = useSearchParams();
  let isPondsamaCollection =
    searchParams.get('address') ==
    '0xe4edcaaea73684b310fc206405ee80abcec73ee0'.toLowerCase();

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
