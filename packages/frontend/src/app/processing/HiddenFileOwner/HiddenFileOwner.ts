import { utils } from 'ethers'

import { FileMarketCrypto } from '../../../../../crypto/src'
import { RsaPublicKey } from '../../../../../crypto/src/lib/types'
import { IBlockchainDataProvider } from '../BlockchainDataProvider'
import { ISeedProvider } from '../SeedProvider'
import { DecryptResult, FileMeta, PersistentDerivationArgs } from '../types'
import { assertSeed, hexToBuffer } from '../utils'
import { IHiddenFileOwner } from './IHiddenFileOwner'

export class HiddenFileOwner implements IHiddenFileOwner {
  #persistentArgs: PersistentDerivationArgs
  #tokenFullIdArgs: [ArrayBuffer, number]
  #isFirefox: boolean

  constructor(
    public readonly address: string,
    public readonly crypto: FileMarketCrypto,
    public readonly blockchainDataProvider: IBlockchainDataProvider,
    public readonly seedProvider: ISeedProvider,
    public readonly globalSalt: ArrayBuffer,
    public readonly collectionAddress: ArrayBuffer,
    public readonly tokenId: number,
    public readonly filesCache: WeakMap<[ArrayBuffer, number], File>,
  ) {
    this.#tokenFullIdArgs = [this.collectionAddress, this.tokenId]
    this.#persistentArgs = [this.globalSalt, ...this.#tokenFullIdArgs]
    this.#isFirefox = navigator.userAgent.includes('Firefox')
  }

  async #getFilePassword(): Promise<ArrayBuffer> {
    assertSeed(this.seedProvider.seed)

    const creator = await this.blockchainDataProvider.getTokenCreator(...this.#tokenFullIdArgs)

    if (this.address === utils.getAddress(creator)) {
      const aesKeyAndIv = await this.crypto.eftAesDerivation(this.seedProvider.seed, ...this.#persistentArgs)

      return aesKeyAndIv.key
    }

    const {
      encryptedPassword,
      dealNumber,
    } = await this.blockchainDataProvider.getLastTransferInfo(...this.#tokenFullIdArgs)

    const { priv } = await this.crypto.eftRsaDerivation(
      this.seedProvider.seed,
      ...this.#persistentArgs,
      dealNumber,
      { disableWorker: this.#isFirefox },
    )

    return this.crypto.rsaDecrypt(hexToBuffer(encryptedPassword), priv)
  }

  async decryptFile(encryptedFile: ArrayBuffer, meta: FileMeta | undefined): Promise<DecryptResult<File>> {
    let result = this.filesCache.get(this.#tokenFullIdArgs)
    if (result) return { ok: true, result }

    try {
      const password = await this.#getFilePassword()
      const decryptedFile = await this.crypto.aesDecrypt(encryptedFile, password)

      result = new File([decryptedFile], meta?.name || 'hidden_file', { type: meta?.type })
      this.filesCache.set(this.#tokenFullIdArgs, result)

      return { ok: true, result }
    } catch (error) {
      return {
        ok: false,
        error: `Decrypt failed: ${error}`,
      }
    }
  }

  async encryptFile(file: File): Promise<Blob> {
    assertSeed(this.seedProvider.seed)

    const arrayBuffer = await file.arrayBuffer()
    const aesKeyAndIv = await this.crypto.eftAesDerivation(this.seedProvider.seed, ...this.#persistentArgs)
    const encrypted = await this.crypto.aesEncrypt(arrayBuffer, aesKeyAndIv)

    return new Blob([encrypted])
  }

  async encryptFilePassword(publicKey: RsaPublicKey): Promise<ArrayBuffer> {
    const password = await this.#getFilePassword()
    const encryptedPassword = await this.crypto.rsaEncrypt(password, publicKey)

    return encryptedPassword
  }
}
