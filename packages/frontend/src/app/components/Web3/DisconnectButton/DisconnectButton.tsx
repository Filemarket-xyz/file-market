import { type PressEvent } from '@react-types/shared/src/events'
import { type FC } from 'react'
import { useAccount, useDisconnect } from 'wagmi'

import { useSeedProvider } from '../../../processing'
import { Link } from '../../../UIkit'

export interface DisconnectButtonProps {
  onPress?: (e: PressEvent) => void
}

export const DisconnectButton: FC<DisconnectButtonProps> = ({ onPress }) => {
  const { disconnect } = useDisconnect()
  const { address } = useAccount()
  const { seedProvider } = useSeedProvider(address)

  return (
    <Link
      type="button"
      style={{
        color: '#D81B60',
      }}
      onPress={(e) => {
        seedProvider?.lock()
        disconnect()
        onPress?.(e)
      }}
    >
      Disconnect
    </Link>
  )
}
