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
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    padding: 10px;
    > * {
        margin-left: 8px;
    }
`;

const Title = styled.div`
    font-size: 1.2em;
    color: #333;
    font-weight: 600;
    border-bottom: 2px solid #ddd;
    padding-bottom: 10px;
    margin-bottom: 10px;
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

        if (edge === 'none') {
            onSetHorizontal(false);
            onSetVertical(false);
        } else if (edge === 'horizontal') {
            onSetHorizontal(true);
            onSetVertical(false);
        } else if (edge === 'vertical') {
            onSetHorizontal(false);
            onSetVertical(true);
        }
    }

    return (
        <Container>
            <Title> Restrictions </Title>
            <RadioButtonLabel>
                <input 
                    type="radio" 
                    value="none"
                    checked={selectedEdge === 'none'} 
                    onChange={handleEdgeChange}
                    name="edgeDirection"
                />
                None
            </RadioButtonLabel>
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