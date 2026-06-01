import { createRoot } from 'react-dom/client';
import React from 'react';
import KpiSparklineReactApp from './KpiSparklineReactApp';

const roots = new WeakMap();
const lastProps = new WeakMap();

export function mountViz(el, props) {
    let root = roots.get(el);
    if (!root) {
        root = createRoot(el);
        roots.set(el, root);
    }
    lastProps.set(el, props);
    root.render(<KpiSparklineReactApp {...props} />);
}

export function reflowViz(el) {
    const props = lastProps.get(el);
    if (!props) {
        return;
    }
    const reflowTick = (props.reflowTick || 0) + 1;
    mountViz(el, { ...props, reflowTick });
}

export function unmountViz(el) {
    const root = roots.get(el);
    if (!root) {
        return;
    }
    root.unmount();
    roots.delete(el);
    lastProps.delete(el);
}
