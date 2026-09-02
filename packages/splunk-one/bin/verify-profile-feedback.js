#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Verifies Profile + Feedback page assets are present after build.
 */
const fs = require('fs');
const path = require('path');

const pkgRoot = path.join(__dirname, '..');
const stageRoot = path.join(pkgRoot, 'stage');
const srcRoot = path.join(pkgRoot, 'src/main/resources/splunk');

const requiredStage = [
    'appserver/static/pages/profile.js',
    'appserver/static/pages/feedback.js',
    'default/data/ui/views/profile.xml',
    'default/data/ui/views/feedback.xml',
    'appserver/templates/profile.html',
    'appserver/templates/feedback.html',
];

const requiredSrc = [
    'default/data/ui/views/profile.xml',
    'default/data/ui/views/feedback.xml',
    'appserver/templates/profile.html',
    'appserver/templates/feedback.html',
    'default/data/ui/nav/default.xml',
];

function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

function main() {
    const stageExists = fs.existsSync(stageRoot);
    const root = stageExists ? stageRoot : srcRoot;
    const required = stageExists ? requiredStage : requiredSrc;
    const label = stageExists ? 'stage' : 'src';

    required.forEach((rel) => {
        const full = path.join(root, rel);
        assert(
            fs.existsSync(full),
            `Missing ${rel} under ${label}${stageExists ? ' — run yarn build' : ''}`
        );
    });

    const profileXml = fs.readFileSync(
        path.join(root, stageExists ? 'default/data/ui/views/profile.xml' : 'default/data/ui/views/profile.xml'),
        'utf8'
    );
    const feedbackXml = fs.readFileSync(
        path.join(root, 'default/data/ui/views/feedback.xml'),
        'utf8'
    );
    assert(profileXml.includes('type="html"'), 'profile.xml should be type=html React view');
    assert(profileXml.includes('profile.html'), 'profile.xml should reference profile.html');
    assert(feedbackXml.includes('type="html"'), 'feedback.xml should be type=html React view');
    assert(feedbackXml.includes('feedback.html'), 'feedback.xml should reference feedback.html');

    const navPath = path.join(
        stageExists ? stageRoot : srcRoot,
        'default/data/ui/nav/default.xml'
    );
    const nav = fs.readFileSync(navPath, 'utf8');
    assert(nav.includes('name="profile"'), 'nav missing profile view');
    assert(nav.includes('label="Resources"'), 'nav missing Resources collection');
    assert(
        !nav.includes('name="feedback"'),
        'feedback should stay off the nav bar (Action 2 still opens the view)'
    );

    console.log(`verify-profile-feedback: ok (${label})`);
}

main();
