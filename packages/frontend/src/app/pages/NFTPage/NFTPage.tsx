import { useMediaQuery } from '@mui/material'
import { observer } from 'mobx-react-lite'
import React, { useMemo } from 'react'
import { useParams } from 'react-router-dom'

import { styled } from '../../../styles'
import { useHiddenFileDownload } from '../../hooks/useHiddenFilesDownload'
import { useTokenMetaStore } from '../../hooks/useTokenMetaStore'
import { useTokenStore } from '../../hooks/useTokenStore'
import { useTransferStoreWatchEvents } from '../../hooks/useTransferStoreWatchEvents'
import { useIsBuyer, useIsOwner } from '../../processing'
import { makeTokenFullId } from '../../processing/utils/id'
import { PageLayout } from '../../UIkit'
import { getHttpLinkFromIpfsString } from '../../utils/nfts/getHttpLinkFromIpfsString'
import { Params } from '../../utils/router/Params'
import { transferPermissions } from '../../utils/transfer/status'
import { PreviewNFTFlow } from './components/PreviewNFTFlow'
import { GridBlock } from './helper/styles/style'
import BaseInfoSection from './section/BaseInfo/BaseInfoSection'
import ControlSection from './section/Contol/ControlSection'
import DescriptionSection from './section/Description/DescriptionSection'
import FileInfoSection from './section/FileInfo/FileInfoSection'
import HomeLandSection from './section/HomeLand/HomeLandSection'
import TagsSection from './section/Tags/TagsSection'

const NFTPreviewContainer = styled('div', {
  width: '100%',
  height: 555,
  background: '$gradients$background',
  boxSizing: 'content-box',
  '& .blur': {
    width: '100%',
    height: '100%',
    mixBlendMode: 'normal',
    backdropFilter: 'blur(150px)',
    paddingTop: 'calc($layout$navBarHeight)',
    paddingBottom: '$6'
  },
  zIndex: '1',
  position: 'relative',
  '@sm': {
    height: 390
  }
})

const MainInfo = styled(PageLayout, {
  marginTop: '150px',
  marginBottom: '-80px',
  paddingTB: 48,
  fontSize: '16px',
  gridTemplateColumns: '3fr 1fr',
  columnGap: '$4',
  minHeight: '100%',
  height: '100%',
  borderRadius: '$6 $6 0 0',
  top: '-$6',
  boxShadow: '$footer',
  zIndex: '7',
  position: 'relative',
  '@md': {
    height: 'unset',
    borderRadius: '24px 24px 0px 0px'
  }
})

const GridLayout = styled('div', {
  display: 'grid',
  gap: '3rem',
  position: 'relative',
  columnGap: '$4',
  height: '100%',
  gridTemplateColumns: '3fr 1fr',
  // eslint-disable-next-line
  gridTemplateAreas: "'GridBlock Control' 'HomeLand HomeLand' 'Tags Tags' 'Description Description'",
  '@md': {
    gridTemplateAreas: "'BaseInfo' 'Control' 'HomeLand' 'Tags' 'Description'",
    gridTemplateColumns: 'unset'
  }
})

const GridBlockSection = styled(GridBlock, {
  display: 'flex',
  flexDirection: 'column',
  gridArea: 'GridBlock',
  gap: '32px',
  '@md': {
    display: 'none'
  }
})

const ControlFileSection = styled('div', {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  position: 'sticky',
  top: '125px',
  '@md': {
    position: 'relative',
    top: '0'
  }
})

const NFTPage = observer(() => {
  const { collectionAddress, tokenId } = useParams<Params>()
  const transferStore = useTransferStoreWatchEvents(collectionAddress, tokenId)
  const tokenStore = useTokenStore(collectionAddress, tokenId)
  const tokenMetaStore = useTokenMetaStore(tokenStore.data?.metaUri)
  const files = useHiddenFileDownload(tokenMetaStore, tokenStore.data)
  const tokenFullId = useMemo(
    () => makeTokenFullId(collectionAddress, tokenId),
    [collectionAddress, tokenId]
  )
  const { isOwner } = useIsOwner(tokenFullId)
  const isBuyer = useIsBuyer(transferStore.data)
  const canViewHiddenFiles = isBuyer && transferPermissions.buyer.canViewHiddenFiles(
    transferStore.data
  )

  const categories: string[] = useMemo(() => {
    let categories: string[] = []
    if (tokenStore.data?.categories) categories = tokenStore.data?.categories
    if (tokenStore.data?.subcategories && tokenStore.data?.subcategories[0] !== '') categories = [...categories, ...tokenStore.data?.subcategories]

    return categories
  }, [tokenStore.data?.categories, tokenStore.data?.subcategories])

  const md = useMediaQuery('(max-width:900px)')

  return (
    <>
      <NFTPreviewContainer style={{
        backgroundImage: `url(${getHttpLinkFromIpfsString(tokenStore.data?.image ?? '')})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
      >
        <div className='blur'>
          {
            <PreviewNFTFlow
              getFile={files[0]?.getFile}
              hiddenFile={tokenStore.data?.hiddenFileMeta}
              canViewFile={isOwner || canViewHiddenFiles}
              imageURL={getHttpLinkFromIpfsString(tokenStore.data?.image ?? '')}
            />
          }
        </div>
      </NFTPreviewContainer>
      <MainInfo>
        <GridLayout>
          {!md ? (
            <GridBlockSection>
              <BaseInfoSection />
              <HomeLandSection />
              <TagsSection
                tags={tokenStore.data?.tags}
                categories={categories}
              />
              <DescriptionSection />
            </GridBlockSection>
          )
            : (
              <>
                <BaseInfoSection />
                <HomeLandSection />
                <TagsSection
                  tags={tokenStore.data?.tags}
                  categories={categories}
                />
                <DescriptionSection />
              </>
            )}
          <ControlFileSection style={{ gridArea: 'Control' }}>
            <ControlSection />
            <FileInfoSection
              isOwner={isOwner}
              canViewHiddenFiles={canViewHiddenFiles}
              files={files}
              filesMeta={tokenStore.data?.hiddenFileMeta ? [tokenStore.data?.hiddenFileMeta] : []}
            />
          </ControlFileSection>
        </GridLayout>
      </MainInfo>
    </>
  )
})

export default NFTPage
