import React from 'react'

import { NamespaceCard, type NamespaceCardProps } from '../../../../components/MarketCard/NamespaceCard'
import namespaceImg from '../../img/namespace.jpg'
import userImg from '../../img/userImg.jpg'
import { CardsContainer } from '../Nft'

const card: NamespaceCardProps = {
  imageURL: namespaceImg,
  price: 0.77777,
  title: 'Ultra mega super VR Glasses 6353526 asjsdjsj',
  user: {
    img: userImg,
    username: 'UnderKong',
  },
}
const cards: NamespaceCardProps[] = []
for (let i = 0; i < 30; i++) {
  cards.push(card)
}

export default function NamespaceSection() {
  return (
    <CardsContainer>
      {cards.map((card, i) => (
        <NamespaceCard {...card} key={i} />
      ))}
    </CardsContainer>
  )
}
