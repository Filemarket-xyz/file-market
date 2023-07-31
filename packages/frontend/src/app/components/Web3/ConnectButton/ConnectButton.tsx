import { FC } from 'react'

import { Button } from '../../../UIkit'

interface ConnectButtonProps {
  connectFunc: () => void
}

export const ConnectButton: FC<ConnectButtonProps> = ({ connectFunc }) => {
  // onClick instead of onPress, cos web3modal closes when using onPress
  return (
    <Button
      small
      secondaryWithBlinds
      onClick={async () => connectFunc()}
    >
      Connect
    </Button>
  )
}
