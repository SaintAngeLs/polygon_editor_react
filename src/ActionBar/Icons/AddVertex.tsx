import React, { FunctionComponent, SVGProps } from 'react';

import { AUTHENTIC_BLUE_900 } from '../../common/colors';

interface Props extends SVGProps<SVGSVGElement> {
    iconColor?: string;
}

export const AddVertex: FunctionComponent<Props> = ({ iconColor = AUTHENTIC_BLUE_900, ...props }: Props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width={16} height={16}>
        <path 
        stroke-linecap="round" 
        stroke-linejoin="round" 
        d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);
