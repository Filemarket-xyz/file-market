import React from 'react';
import {styled} from "../../../../../styles";
import {useParams} from "react-router-dom";
import {Params} from "../../../../utils/router/Params";
import {useTokenStore} from "../../../../hooks/useTokenStore";
import {Link, textVariant} from "../../../../UIkit";
import { GridBlock } from '../../helper/styles/style';

const NftName = styled('h1', {
    ...textVariant('h3').true,
    fontWeight: '600',
    color: '$gray800',
    marginBottom: '$2'
})

export const NftLicence = styled('h5', {})

const BaseInfoSection = () => {
    const { collectionAddress, tokenId } = useParams<Params>()
    const { data: token } = useTokenStore(collectionAddress, tokenId)
    return (
        <GridBlock>
            <NftName>{token?.name}</NftName>
            {token?.date && <Link href={token?.mintSrc ?? 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'} target="_blank">Minted on {new Date(token?.date).toDateString().substring(4)}</Link>}
            {token?.license && <NftLicence>License: <Link href={token?.licenseUrl ?? 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'} target="_blank">{token?.license}</Link></NftLicence>}
        </GridBlock>
    );
};

export default BaseInfoSection;