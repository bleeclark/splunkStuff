const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const pkgRoot = path.join(__dirname, '../..');
const stageRoot = path.join(pkgRoot, 'stage');
const srcRoot = path.join(pkgRoot, 'src/main/resources/splunk');

function resolveRoots() {
    if (fs.existsSync(path.join(stageRoot, 'appserver/static/pages'))) {
        return { root: stageRoot, hasBundles: true };
    }
    return { root: srcRoot, hasBundles: false };
}

test.describe('profile + feedback build artifacts', () => {
    test('profile.js and feedback.js page bundles exist after build', async () => {
        const { root, hasBundles } = resolveRoots();
        test.skip(
            !hasBundles,
            'stage/appserver/static/pages missing — run yarn build before Playwright smoke'
        );
        for (const name of ['profile.js', 'feedback.js']) {
            const file = path.join(root, 'appserver/static/pages', name);
            expect(fs.existsSync(file)).toBe(true);
            expect(fs.statSync(file).size).toBeGreaterThan(1000);
        }
    });

    test('profile and feedback views are HTML React templates', async () => {
        const { root } = resolveRoots();
        const profileXml = fs.readFileSync(
            path.join(root, 'default/data/ui/views/profile.xml'),
            'utf8'
        );
        const feedbackXml = fs.readFileSync(
            path.join(root, 'default/data/ui/views/feedback.xml'),
            'utf8'
        );
        expect(profileXml).toContain('type="html"');
        expect(profileXml).toContain('profile.html');
        expect(feedbackXml).toContain('type="html"');
        expect(feedbackXml).toContain('feedback.html');
    });

    test('nav registers profile and Resources, not feedback', async () => {
        const { root } = resolveRoots();
        const nav = fs.readFileSync(
            path.join(root, 'default/data/ui/nav/default.xml'),
            'utf8'
        );
        expect(nav).toContain('name="profile"');
        expect(nav).toContain('label="Resources"');
        expect(nav).not.toContain('name="feedback"');
    });
});
