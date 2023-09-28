import { mnemonicToEntropy } from 'bip39'
import { sha256 } from 'ethereum-cryptography/sha256.js'
import { toHex } from 'ethereum-cryptography/utils'
import React, { type FC, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useAccount } from 'wagmi'

import { styled } from '../../../../../styles'
import { useSeedProvider } from '../../../../processing'
import { ButtonGlowing, Txt } from '../../../../UIkit'
import { InputModalTitleText, ModalBanner } from '../../../../UIkit/Modal/Modal'
import { PasswordInput } from '../../../Form/PasswordInput/PasswordInput'
import { validateImportMnemonic, validatePassword } from '../../ConnectFileWalletDialog/utils/validate'
import { FormControlStyle } from '../../CreateMnemonicDialog/CreatePasswordForm/CreatePasswordForm'

const FormEnterSeedPhraseStyle = styled('form', {
  width: '100%',
  margin: '0 auto',
})

export interface EnterSeedPhraseValue {
  seedPhrase: string
  password: string
  repeatPassword: string
}

export interface EnterSeedPhraseProps {
  onSubmit: (value: EnterSeedPhraseValue) => void
  isReset?: boolean
}

const ButtonContainer = styled('div', {
  display: 'flex',
  justifyContent: 'end',
})

export const EnterSeedPhraseForm: FC<EnterSeedPhraseProps> = ({ onSubmit, isReset }) => {
  const { handleSubmit, formState: { errors }, watch, control, setValue } = useForm<EnterSeedPhraseValue>()
  const [isAppliedWrongPhrase, setAppliesWrongPhrase] = useState<boolean>(false)
  const { address } = useAccount()
  const { seedProvider } = useSeedProvider(address)

  const password = watch('password')
  const passwordRepeat = watch('repeatPassword')

  return (
    <FormEnterSeedPhraseStyle onSubmit={handleSubmit(onSubmit)}>
      <FormControlStyle>
        <InputModalTitleText>FileWallet seed phrase</InputModalTitleText>
        <PasswordInput<EnterSeedPhraseValue>
          inputProps={{
            type: 'password',
            isError: !!errors?.seedPhrase,
            isDisabledFocusStyle: false,
            errorMessage: errors?.seedPhrase?.message,
          }}
          controlledInputProps={{
            name: 'seedPhrase',
            control,
            setValue,
            rules: {
              required: true,
              validate: (p) => {
                if (!!validateImportMnemonic(p)) return validateImportMnemonic(p)
                if (isReset && seedProvider?.hashSeed !== toHex(sha256(Buffer.from(mnemonicToEntropy((p))))) && !isAppliedWrongPhrase) {
                  setAppliesWrongPhrase(true)

                  return 'You probably made a mistake. This phrase is not suitable for your eft. Click the Connect button again to ignore'
                }
              },
            },
          }}
        />
      </FormControlStyle>
      <FormControlStyle>
        <InputModalTitleText>Create password</InputModalTitleText>
        <PasswordInput<EnterSeedPhraseValue>
          inputProps={{
            type: 'password',
            isError: !!errors?.password,
            isDisabledFocusStyle: false,
            errorMessage: errors?.password?.message,
          }}
          controlledInputProps={{
            name: 'password',
            control,
            setValue,
            rules: {
              required: true,
              validate: validatePassword,
            },
          }}
        />
      </FormControlStyle>
      <FormControlStyle style={{ marginBottom: '0' }}>
        <InputModalTitleText>Repeat password</InputModalTitleText>
        <PasswordInput<EnterSeedPhraseValue>
          inputProps={{
            type: 'password',
            isError: !!errors?.repeatPassword,
            isDisabledFocusStyle: false,
            errorMessage: errors.repeatPassword?.message,
          }}
          controlledInputProps={{
            name: 'repeatPassword',
            control,
            setValue,
            rules: {
              required: true,
              validate: () => password === passwordRepeat ? undefined : 'Password are not matching',
            },
          }}
        />
      </FormControlStyle>
      <ModalBanner
        style={{
          marginBottom: '40px',
        }}
      >
        <Txt primary1 style={{ fontSize: '20px', lineHeight: '24px' }}>Note about password</Txt>
        <Txt primary1 style={{ fontWeight: '400', lineHeight: '24px' }}>
          The password will be attached to your current browser/device.
          You can use the same password as on other devices or create a new one.
        </Txt>
      </ModalBanner>
      <ButtonContainer>
        <ButtonGlowing
          whiteWithBlue
          modalButton
          modalButtonFontSize
          type="submit"
          isDisabled={!!(errors.password)}
        >
          Connect
        </ButtonGlowing>
      </ButtonContainer>
    </FormEnterSeedPhraseStyle>
  )
}
