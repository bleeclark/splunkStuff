export function parseTruthyOption(raw) {
    const normalized = String(raw == null ? '' : raw)
        .trim()
        .toLowerCase();
    return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on';
}

export function sanitizeHexColor(raw, fallbackColor) {
    const candidate = String(raw == null ? '' : raw).trim();
    return /^#[0-9A-Fa-f]{6}$/.test(candidate) ? candidate : fallbackColor;
}

export function clampNumber(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
}
