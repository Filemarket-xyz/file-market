export type checkCryptoField = 'success' | 'failed' | 'waiting'

export type checkCryptoObject = Record<string, checkCryptoField | undefined>

export interface ICheckCrypto {
  seed?: ArrayBuffer
  collectionAddress?: string
}

export interface ICheckCryptoFile extends checkCryptoObject {
  aesDerivation: checkCryptoField
  aesEncrypt: checkCryptoField
  aesDecrypt: checkCryptoField
  res: checkCryptoField
}

export interface ICheckCryptoCycle extends checkCryptoObject {
  aesDerivation: checkCryptoField
  rsaDerivation: checkCryptoField
  rsaEncrypt: checkCryptoField
  rsaDecrypt: checkCryptoField
  res: checkCryptoField
}

export interface IPlayTest {
  play?: boolean
  onTestEnd?: () => void
  iterNumber: number
}

export type ITestProps = IPlayTest & ICheckCrypto
