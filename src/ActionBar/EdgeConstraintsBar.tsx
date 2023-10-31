import { EdgeRestriction } from 'PolygonDraw/Map';
import React, { FunctionComponent, useEffect, useState } from 'react';
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
    margin-top: 10px;
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
    onRemoveConstraint: () => void;
    onOffsetChange: (isOffset: boolean) => void;
    currentEdgeRestriction: EdgeRestriction;
    onAlgorithmChange: (algorithm: string) => void; 
}

export const EdgeConstraintsBar: FunctionComponent<EdgeConstraintsBarProps> = ({ 
    onSetHorizontal, 
    onSetVertical, 
    onRemoveConstraint, 
    currentEdgeRestriction, 
    onOffsetChange, 
    onAlgorithmChange }) => {

    
    //const selectedEdgeHandle = currentEdgeRestriction === 'horizontal' ? 'horizontal' :
        currentEdgeRestriction === 'vertical' ? 'vertical' :
        'none';

    const [selectedEdge, setSelectedEdge] = useState<string | null>(currentEdgeRestriction);

    const [activePolygon, setActivePolygon] = useState<string | null>(null);
    const [selectedAlgorithm, setSelectedAlgorithm] = useState<string>('library');

    useEffect(() => {
        setSelectedEdge(currentEdgeRestriction);
    }, [currentEdgeRestriction]);

    const handleEdgeChange = (e: React.ChangeEvent<HTMLInputElement>) => {

        const edge = e.target.value;
        setSelectedEdge(edge);

        if (edge === 'none') {
            onSetHorizontal(false);
            onSetVertical(false);
        } else if (edge === 'horizontal') {
            onSetHorizontal(true);
            
        } else if (edge === 'vertical') {
            onSetVertical(true);
            
        }
    }

    const handleOffsetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const offsetStatus = e.target.value;
        setActivePolygon(offsetStatus);
        if (offsetStatus === 'offsetOn') {
            onOffsetChange(true);
        } else {
            onOffsetChange(false);
        }
    }
    const handleAlgorithmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const algorithm = e.target.value;
        setSelectedAlgorithm(algorithm);
        onAlgorithmChange(algorithm);
      };

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

            <Title> Offsetted polygon </Title>
            <RadioButtonLabel>
                <input 
                        type="radio" 
                        value="offsetOn"
                        checked={activePolygon === 'offsetOn'} 
                        onChange={handleOffsetChange}
                        name="offsettedpolygon"
                />
                On
            </RadioButtonLabel>
            <RadioButtonLabel>
                <input 
                        type="radio" 
                        value="offsetOff"
                        checked={activePolygon === 'offsetOff'} 
                        onChange={handleOffsetChange}
                        name="offsettedpolygon"
                />
                Off
            </RadioButtonLabel>

            <Title> Line Drawing</Title>
            <RadioButtonLabel>
                <input 
                type="radio" 
                value="library-algorithm"
                checked={selectedAlgorithm === 'library-algorithm'} 
                onChange={handleAlgorithmChange}
                name="drawingAlgorithm"
                />
                Library Algorithm
            </RadioButtonLabel>
            <RadioButtonLabel>
                <input 
                type="radio" 
                value="bresenham-algorithm"
                checked={selectedAlgorithm === 'bresenham-algorithm'}
                onChange={handleAlgorithmChange}
                name="drawingAlgorithm"
                />
                Bresenham Algorithm
            </RadioButtonLabel>
        </Container>
    );
}
