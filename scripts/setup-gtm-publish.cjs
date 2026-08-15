#!/usr/bin/env node
const { google } = require('googleapis');
const fs = require('fs');

const ACCOUNT = '6371427711';
const CONTAINER = '261278316';
const WORKSPACE = '2';

const creds = JSON.parse(fs.readFileSync('/Users/sergioaldana/.secrets/repararya-oauth.json', 'utf8')).installed;
const oauth2Client = new google.auth.OAuth2(creds.client_id, creds.client_secret, 'http://localhost:8080/callback');
oauth2Client.setCredentials(JSON.parse(fs.readFileSync('/Users/sergioaldana/.secrets/gtm-token.json', 'utf8')));

const BASE = `accounts/${ACCOUNT}/containers/${CONTAINER}`;
const WS = `${BASE}/workspaces/${WORKSPACE}`;

async function api(path, method, data) {
  const t = (await oauth2Client.getAccessToken()).token;
  const res = await fetch(`https://tagmanager.googleapis.com/tagmanager/v2/${path}`, {
    method,
    headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
    body: data ? JSON.stringify(data) : undefined,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${res.status} ${JSON.stringify(body)}`);
  return body;
}

(async () => {
  console.log('=== CREATE VERSION ===');
  const version = await api(`${WS}:create_version`, 'POST', {
    name: 'Mayprotec — GA4 + GTM tracking',
    notes: 'GA4 config (G-MGY4Q16N34) + eventos: form_start, form_complete, modal_open, click_to_call, click_email, click_whatsapp, scroll_depth',
  });
  const vId = version.containerVersion.containerVersionId;
  console.log(`  version creada: ${vId}`);
  console.log('=== PUBLISH ===');
  const pub = await api(`${BASE}/versions/${vId}:publish`, 'POST', {});
  console.log('  PUBLISH OK:', JSON.stringify({ id: pub.containerVersion.containerVersionId, name: pub.containerVersion.name }));
  console.log('DONE');
})().catch((e) => {
  console.error('ERROR:', e.message);
  process.exit(1);
});