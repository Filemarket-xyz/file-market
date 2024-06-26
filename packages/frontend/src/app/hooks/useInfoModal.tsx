import { type ReactNode, useCallback, useEffect, useState } from 'react'

import { InfoModal } from '../components/Modal/InfoModal'
import { type DialogRef } from '../stores/Dialog/DialogStore'
import { useModalProperties } from './useModalProperties'
import { useStores } from './useStores'

export interface UseModalArgs {
  header?: ReactNode
  main?: ReactNode
}

export function useInfoModal({ header, main }: UseModalArgs) {
  const {
    modalOpen,
    setModalOpen,
    modalBody,
    setModalBody,
    modalHeader,
    setModalHeader,
  } = useModalProperties()

  const { dialogStore } = useStores()

  const [modalInfoInst, setModalInfoInst] = useState<DialogRef | undefined>()

  const handleClose = useCallback(() => {
    setModalOpen(false)
  }, [setModalOpen])
  useEffect(() => {
    if (header || main) {
      setModalOpen(true)
    }
  }, [header, main])
  useEffect(() => {
    if (header) {
      setModalHeader(header)
    }
    if (main) {
      setModalBody(main)
    }
  }, [header, main])
  useEffect(() => {
    if (modalOpen && !modalInfoInst) {
      const inst = dialogStore.openDialog({
        component: InfoModal,
        props: {
          header: modalHeader,
          body: modalBody,
        },
      })
      setModalInfoInst(inst)
    }
    if (!modalOpen && modalInfoInst) {
      modalInfoInst.close()
    }
  }, [modalOpen, modalInfoInst])

  return {
    modalInfoProps: {
      header: modalHeader,
      body: modalBody,
      open: modalOpen,
      handleClose,
    },
    setModalOpen,
    setModalBody,
    setModalHeader,
  }
}
