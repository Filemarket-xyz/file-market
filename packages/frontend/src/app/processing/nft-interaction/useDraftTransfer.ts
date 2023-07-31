import { BigNumber, ContractReceipt } from 'ethers'
import { useCallback } from 'react'

import { useStatusState } from '../../hooks'
import { useConfig } from '../../hooks/useConfig'
import { useCollectionContract } from '../contracts'
import { assertCollection, assertContract, assertSigner, assertTokenId, callContract, nullAddress } from '../utils'

interface IDraftTransfer {
  collectionAddress?: string
  tokenId?: string
}

export function useDraftTransfer() {
  const { contract, signer } = useCollectionContract()
  const { statuses, wrapPromise } = useStatusState<ContractReceipt, IDraftTransfer>()
  const config = useConfig()

  const draftTransfer = useCallback(wrapPromise(async ({ collectionAddress, tokenId }: IDraftTransfer) => {
    assertContract(contract, config?.collectionToken.name ?? '')
    assertSigner(signer)
    assertCollection(collectionAddress)
    assertTokenId(tokenId)
    console.log('draft transfer', { tokenId, callbackReceiver: nullAddress })

    return callContract({ contract, method: 'draftTransfer' },
      BigNumber.from(tokenId),
      nullAddress,
      { gasPrice: config?.gasPrice },
    )
  }), [contract, signer, wrapPromise])

  return {
    ...statuses,
    draftTransfer,
  }
}
