import React from 'react'
import { type Chain } from 'wagmi'

import { type HiddenFileMetaData } from '../../../../swagger/Api'
import { type TokenFullId } from '../../../processing/types'
import { NftCardBase, NftCardUserInfo, PriceBadge } from '../../../UIkit'
import { FileType } from '../FileType'
import { StyledTxtName, StyledTxtValue } from './TransferCard.styles'

export interface TransferCardProps {
  imageURL: string
  title: string
  collectionName: string
  hiddenFileMeta?: HiddenFileMetaData
  categories?: string
  likesCount?: number
  tokenFullId: TokenFullId
  user: {
    img: string
    address: string
  }
  button: {
    link: string
    text: string
  }
  price?: string
  status: string
  chain?: Chain
  chainImg?: string
  onFlameSuccess: () => void
}

export const TransferCard: React.FC<TransferCardProps> = ({
  imageURL,
  title,
  collectionName,
  onFlameSuccess,
  categories,
  tokenFullId,
  hiddenFileMeta,
  user,
  price,
  likesCount,
  status,
  button,
  chain,
  chainImg,
}) => {
  return (
    <NftCardBase
      to={button.link}
      imgSrc={imageURL}
      title={title}
      likesCount={likesCount}
      tokenFullId={tokenFullId}
      collectionName={collectionName}
      fileType={<FileType categories={categories} hiddenFileMeta={hiddenFileMeta} />}
      button={{ to: button.link, text: button.text }}
      chain={chain}
      chainImg={chainImg}
      onFlameSuccess={onFlameSuccess}
    >
      <NftCardUserInfo img={user.img} address={user.address} />
      <PriceBadge
        left={<StyledTxtName primary2>{status}</StyledTxtName>}
        right={price && <StyledTxtValue primary2>{price}</StyledTxtValue>}
      />
    </NftCardBase>
  )
}
