import React, { memo } from 'react';
import { LatLng, latLngBounds, LatLngBounds, LatLngTuple, LeafletMouseEvent } from 'leaflet';
import L from 'leaflet';
import { useMap, Pane, Polyline, Rectangle } from 'react-leaflet';
import flatten from 'lodash.flatten';
import 'react-toastify/dist/ReactToastify.css';
//import { ToastContainer, toast } from 'react-toastify';


import { Coordinate } from 'types';
import ReactDOMServer from 'react-dom/server';

import {
    createCoordinateFromLeafletLatLng,
    createLeafletLatLngBoundsFromCoordinates,
    createLeafletLatLngFromCoordinate,
    addCoordinates,
    subtractCoordinates,
    getPolygonEdges,
    isCoordinateInPolygon,
    isPolygonClosed,
    getMidPoint,
    bresenhamLine,
    styleToString,
} from '../helpers';
import { Modal } from '../common/components/Modal';
import { ExportPolygonForm } from '../conversion/ExportPolygonForm';
import { ImportPolygonForm } from '../conversion/ImportPolygonForm';
//import { TileLayer } from '../leaflet/TileLayer';
import { Algorithms, MAP } from '../constants';
import { Map, Container } from '../leaflet/Map';
import { ActionBar } from '../ActionBar/ActionBar';
import { EdgeVertex } from './EdgeVertex';
import { PolygonVertex } from './PolygonVertex';
import { BoundaryPolygon } from './BoundaryPolygon';
import { Polygon } from './Polygon';
import MapInner from './MapInner';
import { EdgeConstraintsBar } from '../ActionBar/EdgeConstraintsBar';
import { IconForHorizontal } from '../ActionBar/Icons/IconForHorizontal';
import { IconForVertical } from '../ActionBar/Icons/IconForVertical';
import { OffsetPolygon } from './OffsetPolygon';

interface MapSnapshot {
    reframe: boolean;
    size: string;
}

export interface Props {
    /**
     * activePolygonIndex is the index of the polygon that is currently available for editing
     */
    activePolygonIndex: number;
    highlightedPolygonIndex?: number;
    polygonCoordinates: Coordinate[][];
    boundaryPolygonCoordinates: Coordinate[];
    selection: Set<number>;
    editable: boolean;
    drawable: boolean;
    initialCenter: LatLngTuple;
    initialZoom: number;
    isPolygonClosed: boolean;
    onClick?: (index: number) => void;
    onMouseEnter?: (index: number) => void;
    onMouseLeave?: (index: number) => void;
    addPoint: (coord: Coordinate) => void;
    setEdgeRestriction: (restriction: EdgeRestriction) => void;
    addPointToEdge: (coordinate: Coordinate, index: number) => void;
    deselectAllPoints: () => void;
    removePointFromSelection: (index: number) => void;
    addPointsToSelection: (indices: number[]) => void;
    selectPoints: (indices: number[]) => void;
    moveSelectedPoints: (newPosition: Coordinate) => void;
    deletePolygonPoints: () => void;
    selectAllPoints: () => void;
    setPolygon: (polygon: Coordinate[]) => void;
    onUndo: () => void;
    onRedo: () => void;
}

type MapType = ReturnType<typeof useMap>;

export interface State {
    isMovedPointInBoundary: boolean;
    isShiftPressed: boolean;
    isMoveActive: boolean;
    rectangleSelection: {
        startPosition: Coordinate;
        endPosition: Coordinate;
        startTime: number;
    } | null;
    selectedEdge:number | null;
    edgeRelationships: string[];
    tempPolygon: Coordinate[];
    previousMouseMovePosition?: Coordinate;
    edgeRestrictions: EdgeRestriction;
    isPenToolActive: boolean;
    isDrawToolActive: boolean;
    selectedEdgeRestriction: EdgeRestriction;
    autoRelationsActive: boolean;
    newPointPosition: Coordinate | null;
    showExportPolygonModal: boolean;
    showImportPolygonModal: boolean;
    showOffsetPolygon: boolean;
    offsetDistance: number; 
    currentAlgorithm: string;
    edgeMarkers: L.Marker[];
}

export type EdgeRestriction = 'horizontal' | 'vertical' | 'none' | null;


export class BaseMap extends React.Component<Props, State> {
    private map: MapType | null = null;

    state: State = {
        isMovedPointInBoundary: true,
        isShiftPressed: false,
        isMoveActive: false,
        rectangleSelection: null,
        previousMouseMovePosition: undefined,
        selectedEdge: null,
        edgeRestrictions: 'none',
        edgeRelationships: [], 
        tempPolygon: [],
        isPenToolActive: false,
        isDrawToolActive: false,
        selectedEdgeRestriction: null,
        newPointPosition: null,
        showExportPolygonModal: false,
        showImportPolygonModal: false,
        showOffsetPolygon: false,
        offsetDistance: 10, 
        currentAlgorithm: Algorithms.ALGORITHM_1,
        autoRelationsActive: false,
        edgeMarkers: [],
    };

    static getDerivedStateFromProps(props: Props, state: State): State {
        return {
            ...state,
            isPenToolActive: props.polygonCoordinates.length === 0 ? true : state.isPenToolActive,
            isDrawToolActive: props.polygonCoordinates.length === 0 ? false : state.isDrawToolActive,
        };
    }

    componentDidMount() {
        this.reframe();
        this.toggleVectorMode();

        this.updateEdgeMarkers();

        const container = this.map?.getContainer();

        if (container) {
            container.addEventListener('keydown', this.handleKeyDown, false);
            container.addEventListener('keyup', this.handleKeyUp);
        }
    }

