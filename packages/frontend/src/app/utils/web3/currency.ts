import { BigNumber, BigNumberish, utils } from 'ethers'
import { formatUnits } from 'ethers/lib.esm/utils'

import { mark3dConfig } from '../../config/mark3d'
import { formatNumber } from '../number'

export const formatCurrency = (value: BigNumberish) => {
  const decimals = mark3dConfig.chain.nativeCurrency?.decimals ?? 18
  const symbol = mark3dConfig.chain.nativeCurrency?.symbol ?? 'BNB'
  const computedValue = utils.formatUnits(value, decimals)

  return `${parseFloat(computedValue) > 0.0000001 ? computedValue : '~0'} ${symbol}`
}

export const toCurrency = (value: BigNumber): number => {
  const decimals = mark3dConfig.chain.nativeCurrency?.decimals ?? 18

  return Number(utils.formatUnits(value, decimals))
}

export const fromCurrency = (value: number): BigNumber => {
  const decimals = mark3dConfig.chain.nativeCurrency?.decimals ?? 18
  const meaningfulDecimals = 9

  return BigNumber
    .from(Math.round(value * Math.pow(10, meaningfulDecimals)))
    .mul(BigNumber.from(Math.pow(10, decimals - meaningfulDecimals)))
}

export const formatUsd = (value: string | number) => {
  return `${formatNumber(value, 2)}$`
}

export const formatRoyalty = (value: BigNumberish) => {
  return +formatUnits(value, 2)
}

export const formatFee = (value: BigNumberish) => {
  return +formatUnits(value, 2)
}
