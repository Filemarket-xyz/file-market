import React from 'react'
import { useParams } from 'react-router-dom'

import { useConversionRateStore } from '../../../../../hooks/useConversionRateStore'
import { useModalOpen } from '../../../../../hooks/useModalOpen'
import { useOrderStore } from '../../../../../hooks/useOrderStore'
import { useStatusModal } from '../../../../../hooks/useStatusModal'
import { usePlaceOrder } from '../../../../../processing'
import { TokenFullId } from '../../../../../processing/types'
import { Button } from '../../../../../UIkit'
import { Modal, ModalBody, ModalTitle } from '../../../../../UIkit/Modal/Modal'
import { Params } from '../../../../../utils/router'
import { toCurrency } from '../../../../../utils/web3'
import { BaseModal } from '../../../../Modal'
import { wrapButtonActionsFunction } from '../../helper/wrapButtonActionsFunction'
import { OrderForm, OrderFormValue } from '../../OrderForm'
import { ActionButtonProps } from './types/types'

export type ButtonPlaceOrderProps = ActionButtonProps & {
  tokenFullId: TokenFullId
}

export const ButtonPlaceOrder: React.FC<ButtonPlaceOrderProps> = ({
  tokenFullId, isDisabled,
}) => {
  const { modalOpen, openModal, closeModal } = useModalOpen()
  const { placeOrder, ...statuses } = usePlaceOrder()
  const conversionRateStore = useConversionRateStore()
  const { wrapAction } = wrapButtonActionsFunction<OrderFormValue>()
  const { collectionAddress, tokenId } = useParams<Params>()
  const orderStore = useOrderStore(collectionAddress, tokenId)

  const { isLoading } = statuses
  const { modalProps } = useStatusModal({
    statuses,
    okMsg: 'Order placed! Now be ready to transfer hidden files, if someone fulfills the order.',
    loadingMsg: 'Placing order',
  })

  const onSubmit = wrapAction(async ({ price }: OrderFormValue) => {
    closeModal()
    await placeOrder({
      ...tokenFullId,
      price,
    })
    conversionRateStore.data?.rate &&
    orderStore.setDataPrice(price.toString(), (conversionRateStore.data?.rate * toCurrency(price)).toString())
  })

  return (
    <>
      <Modal
        closeButton
        open={modalOpen}
        width='465px'
        onClose={closeModal}
      >
        <ModalTitle>Put EFT on sale</ModalTitle>
        <ModalBody css={{ padding: 0 }}>
          <OrderForm
            tokenFullId={tokenFullId}
            onSubmit={onSubmit}
          />
        </ModalBody>
      </Modal>
      <BaseModal {...modalProps} />
      <Button
        primary
        fullWidth
        borderRadiusSecond
        isDisabled={isLoading || isDisabled}
        onPress={openModal}
      >
        Put on sale
      </Button>
    </>
  )
}