    componentWillUnmount() {
        const container = this.map?.getContainer();

        if (container) {
            container.removeEventListener('keydown', this.handleKeyDown, false);
            container.removeEventListener('keyup', this.handleKeyUp);
        }
    }

    getSnapshotBeforeUpdate(prevProps: Props, prevState: State): MapSnapshot {
        const reframe =
            // Reframe when the polygon loads for the first time
            (prevProps.polygonCoordinates[prevProps.activePolygonIndex].length === 0 &&
                this.props.polygonCoordinates[this.props.activePolygonIndex].length > 1) ||
            // Reframe when the boundary polygon loads for the first time
            prevProps.boundaryPolygonCoordinates !== this.props.boundaryPolygonCoordinates;

        const size = this.getSize(this.map);

        return { reframe, size };
    }

    componentDidUpdate(prevProps: Readonly<Props>, prevState: Readonly<State>, { reframe, size }: MapSnapshot): void {
        if (reframe) {
            this.reframe();
        }

        if (this.props.polygonCoordinates !== prevProps.polygonCoordinates || 
            this.state.selectedEdge !== prevState.selectedEdge) {
          this.updateEdgeMarkers();
        }

        if (this.map && this.getSize(this.map) !== size) {
            this.map.invalidateSize();
        }
    }

    setMap = (map: MapType) => {
        if (map) {
            this.map = map;

            this.reframe();
            this.toggleVectorMode();

            const container = map?.getContainer();

            if (container) {
                container?.addEventListener('keydown', this.handleKeyDown, false);
                container?.addEventListener('keyup', this.handleKeyUp);
            }
        }
    };

    reframe = () => {
        const { polygonCoordinates, boundaryPolygonCoordinates, initialCenter, initialZoom } = this.props;

        if (polygonCoordinates[this.props.activePolygonIndex].length > 1) {
            this.reframeOnPolygon(polygonCoordinates);
        } else if (boundaryPolygonCoordinates.length > 0 && boundaryPolygonCoordinates !== MAP.WORLD_COORDINATES) {
            this.reframeOnPolygon(boundaryPolygonCoordinates);
        } else if (this.map) {
            this.map.setView(initialCenter, initialZoom);
        }
    };

    reframeOnPolygon = (polygonCoordinates: Coordinate[] | Coordinate[][]) => {
        if (this.map && polygonCoordinates.length > 0) {
            const bounds = createLeafletLatLngBoundsFromCoordinates(flatten(polygonCoordinates));

            this.map.fitBounds(bounds);
        }
    };

    toggleVectorMode = () => {
        if (!this.props.editable) {
            return;
        }
        this.setState({
            isPenToolActive: !this.state.isPenToolActive,
            isDrawToolActive: false, // Ensure the "draw" tool is deactivated when switching to the "pen" tool
            newPointPosition: null,
        });
    };

    toggleDrawMode = () => {
        if (!this.props.drawable) {
            return;
        }
        this.setState({
            isDrawToolActive: !this.state.isDrawToolActive,
            isPenToolActive: false, // Ensure the "pen" tool is deactivated when switching to the "draw" tool
            newPointPosition: null,
            tempPolygon: [],
        });
    };

    toggleOffsetPolygon = () => {
        this.setState(prevState => ({ showOffsetPolygon: !prevState.showOffsetPolygon }));
    }

    getSize = (map: MapType | null): string => {
        const container = map?.getContainer();
        return container ? `${container.clientHeight}x${container.clientWidth}` : '';
    };

    handleOnFocusClicked = () => {
        const activePolygon = this.props.polygonCoordinates[this.props.activePolygonIndex];
        if (activePolygon) {
            this.reframeOnPolygon(activePolygon);
        } else {
            this.reframe();
        }
    };

    toggleAutoRelations = (isActive: boolean) => {
        this.setState({ autoRelationsActive: isActive });
      };

    ///////////////////////////////////////////////////////////////////////////
    //                          Export / Import methods                      //
    ///////////////////////////////////////////////////////////////////////////

    handleExportPolygon = (serialized: string) => {
        navigator.clipboard.writeText(serialized);
    };

    handleExportPolygonActionClicked = () => {
        this.setState({ showExportPolygonModal: true });
    };

    handleExportPolygonModalClosed = () => {
        this.setState({ showExportPolygonModal: false });
    };

    handleImportPolygon = (coordinates: Coordinate[]) => {
        this.props.setPolygon(coordinates);
        this.reframeOnPolygon(coordinates);
    };

    handleImportPolygonActionClicked = () => {
        this.setState({ showImportPolygonModal: true });
    };

    handleImportPolygonModalClosed = () => {
        this.setState({ showImportPolygonModal: false });
    };

    ///////////////////////////////////////////////////////////////////////////
    //                          Map Events methods                           //
    ///////////////////////////////////////////////////////////////////////////

