import { ensureCall } from '../../utils/error'
import { type IStorageProvider } from '../StorageProvider'
import { type IStorageSecurityProvider } from '../StorageSecurityProvider'
import { CallbacksChangingError } from './errors'
import { type ISecureStorage } from './ISecureStorage'

const encrypt = async (provider: IStorageSecurityProvider | undefined, data: string): Promise<string> => {
  return ensureCall('StorageSecurityProvider.encrypt', provider?.encrypt, data)
}

const decrypt = async (provider: IStorageSecurityProvider | undefined, encryptedValue: string): Promise<string> => {
  return ensureCall('StorageSecurityProvider.decrypt', provider?.decrypt, encryptedValue)
}

export class SecureStorage implements ISecureStorage {
  private securityProvider?: IStorageSecurityProvider
  securityProviderChanging = false

  constructor(
    public readonly storageProvider: IStorageProvider,
  ) {
  }

  async setSecurityProvider(securityProvider: IStorageSecurityProvider): Promise<void> {
    if (this.securityProvider) {
      const ids = await this.storageProvider.ids()
      const encryptedWithNewProvider: Array<[string, string]> = Object.create(null)
      for (const id of ids) {
        const encryptedValue = await this.storageProvider.get(id)
        if (encryptedValue) {
          encryptedWithNewProvider.push([
            id,
            await encrypt(
              securityProvider,
              await decrypt(
                this.securityProvider,
                encryptedValue,
              ),
            ),
          ])
        }
      }
      for (const [id, value] of encryptedWithNewProvider) {
        await this.storageProvider.set(id, value)
      }
    }
    this.securityProvider = securityProvider
  }

  async get(id: string): Promise<string | undefined> {
    if (this.securityProviderChanging) {
      throw new CallbacksChangingError()
    }
    const encryptedValue = await this.storageProvider.get(id)
    if (!encryptedValue) {
      return undefined
    }

    return decrypt(this.securityProvider, encryptedValue)
  }

  async set(id: string, value: string | undefined): Promise<void> {
    if (this.securityProviderChanging) {
      throw new CallbacksChangingError()
    }
    const encryptedValue = value && await encrypt(this.securityProvider, value)
    await this.storageProvider.set(id, encryptedValue)
  }

  async ids(): Promise<string[]> {
    return this.storageProvider.ids()
  }
}
