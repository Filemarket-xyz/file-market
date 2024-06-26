import { observer } from 'mobx-react-lite'
import React, { type FC } from 'react'

import { type Transfer } from '../../../../../swagger/Api'
import { type TokenFullId } from '../../../../processing/types'
import { Button } from '../../../../UIkit'
import { transferPermissions } from '../../../../utils/transfer/status'
import { ButtonApproveExchange } from './ActionButtons/ButtonApproveExchange'
import { ButtonApproveTransfer } from './ActionButtons/ButtonApproveTransfer'
import { ButtonCancelOrder } from './ActionButtons/ButtonCancelOrder'
import { ButtonCancelTransfer } from './ActionButtons/ButtonCancelTransfer'
import { ButtonFinalizeTransfer } from './ActionButtons/ButtonFinalizeTransfer'
import { ButtonInitTransfer } from './ActionButtons/ButtonInitTransfer'
import { ButtonPlaceOrder } from './ActionButtons/ButtonPlaceOrder'
import { HideAction } from './HideAction'

export interface NFTDealActionsOwnerProps {
  tokenFullId: TokenFullId
  transfer?: Transfer
  isDisabled?: boolean
  isApprovedExchange?: boolean
  runIsApprovedRefetch: () => void
  isFileBunnies?: boolean
}

const permissions = transferPermissions.owner

export const NFTDealActionOwner: FC<NFTDealActionsOwnerProps> = observer(({
  transfer,
  tokenFullId,
  isDisabled,
  isApprovedExchange,
  runIsApprovedRefetch,
  isFileBunnies,
}) => {
  return (
    <>
      <HideAction hide={!transfer || !permissions.canWaitBuyer(transfer)}>
        <Button
          primary
          fullWidth
          borderRadiusSecond
          isDisabled
        >
          Waiting for buyer
        </Button>
      </HideAction>
      <HideAction hide={!transfer || !permissions.canApprove(transfer)}>
        <ButtonApproveTransfer
          tokenFullId={tokenFullId}
          transfer={transfer}
          isDisabled={isDisabled}
        />
      </HideAction>
      <HideAction hide={!transfer || !permissions.canFinalize(transfer)}>
        <ButtonFinalizeTransfer
          tokenFullId={tokenFullId}
          isDisabled={isDisabled}
        />
      </HideAction>
      <HideAction hide={!transfer || !permissions.canCancelOrder(transfer)}>
        <ButtonCancelOrder
          tokenFullId={tokenFullId}
          isDisabled={isDisabled}
        />
      </HideAction>
      <HideAction hide={!transfer || !permissions.canCancel(transfer)}>
        <ButtonCancelTransfer
          tokenFullId={tokenFullId}
          isDisabled={isDisabled}
        />
      </HideAction>
      <HideAction hide={!!transfer || !isApprovedExchange}>
        <ButtonPlaceOrder
          tokenFullId={tokenFullId}
          isDisabled={isDisabled}
        />
      </HideAction>
      <HideAction hide={!!transfer || isApprovedExchange}>
        <ButtonApproveExchange
          tokenFullId={tokenFullId}
          isDisabled={isDisabled}
          onEnd={() => { runIsApprovedRefetch() }}
        />
      </HideAction>
      <HideAction hide={!!transfer}>
        <ButtonInitTransfer
          tokenFullId={tokenFullId}
          isDisabled={isDisabled}
        />
      </HideAction>
    </>
  )
})
