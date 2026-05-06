import { createRoot } from 'react-dom/client';
import React from 'react';
import VizApp from './VizApp';

const roots = new WeakMap();

export function mountViz(el, props) {
    let root = roots.get(el);
    if (!root) {
        root = createRoot(el);
        roots.set(el, root);
    }
    root.render(<VizApp {...props} />);
}

export function unmountViz(el) {
    const root = roots.get(el);
    if (!root) {
        return;
    }
    root.unmount();
    roots.delete(el);
}
