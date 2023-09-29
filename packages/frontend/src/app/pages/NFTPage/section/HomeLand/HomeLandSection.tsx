import React, { useMemo } from 'react'
import { useParams } from 'react-router-dom'

import FileLogo from '../../../../../assets/FilemarketFileLogo.png'
import { styled } from '../../../../../styles'
import { useCollectionStore } from '../../../../hooks/useCollectionStore'
import { useTokenStore } from '../../../../hooks/useTokenStore'
import { Badge, gradientPlaceholderImg, NavLink } from '../../../../UIkit'
import { getHttpLinkFromIpfsString } from '../../../../utils/nfts/getHttpLinkFromIpfsString'
import { getProfileImageUrl } from '../../../../utils/nfts/getProfileImageUrl'
import { reduceAddress } from '../../../../utils/nfts/reduceAddress'
import { type Params } from '../../../../utils/router'
import { GridBlock } from '../../helper/styles/style'

const BadgesContainer = styled('div', {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '$2',
  '@sm': {
    flexDirection: 'column-reverse',
  },
})

const HomeLandSection = () => {
  const { collectionAddress, tokenId, chainName } = useParams<Params>()
  const { data: token } = useTokenStore(collectionAddress, tokenId)
  const { collection } = useCollectionStore(collectionAddress, chainName)

  const { collectionImgUrl, collectionName } = useMemo(() => {
    const result = {
      collectionImgUrl: gradientPlaceholderImg,
      collectionName: collection?.name ?? '',
    }
    if (collection?.image) {
      result.collectionImgUrl = getHttpLinkFromIpfsString(collection.image)
    }
    if (collection?.type === 'Public Collection') {
      result.collectionImgUrl = FileLogo
      result.collectionName = 'Public Collection'
    }

    return result
  }, [collection])

  return (
    <GridBlock style={{ gridArea: 'HomeLand' }}>
      <BadgesContainer>
        <NavLink
          lgFullWidth
          to={
            collection?.address
              ? `/collection/${chainName}/${collection?.address}`
              : location.pathname
          }
        >
          <Badge
            content={{ title: 'Collection', value: collectionName }}
            image={{
              url: collectionImgUrl,
              borderRadius: 'roundedSquare',
            }}
            wrapperProps={{
              nftPage: true,
            }}
          />
        </NavLink>
        <NavLink
          lgFullWidth
          to={collection?.creator ? `/profile/${collection?.creator}` : location.pathname}
        >
          <Badge
            image={{
              borderRadius: 'circle',
              url: getProfileImageUrl(collection?.creator ?? ''),
            }}
            content={{
              title: 'Creator',
              value: reduceAddress(collection?.creator ?? ''),
            }}
            wrapperProps={{
              nftPage: true,
            }}
          />
        </NavLink>
        <NavLink
          lgFullWidth
          to={token?.owner ? `/profile/${token?.owner}` : location.pathname}
        >
          <Badge
            image={{
              borderRadius: 'circle',
              url: getProfileImageUrl(token?.owner ?? ''),
            }}
            content={{
              title: 'Owner',
              value: reduceAddress(token?.owner ?? ''),
            }}
            wrapperProps={{
              nftPage: true,
            }}
          />
        </NavLink>
      </BadgesContainer>
    </GridBlock>
  )
}

export default HomeLandSection
