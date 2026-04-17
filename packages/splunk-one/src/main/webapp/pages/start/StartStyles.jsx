import React from 'react';

/** Plain wrappers so this repo needs no styled-components; swap for your Splunk styles on the other machine. */
export function StyledContainer({ children, ...rest }) {
    return (
        <div style={{ padding: 24, maxWidth: 960 }} {...rest}>
            {children}
        </div>
    );
}

export function StyledGreeting({ children, ...rest }) {
    return <div {...rest}>{children}</div>;
}