    handleMapClick = (event: LeafletMouseEvent) => {
        const coordinate = createCoordinateFromLeafletLatLng(event.latlng);

        const { isPolygonClosed, polygonCoordinates, activePolygonIndex } = this.props;
        
        if (this.state.isDrawToolActive) {
            // Check if the draw tool is active
            if (!this.state.tempPolygon || this.state.tempPolygon.length === 0) {
                // Start a new polygon if one doesn't exist
                this.setState({ tempPolygon: [coordinate] });
            } else {
                // Add a new point to the existing temporary polygon
                // this.setState((prevState) => ({
                //     tempPolygon: [...prevState.tempPolygon, coordinate],
                // }));

                this.setState((prevState) => ({
                    tempPolygon: [...prevState.tempPolygon, coordinate],
                  }), () => {
                    // After setting the new point, apply auto relations if active
                    if (this.state.autoRelationsActive) {
                      // Apply auto relations to the last edge of tempPolygon
                      this.applyAutoRelationsToNewEdge();
                    }
                  });
            }
        }
        else if (this.state.isPenToolActive && !isPolygonClosed) {
            if (this.state.currentAlgorithm === Algorithms.ALGORITHM_2) {
              const lastPointIndex = polygonCoordinates[activePolygonIndex].length - 1;
              if (lastPointIndex >= 0) {
                const lastPoint = polygonCoordinates[activePolygonIndex][lastPointIndex];
                this.drawLineWithBresenham(lastPoint, coordinate);
                console.log("Bresenham is activated.");
              } else {
                // If there are no points yet in the current polygon, just add the clicked point
                this.props.addPoint(coordinate);
                if (this.state.autoRelationsActive) {
                    // Apply auto relations to the last edge of tempPolygon
                    this.applyAutoRelationsToNewEdge();
                  }
                console.log("Adding initial point to the polygon.");
              }
            } else if (isCoordinateInPolygon(coordinate, this.props.boundaryPolygonCoordinates)) {
              // If not using Bresenham algorithm, just add the point (and ensure it's within the boundary)
              this.props.addPoint(coordinate);
               // Update the temporary polygon state with the new point
                this.setState((prevState) => ({
                    tempPolygon: [...prevState.tempPolygon, coordinate],
                }), () => {
                    // After setting the new point, check and apply auto relations if active
                    if (this.state.autoRelationsActive && this.state.tempPolygon.length > 1) {
                        console.log("THe new relation was set up")
                        this.applyAutoRelationsToNewEdge();
                    }
                });
              console.log('Adding the point to the map');
            }
          } else if (!this.state.isShiftPressed) {
            this.props.deselectAllPoints();
          }
    };

    applyAutoRelationsToNewEdge = () => {
        const { tempPolygon } = this.state;
        if (tempPolygon.length > 1) {
          const lastVertexIndex = tempPolygon.length - 1;
          const lastVertex = tempPolygon[lastVertexIndex];
          const secondLastVertex = tempPolygon[lastVertexIndex - 1];
      
          // Calculate the movement direction
          const deltaX = Math.abs(lastVertex.longitude - secondLastVertex.longitude);
          const deltaY = Math.abs(lastVertex.latitude - secondLastVertex.latitude);
      
          // Determine if movement is more horizontal or vertical
          const isHorizontalMove = deltaX > deltaY;
          const isVerticalMove = deltaY > deltaX;
      
          if (isHorizontalMove) {
            this.setEdgeRestrictionForIndex(lastVertexIndex - 1, 'horizontal');
          } else if (isVerticalMove) {
            this.setEdgeRestrictionForIndex(lastVertexIndex - 1, 'vertical');
          }
        }
      };
      
      setEdgeRestrictionForIndex = (index: number, restrictionType: 'horizontal' | 'vertical') => {
        const updatedEdgeRelationships = [...this.state.edgeRelationships];
        updatedEdgeRelationships[index] = restrictionType;
      
        this.setState({ edgeRelationships: updatedEdgeRelationships });
      };

    handleCompleteDrawing = () => {
        const { tempPolygon } = this.state;
        const { activePolygonIndex, polygonCoordinates } = this.props;

        if (tempPolygon && tempPolygon.length > 2) {
            // Merge the temporary polygon with the existing active polygon
            const mergedPolygon = [
                ...polygonCoordinates[activePolygonIndex],
                ...tempPolygon,
            ];

            this.props.setPolygon(mergedPolygon);
            // Clear the temporary polygon
            this.setState({ tempPolygon:  [] });
        }
    };

    handleMouseDownOnMap = (event: LeafletMouseEvent) => {
        const coordinate = createCoordinateFromLeafletLatLng(event.latlng);

        if (this.state.isShiftPressed) {
            this.setState({
                rectangleSelection: {
                    startPosition: coordinate,
                    endPosition: coordinate,
                    startTime: new Date().getTime(),
                },
            });
        }
    };

    handleMouseUpOnMap = () => {
        if (this.state.rectangleSelection) {
            this.setState({
                rectangleSelection: null,
            });
        }
    };

    handleMouseMoveOnMap = (event: LeafletMouseEvent) => {
        const mouseCoordinate = createCoordinateFromLeafletLatLng(event.latlng);
        if (this.state.rectangleSelection && new Date().getTime() - this.state.rectangleSelection?.startTime >= 100) {
            const start = this.state.rectangleSelection.startPosition;
            if (start) {
                const bounds: LatLngBounds = latLngBounds(createLeafletLatLngFromCoordinate(start), event.latlng);

                const activePolygon: Coordinate[] | undefined =
                    this.props.polygonCoordinates[this.props.activePolygonIndex];
                if (activePolygon) {
                    const pointsInsideBounds: number[] = [];
                    activePolygon.forEach((point, index) => {
                        if (bounds.contains(createLeafletLatLngFromCoordinate(point))) {
                            pointsInsideBounds.push(index);
                        }
                    });
                    this.props.selectPoints(pointsInsideBounds);
                }
            }
            this.setState({
                rectangleSelection: {
                    ...this.state.rectangleSelection,
                    endPosition: mouseCoordinate,
                },
            });
        } else {
            const newPointPosition =
                this.state.isPenToolActive &&
                !this.props.isPolygonClosed &&
                isCoordinateInPolygon(mouseCoordinate, this.props.boundaryPolygonCoordinates)
                    ? mouseCoordinate
                    : null;

            this.setState({ newPointPosition });
        }
    };

    handleMouseOutOfMap = () =>
        this.setState({
            newPointPosition: null,
            rectangleSelection: null,
        });

    ///////////////////////////////////////////////////////////////////////////
    //                           Vertex methods                              //
    ///////////////////////////////////////////////////////////////////////////

