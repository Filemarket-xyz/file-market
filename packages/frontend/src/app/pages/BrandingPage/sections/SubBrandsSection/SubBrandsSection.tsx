import { useState } from 'react'

import { styled } from '../../../../../styles'
import Switch from '../../../../components/Switch/Switch'
import DownloadAsset from '../../blocks/DownloadAsset/DownloadAsset'
import DownloadButton from '../../blocks/DownloadButton/DownloadButton'
import { PNG_SUB_BRANDS, SVG_SUB_BRANDS } from './assets'

type AssetType = 'color' | 'dark' | 'light'
type PreviewStyle = 'light' | 'dark'

const SwitchWrapper = styled('div', {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '$4',
  '.downloadAllButton': {
    '@md': {
      display: 'none',
    },
  },
})

const AssetsWrapper = styled('div', {
  display: 'flex',
  flexDirection: 'column',
  rowGap: '32px',
  '@md': {
    rowGap: '28px',
  },
  '@sm': {
    rowGap: '24px',
  },
  '.downloadAllMobileButton': {
    display: 'none',
    '@md': {
      display: 'flex',
    },
  },
})

export default function SubBrandsSection () {
  const [currentAssets, setCurrentAssets] = useState<AssetType>('color')
  const [previewStyle, setPreviewStyle] = useState<PreviewStyle>('light')

  const options = [
    { label: 'Colored', value: 'color', previewStyle: 'light' },
    { label: 'Dark', value: 'dark', previewStyle: 'light' },
    { label: 'Light', value: 'light', previewStyle: 'dark' },
  ]

  const handleAssetsChange = (asset: string) => {
    setCurrentAssets(asset as AssetType)
    setPreviewStyle(
      options.find((option) => option.value === asset)?.previewStyle as PreviewStyle,
    )
  }

  return (
    <>
      <SwitchWrapper>
        <Switch options={options} onChange={handleAssetsChange} />
        <DownloadButton class={'downloadAllButton'} downloadHref="sub-brands-logos.zip" bigBtn>full zip</DownloadButton>
      </SwitchWrapper>
      <AssetsWrapper>
        <DownloadAsset
          pngAsset={PNG_SUB_BRANDS.eft[currentAssets]}
          svgAsset={SVG_SUB_BRANDS.eft[currentAssets]}
          title='EFT logotype'
          previewStyle={previewStyle}
        />
        <DownloadAsset
          pngAsset={PNG_SUB_BRANDS.fileWalletLogotype[currentAssets]}
          svgAsset={SVG_SUB_BRANDS.fileWalletLogotype[currentAssets]}
          title='FileWallet logotype'
          previewStyle={previewStyle}
        />
        <DownloadAsset
          pngAsset={PNG_SUB_BRANDS.fileWalletLogomark[currentAssets]}
          svgAsset={SVG_SUB_BRANDS.fileWalletLogomark[currentAssets]}
          title='FileWallet logomark'
          previewStyle={previewStyle}
        />
        <DownloadAsset
          pngAsset={PNG_SUB_BRANDS.fileBunniesLogotype[currentAssets]}
          svgAsset={SVG_SUB_BRANDS.fileBunniesLogotype[currentAssets]}
          title='FileBunnies logotype'
          previewStyle={previewStyle}
        />
        <DownloadAsset
          pngAsset={PNG_SUB_BRANDS.fileBunniesLogomark[currentAssets]}
          svgAsset={SVG_SUB_BRANDS.fileBunniesLogomark[currentAssets]}
          title='FileBunnies logomark'
          previewStyle={previewStyle}
        />
        <DownloadButton downloadHref="sub-brands-logos.zip" class={'downloadAllMobileButton'}>full zip</DownloadButton>
      </AssetsWrapper>
    </>
  )
}
