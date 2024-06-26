import { useCallback, useState } from 'react'

export function useModalOpen() {
  const [modalOpen, setModalOpen] = useState<boolean>(false)
  const closeModal = useCallback(() => { setModalOpen(false) }, [modalOpen])
  const openModal = useCallback(() => { setModalOpen(true) }, [modalOpen])

  return {
    modalOpen,
    closeModal,
    openModal,
  }
}
