import { MetaAttributes } from '../hooks/useFetchTokenUri.ts/useFetchTokenUri.types';

export const getMinecraftSkinUrl = (attributes?: MetaAttributes[]) => {
  const attr = attributes?.find(
    (x) => x.trait === 'Minecraft Skin External URL'
  );
  return attr?.value as string;
};

export const getAttributesList = (attributes?: MetaAttributes[]) => {
  const chipLabels = attributes?.map(
    (x) => `${x.trait}: ${x.value}${x.display?.startsWith('range') ? `/${x.display.split('_')[2]}` : ''}`
  );
  return chipLabels
};
