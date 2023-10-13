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
    padding: 10px;
    > * {
        margin-left: 8px;
    }
`;

const RadioButtonLabel = styled.label`
    display: flex;
    align-items: center;
    margin-right: 10px;

    input {
        margin-right: 10px;
    }
`;

export interface EdgeConstraintsBarProps {
    onSetHorizontal: (value: boolean) => void;
    onSetVertical: (value: boolean) => void;
}

export const EdgeConstraintsBar: FunctionComponent<EdgeConstraintsBarProps> = ({ onSetHorizontal, onSetVertical }) => {
    const [selectedEdge, setSelectedEdge] = useState<string | null>(null);

    const handleEdgeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const edge = e.target.value;
        setSelectedEdge(edge);

        onSetHorizontal(edge === 'horizontal');
        onSetVertical(edge === 'vertical');
    }

    return (
        <Container>
            <RadioButtonLabel>
                <input 
                    type="radio" 
                    value="horizontal"
                    checked={selectedEdge === 'horizontal'} 
                    onChange={handleEdgeChange}
                    name="edgeDirection"
                />
                Horizontal Edge
            </RadioButtonLabel>
            <RadioButtonLabel>
                <input 
                    type="radio" 
                    value="vertical"
                    checked={selectedEdge === 'vertical'} 
                    onChange={handleEdgeChange}
                    name="edgeDirection"
                />
                Vertical Edge
            </RadioButtonLabel>
        </Container>
    );
}