    onPolygonVertexClick = (index: number) => {
        if (
            index === 0 &&
            this.props.polygonCoordinates[this.props.activePolygonIndex].length > 2 &&
            !this.props.isPolygonClosed
        ) {
            // Close polygon when user clicks the first point
            this.props.addPoint({ ...this.props.polygonCoordinates[this.props.activePolygonIndex][0] });
        } else if (this.state.isShiftPressed) {
            if (this.props.selection.has(index)) {
                this.props.removePointFromSelection(index);
            } else {
                this.props.addPointsToSelection([index]);
            }
        } else {
            this.props.selectPoints([index]);
        }
    };

    startVertexMove = (latLng: LatLng) => {
        if (!this.state.isMoveActive) {
            this.setState({
                isMoveActive: true,
                previousMouseMovePosition: createCoordinateFromLeafletLatLng(latLng),
            });
            this.updateEdgeMarkers();
        }
        this.updateEdgeMarkers();
    };

    onPolygonVertexDragStart = (latLng: LatLng, index: number) => {
        if (!this.props.selection.has(index)) {
            if (this.state.isShiftPressed) {
                this.props.addPointsToSelection([index]);
            } else {
                this.props.selectPoints([index]);
            }
        }
        this.startVertexMove(latLng);
    };

    updateVertexPosition = (latLng: LatLng) => {
        
        if (this.state.isMoveActive && this.state.previousMouseMovePosition) {
            // const coordinate: Coordinate = createCoordinateFromLeafletLatLng(latLng);
            // const moveVector = subtractCoordinates(coordinate, this.state.previousMouseMovePosition);
        
            // const polygon = this.props.polygonCoordinates[this.props.activePolygonIndex];
            // const edgeRestrictions = this.state.edgeRelationships;
            
            // const nextCoordinates: Coordinate[] = [...polygon];
            
            // Array.from(this.props.selection).forEach((index) => {
            //   let updatedCoordinate = addCoordinates(polygon[index], moveVector);
        
            //   const edges = [(index - 1 + polygon.length) % polygon.length, index];
            //   for (const edgeIndex of edges) {
            //     const restriction = edgeRestrictions[edgeIndex];
            //     if (restriction === 'horizontal') {
            //       updatedCoordinate.latitude = polygon[index].latitude;
            //     } else if (restriction === 'vertical') {
            //       updatedCoordinate.longitude = polygon[index].longitude;
            //     }
            //   }
        
            //   nextCoordinates[index] = updatedCoordinate;
              
            //   // Additionally, update the adjacent vertices if they are part of a restricted edge
            //   edges.forEach((edgeIndex) => {
            //     const restriction = edgeRestrictions[edgeIndex];
            //     const adjacentVertexIndex = (edgeIndex + 1) % polygon.length;
            //     if (restriction === 'horizontal') {
            //       nextCoordinates[adjacentVertexIndex] = { ...nextCoordinates[adjacentVertexIndex], latitude: updatedCoordinate.latitude };
            //     } else if (restriction === 'vertical') {
            //       nextCoordinates[adjacentVertexIndex] = { ...nextCoordinates[adjacentVertexIndex], longitude: updatedCoordinate.longitude };
            //     }
            //   });
            // });
        
            // const inBoundary = nextCoordinates.every((nextCoordinate) =>
            //   isCoordinateInPolygon(nextCoordinate, this.props.boundaryPolygonCoordinates)
            // );
        
            // if (inBoundary) {
            //   this.props.setPolygon(nextCoordinates);
            //   this.setState({ previousMouseMovePosition: coordinate, isMovedPointInBoundary: true });
            // } else {
            //   this.setState({ isMovedPointInBoundary: false });
            // }

            const coordinate: Coordinate = createCoordinateFromLeafletLatLng(latLng);
            const moveVector = subtractCoordinates(coordinate, this.state.previousMouseMovePosition);

            const nextCoordinates = Array.from(this.props.selection)
                .map((i) => this.props.polygonCoordinates[this.props.activePolygonIndex][i])
                .map((coord) => addCoordinates(coord, moveVector));

            const inBoundary = nextCoordinates.every((nextCoordinate) =>
                isCoordinateInPolygon(nextCoordinate, this.props.boundaryPolygonCoordinates)
            );

            if (inBoundary) {
                this.props.moveSelectedPoints(moveVector);
                this.setState({ previousMouseMovePosition: coordinate, isMovedPointInBoundary: true });
            } else {
                this.setState({ isMovedPointInBoundary: false });
            }
        }

        if (this.state.autoRelationsActive && this.state.isMoveActive && this.state.previousMouseMovePosition) {
            const coordinate: Coordinate = createCoordinateFromLeafletLatLng(latLng);
            // Calculate the movement direction
            const deltaX = Math.abs(coordinate.longitude - this.state.previousMouseMovePosition.longitude);
            const deltaY = Math.abs(coordinate.latitude - this.state.previousMouseMovePosition.latitude);
            
            // Determine if movement is more horizontal or vertical
            const isHorizontalMove = deltaX > deltaY;
            const isVerticalMove = deltaY > deltaX;
    
            // Apply automatic edge restrictions based on the movement
            Array.from(this.props.selection).forEach((index) => {
                // Get the indexes of the adjacent edges for the moving vertex
                const edges = [(index - 1 + this.props.polygonCoordinates[this.props.activePolygonIndex].length) % this.props.polygonCoordinates[this.props.activePolygonIndex].length, index];
                edges.forEach((edgeIndex) => {
                    if (isHorizontalMove) {
                        // Set edge to horizontal if the movement is more horizontal
                        console.log("The edge restriociton is the to be the horisontal")
                        this.setEdgeRelationship('horizontal')
                        this.setEdgeRelationshipForIndex(edgeIndex, 'horizontal');
                    } else if (isVerticalMove) {
                        // Set edge to vertical if the movement is more vertical
                        console.log("The edge restriociton is the to be the vertical")
                        this.setEdgeRelationship('vertical')
                        this.setEdgeRelationshipForIndex(edgeIndex, 'vertical');
                    }
                });
            });
        }
        
    };

