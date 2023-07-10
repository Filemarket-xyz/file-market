
import { styled } from '../../../../../styles'
import { NavButton } from '../../../Button'
import { Txt } from '../../../Txt'
import { StyledImgContainer } from '../../CardImg'

export const StyledFileTypeContainer = styled('div', {
  position: 'absolute',
  left: 4,
  top: 4,
  zIndex: 1,
})

export const StyledInfoWrapper = styled('div', {
  position: 'relative',
  // witn card border
  width: 'calc(100% + 2px)',
  borderStartStartRadius: '$space-3',
  borderStartEndRadius: '$space-3',
  paddingTB: 12,
  paddingLR: '$3',
  background: '$white',
  border: '1px solid $gray300',
  borderBottom: 'none',
  transform: 'translate(-1px, 0px)',
  transition: 'all 0.25s ease-in-out',
  '&::before': {
    content: '""',
    position: 'absolute',
    left: -1,
    // witn card border
    width: 'calc(100% + 2px)',
    top: '100%',
    height: '100%',
    background: '$white',
  },
})

export const StyledTitle = styled(Txt, {
  width: '100%',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  color: '$black',
})

export const StyledCollectionName = styled(Txt, {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  color: '$gray600',
})

export const StyledButtonWrapper = styled('div', {
  width: '100%',
  position: 'relative',
})

export const StyledButton = styled(NavButton, {
  transition: 'all 0.25s ease-in-out',
  left: 0,
  top: 44,
  position: 'absolute',
})

export const StyledCardInner = styled('div', {
  background: '$gray100',
  borderRadius: '$3',
  position: 'relative',
  overflow: 'hidden',
})

export const StyledCardBorder = styled('div', {
  border: '1px solid $gray300',
  backgroundColor: '$gray100',
  borderRadius: 'inherit',
  transition: 'all 0.25s ease-in-out',
})

export const StyledCard = styled('span', {
  height: 'fit-content',
  color: '$black',
  border: '1px solid $gray100',
  borderRadius: '$3',
  position: 'relative',
  transition: 'all 0.25s ease-in-out',
  cursor: 'pointer',
  background: 'transparent',
  '&:hover': {
    background: '$blue500',
    borderColor: 'transparent',
    filter: 'drop-shadow(0px 12px 24px rgba(0, 0, 0, 0.2))',
  },
  [`&:hover ${StyledFileTypeContainer.selector} > div > div`]: {
    backgroundColor: '$whiteOp75',
  },
  [`&:hover ${StyledCardBorder.selector}`]: {
    borderColor: 'transparent',
    backgroundColor: 'transparent',
    borderRadius: '$3',
  },
  [`&:hover ${StyledButton.selector}`]: {
    top: 8,
  },
  [`&:hover ${StyledImgContainer.selector}`]: {
    '&::after': {
      opacity: 1,
    },
  },
  [`&:hover ${StyledInfoWrapper.selector}`]: {
    boxShadow: '0px -10px 25px rgba(0, 0, 0, 0.25)',
    transform: 'translate(-1px, -40px)',
  },
})
