#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Verifies PROF-1 packaging artifacts (src + stage when built).
 */
const fs = require('fs');
const path = require('path');

const pkgRoot = path.join(__dirname, '..');
const stageRoot = path.join(pkgRoot, 'stage');
const srcRoot = path.join(pkgRoot, 'src/main/resources/splunk');
const appId = 'so_profile_prof1';

const requiredSrc = [
    'default/app.conf',
    'default/data/ui/views/profile.xml',
    'default/data/ui/nav/default.xml',
    'appserver/templates/profile.html',
];

const requiredStage = [
    ...requiredSrc,
    'appserver/static/pages/profile.js',
];

function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

function checkRoot(root, required, label) {
    required.forEach((rel) => {
        const full = path.join(root, rel);
        assert(fs.existsSync(full), `Missing ${rel} under ${label}`);
    });
}

function main() {
    checkRoot(srcRoot, requiredSrc, 'src');

    const profileXml = fs.readFileSync(
        path.join(srcRoot, 'default/data/ui/views/profile.xml'),
        'utf8'
    );
    assert(profileXml.includes('type="html"'), 'profile.xml must be type=html');
    assert(profileXml.includes('profile.html'), 'profile.xml must reference profile.html');
    assert(
        profileXml.includes(`${appId}:/templates/profile.html`),
        `profile.xml must use ${appId} template path`
    );

    const nav = fs.readFileSync(
        path.join(srcRoot, 'default/data/ui/nav/default.xml'),
        'utf8'
    );
    assert(nav.includes('name="profile"'), 'nav missing profile view');
    assert(!/studio/i.test(nav), 'nav should not list a Studio Profile entry');

    const tpl = fs.readFileSync(
        path.join(srcRoot, 'appserver/templates/profile.html'),
        'utf8'
    );
    assert(tpl.includes(`/static/app/${appId}/pages/`), 'template page_path must use app id');
    assert(/page_asset_version\s*=/.test(tpl), 'template must set page_asset_version for cache-bust');

    const pageSrc = path.join(pkgRoot, 'src/main/webapp/pages/profile/index.jsx');
    assert(fs.existsSync(pageSrc), 'missing pages/profile/index.jsx');
    const page = fs.readFileSync(pageSrc, 'utf8');
    assert(page.includes('@splunk/react-page/18'), 'page must boot with react-page/18');
    assert(page.includes('getUserTheme'), 'page must use getUserTheme()');
    assert(page.includes('FILTER_OPTIONS') || page.includes('getProfileFeed'), 'page must wire filter feeds');

    if (fs.existsSync(stageRoot)) {
        checkRoot(stageRoot, requiredStage, 'stage');
        console.log('verify: ok (src + stage)');
    } else {
        console.log('verify: ok (src only — run yarn build for stage)');
    }
}

main();
