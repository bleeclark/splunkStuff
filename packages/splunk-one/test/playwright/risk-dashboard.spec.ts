const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const pkgRoot = path.join(__dirname, '../..');
const stageRiskJs = path.join(pkgRoot, 'stage/appserver/static/pages/risk.js');

test.describe('risk dashboard build artifacts', () => {
    test('risk.js page bundle exists after build', async () => {
        expect(fs.existsSync(stageRiskJs)).toBe(true);
        const stat = fs.statSync(stageRiskJs);
        expect(stat.size).toBeGreaterThan(1000);
    });

    test('risk view xml and classic dashboard registered', async () => {
        const riskXml = path.join(pkgRoot, 'stage/default/data/ui/views/risk.xml');
        const classicXml = path.join(
            pkgRoot,
            'stage/default/data/ui/views/risk_dashboard.xml'
        );
        expect(fs.readFileSync(riskXml, 'utf8')).toContain('risk.html');
        expect(fs.readFileSync(classicXml, 'utf8')).toContain('filter_earliest');
    });
});
