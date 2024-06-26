// implementation of https://www.rfc-editor.org/rfc/rfc5869
import {HkdfFunction, HmacFunction} from './types';
import {hmacSha512, hmacSha512Native} from './hmac-sha512';
import {hashLength} from './config';

export const hkdfSha512: HkdfFunction = async (salt: ArrayBuffer, IKM: ArrayBuffer, info: ArrayBuffer, bytesLength: number): Promise<ArrayBuffer> => {
  return hkdfAux(hmacSha512, hashLength, salt, IKM, info, bytesLength)
}

export const hkdfSha512Native = (crypto: Crypto): HkdfFunction =>
  async (salt: ArrayBuffer, IKM: ArrayBuffer, info: ArrayBuffer, L: number): Promise<ArrayBuffer> => {
    const nativeIkm = await crypto
      .subtle
      .importKey('raw', IKM, 'HKDF',
        false,
        ['deriveBits']
      )
    return window.crypto.subtle.deriveBits({
        name: 'HKDF',
        hash: 'SHA-512',
        salt,
        info,
      },
      nativeIkm,
      L
    )
  }

export const hkdfSha512NativeHash = (crypto: Crypto): HkdfFunction =>
  async (salt: ArrayBuffer, IKM: ArrayBuffer, info: ArrayBuffer, bitsLen: number): Promise<ArrayBuffer> => {
    return hkdfAux(hmacSha512Native(crypto), hashLength, salt, IKM, info, bitsLen)
  }

const hkdfAux = async (hmacF: HmacFunction, hashLen: number, salt: ArrayBuffer, IKM: ArrayBuffer, info: ArrayBuffer, L: number): Promise<ArrayBuffer> => {
  const PRK = await hkdfExtract(hmacF, salt, IKM)
  return hkdfExpand(hmacF, hashLen, PRK, info, L)
}

const hkdfExtract = async (hmacF: HmacFunction, salt: ArrayBuffer, IKM: ArrayBuffer): Promise<ArrayBuffer> => {
  return hmacF(salt, IKM)
}

const hkdfExpand = async (hmacF: HmacFunction, hashLen: number, PRK: ArrayBuffer, info: ArrayBuffer, L: number): Promise<ArrayBuffer> => {
  const maxL = ((1 << 8) * hashLen)
  if (L > maxL) {
    throw Error(`Unsupported: too big L, max L is ${maxL}`)
  }
  const N = Math.ceil(L / hashLen)
  const TList: Buffer[] = []
  const infoBuffer = Buffer.from(info)
  TList[0] = Buffer.alloc(0)
  for (let i = 1; i <= N; i++) {
    TList[i] = Buffer.from(await hmacF(PRK, Buffer.concat([TList[i - 1], infoBuffer, Buffer.from([i])])))
  }
  const T = Buffer.concat(TList.slice(1))
  return T.subarray(0, L)
}
