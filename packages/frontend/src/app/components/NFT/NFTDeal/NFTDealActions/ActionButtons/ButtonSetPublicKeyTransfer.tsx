import { FC } from 'react'

import { useStatusModal } from '../../../../../hooks/useStatusModal'
import { useSetPublicKey } from '../../../../../processing'
import { TokenFullId } from '../../../../../processing/types'
import { Button } from '../../../../../UIkit'
import BaseModal from '../../../../Modal/Modal'

export interface ButtonSetPublicKeyTransferProps {
  tokenFullId: TokenFullId
  callBack?: () => void
  isDisabled?: boolean
}

export const ButtonSetPublicKeyTransfer: FC<ButtonSetPublicKeyTransferProps> = ({
  tokenFullId,
  callBack,
  isDisabled,
}) => {
  const { setPublicKey, ...statuses } = useSetPublicKey({ ...tokenFullId })
  const { isLoading } = statuses
  const { modalProps } = useStatusModal({
    statuses,
    okMsg: 'Public key was sent. The owner can now give you access to the hidden file.',
    loadingMsg: 'Sending keys, so owner could encrypt the file password and transfer it to you',
  })

  const onPress = async () => {
    await setPublicKey(tokenFullId)
    callBack?.()
  }

  return (
    <>
      <BaseModal {...modalProps} />
      <Button
        primary
        fullWidth
        borderRadiusSecond
        isDisabled={isLoading || isDisabled}
        onPress={onPress}
      >
        Accept transfer
      </Button>
    </>
  )
}
