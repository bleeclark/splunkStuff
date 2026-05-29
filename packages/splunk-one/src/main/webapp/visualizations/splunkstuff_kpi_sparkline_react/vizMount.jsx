import { createRoot } from 'react-dom/client';
import React from 'react';
import KpiSparklineReactApp from './KpiSparklineReactApp';

const roots = new WeakMap();

export function mountViz(el, props) {
    let root = roots.get(el);
    if (!root) {
        root = createRoot(el);
        roots.set(el, root);
    }
    root.render(<KpiSparklineReactApp {...props} />);
}

export function unmountViz(el) {
    const root = roots.get(el);
    if (!root) {
        return;
    }
    root.unmount();
    roots.delete(el);
}
