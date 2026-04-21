import React from 'react';
import PropTypes from 'prop-types';

export function DocContainer({ children, ...rest }) {
    return (
        <div style={{ padding: 24, maxWidth: 880 }} {...rest}>
            {children}
        </div>
    );
}

DocContainer.propTypes = {
    children: PropTypes.node,
};
DocContainer.defaultProps = {
    children: null,
};
