import React from 'react';
import { CircleMarker as LeafletCircleMarker } from 'react-leaflet';

import { Coordinate } from 'types';
import { createLeafletLatLngFromCoordinate } from '../helpers';
import { MAP } from '../constants';
import { EdgeRestriction } from './Map';

interface Props {
    coordinate: Coordinate;
    index: number;
    onClick: (coordinate: Coordinate, index: number) => void;
    edgeRestriction: EdgeRestriction;
    children?: React.ReactNode;
}

interface State {
    isHoverActive: boolean;
}

export class EdgeVertex extends React.Component<Props, State> {
    state = {
        isHoverActive: false,
    };

    handleMouseOver = () => this.setState({ isHoverActive: true });
    handleMouseOut = () => this.setState({ isHoverActive: false });
    handleClick = () => this.props.onClick(this.props.coordinate, this.props.index);


    renderIcon = () => {
        const { edgeRestriction } = this.props;

        switch (edgeRestriction) {
            case 'horizontal':
                return (
                    <div className="edge-icon">
                        <i className="fa fa-arrows-h" aria-hidden="true"></i>
                    </div>
                );
            case 'vertical':
                return (
                    <div className="edge-icon">
                        <i className="fa fa-arrows-v" aria-hidden="true"></i>
                    </div>
                );
            default:
                return null; // No icon for 'none' or null restriction
        }
    };

    render() {
        const { isHoverActive } = this.state;
        const { coordinate } = this.props;

        return (
            <div className="edge-vertex">
                {this.renderIcon()}
                <LeafletCircleMarker
                    
                    fillColor={MAP.VERTEX_FILL_COLOR}
                    fillOpacity={isHoverActive ? 1 : 0.8}
                    color={MAP.POLYGON_ACTIVE_COLOR}
                    opacity={isHoverActive ? 1 : 0.8}
                    weight={isHoverActive ? 2 : 0.5}
                    radius={isHoverActive ? 6 : 3}
                    center={createLeafletLatLngFromCoordinate(coordinate)}
                    eventHandlers={{
                        click: this.handleClick,
                        mouseover: this.handleMouseOver,
                        mouseout: this.handleMouseOut,
                    }}
                />
            </div>
        );
    }
}
