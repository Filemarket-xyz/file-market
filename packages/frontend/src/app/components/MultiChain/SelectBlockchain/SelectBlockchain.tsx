import { observer } from 'mobx-react-lite'
import React, { ReactNode, useMemo } from 'react'

import { styled } from '../../../../styles'
import { useMultiChainStore } from '../../../hooks/useMultiChainStore'
import { PageLayout, textVariant, Txt } from '../../../UIkit'
import {
  selectBlockchainDescription,
  selectBlockchainTitle,
  selectBlockchainType,
} from '../helper/data/SelectBlockchainData'
import SelectBlockchainBlock from './SelectBlockchainBlock/SelectBlockchainBlock'

const SelectBlockchainContainer = styled('div', {
  width: 'max-content',
  display: 'flex',
  gap: '16px',
  color: '#2F3134',
  '@md': {
    flexWrap: 'wrap',
    width: '100%',
  },
})

const SelectBlockchainStyle = styled(PageLayout, {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
})

const SelectBlockchainContent = styled('div', {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '48px',
})

const TextBlock = styled('div', {
  display: 'flex',
  flexDirection: 'column',
  gap: '24px',
  width: '728px',
  '@md': {
    width: '100%',
  },
})

const TitleStyled = styled(Txt, {
  width: '514px',
  ...textVariant('fourfold1').true,
  '@md': {
    width: '100%',
  },
  '@sm': {
    fontSize: '32px',
  },
})

const DescriptionStyled = styled(Txt, {
  width: '640px',
  ...textVariant('body2').true,
  '@md': {
    width: '100%',
  },
  '@sm': {
    fontSize: '16px',
  },
})

interface ISelectBlockchain {
  type?: selectBlockchainType
  title?: ReactNode
  description?: ReactNode
  onChange?: (chainId: number) => void
}

const SelectBlockchain = observer(({ type, title: titleProps, description: descriptionProps, onChange }: ISelectBlockchain) => {
  const multiChainStore = useMultiChainStore()
  const title = useMemo(() => {
    if (!type) return titleProps

    return titleProps ?? selectBlockchainTitle[type]
  }, [type, titleProps])

  const description = useMemo(() => {
    if (!type) return descriptionProps

    return descriptionProps ?? selectBlockchainDescription[type]
  }, [type, descriptionProps])

  return (
    <SelectBlockchainStyle>
      <SelectBlockchainContent>
        <TextBlock>
          <TitleStyled>{title}</TitleStyled>
          <DescriptionStyled>{description}</DescriptionStyled>
          <SelectBlockchainContainer>
            {multiChainStore.data?.map(item => {
              return (
                <SelectBlockchainBlock
                  key={item.chain.id.toString()}
                  name={item.chain.name}
                  img={item.img}
                  onClick={() => { onChange?.(item.chain.id) }}
                />
              )
            })}
          </SelectBlockchainContainer>
        </TextBlock>
      </SelectBlockchainContent>
    </SelectBlockchainStyle>
  )
})

export default SelectBlockchain