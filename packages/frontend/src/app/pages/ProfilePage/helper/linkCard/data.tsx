import discordImg from '../../img/discord.svg'
import telegramImg from '../../img/telegram.svg'
import twitterImg from '../../img/Twitter.svg'
import urlImg from '../../img/Url.svg'
import { type typesCard } from './types'

export const imgs: Record<typesCard, string> = {
  url: urlImg,
  discord: discordImg,
  telegram: telegramImg,
  twitter: twitterImg,
}

export const baseUrls: Record<typesCard, string> = {
  url: 'https://',
  discord: '',
  telegram: 'https://t.me/',
  twitter: 'https://twitter.com/',
}
