import React, { FunctionComponent } from 'react';
import styled from 'styled-components';

import { FREEDOM_RED_900 } from '../common/colors';

import { ActionButton, ActionButtonIcons } from './ActionButton';
import { LABELS } from '../constants';

const Container = styled.div`
    position: absolute;
    right: 0;
    bottom: 24px;
    display: flex;

    padding-right: 8px;
    padding-left: 8px;

    > * {
        margin-left: 8px;
    }
`;

export interface Props {
    editable: boolean;

    drawable: boolean;

    onFocus: () => void;

    onEnableDrawMode: (enabled?: boolean) => void;
    isVectorModeEnabled: boolean;

    onEnableVectorMode: (enabled?: boolean) => void;
    isDrawModeEnabled: boolean;

    onAddVertex: () => void;

    onDelete: () => void;
    deleteInactive: boolean;

    onExport: () => void;
    onImport: () => void;
}

export const ActionBar: FunctionComponent<Props> = ({
    editable,
    drawable,
    deleteInactive,
    isVectorModeEnabled,
    onEnableVectorMode,
    onEnableDrawMode,
    isDrawModeEnabled,
    onAddVertex,
    onFocus,
    onDelete,
    onExport,
    onImport,
}) => (
    <Container>
        {editable && (
            <>
                <ActionButton
                     onClick={(e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
                        e.stopPropagation();
                        //if (!isVectorModeEnabled) {
                            onEnableVectorMode(true);
                            //onEnableDrawMode(false);
                        //}
                    }}
                    icon={ActionButtonIcons.VECTOR_MODE}
                    inactive={!isVectorModeEnabled}
                    aria-label={`${isVectorModeEnabled ? 'Disable Editing' : 'Enable Editing'}`}
                >
                    {LABELS.PEN}
                </ActionButton>
                <ActionButton
                    onClick={onDelete}
                    icon={ActionButtonIcons.TRASHCAN}
                    activeIconColor={FREEDOM_RED_900}
                    disabled={deleteInactive}
                    inactive={deleteInactive}
                    aria-label="Delete"
                >
                    {LABELS.DELETE}
                </ActionButton>
            </>
        )}
        {drawable && (
            <>
                <ActionButton
                    onClick={(e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
                        e.stopPropagation();
                        //if (!isDrawModeEnabled) {
                            onEnableDrawMode(true);
                            //onEnableVectorMode(false);
                        //}
                    }}
                    icon={ActionButtonIcons.DRAW_MODE}
                    inactive={!isDrawModeEnabled}
                    aria-label={`${isDrawModeEnabled ? 'Disable Drawing' : 'Enable Drawing'}`}
                >
                    {LABELS.DRAW}
                </ActionButton>
                <ActionButton
                    onClick={onDelete}
                    icon={ActionButtonIcons.TRASHCAN}
                    activeIconColor={FREEDOM_RED_900}
                    disabled={deleteInactive}
                    inactive={deleteInactive}
                    aria-label="Delete"
                >
                    {LABELS.DELETE}
                </ActionButton>
            </>
        )}
        <ActionButton onClick={onAddVertex} icon={ActionButtonIcons.ADD_VERTEX}>
            {LABELS.ADD_VERTEX}
        </ActionButton>
        <ActionButton onClick={onImport} icon={ActionButtonIcons.IMPORT}>
            {LABELS.IMPORT}
        </ActionButton>
        <ActionButton onClick={onExport} icon={ActionButtonIcons.EXPORT}>
            {LABELS.EXPORT}
        </ActionButton>
        <ActionButton onClick={onFocus} icon={ActionButtonIcons.FRAME}>
            {LABELS.FOCUS}
        </ActionButton>
    </Container>
);