    setEdgeRestrictionForIndex = (index: number, restrictionType: EdgeRestriction) => {
        const updatedEdgeRelationships = [...this.state.edgeRelationships];
        updatedEdgeRelationships[index] = restrictionType;
        
        this.setState({ edgeRelationships: updatedEdgeRelationships });
    };

    endVertexMove = () => {
        if (this.state.isMoveActive) {
            this.setState({
                isMoveActive: false,
                previousMouseMovePosition: undefined,
                isMovedPointInBoundary: true,
            });
        }
    };

    handleEdgeClick = (coordinate: Coordinate, index: number) => {

        const { selectedEdge, edgeRelationships } = this.state;

        if (selectedEdge === index) {
          this.handleAddVertexInMiddleOfEdge();
        } else {
          const restriction = edgeRelationships[index] as EdgeRestriction;
          console.log(`Edge ${index} has restriction: ${restriction}`);
          this.setState({ selectedEdge: index, selectedEdgeRestriction: restriction }, () => {
            this.updateEdgeMarkers();
          });
          
          //this.updateEdgeMarkers();
        }
    };

    handleAddVertexInMiddleOfEdge = () => {
        if (this.state.selectedEdge === null) {
            console.error("No edge selected to add a vertex.");
            return;
        }
    
        const activePolygon = this.props.polygonCoordinates[this.props.activePolygonIndex];
        const startPoint = activePolygon[this.state.selectedEdge];
        const endPoint = activePolygon[(this.state.selectedEdge + 1) % activePolygon.length];
        // const midpoint = getMidPoint(startPoint, endPoint);
    
        
        let midpoint;

        if (this.state.edgeRelationships[this.state.selectedEdge] === 'horizontal') {
            midpoint = {
                latitude: (startPoint.latitude + endPoint.latitude) / 2,
                longitude: startPoint.longitude, // Keeps the longitude unchanged to ensure a horizontal edge.
            };
        } else if (this.state.edgeRelationships[this.state.selectedEdge] === 'vertical') {
            midpoint = {
                latitude: startPoint.latitude, // Keeps the latitude unchanged to ensure a vertical edge.
                longitude: (startPoint.longitude + endPoint.longitude) / 2,
            };
        } else {
            midpoint = getMidPoint(startPoint, endPoint); // Calculate the midpoint using your existing logic.
            this.updateEdgeMarkers();
        }
    
        this.props.addPointToEdge(midpoint, this.state.selectedEdge);

        // this.setState({
        //     selectedEdge: null
        // });

        const updatedEdgeRelationships = [...this.state.edgeRelationships];
        updatedEdgeRelationships[this.state.selectedEdge] = 'none';
        updatedEdgeRelationships.splice(this.state.selectedEdge + 1, 0, 'none'); // Add 'none' for the new edge created
        this.setState({
            selectedEdge: null,
            edgeRelationships: updatedEdgeRelationships,
        }
        //   , () => {
        //     this.updateEdgeMarkers();
        //   }
          );
        
    };

    setEdgeRelationshipForIndex = (index: number, relationshipType: 'horizontal' | 'vertical') => {
        const updatedEdgeRelationships = [...this.state.edgeRelationships];
        updatedEdgeRelationships[index] = relationshipType;
        
        this.setState({ edgeRelationships: updatedEdgeRelationships });
      };

    handleAlgorithmChange = (newAlgorithm: string) => {
        console.log("Changing algorithm to:", newAlgorithm);
        if (Object.values(Algorithms).includes(newAlgorithm)) {
            this.setState({ currentAlgorithm: newAlgorithm });
            // You can also add any additional logic here if needed, 
            // such as re-rendering the map, recalculating data, etc.
        } else {
            console.error("Attempted to switch to an invalid algorithm:", newAlgorithm);
        }
    };

    // drawLineWithBresenham = (startCoord: Coordinate, endCoord: Coordinate) => {
    //     const points = bresenhamLine(startCoord.latitude, startCoord.longitude, endCoord.latitude, endCoord.longitude);
    //     // Here, you can do whatever you want with the points, like updating the state or props
    //     this.props.setPolygon([...this.props.polygonCoordinates[this.props.activePolygonIndex], ...points]);
    // }
    drawLineWithBresenham = (startPoint: Coordinate, endPoint: Coordinate) => {
        const { activePolygonIndex } = this.props;
      
        const points = bresenhamLine(startPoint.longitude, startPoint.latitude, endPoint.longitude, endPoint.latitude);
        
        // Adding points in batches to avoid too many re-renders
        const batchSize = 1000;
        const addPoints = (index: number) => {
          const batch = points.slice(index, index + batchSize);
          this.addPointsToEdgeForBresenham(batch, activePolygonIndex);
          console.log(`Batch start index in drawLineWithBresenham method: ${index}`);

          if (index + batchSize < points.length) {
            requestAnimationFrame(() => addPoints(index + batchSize));
          }
        };
      
        addPoints(0);
      };
      

    addPointsToEdgeForBresenham = (points: Coordinate[], polygonIndex: number) => {
        points.forEach(point => {
            this.props.addPointToEdge(point, polygonIndex);
        });
    };
      

