import { BigNumber, ContractReceipt } from 'ethers'
import { useCallback } from 'react'

import { mark3dConfig } from '../../config/mark3d'
import { useStatusState } from '../../hooks'
import { useExchangeContract } from '../contracts'
import { assertCollection, assertContract, assertSigner, assertTokenId, callContract } from '../utils'

/**
 * Calls Mark3dExchange contract to cancel an order
 * @param collectionAddress
 * @param tokenId assigned to a token by the mint function
 */

interface IUseCancelOrder {
  collectionAddress?: string
  tokenId?: string
  callBack?: () => void
}

export function useCancelOrder({ callBack }: IUseCancelOrder = {}) {
  const { contract, signer } = useExchangeContract()
  const { wrapPromise, statuses } = useStatusState<ContractReceipt, IUseCancelOrder>()
  const cancelOrder = useCallback(wrapPromise(async ({ collectionAddress, tokenId }) => {
    assertCollection(collectionAddress)
    assertTokenId(tokenId)
    assertContract(contract, mark3dConfig.exchangeToken.name)
    assertSigner(signer)
    console.log('cancel order', { collectionAddress, tokenId })

    return callContract({ contract, method: 'cancelOrder' },
      collectionAddress,
      BigNumber.from(tokenId),
      { gasPrice: mark3dConfig.gasPrice },
    )
  }, callBack), [contract, signer, wrapPromise])

  return {
    ...statuses,
    cancelOrder,
  }
}
