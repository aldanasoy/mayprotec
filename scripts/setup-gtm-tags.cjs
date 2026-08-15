#!/usr/bin/env node
/**
 * Tags + publish para GTM Mayprotec (triggers/variables ya creados).
 * Trigger IDs: AllPages=3 tel=4 mailto=5 wa=6 form_start=7 form_complete=8 modal_open=9 scroll=10
 * Variable IDs: form_type=11 click_location=12 click_text=13 lead_servicio=14
 */
const { google } = require('googleapis');
const fs = require('fs');

const ACCOUNT = '6371427711';
const CONTAINER = '261278316';
const WORKSPACE = '2';
const GA4_ID = 'G-MGY4Q16N34';

const creds = JSON.parse(fs.readFileSync('/Users/sergioaldana/.secrets/repararya-oauth.json', 'utf8')).installed;
const oauth2Client = new google.auth.OAuth2(creds.client_id, creds.client_secret, 'http://localhost:8080/callback');
oauth2Client.setCredentials(JSON.parse(fs.readFileSync('/Users/sergioaldana/.secrets/gtm-token.json', 'utf8')));

const gtm = google.tagmanager({ version: 'v2', auth: oauth2Client });
const WS = `accounts/${ACCOUNT}/containers/${CONTAINER}/workspaces/${WORKSPACE}`;
const BASE = `accounts/${ACCOUNT}/containers/${CONTAINER}`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const delay = () => sleep(700);

async function api(path, method, data) {
  const res = await oauth2Client.request({
    url: `https://tagmanager.googleapis.com/tagmanager/v2/${path}`,
    method,
    data,
  });
  return res.data;
}

async function createTag(name, params, firing) {
  await delay();
  const res = await gtm.accounts.containers.workspaces.tags.create({
    parent: WS,
    requestBody: { name, type: 'gaawe', parameter: params, firingTriggerId: firing, tagFiringOption: 'oncePerEvent' },
  });
  console.log(`  tag OK: ${name} (${res.data.tagId})`);
  return res.data.tagId;
}

(async () => {
  await delay();
  const cfg = await gtm.accounts.containers.workspaces.tags.create({
    parent: WS,
    requestBody: {
      name: 'GA4 - Configuration',
      type: 'googtag',
      parameter: [{ type: 'template', key: 'tagId', value: GA4_ID }],
      firingTriggerId: ['3'],
      tagFiringOption: 'oncePerEvent',
    },
  });
  console.log(`  tag OK: GA4 - Configuration (${cfg.data.tagId})`);

  await createTag('GA4 - click_to_call', [
    { type: 'template', key: 'eventName', value: 'click_to_call' },
    { type: 'template', key: 'measurementIdOverride', value: GA4_ID },
  ], ['4']);

  await createTag('GA4 - click_email', [
    { type: 'template', key: 'eventName', value: 'click_email' },
    { type: 'template', key: 'measurementIdOverride', value: GA4_ID },
  ], ['5']);

  await createTag('GA4 - click_whatsapp', [
    { type: 'template', key: 'eventName', value: 'click_whatsapp' },
    { type: 'template', key: 'measurementIdOverride', value: GA4_ID },
    {
      type: 'list',
      key: 'eventParameters',
      list: [
        { type: 'map', map: [{ type: 'template', key: 'name', value: 'click_location' }, { type: 'template', key: 'value', value: '{{DLV - click_location}}' }] },
        { type: 'map', map: [{ type: 'template', key: 'name', value: 'click_text' }, { type: 'template', key: 'value', value: '{{DLV - click_text}}' }] },
      ],
    },
  ], ['6']);

  await createTag('GA4 - form_start', [
    { type: 'template', key: 'eventName', value: 'form_start' },
    { type: 'template', key: 'measurementIdOverride', value: GA4_ID },
    {
      type: 'list',
      key: 'eventParameters',
      list: [
        { type: 'map', map: [{ type: 'template', key: 'name', value: 'form_type' }, { type: 'template', key: 'value', value: '{{DLV - form_type}}' }] },
      ],
    },
  ], ['7']);

  await createTag('GA4 - form_submit_lead', [
    { type: 'template', key: 'eventName', value: 'form_complete' },
    { type: 'template', key: 'measurementIdOverride', value: GA4_ID },
    {
      type: 'list',
      key: 'eventParameters',
      list: [
        { type: 'map', map: [{ type: 'template', key: 'name', value: 'form_type' }, { type: 'template', key: 'value', value: '{{DLV - form_type}}' }] },
        { type: 'map', map: [{ type: 'template', key: 'name', value: 'lead_servicio' }, { type: 'template', key: 'value', value: '{{DLV - lead_servicio}}' }] },
      ],
    },
  ], ['8']);

  await createTag('GA4 - modal_open', [
    { type: 'template', key: 'eventName', value: 'modal_open' },
    { type: 'template', key: 'measurementIdOverride', value: GA4_ID },
    {
      type: 'list',
      key: 'eventParameters',
      list: [
        { type: 'map', map: [{ type: 'template', key: 'name', value: 'click_location' }, { type: 'template', key: 'value', value: '{{DLV - click_location}}' }] },
      ],
    },
  ], ['9']);

  await createTag('GA4 - scroll_depth', [
    { type: 'template', key: 'eventName', value: 'scroll_depth' },
    { type: 'template', key: 'measurementIdOverride', value: GA4_ID },
    {
      type: 'list',
      key: 'eventParameters',
      list: [
        { type: 'map', map: [{ type: 'template', key: 'name', value: 'percent_scrolled' }, { type: 'template', key: 'value', value: '{{Scroll Depth Threshold}}' }] },
      ],
    },
  ], ['10']);

  console.log('=== PUBLISH ===');
  const version = await api(`${WS}/create_version`, 'POST', {
    name: 'Mayprotec — GA4 + GTM tracking',
    notes: 'GA4 config (G-MGY4Q16N34) + eventos: form_start, form_complete, modal_open, click_to_call, click_email, click_whatsapp, scroll_depth',
  });
  const vId = version.containerVersion.containerVersionId;
  console.log(`  version creada: ${vId}`);
  const pub = await api(`${BASE}/versions/${vId}/publish`, 'POST', {});
  console.log('  PUBLISH OK:', JSON.stringify({ id: pub.containerVersion.containerVersionId, name: pub.containerVersion.name }));
  console.log('DONE');
})().catch((e) => {
  console.error('ERROR:', e.message);
  if (e.response && e.response.data) console.error(JSON.stringify(e.response.data, null, 2));
  process.exit(1);
});