    setEdgeRelationship = (relationshipType: string) => {
        if (this.state.selectedEdge !== null) {
            const updatedEdgeRelationships = [...this.state.edgeRelationships];
            
            // Check adjacent edges' restrictions
            const prevEdgeIndex = (this.state.selectedEdge - 1 + updatedEdgeRelationships.length) % updatedEdgeRelationships.length;
            const nextEdgeIndex = (this.state.selectedEdge + 1) % updatedEdgeRelationships.length;
            
            if ((relationshipType === 'horizontal' && (updatedEdgeRelationships[prevEdgeIndex] === 'horizontal' || updatedEdgeRelationships[nextEdgeIndex] === 'horizontal')) ||
                (relationshipType === 'vertical' && (updatedEdgeRelationships[prevEdgeIndex] === 'vertical' || updatedEdgeRelationships[nextEdgeIndex] === 'vertical'))) {
              console.warn('Adjacent edges cannot both be vertical or horizontal');
                //   toast.warn("This edge already has the same restriction.", {
                //     position: toast.POSITION.TOP_RIGHT,
                //   });
              return;
            }
            
            updatedEdgeRelationships[this.state.selectedEdge] = relationshipType;
            this.setState({ edgeRelationships: updatedEdgeRelationships }, () => {
                console.log('Updated edgeRelationships:', this.state.edgeRelationships);
                this.updateEdgeCoordinates(); 
                this.updateEdgeMarkers();
            });
          }
    };

    setRestriction = (direction: EdgeRestriction) => {
        const { selectedEdge, edgeRelationships } = this.state;
        if (typeof selectedEdge === 'number') {
          const updatedEdgeRelationships = [...edgeRelationships];
          if (updatedEdgeRelationships[selectedEdge] === direction) {
            // toast.warn("This edge already has the same restriction.", {
            //   position: toast.POSITION.BOTTOM_LEFT,
            // });
            return;
          }
          updatedEdgeRelationships[selectedEdge] = direction!;
          this.setState({ edgeRelationships: updatedEdgeRelationships }, () => {
            console.log('Updated edgeRelationships:', this.state.edgeRelationships);
            this.updateEdgeCoordinates(); 
            this.updateEdgeMarkers();
          });
        }
      }
      
    

    handleRemoveConstraint = () => {
        if (this.state.selectedEdge !== null) {
            const updatedEdgeRelationships = [...this.state.edgeRelationships];
            updatedEdgeRelationships[this.state.selectedEdge] = 'none'; // or null, depending on your implementation
            this.setState({ edgeRelationships: updatedEdgeRelationships });
        }
    }

    handleSetHorizontal = () => {
        this.setRestriction('horizontal');
        
    }
    
    handleSetVertical = () => {
        this.setRestriction('vertical');
    }
    
    updateEdgeCoordinates = () => {
        const { selectedEdge, edgeRelationships } = this.state;
        if (selectedEdge !== null) {
          const activePolygon = [...this.props.polygonCoordinates[this.props.activePolygonIndex]];
          const restriction = edgeRelationships[selectedEdge];
      
          if (restriction === 'horizontal' || restriction === 'vertical') {
            // Check adjacent edges' restrictions
            const prevEdgeIndex = (selectedEdge - 1 + activePolygon.length) % activePolygon.length;
            const nextEdgeIndex = (selectedEdge + 1) % activePolygon.length;
            
            if (edgeRelationships[prevEdgeIndex] === restriction || edgeRelationships[nextEdgeIndex] === restriction) {
                console.warn('Adjacent edges cannot both be vertical or horizontal');
                return;
            }

            if (restriction === 'horizontal') {
                const avgLatitude = (activePolygon[selectedEdge].latitude + activePolygon[nextEdgeIndex].latitude) / 2;
                activePolygon[selectedEdge].latitude = avgLatitude;
                activePolygon[nextEdgeIndex].latitude = avgLatitude;
            } else {
                const avgLongitude = (activePolygon[selectedEdge].longitude + activePolygon[nextEdgeIndex].longitude) / 2;
                activePolygon[selectedEdge].longitude = avgLongitude;
                activePolygon[nextEdgeIndex].longitude = avgLongitude;
            }
        }

        this.props.setPolygon(activePolygon);
        }
    }

    
    ///////////////////////////////////////////////////////////////////////////
    //                      Keyboard handling methods                        //
    ///////////////////////////////////////////////////////////////////////////

    handleKeyDown = (e: KeyboardEvent) => {
        e.preventDefault();
        switch (e.key) {
            case 'Escape':
                this.props.deselectAllPoints();
                break;
            case 'Backspace':
                this.props.deletePolygonPoints();
                break;
            case 'Shift':
                this.setState({ isShiftPressed: true });
                break;
            case 'p':
                this.toggleVectorMode();
                break;
            case 'd':
                if (this.props.editable) {
                    this.props.deselectAllPoints();
                }
                break;
            case 'a':
                if (this.props.editable) {
                    this.props.selectAllPoints();
                }
                break;
            case 'f':
                this.reframe();
                break;
            case 'z':
                if (e.metaKey && e.shiftKey) {
                    this.props.onRedo();
                } else if (e.metaKey) {
                    this.props.onUndo();
                }
                break;
        }
    };

    handleKeyUp = (e: KeyboardEvent) => {
        switch (e.key) {
            case 'Shift':
                this.setState({ isShiftPressed: false });
                break;
        }
    };

    ///////////////////////////////////////////////////////////////////////////
    //                           Render methods                              //
    ///////////////////////////////////////////////////////////////////////////

    renderPolygonVertex = (coordinate: Coordinate, index: number) => {
        return (
            <PolygonVertex
                coordinate={coordinate}
                isSelected={this.props.selection.has(index)}
                key={index}
                index={index}
                onClick={this.onPolygonVertexClick}
                onDragStart={this.onPolygonVertexDragStart}
                onDrag={this.updateVertexPosition}
                onDragEnd={this.endVertexMove}
            />
        );
    };

