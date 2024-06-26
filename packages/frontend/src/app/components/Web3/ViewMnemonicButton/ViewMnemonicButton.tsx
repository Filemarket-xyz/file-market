import { type PressEvent } from '@react-types/shared/src/events'
import { observer } from 'mobx-react-lite'
import { type FC } from 'react'

import { useStores } from '../../../hooks'
import { Link } from '../../../UIkit'
import { ViewMnemonicDialog } from '../ViewMnemonicDialog/ViewMnemonicDialog'

export interface ChangeMnemonicButton {
  onPress?: (e: PressEvent) => void
}

export const ViewMnemonicButton: FC<ChangeMnemonicButton> = observer(({ onPress }) => {
  const { dialogStore } = useStores()

  const openWindow = () => {
    dialogStore.openDialog({
      component: ViewMnemonicDialog,
      props: { },
    })
  }

  return (
    <Link
      type="button"
      onPress={() => {
        openWindow()
      }}
    >
      View FileWallet seed phrase
    </Link>
  )
})
