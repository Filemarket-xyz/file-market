import React, {FC, ReactNode} from 'react';
import {styled} from "../../../styles";
import {textVariant} from "../Txt";
import deleteImg from '../../../assets/img/closeButtonIcon.svg'

export const BlueText = styled('h5', {
    ...textVariant('primary2').true,
    color: '$blue500'
})

export const TagStyle = styled(BlueText, {
    padding: '6px 16px',
    background: '#FFFFFF',
    boxShadow: '0px 4px 20px rgba(35, 37, 40, 0.05)',
    borderRadius: '20px',
    display: 'flex',
    gap: '10px',
    '& img': {
        cursor: 'pointer'
    }
})

export interface TagOptions {
    isCanDelete?: boolean
    onDelete?: (value?: string) => void
}

interface TagProps {
    tagOptions?: TagOptions
    children?: ReactNode
    value?: string
}

const Tag: FC<TagProps> = ({tagOptions, children, value}) => {
    return (
        <TagStyle>
            {children}
            {tagOptions?.isCanDelete && <img src={deleteImg} onClick={() => {console.log(value);tagOptions?.onDelete?.(value)}}/>}
        </TagStyle>
    );
};

export default Tag;