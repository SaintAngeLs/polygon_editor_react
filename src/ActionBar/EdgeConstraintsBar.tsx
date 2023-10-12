import React, { FunctionComponent, useState } from 'react';
import styled from 'styled-components';

const Container = styled.div`
    position: absolute;
    background-color: #fff;
    right: 0;
    top: 64px;  
    border-radius: 5px;
    padding-right: 8px;
    display: block;
    margin-right: 8px;
    padding-left: 8px;
    > * {
        margin-left: 8px;
    }
`;

const CheckboxLabel = styled.label`
    display: flex;
    align-items: center;
    margin-right: 10px;
`;

export interface EdgeConstraintsBarProps {
    onSetHorizontal: (value: boolean) => void;
    onSetVertical: (value: boolean) => void;
}

export const EdgeConstraintsBar: FunctionComponent<EdgeConstraintsBarProps> = ({ onSetHorizontal, onSetVertical }) => {
    const [isHorizontal, setIsHorizontal] = useState(false);
    const [isVertical, setIsVertical] = useState(false);

    const handleHorizontalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (isVertical) return;  // Do not allow both to be checked
        setIsHorizontal(e.target.checked);
        onSetHorizontal(e.target.checked);
    }

    const handleVerticalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (isHorizontal) return;  // Do not allow both to be checked
        setIsVertical(e.target.checked);
        onSetVertical(e.target.checked);
    }

    return (
        <Container>
            <CheckboxLabel>
                <input 
                    type="checkbox" 
                    checked={isHorizontal} 
                    onChange={handleHorizontalChange}
                />
                Horizontal Edge
            </CheckboxLabel>
            <CheckboxLabel>
                <input 
                    type="checkbox" 
                    checked={isVertical} 
                    onChange={handleVerticalChange}
                />
                Vertical Edge
            </CheckboxLabel>
        </Container>
    );
}
