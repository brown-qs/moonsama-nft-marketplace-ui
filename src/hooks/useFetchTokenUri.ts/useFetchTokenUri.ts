import { useCallback, useEffect, useState } from 'react';
import { useFetchUrlCallback } from 'hooks/useFetchUrlCallback/useFetchUrlCallback';
import uriToHttp from 'utils/uriToHttp';
import { TokenMeta } from './useFetchTokenUri.types';

// returns a variable indicating the state of the approval and a function which approves if necessary or early returns
export function useFetchTokenUri(
  uris: ({ tokenURI?: string } | undefined)[] | undefined
): (TokenMeta | undefined)[] {
  const [metas, setMetas] = useState<(TokenMeta | undefined)[]>([]);

  const cb = useFetchUrlCallback();

  const fetchMetas = useCallback(async () => {
    if (!uris) {
      setMetas([]);
      return;
    }

    const promises = uris.map(async (uri) => {
      const rawmeta = await cb<TokenMeta>(uri?.tokenURI, false);

      let meta;
      if (typeof rawmeta === 'string' || rawmeta instanceof String) {
        meta = JSON.parse(rawmeta as string);
      } else {
        meta = rawmeta;
      }

      if (meta) {
        meta.external_url = meta.external_url
          ? uriToHttp(meta.external_url, false)?.[0]
          : undefined;
        meta.image = meta.image ? uriToHttp(meta.image, false)?.[0] : undefined;
        meta.animation_url = meta.animation_url
          ? uriToHttp(meta.animation_url, false)?.[0]
          : undefined;
        meta.youtube_url = meta.youtube_url
          ? uriToHttp(meta.youtube_url, false)?.[0]
          : undefined;
      }
      return meta;
    });

    const metas = await Promise.all(promises);

    setMetas(metas);
  }, [uris, cb]);

  useEffect(() => {
    if (uris) {
      fetchMetas();
    }
  }, [uris]);

  return metas;
}
