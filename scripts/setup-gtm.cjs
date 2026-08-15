#!/usr/bin/env node
/**
 * Setup GTM para Mayprotec — GTM-TCV97SLJ (GA4 G-MGY4Q16N34)
 * Crea triggers, variables, tags y publica una versión.
 *
 * Requiere NODE_PATH apuntando a node_modules con googleapis (MCP gtm server).
 * Run: NODE_PATH=/Users/sergioaldana/Claude/RepararYa\ Cartagena/.mcp-servers/gtm/node_modules node scripts/setup-gtm.cjs
 */
const { google } = require('googleapis');
const fs = require('fs');

const ACCOUNT = '6371427711';
const CONTAINER = '261278316';
const WORKSPACE = '2';
const GA4_ID = 'G-MGY4Q16N34';

const OAUTH_CREDENTIALS = '/Users/sergioaldana/.secrets/repararya-oauth.json';
const TOKEN_PATH = '/Users/sergioaldana/.secrets/gtm-token.json';

const creds = JSON.parse(fs.readFileSync(OAUTH_CREDENTIALS, 'utf8')).installed;
const oauth2Client = new google.auth.OAuth2(creds.client_id, creds.client_secret, 'http://localhost:8080/callback');
oauth2Client.setCredentials(JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8')));

const gtm = google.tagmanager({ version: 'v2', auth: oauth2Client });
const BASE = `accounts/${ACCOUNT}/containers/${CONTAINER}`;
const WS = `${BASE}/workspaces/${WORKSPACE}`;

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

async function createTrigger(name, type, extra = {}) {
  await delay();
  const res = await gtm.accounts.containers.workspaces.triggers.create({
    parent: WS,
    requestBody: { name, type, ...extra },
  });
  console.log(`  trigger OK: ${name} (${res.data.triggerId})`);
  return res.data.triggerId;
}

async function createVariable(name, dataLayerKey) {
  await delay();
  const res = await gtm.accounts.containers.workspaces.variables.create({
    parent: WS,
    requestBody: {
      name,
      type: 'v',
      parameter: [{ type: 'template', key: 'name', value: dataLayerKey }],
    },
  });
  console.log(`  variable OK: ${name} (${res.data.variableId})`);
  return res.data.variableId;
}

async function createTag(name, type, params, firingTriggerIds) {
  await delay();
  const res = await gtm.accounts.containers.workspaces.tags.create({
    parent: WS,
    requestBody: {
      name,
      type,
      parameter: params,
      firingTriggerId: firingTriggerIds,
      tagFiringOption: 'oncePerEvent',
    },
  });
  console.log(`  tag OK: ${name} (${res.data.tagId})`);
  return res.data.tagId;
}

(async () => {
  console.log('=== 1. TRIGGERS ===');

  const allPages = await createTrigger('All Pages', 'pageview');
  const telClick = await createTrigger('Click - tel links', 'linkClick', {
    filter: [
      {
        type: 'contains',
        parameter: [
          { type: 'template', key: 'arg0', value: '{{Click URL}}' },
          { type: 'template', key: 'arg1', value: 'tel:' },
        ],
      },
    ],
  });
  const mailClick = await createTrigger('Click - mailto links', 'linkClick', {
    filter: [
      {
        type: 'contains',
        parameter: [
          { type: 'template', key: 'arg0', value: '{{Click URL}}' },
          { type: 'template', key: 'arg1', value: 'mailto:' },
        ],
      },
    ],
  });
  const waClick = await createTrigger('Click - WhatsApp links', 'linkClick', {
    filter: [
      {
        type: 'contains',
        parameter: [
          { type: 'template', key: 'arg0', value: '{{Click URL}}' },
          { type: 'template', key: 'arg1', value: 'wa.me' },
        ],
      },
    ],
  });
  const formStart = await createTrigger('Custom Event - form_start', 'customEvent', {
    customEventFilter: [
      {
        type: 'equals',
        parameter: [
          { type: 'template', key: 'arg0', value: '{{_event}}' },
          { type: 'template', key: 'arg1', value: 'form_start' },
        ],
      },
    ],
  });
  const formComplete = await createTrigger('Custom Event - form_complete', 'customEvent', {
    customEventFilter: [
      {
        type: 'equals',
        parameter: [
          { type: 'template', key: 'arg0', value: '{{_event}}' },
          { type: 'template', key: 'arg1', value: 'form_complete' },
        ],
      },
    ],
  });
  const modalOpen = await createTrigger('Custom Event - modal_open', 'customEvent', {
    customEventFilter: [
      {
        type: 'equals',
        parameter: [
          { type: 'template', key: 'arg0', value: '{{_event}}' },
          { type: 'template', key: 'arg1', value: 'modal_open' },
        ],
      },
    ],
  });
  const scrollDepth = await createTrigger('Scroll Depth 25-50-75-90', 'scrollDepth', {
    parameter: [
      { type: 'boolean', key: 'verticalScrollDirectionCheck', value: 'false' },
      { type: 'boolean', key: 'horizontalScrollDirectionCheck', value: 'false' },
      {
        type: 'list',
        key: 'verticalThresholds',
        list: [
          { type: 'template', value: '25' },
          { type: 'template', value: '50' },
          { type: 'template', value: '75' },
          { type: 'template', value: '90' },
        ],
      },
    ],
  });

  console.log('=== 2. VARIABLES ===');
  const vFormType = await createVariable('DLV - form_type', 'form_type');
  const vClickLoc = await createVariable('DLV - click_location', 'click_location');
  const vClickText = await createVariable('DLV - click_text', 'click_text');
  const vLeadServ = await createVariable('DLV - lead_servicio', 'lead_servicio');

  console.log('=== 3. TAGS ===');

  await createTag('GA4 - Configuration', 'googtag', [
    { type: 'template', key: 'tagId', value: GA4_ID },
  ], [allPages]);

  await createTag('GA4 - click_to_call', 'gaawe', [
    { type: 'template', key: 'eventName', value: 'click_to_call' },
    { type: 'template', key: 'measurementIdOverride', value: GA4_ID },
  ], [telClick]);

  await createTag('GA4 - click_email', 'gaawe', [
    { type: 'template', key: 'eventName', value: 'click_email' },
    { type: 'template', key: 'measurementIdOverride', value: GA4_ID },
  ], [mailClick]);

  await createTag('GA4 - click_whatsapp', 'gaawe', [
    { type: 'template', key: 'eventName', value: 'click_whatsapp' },
    { type: 'template', key: 'measurementIdOverride', value: GA4_ID },
    {
      type: 'list',
      key: 'eventParameters',
      list: [
        { type: 'map', map: [
          { type: 'template', key: 'name', value: 'click_location' },
          { type: 'template', key: 'value', value: '{{DLV - click_location}}' },
        ] },
        { type: 'map', map: [
          { type: 'template', key: 'name', value: 'click_text' },
          { type: 'template', key: 'value', value: '{{DLV - click_text}}' },
        ] },
      ],
    },
  ], [waClick]);

  await createTag('GA4 - form_start', 'gaawe', [
    { type: 'template', key: 'eventName', value: 'form_start' },
    { type: 'template', key: 'measurementIdOverride', value: GA4_ID },
    {
      type: 'list',
      key: 'eventParameters',
      list: [
        { type: 'map', map: [
          { type: 'template', key: 'name', value: 'form_type' },
          { type: 'template', key: 'value', value: '{{DLV - form_type}}' },
        ] },
      ],
    },
  ], [formStart]);

  await createTag('GA4 - form_submit_lead', 'gaawe', [
    { type: 'template', key: 'eventName', value: 'form_complete' },
    { type: 'template', key: 'measurementIdOverride', value: GA4_ID },
    {
      type: 'list',
      key: 'eventParameters',
      list: [
        { type: 'map', map: [
          { type: 'template', key: 'name', value: 'form_type' },
          { type: 'template', key: 'value', value: '{{DLV - form_type}}' },
        ] },
        { type: 'map', map: [
          { type: 'template', key: 'name', value: 'lead_servicio' },
          { type: 'template', key: 'value', value: '{{DLV - lead_servicio}}' },
        ] },
      ],
    },
  ], [formComplete]);

  await createTag('GA4 - modal_open', 'gaawe', [
    { type: 'template', key: 'eventName', value: 'modal_open' },
    { type: 'template', key: 'measurementIdOverride', value: GA4_ID },
    {
      type: 'list',
      key: 'eventParameters',
      list: [
        { type: 'map', map: [
          { type: 'template', key: 'name', value: 'click_location' },
          { type: 'template', key: 'value', value: '{{DLV - click_location}}' },
        ] },
      ],
    },
  ], [modalOpen]);

  await createTag('GA4 - scroll_depth', 'gaawe', [
    { type: 'template', key: 'eventName', value: 'scroll_depth' },
    { type: 'template', key: 'measurementIdOverride', value: GA4_ID },
    {
      type: 'list',
      key: 'eventParameters',
      list: [
        { type: 'map', map: [
          { type: 'template', key: 'name', value: 'percent_scrolled' },
          { type: 'template', key: 'value', value: '{{Scroll Depth Threshold}}' },
        ] },
      ],
    },
  ], [scrollDepth]);

  console.log('=== 4. VERSION + PUBLISH ===');
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