    renderActivePolygonPoints = () => {
        return this.props.polygonCoordinates[this.props.activePolygonIndex].map(this.renderPolygonVertex);
    };

    renderVertexEdge = (coordinate: Coordinate, index: number) => (
        <EdgeVertex 
            key={index} 
                index={index} 
                coordinate={coordinate} 
                onClick={this.props.addPointToEdge} 
                edgeRestriction={this.state.edgeRestrictions}
            />
    );
   
    renderPolygonEdges = () => {
        const { polygonCoordinates, activePolygonIndex } = this.props;
        const activePolygon = polygonCoordinates[activePolygonIndex];
    
        if (!this.map) return null; // Ensure map is initialized
        // const map = this.map;
    
        const edgeVertices = getPolygonEdges(activePolygon).map((coordinate, index) => {
          // const isSelectedEdge = this.state.selectedEdge === index;
          // const edgeRelationship = this.state.edgeRelationships[index];
          // const isEdgeRestricted = edgeRelationship !== 'none';
    
    
          return (
            <EdgeVertex
              key={index}
              index={index}
              coordinate={coordinate}
              onClick={() => this.handleEdgeClick(coordinate, index)}
              edgeRestriction={this.state.edgeRestrictions} 
            >
              {/* {isSelectedEdge && (
                <div className='z-100'>
                  <div>Relationship: {edgeRelationship}</div>
                  <div>Restriction: {this.state.selectedEdgeRestriction}</div>
                  {isEdgeRestricted && (
                    <div className='constraint-text z-100 bg-red-900'>
                      Restriction: {edgeRelationship}
                    </div>
                  )}
                </div>
              )}
              {isSelectedEdge && isEdgeRestricted && (
                <div className='constraint-icon z-100 bg-red-900'>
                  {edgeRelationship === 'horizontal' && <IconForHorizontal />}
                  {edgeRelationship === 'vertical' && <IconForVertical />}
                </div>
              )} */}
            </EdgeVertex>
          );
        });
    
        return <>{edgeVertices}</>;
    };
    
    updateEdgeMarkers = () => {
        const { polygonCoordinates, activePolygonIndex } = this.props;
        const activePolygon = polygonCoordinates[activePolygonIndex];
      
        if (!this.map || !activePolygon) return;
      
        // Clear existing markers
        this.state.edgeMarkers.forEach(marker => {
          if (marker) this.map!.removeLayer(marker);
        });
      
        // Calculate and add new markers
        const newMarkers = getPolygonEdges(activePolygon).map((coordinate, index) => {
          const nextIndex = (index + 1) % activePolygon.length;
          const nextCoordinate = activePolygon[nextIndex];
          const adjustment = 0.001;
          const midpoint = {
            lat: (coordinate.latitude + nextCoordinate.latitude) / 2 + adjustment,
            lng: (coordinate.longitude + nextCoordinate.longitude) / 2 + adjustment,
          };
      
          const isSelectedEdge = this.state.selectedEdge === index;
          const edgeRelationship = this.state.edgeRelationships[index];
      
          if (isSelectedEdge && (edgeRelationship === 'horizontal' || edgeRelationship === 'vertical')) {
            const iconComponent = edgeRelationship === 'horizontal' ? <IconForHorizontal /> : <IconForVertical />;
            const iconHtml = ReactDOMServer.renderToStaticMarkup(iconComponent);
            const iconStyles = edgeRelationship === 'horizontal' 
                    ? { backgroundColor: '#0ff', borderRadius: '20%', border: '2px solid #0ff', boxSizing: 'border-box', lineHeight: '1', /* other styles */ } 
                    : { backgroundColor: '#0ff', borderRadius: '0', border: '2px solid #0ff', boxSizing: 'border-box', lineHeight: '1', /* other styles */ };


            const iconOptions = { 
                className: 'leaflet-div-icon', 
                html: `<div style="${styleToString(iconStyles)}">${iconHtml}</div>`
      }; 
            
      
            let marker = L.marker(midpoint, { icon: L.divIcon(iconOptions) }).addTo(this.map!);
            return marker;
          }
      
          return null;
        }).filter(marker => marker !== null) as L.Marker[];
      
        // Update the state with the new markers
        this.setState({ edgeMarkers: newMarkers });
      };
     
    handleOffsetChange = (isOffsetOn: boolean) => {
    if (isOffsetOn) {
        // Code to set the active polygon
        // Example: this.setActivePolygon(this.props.activePolygonIndex);
    }
    this.setState({ showOffsetPolygon: isOffsetOn });
    };
      
    renderOffsetPolygon = () => {
        const { polygonCoordinates, activePolygonIndex } = this.props;
        const { showOffsetPolygon } = this.state;

        if (!showOffsetPolygon || !polygonCoordinates[activePolygonIndex]) {
            return null;
        }

        // const activePolygon = polygonCoordinates[activePolygonIndex];

        return (
            <OffsetPolygon
                coordinates={this.props.polygonCoordinates[this.props.activePolygonIndex]}
                offsetDistance={100} 
                show={this.state.showOffsetPolygon}
            />
        );
    }


