import { useEffect } from 'react';
import { useParams, useHistory } from 'react-router-dom';

import { checkType } from 'services/token/tokenService';

const Search = () => {
  const { address } = useParams<{ address: string }>();
  const { push } = useHistory();
  useEffect(() => {
    const checkTypeOfToken = async () => {
      const type = await checkType(address);
      if (type === 'collection') {
        return push(`/collection/${address}/0/3//`);
      }
      if (type === 'nft') {
        return push(`/token/${address}`);
      }
    };
    checkTypeOfToken();
  }, []);

  return null;
};

export default Search;
