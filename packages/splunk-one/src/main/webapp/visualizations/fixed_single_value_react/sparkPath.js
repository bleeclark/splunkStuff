export function sparkBounds(minIn, maxIn) {
    const lo = parseFloat(String(minIn), 10);
    const hi = parseFloat(String(maxIn), 10);

    let loN = Number.isFinite(lo) ? lo : 0;
    let hiN = Number.isFinite(hi) ? hi : 100;

    if (loN > hiN) {
        const t = loN;
        loN = hiN;
        hiN = t;
    }
    if (hiN <= loN) {
        hiN = loN + 1;
    }
    return { min: loN, max: hiN };
}

export function sparkPath(values, w, h, padL, padR, padT, padB, vmin, vmax) {
    const iw = Math.max(1, w - padL - padR);
    const ih = Math.max(1, h - padT - padB);
    const n = values.length;
    if (n < 2) {
        return '';
    }
    const xStep = iw / (n - 1);
    const parts = [];
    for (let i = 0; i < n; i += 1) {
        const v = Number(values[i]);
        let ratio = (v - vmin) / (vmax - vmin);
        ratio = Math.max(0, Math.min(1, ratio));
        const x = padL + i * xStep;
        const y = padT + ih - ratio * ih;
        parts.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`);
    }
    return parts.join(' ');
}