    renderInactivePolygons = () => {
        const activePolygonIsClosed = isPolygonClosed(this.props.polygonCoordinates[this.props.activePolygonIndex]);

        return this.props.polygonCoordinates.map((coordinates, index) => {
            const eventHandler = {
                onClick: () => this.props.onClick && this.props.onClick(index),
                onMouseEnter: () => this.props.onMouseEnter && this.props.onMouseEnter(index),
                onMouseLeave: () => this.props.onMouseLeave && this.props.onMouseLeave(index),
            };

            return index === this.props.activePolygonIndex ? null : (
                <Polygon
                    key={`${index}-${coordinates.reduce((acc, cur) => acc + cur.latitude + cur.longitude, 0)}`}
                    coordinates={coordinates}
                    isActive={false}
                    isHighlighted={index === this.props.highlightedPolygonIndex}
                    {...(activePolygonIsClosed ? eventHandler : {})}
                />
            );
        });
    };

    renderActivePolygon = () => {
        const coordinates = this.props.polygonCoordinates[this.props.activePolygonIndex];
        const index = this.props.activePolygonIndex;
        return (
            <Polygon
                coordinates={coordinates}
                isActive
                isHighlighted={false}
                onClick={() => this.props.onClick && this.props.onClick(index)}
                onMouseEnter={() => this.props.onMouseEnter && this.props.onMouseEnter(index)}
                onMouseLeave={() => this.props.onMouseLeave && this.props.onMouseLeave(index)}
            />
        );
    };

    renderPolyline = () => {
        const { newPointPosition } = this.state;
        const polygon = this.props.polygonCoordinates[this.props.activePolygonIndex].map(
            createLeafletLatLngFromCoordinate
        );

        if (polygon.length === 0) {
            return null;
        }

        const newPath = [polygon[polygon.length - 1]];
        if (newPointPosition) {
            newPath.push(createLeafletLatLngFromCoordinate(newPointPosition));
        }

        return (
            <>
                <Polyline positions={polygon} color={MAP.POLYGON_ACTIVE_COLOR} interactive={false} />
                <Polyline positions={newPath} color={MAP.POLYGON_ACTIVE_COLOR} dashArray="2 12" interactive={false} />
            </>
        );
    };

    renderSelectionRectangle = () => {
        if (this.state.rectangleSelection) {
            const bounds: LatLngBounds = latLngBounds(
                createLeafletLatLngFromCoordinate(this.state.rectangleSelection.startPosition),
                createLeafletLatLngFromCoordinate(this.state.rectangleSelection.endPosition)
            );

            return (
                <Rectangle
                    color={MAP.RECTANGLE_SELECTION_COLOR}
                    fillColor={MAP.RECTANGLE_SELECTION_COLOR}
                    bounds={bounds}
                />
            );
        }
        return null;
    };

    render() {
        const { editable,  drawable, selection, initialZoom, initialCenter } = this.props;
        const { newPointPosition, isPenToolActive, isDrawToolActive } = this.state;

        return (
            <Container>
                <Map
                    fadeAnimation
                    trackResize
                    zoomControl={false}
                    ref={this.setMap}
                    center={initialCenter}
                    zoom={initialZoom}
                    zoomDelta={2}
                    zoomSnap={1.5}
                    boxZoom={false}
                    drawCursor={!!newPointPosition}
                >
                    <BoundaryPolygon
                        coordinates={this.props.boundaryPolygonCoordinates}
                        hasError={!this.state.isMovedPointInBoundary}
                    />
                    {this.props.isPolygonClosed ? this.renderActivePolygon() : this.renderPolyline()}
                    {this.renderInactivePolygons()}

                    {editable && (
                        <Pane name="Polygon points">
                            {this.renderActivePolygonPoints()}
                            {this.props.isPolygonClosed && isPenToolActive && this.renderPolygonEdges()}
                        </Pane>
                    )}

                    {this.state.rectangleSelection && this.renderSelectionRectangle()}
                    {this.renderOffsetPolygon()}
                    {/* <TileLayer /> */}
                    <MapInner
                        onClick={this.handleMapClick}
                        onMouseOut={this.handleMouseOutOfMap}
                        onMouseMove={this.handleMouseMoveOnMap}
                        onMouseDown={this.handleMouseDownOnMap}
                        onMouseUp={this.handleMouseUpOnMap}
                    />
                </Map>
                <ActionBar
                    editable={editable}
                    drawable={drawable}
                    isVectorModeEnabled={isPenToolActive}
                    isDrawModeEnabled={isDrawToolActive}
                    onDelete={this.props.deletePolygonPoints}
                    onFocus={this.handleOnFocusClicked}
                    onAddVertex={this.handleAddVertexInMiddleOfEdge}
                    onEnableDrawMode={this.toggleDrawMode}
                    onEnableVectorMode={this.toggleVectorMode}
                    deleteInactive={selection.size === 0}
                    onExport={this.handleExportPolygonActionClicked}
                    onImport={this.handleImportPolygonActionClicked}
                />
                 <EdgeConstraintsBar 
                    onSetHorizontal={this.handleSetHorizontal} 
                    onSetVertical={this.handleSetVertical} 
                    onRemoveConstraint={this.handleRemoveConstraint} 
                    currentEdgeRestriction={this.state.selectedEdgeRestriction}
                    onOffsetChange={this.handleOffsetChange}
                    onAlgorithmChange={this.handleAlgorithmChange}
                    onAutoRelationsChange ={this.toggleAutoRelations}
                />

                {this.state.showExportPolygonModal && (
                    <Modal onClose={this.handleExportPolygonModalClosed}>
                        <ExportPolygonForm
                            polygon={this.props.polygonCoordinates[this.props.activePolygonIndex]}
                            onSubmit={this.handleExportPolygon}
                        />
                    </Modal>
                )}

                {this.state.showImportPolygonModal && (
                    <Modal onClose={this.handleImportPolygonModalClosed}>
                        <ImportPolygonForm onSubmit={this.handleImportPolygon} />
                    </Modal>
                )}
            </Container>
        );
    }
}

export default memo(BaseMap);
