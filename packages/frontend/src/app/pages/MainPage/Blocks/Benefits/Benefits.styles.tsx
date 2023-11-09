import { styled } from '../../../../../styles'

export const StyledBenefitItem = styled('li', {
  display: 'flex',
  columnGap: 12,
  justifyContent: 'flex-start',
  border: '2px solid #898E94',
  borderRadius: 16,
  padding: 11,
  paddingLeft: 14,
  paddingTop: 15,
  paddingBottom: 14,
  background: '$white',
})

export const StyledBenefitItemIconsWrapper = styled('div', {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  alignSelf: 'center',
  rowGap: 6,
})

export const StyledBenefitItemIconMain = styled('img', {
  minWidth: 40,
  maxWidth: 40,
  height: 'auto',
})

export const StyledBenefitItemTitle = styled('h4', {
  color: '$gray700',
  fontSize: 16,
  fontWeight: 600,
  lineHeight: '20px',
  marginBottom: 8,
})

export const StyledBenefitItemText = styled('h4', {
  color: '$gray700',
  fontSize: 12,
  fontWeight: 400,
  lineHeight: '16px',
})

export const StyledBenefitItemDotsGradient = styled('img', {
  height: 26,
  width: 'auto',
})

export const StyledBenefits = styled('section', {
  marginBottom: 120,
  '@lg': {
    marginBottom: 100,
  },
  '@md': {
    marginBottom: 85,
  },
  '@sm': {
    marginBottom: 70,
  },
  '@xs': {
    marginBottom: 55,
  },
})

export const StyledBenefitsList = styled('ul', {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  columnGap: 16,
  rowGap: 16,
  gridAutoRows: '1fr',
  '@lg': {
    gridTemplateColumns: 'repeat(2, 1fr)',
  },
  '@md': {
    gridTemplateColumns: 'repeat(1, 1fr)',
    rowGap: 12,
  },
})