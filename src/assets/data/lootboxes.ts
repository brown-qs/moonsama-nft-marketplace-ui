import { StringAssetType } from "../../utils/subgraph";
import box1Video from '../../assets/samabox/1.mp4';
import box2Video from '../../assets/samabox/2.mp4';
import box1imageUnopened from '../../assets/samabox/1.jpg';
import box2imageUnopened from '../../assets/samabox/2.jpg';

export type LootboxDataType = {
    blueprintId: string,
    lootboxId: string,
    name: string,
    blueprintOutput: {
        assetAddress: string,
        assetId: string,
        assetType: StringAssetType,
        id: string
    },
    notEnoughText: string,
    notEnoughLink: string,
    noMoreText: string,
    noMoreLink: string,
    conditionsText: string
    craftText: string,
    burnText: string,
    openText: string,
    openDialogText: string,
    video: string,
    imageUnopened: string
}

export const LOOTBOXES: LootboxDataType[] = [
    {
        blueprintId: '2',
        lootboxId: '0xd335417999ff2b9b59737244e554370264b3f877-1-1',
        name: 'S1 Sama Box',
        blueprintOutput: {
            assetAddress: '0xd335417999ff2b9b59737244e554370264b3f877'.toLowerCase(),
            assetId: '1',
            assetType: StringAssetType.ERC1155,
            id: '-'
        },
        notEnoughText: 'Not enough resources',
        notEnoughLink: '/collection/ERC1155/0x1b30a3b5744e733d8d2f19f0812e3f79152a8777/0',
        noMoreText: `No more boxes left to craft`,
        noMoreLink: '/token/ERC1155/0xd335417999ff2b9b59737244e554370264b3f877/1',
        conditionsText: 'The Moonsama Council requires the presentation of a resource sacrifice',
        craftText: 'Craft one',
        burnText: '"Push to open"',
        openText: 'The lid is loose',
        openDialogText: 'Click to open',
        video: box1Video,
        imageUnopened: box1imageUnopened
    },
    {
        blueprintId: '3',
        lootboxId: '0xd335417999ff2b9b59737244e554370264b3f877-2-1',
        name: 'S1 Reward Box',
        blueprintOutput: {
            assetAddress: '0xd335417999ff2b9b59737244e554370264b3f877'.toLowerCase(),
            assetId: '2',
            assetType: StringAssetType.ERC1155,
            id: '-'
        },
        notEnoughText: `You need a fitting key`,
        notEnoughLink: '/token/ERC1155/0x1b30a3b5744e733d8d2f19f0812e3f79152a8777/11',
        noMoreText: `No more boxes left to craft`,
        noMoreLink: '/token/ERC1155/0xd335417999ff2b9b59737244e554370264b3f877/2',
        conditionsText: 'Box is granted to whomever presents a fitting key',
        craftText: 'See if your key matches',
        burnText: 'Turn the key',
        openText: 'The lid is loose',
        openDialogText: 'Click to open',
        video: box2Video,
        imageUnopened: box2imageUnopened
    }
]
