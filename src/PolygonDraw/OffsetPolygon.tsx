import React, { FunctionComponent } from 'react';
import { Polygon as LeafletPolygon } from 'react-leaflet';

import { Coordinate } from 'types';
import { createLeafletLatLngFromCoordinate, createOffsetCoordinates } from '../helpers';
import { MAP } from '../constants';

interface Props {
    coordinates: Coordinate[];
    offsetDistance: number;
    show: boolean;
}

export const OffsetPolygon: FunctionComponent<Props> = ({ coordinates, offsetDistance, show }) => {
    if (!show) {
        return null;
    }

    const offsetCoordinatesArray = createOffsetCoordinates(coordinates, offsetDistance);

    return (
        <>
            {offsetCoordinatesArray.map((offsetCoordinates, index) => (
                <LeafletPolygon
                    key={index}
                    positions={offsetCoordinates.map(createLeafletLatLngFromCoordinate)}
                    fillColor={MAP.OFFSET_POLYGON_COLOR}
                    color={MAP.OFFSET_POLYGON_COLOR}
                    weight={MAP.BORDER_WIDTH}
                    interactive={false}
                />
            ))}
        </>
    );
};
