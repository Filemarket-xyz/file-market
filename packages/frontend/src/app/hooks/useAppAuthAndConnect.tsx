import { useWeb3Modal } from '@web3modal/react'
import assert from 'assert'
import { useCallback, useEffect, useState } from 'react'
import { useAccount, useSignMessage } from 'wagmi'

import { LoadingModal } from '../components/Modal/LoadingModal'
import { type InProcessBodyProps } from '../components/Modal/Modal'
import { type DialogProps } from '../utils/dialog'
import { useStores } from './useStores'

export interface IUseAppAuthAndConnect {
  isWithSign?: boolean
  onSuccess?: () => void
}

type InProccess = InProcessBodyProps & DialogProps

export default function useAppAuthAndConnect(props?: IUseAppAuthAndConnect) {
  const { isConnected, address, connector } = useAccount()
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isACanAuthEffect, setIsACanAuthEffect] = useState<boolean>(false)
  const [addressState, setAddressState] = useState<string | undefined>()
  const { authStore, dialogStore } = useStores()
  const { open, setDefaultChain } = useWeb3Modal()
  const { signMessage } = useSignMessage({
    async onSuccess(data) {
      try {
        if ((addressState ?? address) !== undefined) {
          await authStore.loginBySignature({ address: (addressState ?? address) ?? '', signature: data.substring(2, data.length) })
          props?.onSuccess?.()
          setIsLoading(false)
        }
      } catch (e: any) {
        setIsLoading(false)
      }
    },
    onError(data) {
      setIsLoading(false)
    },
  })

  useEffect(() => {
    if (isConnected && isACanAuthEffect && props?.isWithSign) {
      assert(address, 'address is undefined')
      setAddressState(address)
      setIsLoading(true)
      authStore.getMessageForAuth(address).then((res) => {
        signMessage({ message: res.data.message })
      }).catch((e: any) => {
        setIsLoading(false)
      })
    }
  }, [isConnected, isACanAuthEffect])

  // useErrorWindow(errorConnect?.message)
  // useErrorWindow(errorSign?.message)

  const connect = useCallback(async () => {
    if (isConnected && address && props?.isWithSign) {
      setAddressState(address)
      setIsLoading(true)
      await authStore.getMessageForAuth(address).then((res) => {
        signMessage({ message: res.data.message })
      }).catch((e: any) => {
        setIsLoading(false)
      })
    } else {
      void open().then(() => {
        if (!props?.isWithSign) props?.onSuccess?.()
        setIsACanAuthEffect(true)
      })
        .catch((e) => {
          setIsLoading(false)
        })
    }
  }, [isConnected, address, connector, props?.isWithSign, setIsLoading])

  useEffect(() => {
    if (isLoading) {
      if (dialogStore.isDialogOpenByName('LoadingSign')) return
      dialogStore.openDialog<InProccess>({
        component: LoadingModal,
        props: {
          name: 'LoadingSign',
          text: 'Please sign the message',
        },
      })
    } else {
      dialogStore.closeDialogByName('LoadingSign')
    }

    return () => {
      dialogStore.closeDialogByName('LoadingSign')
    }
  }, [isLoading])

  return { connect, isLoading, setDefaultChain }
}
