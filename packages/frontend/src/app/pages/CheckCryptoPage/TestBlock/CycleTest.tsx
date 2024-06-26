import { FileMarketCrypto } from 'file-market-crypto/src'
import { bufferToHex } from 'file-market-crypto/src/lib/utils'
import React, { useCallback, useEffect, useState } from 'react'
import { useAccount } from 'wagmi'

import { assertAccount, assertCollection, assertSeed } from '../../../processing'
import { globalSalt } from '../helper/data/data'
import { type ICheckCrypto, type ICheckCryptoCycle, type ITestProps } from '../helper/types/types'
import { setNextFieldToFalseAfterTrue } from '../helper/utils/checkSuccessFunc'
import StateDisplay from '../StateDisplay/StateDisplay'

const CycleTest = (props: ITestProps) => {
  const { address } = useAccount()
  const [checkCryptoCycleState, setCheckCryptoCycleState] = useState<ICheckCryptoCycle>({
    aesDerivation: 'waiting',
    rsaDerivation: 'waiting',
    rsaEncrypt: 'waiting',
    rsaDecrypt: 'waiting',
    res: 'waiting',
  })

  const checkCryptoCycle = useCallback(async ({ seed, collectionAddress }: ICheckCrypto, iter: number) => {
    if (!props.play) return
    try {
      assertAccount(address)
      assertSeed(seed)
      assertCollection(collectionAddress)

      const fc = new FileMarketCrypto(window.crypto)
      const { key: generatedPassword } = await fc.eftAesDerivation(seed,
        globalSalt,
        Buffer.from(collectionAddress),
        iter)
      setCheckCryptoCycleState((prevState) => ({
        ...prevState,
        aesDerivation: 'success',
      }),
      )
      const { priv, pub } = await fc.eftRsaDerivation(seed, globalSalt, Buffer.from(collectionAddress), iter, iter)
      setCheckCryptoCycleState((prevState) => ({
        ...prevState,
        rsaDerivation: 'success',
      }),
      )
      const encryptedPassword = await fc.rsaEncrypt(generatedPassword, pub)
      setCheckCryptoCycleState((prevState) => ({
        ...prevState,
        rsaEncrypt: 'success',
      }),
      )
      const decryptedPassword = await fc.rsaDecrypt(encryptedPassword, priv)
      setCheckCryptoCycleState((prevState) => ({
        ...prevState,
        rsaDecrypt: 'success',
      }),
      )

      if (bufferToHex(decryptedPassword) !== bufferToHex(generatedPassword)) throw new Error()
      setCheckCryptoCycleState((prevState) => ({
        ...prevState,
        res: 'success',
      }),
      )
      props.onTestEnd?.()
    } catch (error) {
      props.onTestEnd?.()

      setCheckCryptoCycleState((prevState) => (
        setNextFieldToFalseAfterTrue<ICheckCryptoCycle>(prevState)
      ))
    }
  }, [props.play])

  useEffect(() => {
    props.play && checkCryptoCycle({ seed: props.seed, collectionAddress: props.collectionAddress }, props.iterNumber)
  }, [props.play])

  return (
    <>
      {(Object.keys(checkCryptoCycleState) as Array<keyof ICheckCryptoCycle>).map((item, index) => {
        return <StateDisplay key={index} state={checkCryptoCycleState[item]} />
      })}
    </>
  )
}

export default CycleTest
