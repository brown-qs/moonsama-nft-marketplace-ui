
import { useCallback, useMemo } from 'react';
import MoonsamaAttrMap from '../../assets/data/moonsamaAttrMap.json';


export const useMoonsamaAttrIdsCallback = () => {
    const amap: {[key: string]: number[]} = useMemo(() => {
        return MoonsamaAttrMap
    }, [])

    const cb = useCallback((attributes: string[]) => {
        const attrIds = attributes.map(x => amap[x])
        const set = new Set(([] as number[]).concat(...attrIds))

        return Array.from(set).sort()
    }, [amap])

    return cb
};
