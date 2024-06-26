// See https://outline.customapp.tech/doc/shifrovanie-i-derivaciya-fYE6XPQHkq#h-derivaciya-klyuchej
import { rsaGenerateKeyPair } from './rsa'
import {AesKeyAndIv, EftAesDerivationFunction, EftRsaDerivationFunction, HkdfFunction, RsaKeyPair} from './types';
import {aesIVLength, aesKeyLength, aesKeyType, rsaKeyType, rsaModulusLength} from './config';
import {numberToBuffer} from './utils';
import {hkdfSha512, hkdfSha512Native} from './hkdf-sha512';
// @ts-ignore
// vite handles this and can build it
import RsaWorker from '../dedicated-wokrers/rsa.worker?worker'

export const eftAesDerivationNative = (crypto: Crypto): EftAesDerivationFunction =>
  async (seed, globalSalt, collectionAddress, tokenId) =>
    eftAesDerivationAux(hkdfSha512Native(crypto), seed, globalSalt, collectionAddress, tokenId)

export const eftAesDerivation: EftAesDerivationFunction =
  async (seed, globalSalt, collectionAddress, tokenId,) =>
    eftAesDerivationAux(hkdfSha512, seed, globalSalt, collectionAddress, tokenId)

export const eftRsaDerivationNative = (crypto: Crypto): EftRsaDerivationFunction =>
  async (seed, globalSalt, collectionAddress, tokenId, dealNumber, options) =>
    eftRsaDerivationAux(hkdfSha512Native(crypto), seed, globalSalt, collectionAddress, tokenId, dealNumber, options)

export const eftRsaDerivation: EftRsaDerivationFunction =
  async (seed, globalSalt, collectionAddress, tokenId, dealNumber) =>
    eftRsaDerivationAux(hkdfSha512, seed, globalSalt, collectionAddress, tokenId, dealNumber)

const eftAesDerivationAux = async (
  hkdf: HkdfFunction, seed: ArrayBuffer, globalSalt: ArrayBuffer, collectionAddress: ArrayBuffer, tokenId: number
): Promise<AesKeyAndIv> => {
  const OKM = await hkdf(
    globalSalt,
    seed,
    Buffer.concat([
      aesKeyType,
      Buffer.from(collectionAddress),
      numberToBuffer(tokenId)]),
    aesKeyLength + aesIVLength
  )
  return {
    key: OKM.slice(0, aesKeyLength / 8),
    iv: OKM.slice(aesKeyLength / 8, (aesKeyLength + aesIVLength) / 8)
  }
}

const eftRsaDerivationAux = async (
  hkdf: HkdfFunction,
  seed: ArrayBuffer,
  globalSalt: ArrayBuffer,
  collectionAddress: ArrayBuffer,
  tokenId: number,
  dealNumber: number,
  options?: { disableWorker: boolean }
): Promise<RsaKeyPair> => {
  const OKM = await hkdf(
    globalSalt,
    seed,
    Buffer.concat([
      rsaKeyType,
      Buffer.from(collectionAddress),
      numberToBuffer(tokenId),
      numberToBuffer(dealNumber)]),
    rsaModulusLength,
  )

  if (options?.disableWorker) {
    return rsaGenerateKeyPair(OKM)
  }

  return new Promise((resolve, reject) => {
    const rsaWorker = new RsaWorker()
    rsaWorker.onmessage = (e: MessageEvent<RsaKeyPair>) => resolve(e.data)
    rsaWorker.onerror = (e: ErrorEvent) => {
      console.error(e)
      reject(e)
    }

    rsaWorker.postMessage({ seed: OKM })
  })
}

