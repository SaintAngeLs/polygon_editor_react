import React, { useEffect, useState } from 'react';
import { action } from '@storybook/addon-actions';
import { Meta } from '@storybook/react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { PolygonDraw } from '../src/PolygonDraw/PolygonDraw';
import { Coordinate } from '../src/types';
import { BOUNDARY, POLYGON, POLYGON_ONE, POLYGON_TWO, POLYGON_THREE, POLYGON_FOUR, POLYGON_ZERO } from './polygons';
import { StateContainer } from './StateContainer';

import 'leaflet/dist/leaflet.css';
import { BaseMap } from '../src/PolygonDraw/Map';

const SAMPLES: Coordinate[][] = [POLYGON_ZERO, POLYGON_ONE, POLYGON_TWO, POLYGON_THREE, POLYGON_FOUR];

const polygonChangeAction = action('polygon changed');
const polygonClickedAction = action('polygon clicked');
const polygonMouseEnterAction = action('polygon mouseenter');
const polygonMouseLeaveAction = action('polygon mouseleave');

const meta: Meta = {
    title: 'PolygonDraw',
    decorators: [(Story) => <div style={{ height: '100vh', background: 'red' }}><Story /><ToastContainer /></div>],
};

export default meta;

// The defaul polygon draw is the only one polygone with the possibility to edit only this one polygone, 
// the MoultiplePolygones is the component wiht the list of the polygones and with the ability to edit all this polygone
// The new component is the one component with the ability co crete only the one polygone and no more.

// I want to update al of this components to make it possible to add the new polugone to each of the component 

export const Default = () => (
    <StateContainer initialState={{ polygons: [POLYGON] }}>
        {(state, setState) => (
            <>
                <PolygonDraw
                    //polygon={state.polygon}
                    polygon={state.polygons[state.polygons.length - 1]}
                    editable={true} 
                    // onChange={(polygon, isValid) => {
                    //     setState({ polygon: polygon });
                    //     polygonChangeAction(polygon, isValid);
                    // }}
                    onChange={(polygon, isValid) => {
                        const updatedPolygons = [...state.polygons];
                        if (isValid) {
                            updatedPolygons.push(polygon);
                        } else {
                            updatedPolygons[updatedPolygons.length - 1] = polygon;
                            
                        }
                        setState({ polygons: updatedPolygons });
                        polygonChangeAction(polygon, isValid);
                    }}
                />
            </>   
        )}
    </StateContainer>
);

export const MultiplePolygons = () => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [highlightedIndex, setHighlightedIndex] = useState<number | undefined>(undefined);
    const [polygons, setPolygons] = useState(SAMPLES);


    //  // Function to set restrictions on load
    //  const setInitialRestrictions = () => {
    //     // Example: Setting the first edge of the first polygon to be horizontal
    //     polygons[0] = etRestriction(polygons[0], 0);
    //     setPolygons([...polygons]);
    // };

    // useEffect(() => {
    //     setInitialRestrictions();
    // }, []);

    return (
        <PolygonDraw
            polygon={polygons}
            activeIndex={activeIndex}
            highlightedIndex={highlightedIndex}
            onClick={setActiveIndex}
            onChange={(newPolygons) => setPolygons(newPolygons)}
            onMouseEnter={(index) => setHighlightedIndex(index)}
            onMouseLeave={(index) => setHighlightedIndex((oldIndex) => (oldIndex === index ? undefined : oldIndex))}
        />
    );
};

// export const AutomaticReplace = {
//     render: () => {
//         const [index, setIndex] = useState(0);

//         useEffect(() => {
//             const id = setInterval(() => {
//                 setIndex((oldIndex) => {
//                     return (oldIndex + 1) % SAMPLES.length;
//                 });
//             }, 1000);
//             return () => clearInterval(id);
//         }, []);

//         return (
//             <PolygonDraw
//                 polygon={SAMPLES[index]}
//                 activeIndex={0}
//                 editable={false}
//                 onClick={(i) => polygonClickedAction(i)}
//                 onChange={(i) => polygonChangeAction(i)}
//                 onMouseEnter={(i) => polygonMouseEnterAction(i)}
//                 onMouseLeave={(i) => polygonMouseLeaveAction(i)}
//             />
//         );
//     },

//     name: 'Automatic replace',
// };

export const New = () => (
    <StateContainer initialState={{ polygons: [[]] as Coordinate[][] }}>
        {(state, setState) => (
            <PolygonDraw
                polygon={state.polygons[state.polygons.length - 1]}
                onChange={(polygon, isValid) => {
                    const updatedPolygons = [...state.polygons];
                    if (isValid) {
                        updatedPolygons.push(polygon); // Add a new polygon when the current one is complete.
                    } else {
                        updatedPolygons[updatedPolygons.length - 1] = polygon; // Update the current polygon.
                    }
                    setState({ polygons: updatedPolygons });
                    polygonChangeAction(polygon, isValid);
                }}
            />
        )}
    </StateContainer>
);

// Additional development 

// export const NotEditable = () => <PolygonDraw editable={false} polygon={POLYGON} boundary={BOUNDARY} />;

// export const Highlighted = () => (
//     <PolygonDraw editable={false} highlightedIndex={2} polygon={SAMPLES} boundary={BOUNDARY} />
// );

// export const WithBoundary = () => (
//     <StateContainer initialState={{ polygon: POLYGON }}>
//         {(state, setState) => (
//             <PolygonDraw
//                 polygon={state.polygon}
//                 boundary={BOUNDARY}
//                 onChange={(polygon, isValid) => {
//                     setState({ polygon });
//                     polygonChangeAction(polygon, isValid);
//                 }}
//             />
//         )}
//     </StateContainer>
// );

// export const WithInitialCenter = {
//     render: () => (
//         <PolygonDraw editable={false} polygon={[]} initialCenter={{ longitude: 2.1734, latitude: 41.3851 }} />
//     ),

//     name: 'With initial center',
// };

// export const WithInitialZoom = {
//     render: () => <PolygonDraw editable={false} polygon={[]} initialZoom={6} />,
//     name: 'With initial zoom',
// };
