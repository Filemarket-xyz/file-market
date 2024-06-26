import * as passworder from '@metamask/browser-passworder'
import { entropyToMnemonic } from 'bip39'
import { getAddress } from 'viem'

import { fileMarketCrypto } from '../FileMarketCrypto'
import { type IStorageProvider } from '../StorageProvider'
import { type ISeedProvider } from './ISeedProvider'

const seedStorageKey = 'seed'
const hashSeedStorageKey = 'hashSeed'

export class SeedProvider implements ISeedProvider {
  seed: ArrayBuffer | undefined
  hashSeed: string | undefined
  private seedEncrypted: string | undefined

  private onChangeListeners: Array<(seed: ArrayBuffer | undefined) => void> = []
  private onInitListeners: Array<() => void> = []

  constructor(
    private readonly storage: IStorageProvider,
    private readonly account: string,
  ) {
  }

  canUnlock(): boolean {
    return !!this.seedEncrypted
  }

  async init(): Promise<void> {
    this.seedEncrypted = await this.storage.get(seedStorageKey)
    this.hashSeed = await this.storage.get(hashSeedStorageKey)
  }

  private setSeed(seed: ArrayBuffer | undefined) {
    this.seed = seed
    this.onChangeListeners.forEach(fn => { fn(seed) })
  }

  async unlock(password: string): Promise<void> {
    if (!this.seedEncrypted) {
      throw new Error('Unable to unlock seed: no seed found')
    }
    const seed = await passworder.decrypt(password, this.seedEncrypted)
    if (!seed || typeof seed !== 'string') {
      throw new Error('Unable to unlock seed: cannot decrypt seed')
    }
    const seedBuf = Buffer.from(seed, 'hex')
    const seedBufHash = await fileMarketCrypto.sha512(seedBuf)
    await this.storage.set(hashSeedStorageKey, Buffer.from(seedBufHash).toString('hex'))
    // if (seedBuf.byteLength !== seedByteLength) {
    //   throw new Error(
    //     `Unable to unlock seed: expected seed to be ${seedByteLength} bytes, but got ${seedBuf.byteLength}`
    //   )
    // }
    this.setSeed(seedBuf)
  }

  async set(newSeed: ArrayBuffer, password: string): Promise<void> {
    const seedEncrypted = await passworder.encrypt(password, Buffer.from(newSeed).toString('hex'))
    if (!seedEncrypted) {
      throw new Error('Unable to encrypt seed')
    }
    await this.storage.set(seedStorageKey, seedEncrypted)
    const newSeedHash = await fileMarketCrypto.sha512(Buffer.from(newSeed))
    await this.storage.set(hashSeedStorageKey, Buffer.from(newSeedHash).toString('hex'))
    this.hashSeed = Buffer.from(newSeedHash).toString('hex')
    this.seedEncrypted = seedEncrypted

    this.setSeed(newSeed)
  }

  async lock(): Promise<void> {
    this.setSeed(undefined)
  }

  isForAccount(account: string) {
    return getAddress(account) === getAddress(this.account)
  }

  addOnSeedChangeListener(callback: (seed: ArrayBuffer | undefined) => void) {
    this.onChangeListeners.push(callback)
  }

  removeOnSeedChangeListener(callback: (seed: ArrayBuffer | undefined) => void) {
    this.onChangeListeners = this.onChangeListeners.filter(fn => fn !== callback)
  }

  addOnInitListener(callback: () => void) {
    this.onInitListeners.push(callback)
  }

  removeOnInitListener(callback: () => void) {
    this.onInitListeners = this.onInitListeners.filter(fn => fn !== callback)
  }

  get mnemonic(): string | undefined {
    if (this.seed) {
      return entropyToMnemonic(Buffer.from(this.seed).toString('hex'))
    }
  }
}
