import React, { FunctionComponent, SVGProps } from 'react';

import { AUTHENTIC_BLUE_900 } from '../../common/colors';

interface Props extends SVGProps<SVGSVGElement> {
    iconColor?: string;
}

export const IconForHorizontal: FunctionComponent<Props> = ({ iconColor = AUTHENTIC_BLUE_900, ...props }: Props) => (
    <svg className="z-50 bg-red-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width={16} height={16}>
        <path d="M21.883 12l-7.527 6.235.644.765 9-7.521-9-7.479-.645.764 7.529 6.236h-21.884v1h21.883z"/>
    </svg>
);
