import assert from 'assert'
import { BigNumber, BigNumberish, ContractReceipt, utils } from 'ethers'
import { useCallback } from 'react'
import { useAccount } from 'wagmi'

import { useStatusState } from '../../hooks'
import { useConfig } from '../../hooks/useConfig'
import { useExchangeContract } from '../contracts'
import { useHiddenFileProcessorFactory } from '../HiddenFileProcessorFactory'
import {
  assertAccount, assertCollection,
  assertContract,
  assertSigner,
  assertTokenId,
  bufferToEtherHex,
  callContract,
} from '../utils'

/**
 * Fulfills an existing order.
 * @param collectionAddress
 * @param tokenId assigned to a token by the mint function
 * @param price an integer price
 */

interface IFulFillOrder {
  price?: BigNumberish
  collectionAddress?: string
  tokenId?: string
  signature?: string
}

export function useFulfillOrder() {
  const { contract, signer } = useExchangeContract()
  const { address } = useAccount()
  const { wrapPromise, statuses } = useStatusState<ContractReceipt, IFulFillOrder>()
  const factory = useHiddenFileProcessorFactory()
  const config = useConfig()

  const fulfillOrder = useCallback(wrapPromise(async ({ collectionAddress, tokenId, price, signature }) => {
    assertCollection(collectionAddress)
    assertContract(contract, config?.exchangeToken.name ?? '')
    assertSigner(signer)
    assertTokenId(tokenId)
    assertAccount(address)
    assert(price, 'price is not provided')

    const buyer = await factory.getBuyer(address, collectionAddress, +tokenId)
    const publicKey = await buyer.initBuy()
    console.log('fulfill order', { collectionAddress, publicKey, tokenId, price })

    return callContract(
      { contract, signer, method: 'fulfillOrder', minBalance: BigNumber.from(price) },
      utils.getAddress(collectionAddress),
      bufferToEtherHex(publicKey),
      BigNumber.from(tokenId),
      signature ? `0x${signature}` : '0x00',
      {
        value: BigNumber.from(price),
        gasPrice: config?.gasPrice,
      },
    )
  }), [contract, address, wrapPromise, signer])

  return { ...statuses, fulfillOrder }
}
