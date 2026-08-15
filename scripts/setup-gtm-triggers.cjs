#!/usr/bin/env node
const { google } = require('googleapis');
const fs = require('fs');

const creds = JSON.parse(fs.readFileSync('/Users/sergioaldana/.secrets/repararya-oauth.json', 'utf8')).installed;
const oauth2Client = new google.auth.OAuth2(creds.client_id, creds.client_secret, 'http://localhost');
oauth2Client.setCredentials(JSON.parse(fs.readFileSync('/Users/sergioaldana/.secrets/gtm-token.json', 'utf8')));
const gtm = google.tagmanager({ version: 'v2', auth: oauth2Client });

const WS = 'accounts/6371427711/containers/261278316/workspaces/2';

const cond = (arg0, arg1, op) => ({
  type: op,
  parameter: [
    { type: 'template', key: 'arg0', value: arg0 },
    { type: 'template', key: 'arg1', value: arg1 },
  ],
});

const triggers = [
  {
    id: '4', name: 'Click - tel links', type: 'linkClick',
    parameter: [
      { type: 'boolean', key: 'waitForTags', value: 'false' },
      { type: 'boolean', key: 'checkValidation', value: 'true' },
    ],
    filter: [cond('{{Click URL}}', 'tel:', 'startsWith')],
  },
  {
    id: '5', name: 'Click - mailto links', type: 'linkClick',
    parameter: [
      { type: 'boolean', key: 'waitForTags', value: 'false' },
      { type: 'boolean', key: 'checkValidation', value: 'true' },
    ],
    filter: [cond('{{Click URL}}', 'mailto:', 'startsWith')],
  },
  {
    id: '6', name: 'Click - WhatsApp links', type: 'linkClick',
    parameter: [
      { type: 'boolean', key: 'waitForTags', value: 'false' },
      { type: 'boolean', key: 'checkValidation', value: 'true' },
    ],
    filter: [cond('{{Click URL}}', '(wa\\.me|api\\.whatsapp\\.com)', 'matchRegex')],
  },
  {
    id: '7', name: 'Custom Event - form_start', type: 'customEvent',
    customEventFilter: [cond('{{_event}}', 'form_start', 'equals')],
  },
  {
    id: '8', name: 'Custom Event - form_complete', type: 'customEvent',
    customEventFilter: [cond('{{_event}}', 'form_complete', 'equals')],
  },
  {
    id: '9', name: 'Custom Event - modal_open', type: 'customEvent',
    customEventFilter: [cond('{{_event}}', 'modal_open', 'equals')],
  },
  {
    id: '10', name: 'Scroll Depth 25-50-75-90', type: 'scrollDepth',
    parameter: [
      { type: 'boolean', key: 'verticalScrollDepthEnabled', value: 'true' },
      { type: 'list', key: 'verticalPercent', list: ['25', '50', '75', '90'].map(v => ({ type: 'template', value: v })) },
    ],
  },
];

(async () => {
  for (const t of triggers) {
    try {
      const body = { name: t.name, type: t.type, parameter: t.parameter, filter: t.filter, customEventFilter: t.customEventFilter };
      const res = await gtm.accounts.containers.workspaces.triggers.update({
        path: `${WS}/triggers/${t.id}`,
        requestBody: body,
      });
      console.log('OK trigger', t.id, res.data.name);
    } catch (e) {
      console.error('ERR trigger', t.id, e.message, e.response && JSON.stringify(e.response.data).slice(0, 300));
    }
  }
})();