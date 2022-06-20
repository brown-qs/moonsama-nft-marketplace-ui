import { useCallback, useMemo } from 'react';
import PondsamaAttrMap from '../../assets/data/pondsamaAttrMap.json';

export const usePondsamaAttrIds = (attributes?: string[]) => {
  const amap: { [key: string]: number[] } = useMemo(() => {
    return PondsamaAttrMap;
  }, []);

  return useMemo(() => {
    const attrIds = (attributes ?? [])
      .map((x) => amap[x])
      .reduce((previousValue: number[], currentValue: number[]) => {
        if (!previousValue || previousValue.length == 0) {
          return currentValue;
        }
        return currentValue.filter((x) => previousValue.includes(x));
      }, []);
    const sorted = attrIds.sort((a, b) => a - b);
    console.log("usePondsamaAttrIds", { attrIds, sorted, attributes });
    return sorted;
  }, [amap, JSON.stringify(attributes)]);
};

export const usePondsamaAttrIdsCallback = () => {
  const amap: { [key: string]: number[] } = useMemo(() => {
    return PondsamaAttrMap;
  }, []);

  const cb = useCallback(
    (attributes: string[]) => {
      const attrIds = (attributes ?? [])
        .map((x) => amap[x])
        .reduce((previousValue: number[], currentValue: number[]) => {
          if (!previousValue || previousValue.length == 0) {
            return currentValue;
          }
          return currentValue.filter((x) => previousValue.includes(x));
        }, []);
      const sorted = attrIds.sort((a, b) => a - b);
      console.log("usePondsamaAttrIdsCallback",{ attrIds, sorted, attributes });
      return sorted;
    },
    [amap]
  );

  return cb;
};
