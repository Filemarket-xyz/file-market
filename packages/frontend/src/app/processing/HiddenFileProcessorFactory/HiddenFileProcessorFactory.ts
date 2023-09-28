import { getAddress } from 'viem'

import { type FileMarketCrypto } from '../../../../../crypto/src'
import { blockchainDataProvider, type IBlockchainDataProvider } from '../BlockchainDataProvider'
import { fileMarketCrypto } from '../FileMarketCrypto'
import { HiddenFileBuyer } from '../HiddenFileBuyer'
import { HiddenFileOwner } from '../HiddenFileOwner'
import { type ISeedProviderFactory, seedProviderFactory } from '../SeedProviderFactory'
import { hexToBuffer } from '../utils'
import { type IHiddenFileProcessorFactory } from './IHiddenFileProcessorFactory'

export class HiddenFileProcessorFactory implements IHiddenFileProcessorFactory {
  private readonly owners: Record<string, Record<string, HiddenFileOwner>> = Object.create(null)
  private readonly buyers: Record<string, Record<string, HiddenFileBuyer>> = Object.create(null)
  private readonly filesCache = new WeakMap<[ArrayBuffer, number], File>()

  #globalSalt?: ArrayBuffer

  constructor(
    private readonly seedProviderFactory: ISeedProviderFactory,
    private readonly crypto: FileMarketCrypto,
    private readonly blockchainDataProvider: IBlockchainDataProvider,
  ) {}

  #tokenFullIdKey(collectionAddress: string, tokenId: number) {
    return `${collectionAddress}/${tokenId}`
  }

  async getBuyer(account: string, collectionAddress: string, tokenId: number): Promise<HiddenFileBuyer> {
    account = getAddress(account)
    const key = this.#tokenFullIdKey(collectionAddress, tokenId)

    const accountBuyers = this.buyers[account]
    const existing = accountBuyers?.[key]
    if (existing) return existing

    if (!this.#globalSalt) {
      this.#globalSalt = await this.blockchainDataProvider.getGlobalSalt()
    }

    const seedProvider = await this.seedProviderFactory.getSeedProvider(account)
    const buyer = new HiddenFileBuyer(
      this.crypto,
      this.blockchainDataProvider,
      seedProvider,
      this.#globalSalt,
      hexToBuffer(collectionAddress),
      tokenId,
    )
    this.buyers[account] = {
      ...accountBuyers,
      [key]: buyer,
    }

    return buyer
  }

  async getOwner(account: string, collectionAddress: string, tokenId: number): Promise<HiddenFileOwner> {
    account = getAddress(account)
    const key = this.#tokenFullIdKey(collectionAddress, tokenId)

    const accountOwners = this.owners[account]
    const existing = accountOwners?.[key]
    if (existing) return existing

    if (!this.#globalSalt) {
      this.#globalSalt = await this.blockchainDataProvider.getGlobalSalt()
    }

    const seedProvider = await this.seedProviderFactory.getSeedProvider(account)
    const owner = new HiddenFileOwner(
      account,
      this.crypto,
      this.blockchainDataProvider,
      seedProvider,
      this.#globalSalt,
      hexToBuffer(collectionAddress),
      tokenId,
      this.filesCache,
    )
    this.owners[account] = {
      ...accountOwners,
      [key]: owner,
    }

    return owner
  }
}

/**
 * Exists as singleton
 */
export const hiddenFileProcessorFactory = new HiddenFileProcessorFactory(
  seedProviderFactory,
  fileMarketCrypto,
  blockchainDataProvider,
)
