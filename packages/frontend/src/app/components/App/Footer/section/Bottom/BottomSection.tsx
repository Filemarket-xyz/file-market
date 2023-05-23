import React from 'react'
import { useNavigate } from 'react-router-dom'

import EmailImg from '../../../../../../assets/img/Email.svg'
import { styled } from '../../../../../../styles'
import { Link, Txt } from '../../../../../UIkit'

const BottomSectionStyle = styled('div', {
  display: 'flex',
  justifyContent: 'space-between',
  width: '100%',
  flexWrap: 'wrap',
  gap: '$3',
  '& .links': {
    display: 'flex',
    gap: '16px'
  },
  '@sm': {
    flexFlow: 'column-reverse wrap',
    alignItems: 'center'
  }
})

const Info = styled('div', {
  display: 'flex',
  gap: '$4',
  flexWrap: 'wrap',
  '@sm': {
    flexFlow: 'column-reverse wrap',
    gap: '16px',
    alignItems: 'center'
  }
})

const Divider = styled('div', {
  width: '1px',
  height: '18px',
  background: '#232528',
  borderRadius: '2px',
  '@sm': {
    display: 'none'
  }
})

const Email = styled('div', {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  '& img': {
    width: '16px',
    height: '13px'
  }
})

const date = new Date()

const BottomSection = () => {
  const navigate = useNavigate()

  return (
    <BottomSectionStyle>
      <Info>
        <Txt secondary1 css={{ fontSize: 14, color: '#A7A8A9' }}>
          ©
          {' '}
          {date.getFullYear()}
          {' '}
          FileMarket.xyz, Inc
        </Txt>
        <Divider />
        <div className='links'>
          <Link footer onPress={() => { navigate('/policy') }}>Privacy policy</Link>
          <Link footer>Terms of Service</Link>
        </div>
      </Info>
      <Email>
        <img src={EmailImg} />
        <Txt secondary1 css={{ fontSize: 14 }}>
          genesis@filemarket.xyz
        </Txt>
      </Email>
    </BottomSectionStyle>
  )
}

export default BottomSection
