import { test, expect } from '@playwright/test';

test('LineChart shows hover tooltip (document-capture hover + portal)', async ({ page }) => {
    await page.goto('/');

    const host = page.getByTestId('hover-chart-host');
    await expect(host).toBeVisible();

    await expect(page.getByTestId('splunkstuff-line-chart-area')).toBeVisible();

    await page.evaluate(() => {
        const el = document.querySelector('[data-testid="splunkstuff-line-chart-area"]');
        if (!el) throw new Error('missing splunkstuff-line-chart-area');
        const r = el.getBoundingClientRect();
        const cx = r.left + r.width * 0.5;
        const cy = r.top + r.height * 0.5;
        const opts = { bubbles: true, cancelable: true, clientX: cx, clientY: cy, view: window };
        document.dispatchEvent(new MouseEvent('mousemove', opts));
        try {
            document.dispatchEvent(
                new PointerEvent('pointermove', {
                    ...opts,
                    pointerId: 1,
                    pointerType: 'mouse',
                })
            );
        } catch (_e) {
            /* ignore */
        }
    });

    const tip = page.getByTestId('splunkstuff-line-hover-tooltip');
    await expect(tip).toBeVisible({ timeout: 5000 });

    await expect(tip).toContainText(/\d/);
    await expect(tip).toContainText('%');
});
