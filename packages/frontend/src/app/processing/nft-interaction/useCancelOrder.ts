import { BigNumber, ContractReceipt } from 'ethers'
import { useCallback } from 'react'

import { useStatusState } from '../../hooks'
import { useConfig } from '../../hooks/useConfig'
import { useExchangeContract } from '../contracts'
import { assertCollection, assertContract, assertSigner, assertTokenId, callContract } from '../utils'

/**
 * Calls Mark3dExchange contract to cancel an order
 * @param collectionAddress
 * @param tokenId assigned to a token by the mint function
 */

interface ICancelOrder {
  collectionAddress?: string
  tokenId?: string
}

export function useCancelOrder() {
  const { contract, signer } = useExchangeContract()
  const config = useConfig()
  const { wrapPromise, statuses } = useStatusState<ContractReceipt, ICancelOrder>()
  const cancelOrder = useCallback(wrapPromise(async ({ collectionAddress, tokenId }) => {
    assertCollection(collectionAddress)
    assertTokenId(tokenId)
    assertContract(contract, config?.exchangeToken.name ?? '')
    assertSigner(signer)
    console.log('cancel order', { collectionAddress, tokenId })

    return callContract({ contract, method: 'cancelOrder' },
      collectionAddress,
      BigNumber.from(tokenId),
      { gasPrice: config?.gasPrice },
    )
  }), [contract, signer, wrapPromise])

  return {
    ...statuses,
    cancelOrder,
  }
}
