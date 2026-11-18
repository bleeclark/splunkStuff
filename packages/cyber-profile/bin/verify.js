#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Verifies so_cyber_profile packaging artifacts (src + stage when built).
 *
 * Splunk mapping (do not confuse URL with filesystem):
 *   URL:  /static/app/so_cyber_profile/pages/<page>.js
 *   File: <app>/appserver/static/pages/<page>.js
 * Webpack correctly emits under appserver/static/pages/ — the app id is only in the URL.
 */
const fs = require('fs');
const path = require('path');

const pkgRoot = path.join(__dirname, '..');
const stageRoot = path.join(pkgRoot, 'stage');
const srcRoot = path.join(pkgRoot, 'src/main/resources/splunk');
const appId = 'so_cyber_profile';
const templatesDir = path.join(srcRoot, 'appserver/templates');

const requiredSrc = [
    'default/app.conf',
    'default/data/ui/views/profile.xml',
    'default/data/ui/nav/default.xml',
    'appserver/templates/profile.html',
];

/** Filesystem path under the app (NOT /static/app/<id>/…). */
const requiredStagePages = ['appserver/static/pages/profile.js'];

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

function listHtmlTemplates() {
    return fs
        .readdirSync(templatesDir)
        .filter((name) => name.endsWith('.html'))
        .sort();
}

function readAppBuild() {
    const conf = fs.readFileSync(path.join(srcRoot, 'default/app.conf'), 'utf8');
    const match = conf.match(/^\s*build\s*=\s*(\S+)/m);
    assert(match, 'app.conf must set build =');
    return match[1];
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

    const appBuild = readAppBuild();
    const templates = listHtmlTemplates();
    assert(templates.length > 0, 'no HTML templates found');

    templates.forEach((name) => {
        const tpl = fs.readFileSync(path.join(templatesDir, name), 'utf8');
        assert(
            tpl.includes(`/static/app/${appId}/pages/`),
            `${name}: page_path must use /static/app/${appId}/pages/ (Splunk URL)`
        );
        const versionMatch = tpl.match(/page_asset_version\s*=\s*"([^"]+)"/);
        assert(versionMatch, `${name}: must set page_asset_version for cache-bust`);
        assert(
            versionMatch[1] === appBuild,
            `${name}: page_asset_version "${versionMatch[1]}" must match app.conf build "${appBuild}"`
        );
    });

    const pageSrc = path.join(pkgRoot, 'src/main/webapp/pages/profile/index.jsx');
    assert(fs.existsSync(pageSrc), 'missing pages/profile/index.jsx');
    const page = fs.readFileSync(pageSrc, 'utf8');
    assert(page.includes('@splunk/react-page/18'), 'page must boot with react-page/18');
    assert(page.includes('getUserTheme'), 'page must use getUserTheme()');
    assert(
        /import\s*\{[^}]*useProfileData[^}]*\}\s*from\s*['"]\.\/hooks\/useProfileData['"]/.test(page) ||
            page.includes("from './hooks/useProfileData'"),
        'page must import useProfileData from ./hooks/useProfileData'
    );
    assert(page.includes('useProfileData('), 'page must call useProfileData(...)');

    if (fs.existsSync(stageRoot)) {
        checkRoot(stageRoot, requiredStagePages, 'stage');
        // Wrong nested layout people sometimes expect from the URL — must not exist.
        assert(
            !fs.existsSync(path.join(stageRoot, `appserver/static/app/${appId}/pages/profile.js`)),
            `stage must NOT nest pages under appserver/static/app/${appId}/ (URL app id ≠ filesystem)`
        );
        templates.forEach((name) => {
            const pageName = name.replace(/\.html$/, '');
            const bundle = path.join(stageRoot, 'appserver/static/pages', `${pageName}.js`);
            assert(
                fs.existsSync(bundle),
                `Missing stage bundle appserver/static/pages/${pageName}.js for template ${name}`
            );
        });
        const stageConf = fs.readFileSync(path.join(stageRoot, 'default/app.conf'), 'utf8');
        const stageBuild = (stageConf.match(/^\s*build\s*=\s*(\S+)/m) || [])[1];
        assert(
            stageBuild === appBuild,
            `stage app.conf build "${stageBuild}" must match src build "${appBuild}"`
        );
        console.log(`verify: ok (src + stage), build=${appBuild}, templates=${templates.length}`);
    } else {
        console.log(`verify: ok (src only — run yarn build for stage), build=${appBuild}`);
    }
}

main();
