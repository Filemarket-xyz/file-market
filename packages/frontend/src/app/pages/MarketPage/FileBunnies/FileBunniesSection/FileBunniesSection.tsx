import { observer } from 'mobx-react-lite'
import React, { useMemo } from 'react'
import { useAccount } from 'wagmi'

import { BaseModal } from '../../../../components'
import { useStores } from '../../../../hooks'
import { useFileBunniesMint } from '../../../../processing/filebunnies/useFileBunniesMint'
import { Link, Txt, WhitelistCard } from '../../../../UIkit'
import FileBunniesLogo from '../../img/FileBunniesLogo.svg'
import LeftBottomPl from '../../img/LeftBottomPlanet.png'
import LeftTopPl from '../../img/LeftTopPlanet.png'
import {
  FileBunniesModal,
  HowMintModalBody,
  HowMintModalTitle,
  HowWorkModalBody,
  HowWorkModalTitle,
  RarityModalBody,
  RarityModalTitle,
} from '../FileBunniesModal/FileBunniesModal'
import {
  BottomBanner,
  CardsBlock,
  FileBunniesLayout,
  FileBunniesSectionStyle,
  LeftBlock,
  LeftBlockText,
  LeftBlockTitle,
  LeftTextBlock,
  MainContent,
  Title,
  ToolTipBlock,
} from './FileBunniesSection.styles'

const FileBunniesSection = observer(() => {
  const { dialogStore } = useStores()
  const { isConnected } = useAccount()
  const { payedMint, isLoading, freeMint, whiteList, modalProps, isPayedMintSoldOut, isFreeMintSoldOut } = useFileBunniesMint()
  const rarityModalOpen = () => {
    dialogStore.openDialog({
      component: FileBunniesModal,
      props: {
        body: <RarityModalBody />,
        title: <RarityModalTitle />,
      },
    })
  }
  const howToMintModalOpen = () => {
    dialogStore.openDialog({
      component: FileBunniesModal,
      props: {
        body: <HowMintModalBody />,
        title: <HowMintModalTitle />,
      },
    })
  }
  const howToWorkModalOpen = () => {
    dialogStore.openDialog({
      component: FileBunniesModal,
      props: {
        body: <HowWorkModalBody />,
        title: <HowWorkModalTitle />,
      },
    })
  }

  const freeButtonVariant = useMemo(() => {
    if (!whiteList && isConnected) return 'notWl'
    if (isFreeMintSoldOut) return 'mintedOut'

    return 'free'
  }, [whiteList, isFreeMintSoldOut, isConnected])

  const payedButtonVariant = useMemo(() => {
    console.log(isPayedMintSoldOut)
    if (isPayedMintSoldOut) return 'soldOut'

    return 'mint'
  }, [isPayedMintSoldOut])

  return (
    <>
      <FileBunniesSectionStyle>
        <img className={'leftTopPl'} src={LeftTopPl} />
        <img className={'leftBottomPl'} src={LeftBottomPl} />
        <FileBunniesLayout>
          <Title>
            <img src={FileBunniesLogo} />
            <span style={{ marginTop: '18px' }}>
              <Link
                href={'https://filebunnies.xyz/'}
                target={'_blank'}
                rel="noreferrer"
                underlined
                fileBunniesTitle
              >
                FileBunnies
              </Link>
              <span>
                {' '}
                Minting
              </span>
            </span>
          </Title>
          <MainContent>
            <LeftBlock>
              <LeftTextBlock>
                <LeftBlockTitle>
                  The FileBunnies EFTs grants holders access to all ecosystem mints!
                </LeftBlockTitle>
                <LeftBlockText>
                  FileBunnies holders will be granted exclusive
                  access to all future NFT mints that occur
                  on the FileMarket platform. This unique
                  utility will allow the holder a White
                  List spot for all content built on FileMarket.
                </LeftBlockText>
              </LeftTextBlock>
              <ToolTipBlock first onClick={() => { rarityModalOpen() }}>
                <Txt style={{ borderBottom: '1px dashed', fontSize: '16px' }}>FileBunnies Rarities</Txt>
              </ToolTipBlock>
              <ToolTipBlock second onClick={() => { howToWorkModalOpen() }}>
                <Txt style={{ borderBottom: '1px dashed', fontSize: '16px' }}>How EFT (Encrypted FileToken) works?</Txt>
              </ToolTipBlock>
              <ToolTipBlock last onClick={() => { howToMintModalOpen() }}>
                <Txt style={{ borderBottom: '1px dashed', fontSize: '16px' }}>How to MINT FileBunnies?</Txt>
              </ToolTipBlock>
            </LeftBlock>
            <CardsBlock>
              <WhitelistCard
                variant={'whitelist'}
                rarityButtonProps={{
                  onClick: () => { rarityModalOpen() },
                }}
                buttonProps={{
                  isDisabled: isLoading || whiteList === '' || isFreeMintSoldOut,
                  onClick: () => { freeMint() },
                  variant: freeButtonVariant,
                }}
              />
              <WhitelistCard
                variant={'mint'}
                rarityButtonProps={{
                  onClick: () => { rarityModalOpen() },
                }}
                buttonProps={{
                  onClick: () => { payedMint() },
                  variant: payedButtonVariant,
                  isDisabled: isPayedMintSoldOut || isLoading,
                }}
              />
            </CardsBlock>
          </MainContent>
        </FileBunniesLayout>
        <BottomBanner />
      </FileBunniesSectionStyle>
      <BaseModal {...modalProps} />
    </>
  )
})
export default FileBunniesSection
