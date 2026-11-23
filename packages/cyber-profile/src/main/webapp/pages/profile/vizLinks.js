/** Link and text-row helpers for visualization tools. No React imports. */

/** Replaces `$value$` and `$label$` in a URL or SPL template. Works with cellHref and the viz text row. */
export function fillTemplate(template, value, label) {
    return String(template)
        .split('$value$')
        .join(value)
        .split('$label$')
        .join(label);
}

/** Escapes quotes and backslashes so a cell value can be dropped into an SPL string. Works with buildSearchLink. */
export function escapeSplValue(value) {
    return String(value == null ? '' : value)
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"');
}

/** Returns the locale prefix before `/app/` (for example `/en-US`). Works with Splunk Web pathnames. */
export function splunkPathPrefix(pathname) {
    const path = String(pathname || '');
    const idx = path.indexOf('/app/');
    return idx > 0 ? path.slice(0, idx) : '';
}

/** Prepends the Splunk locale prefix to same-app `/app/` or `/manager/` paths. Works with buildUrlLink and buildSearchLink. */
export function withSplunkPrefix(url, prefix) {
    if (!prefix) return url;
    if (url.indexOf('/app/') === 0 || url.indexOf('/manager/') === 0) {
        return prefix + url;
    }
    return url;
}

/** Allows only http(s) or a same-app single-slash path. Blocks `javascript:` and protocol-relative URLs. Works with buildUrlLink. */
export function isSafeUrlTemplate(template) {
    const text = String(template == null ? '' : template).trim();
    return /^https?:\/\//i.test(text) || /^\/(?![/\\])/.test(text);
}

/** Builds a cell link from a URL template. Works with VizTools text-row cells and Splunk page paths. */
export function buildUrlLink(template, value, label, pathname) {
    const text = String(template == null ? '' : template).trim();
    if (!text || !isSafeUrlTemplate(text)) return '';
    const url = fillTemplate(
        text,
        encodeURIComponent(value == null ? '' : value),
        encodeURIComponent(label == null ? '' : label)
    );
    const prefix =
        pathname == null && typeof window !== 'undefined'
            ? splunkPathPrefix(window.location.pathname)
            : splunkPathPrefix(pathname);
    return withSplunkPrefix(url, prefix);
}

/** Builds a Splunk search URL from an SPL template plus earliest/latest. Works with the Search app and viz cell tools. */
export function buildSearchLink(template, value, label, earliest, latest, pathname) {
    const text = String(template == null ? '' : template).trim();
    if (!text) return '';
    const spl = fillTemplate(text, escapeSplValue(value), escapeSplValue(label));
    let url = `/app/search/search?q=${encodeURIComponent(spl)}`;
    const early = String(earliest == null ? '' : earliest).trim();
    const late = String(latest == null ? '' : latest).trim();
    if (early) url += `&earliest=${encodeURIComponent(early)}`;
    if (late) url += `&latest=${encodeURIComponent(late)}`;
    const prefix =
        pathname == null && typeof window !== 'undefined'
            ? splunkPathPrefix(window.location.pathname)
            : splunkPathPrefix(pathname);
    return withSplunkPrefix(url, prefix);
}

/** Picks a cell link: URL, then URL field, then search template. Works with VizTools and the tools prop on VizCard. */
export function cellHref(cell, tools, pathname) {
    const value = cell.value;
    const label = cell.label;
    return (
        buildUrlLink(cell.url, value, label, pathname) ||
        buildUrlLink(cell.urlFromField, value, label, pathname) ||
        buildSearchLink(cell.search, value, label, tools.linkEarliest, tools.linkLatest, pathname)
    );
}

/** Returns text-row cells that have a value, hiding empty ones. Works with VizTools and chart tools from demo or live rows. */
export function visibleCells(tools) {
    if (!tools || tools.showTextRow === false) return [];
    return (Array.isArray(tools.cells) ? tools.cells : []).filter(
        (cell) => String(cell?.value ?? '').trim() !== ''
    );
}

/** Returns the info-button text, or empty when info is turned off. Works with the VizTools info popover. */
export function infoTextOf(tools) {
    if (!tools || tools.showInfo === false) return '';
    return String(tools.infoText ?? '').trim();
}

/** Stores checked table rows and returns the feedback-page URL for those ids. Works with AssetResultsTable and the feedback form. */
export function buildFeedbackHref(appId, selectedRows) {
    const payload = (Array.isArray(selectedRows) ? selectedRows : []).map((row) => ({
        id: row.id,
        name: row.name,
        category: row.category,
    }));
    try {
        if (typeof sessionStorage !== 'undefined') {
            sessionStorage.setItem('ss_profile_feedback_assets', JSON.stringify(payload));
        }
    } catch (e) {
        // ignore
    }
    const ids = payload.map((row) => row.id).join(',');
    return `/app/${appId}/feedback?assets=${encodeURIComponent(ids)}`;
}
