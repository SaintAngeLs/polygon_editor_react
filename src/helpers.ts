import { LatLng, LatLngBounds, LatLngTuple } from 'leaflet';
import isEqual from 'lodash.isequal';
import * as turf from '@turf/turf';

import { Coordinate } from './types';
//import { EdgeRestriction } from 'PolygonDraw/Map';

export const createLeafletLatLngTupleFromCoordinate = (coordinate: Coordinate): LatLngTuple => [
    coordinate.latitude,
    coordinate.longitude,
];

export const createLeafletLatLngBoundsFromCoordinates = (coordinates: Coordinate[]) =>
    new LatLngBounds(coordinates.map(createLeafletLatLngTupleFromCoordinate));

export const createLeafletLatLngFromCoordinate = (coordinate: Coordinate) =>
    new LatLng(coordinate.latitude, coordinate.longitude);

export const createCoordinateFromLeafletLatLng = (latLng: LatLng): Coordinate => ({
    latitude: latLng.lat,
    longitude: latLng.lng,
});

export const addCoordinates = (coordA: Coordinate, coordB: Coordinate): Coordinate => ({
    latitude: coordA.latitude + coordB.latitude,
    longitude: coordA.longitude + coordB.longitude,
});

export const subtractCoordinates = (coordA: Coordinate, coordB: Coordinate): Coordinate => ({
    latitude: coordA.latitude - coordB.latitude,
    longitude: coordA.longitude - coordB.longitude,
});

export const isPolygonClosed = (coordinates: Coordinate[]): boolean =>
    coordinates && coordinates.length > 2 && isEqual(coordinates[0], coordinates[coordinates.length - 1]);

export const isClosingPointsSelected = (coordinates: Coordinate[], selection: Set<number>): boolean =>
    isPolygonClosed(coordinates) && (selection.has(coordinates.length - 1) || selection.has(0));

// https://wrf.ecse.rpi.edu//Research/Short_Notes/pnpoly.html
export const isCoordinateInPolygon = (coordinate: Coordinate, polygon: Coordinate[]): boolean => {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const intersect =
            polygon[i].longitude > coordinate.longitude !== polygon[j].longitude > coordinate.longitude &&
            coordinate.latitude <
                ((polygon[j].latitude - polygon[i].latitude) * (coordinate.longitude - polygon[i].longitude)) /
                    (polygon[j].longitude - polygon[i].longitude) +
                    polygon[i].latitude;
        if (intersect) {
            inside = !inside;
        }
    }

    return inside;
};
// export const createOffsetCoordinates = (coordinates: Coordinate[], offsetDistance: number): Coordinate[] => {
//     const turfPolygon = turf.polygon([
//       coordinates.map(coord => [coord.longitude, coord.latitude]),
//     ]);
  
//     const offsetPolygon = turf.transformRotate(turf.buffer(turfPolygon, -Math.abs(offsetDistance), { units: 'meters' }), 0);
  
//     return offsetPolygon.geometry.coordinates[0].map(coord => ({
//       longitude: coord[0],
//       latitude: coord[1],
//     }));
//   };
export const createOffsetCoordinates = (coordinates: Coordinate[], offsetDistance: number): Coordinate[][] => {
    const turfPolygon = turf.polygon([
      coordinates.map(coord => [coord.longitude, coord.latitude]),
    ]);
  
    const offsetResult = turf.buffer(turfPolygon, -Math.abs(offsetDistance), { units: 'meters' });
  
    if (!offsetResult) {
      return [];
    }
  
    let polygons: any[]; // We'll use `any` for simplicity, but in a real-world scenario, you'd want to use a more specific type
    switch ((offsetResult.geometry.type as string)) {  // Type assertion added here
      case 'Polygon':
        polygons = [offsetResult.geometry.coordinates];
        break;
      case 'MultiPolygon':
        polygons = offsetResult.geometry.coordinates;
        break;
      default:
        return [];
    }
  
    return polygons.map(polygon => {
      return (polygon[0] as number[][]).map(coord => ({  // Type assertion added here
        longitude: coord[0],
        latitude: coord[1],
      }));
    });
  };
  
export function styleToString(styles: any) {
    return Object.entries(styles).map(([key, value]) => `${camelToKebab(key)}:${value}`).join(';');
}

export function camelToKebab(str: string) {
    return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}


