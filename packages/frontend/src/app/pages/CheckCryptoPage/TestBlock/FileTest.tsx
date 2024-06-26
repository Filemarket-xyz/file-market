import { aesDecryptNative, aesEncryptNative } from 'file-market-crypto/src/lib/aes'
import { eftAesDerivationNative } from 'file-market-crypto/src/lib/eft-derivation'
import { bufferToHex } from 'file-market-crypto/src/lib/utils'
import React, { useCallback, useEffect, useState } from 'react'

import { assertCollection, assertSeed } from '../../../processing'
import { data, globalSalt } from '../helper/data/data'
import { type ICheckCrypto, type ICheckCryptoFile, type ITestProps } from '../helper/types/types'
import { setNextFieldToFalseAfterTrue } from '../helper/utils/checkSuccessFunc'
import StateDisplay from '../StateDisplay/StateDisplay'

const FileTest = (props: ITestProps) => {
  const [checkCryptoFileState, setCheckCryptoFileState] = useState<ICheckCryptoFile>({
    aesDecrypt: 'waiting',
    aesEncrypt: 'waiting',
    aesDerivation: 'waiting',
    res: 'waiting',
  })

  const checkCryptoFile = useCallback(async ({ seed, collectionAddress }: ICheckCrypto, iter: number) => {
    if (!props.play) return
    try {
      assertSeed(seed)
      assertCollection(collectionAddress)
      const keyAndIv = await eftAesDerivationNative(window.crypto)(seed,
        globalSalt,
        Buffer.from(collectionAddress),
        iter)
      setCheckCryptoFileState((prevState) => (
        {
          ...prevState,
          aesDerivation: 'success',
        }
      ))
      const encryptedData = await aesEncryptNative(window.crypto)(data, keyAndIv)
      setCheckCryptoFileState((prevState) => (
        {
          ...prevState,
          aesEncrypt: 'success',
        }
      ))
      const decryptedData = await aesDecryptNative(window.crypto)(encryptedData, keyAndIv.key)
      setCheckCryptoFileState((prevState) => (
        {
          ...prevState,
          aesDecrypt: 'success',
        }
      ))
      if (bufferToHex(decryptedData) !== bufferToHex(data)) throw new Error()
      if (bufferToHex(encryptedData) === bufferToHex(data)) throw new Error()

      setCheckCryptoFileState((prevState) => (
        {
          ...prevState,
          res: 'success',
        }
      ))

      props.onTestEnd?.()
    } catch (error) {
      setCheckCryptoFileState((prevState) => (
        setNextFieldToFalseAfterTrue<ICheckCryptoFile>(prevState)
      ))
      props.onTestEnd?.()
    }
  }, [props.play])

  useEffect(() => {
    props.play && checkCryptoFile({ seed: props.seed, collectionAddress: props.collectionAddress }, props.iterNumber)
  }, [props.play])

  return (
    <>
      {(Object.keys(checkCryptoFileState) as Array<keyof ICheckCryptoFile>).map((item, index) => {
        return <StateDisplay key={index} state={checkCryptoFileState[item]} />
      })}
    </>
  )
}

export default FileTest
