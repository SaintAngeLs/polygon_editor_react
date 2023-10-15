import React, { FunctionComponent, SVGProps } from 'react';

import { AUTHENTIC_BLUE_900 } from '../../common/colors';

interface Props extends SVGProps<SVGSVGElement> {
    iconColor?: string;
}

export const IconForVertical: FunctionComponent<Props> = ({ iconColor = AUTHENTIC_BLUE_900, ...props }: Props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width={16} height={16}>
        <path d="M11 2.206l-6.235 7.528-.765-.645 7.521-9 7.479 9-.764.646-6.236-7.53v21.884h-1v-21.883z"/>
    </svg>
);