export const movePolygonCoordinates = (
    polygon: Coordinate[],
    selectedCoordinates: Set<number>,
    moveVector: Coordinate
) => {
    const selection = new Set([...selectedCoordinates]);

    if (isClosingPointsSelected(polygon, selection)) {
        selection.add(0);
        selection.add(polygon.length - 1);
    }

    return polygon.map((coord, index) => {
        if (selection.has(index)) {
            return addCoordinates(coord, moveVector);
        } else {
            return coord;
        }
    });
};

export const removeSelectedPoints = (polygonCoordinates: Coordinate[], selectedPoints: Set<number>) => {
    const newPolygonCoordinates = polygonCoordinates.filter((polygonCoordinate, index) => !selectedPoints.has(index));
    const isOldPathClosed =
        polygonCoordinates.length > 1 &&
        isEqual(polygonCoordinates[0], polygonCoordinates[polygonCoordinates.length - 1]);
    const isNewPathClosed =
        newPolygonCoordinates.length > 1 &&
        isEqual(newPolygonCoordinates[0], newPolygonCoordinates[newPolygonCoordinates.length - 1]);

    // Open closed path if it has 3 points or less
    if (newPolygonCoordinates.length < 4 && isNewPathClosed) {
        newPolygonCoordinates.shift();
    }

    // Remove closing points if either of them was removed
    if (isOldPathClosed) {
        if (selectedPoints.has(0) && !selectedPoints.has(polygonCoordinates.length - 1)) {
            newPolygonCoordinates.pop();
        }
        if (!selectedPoints.has(0) && selectedPoints.has(polygonCoordinates.length - 1)) {
            newPolygonCoordinates.shift();
        }
    }

    // Close previously closed path if it has 3 points or more
    if (isOldPathClosed && !isNewPathClosed && newPolygonCoordinates.length > 2) {
        newPolygonCoordinates.push({ ...newPolygonCoordinates[0] });
    }

    return newPolygonCoordinates;
};

export const getCenterCoordinate = (coordA: Coordinate, coordB: Coordinate): Coordinate => ({
    latitude: (coordA.latitude + coordB.latitude) / 2,
    longitude: (coordA.longitude + coordB.longitude) / 2,
});

// Returns the center coordinates of the polygon edges
export const getPolygonEdges = (polygon: Coordinate[]) =>
    polygon.reduce<Coordinate[]>((edges, coordinate, index) => {
        if (index === 0 || isEqual(polygon[index], polygon[index - 1])) {
            return edges;
        }
        edges.push(getCenterCoordinate(polygon[index], polygon[index - 1]));
        return edges;
    }, []);

// Always returns a list of polygons from a single or multiple polygons
export const ensurePolygonList = (polygons: Coordinate[] | Coordinate[][]): Coordinate[][] => {
    if (polygons.length === 0) {
        return [[]];
    }

    if (isPolygonList(polygons)) {
        // we have to cast here because ts can not infer the type from Array.isArray
        return polygons;
    }

    // we have to cast here because ts can not infer the type from Array.isArray
    return [polygons];
};

export const isPolygonList = (polygons: Coordinate[] | Coordinate[][]): polygons is Coordinate[][] => {
    return Array.isArray(polygons[0]);
};


/**
     * function to calculate the midpoint of the edge
     * @param coord1
     * @param coord2
*/
export const getMidPoint = (coord1: Coordinate, coord2: Coordinate) => ({
    latitude: (coord1.latitude + coord2.latitude) / 2,
    longitude: (coord1.longitude + coord2.longitude) / 2

});

export function bresenhamLine(x0: number, y0: number, x1: number, y1: number): Coordinate[] {
    let points: Coordinate[] = [];
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = (x0 < x1) ? 0.00001 : -0.00001;
    const sy = (y0 < y1) ? 0.00001 : -0.00001;
    let err = dx - dy;

    const maxIterations = 1000000;
    let iterations = 0;

    // numarical issus according to the small presiccion, but
    // the React.Dom render runtime update issues resolve
    // the case of iterations numbers supremum is also addition
    // to the solution 

    const epsilon = 0.0000000001; 

    while (true) {
        if (++iterations > maxIterations) break;
        points.push({ latitude: y0, longitude: x0 });
        
        if (Math.abs(x0 - x1) < epsilon && Math.abs(y0 - y1) < epsilon) break;
        const e2 = 2 * err;
        if (e2 > -dy) { err -= dy; x0 += sx; }
        if (e2 < dx) { err += dx; y0 += sy; }
    }

    return points;
}

