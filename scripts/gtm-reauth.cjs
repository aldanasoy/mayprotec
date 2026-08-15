#!/usr/bin/env node
const { google } = require('googleapis');
const http = require('http');
const fs = require('fs');
const { exec } = require('child_process');

const CREDS_PATH = process.env.GTM_OAUTH_CREDENTIALS || '/Users/sergioaldana/.secrets/repararya-oauth.json';
const TOKEN_PATH = process.env.GTM_TOKEN_PATH || '/Users/sergioaldana/.secrets/gtm-token.json';
const PORT = parseInt(process.env.GTM_AUTH_PORT || '8081', 10);
const REDIRECT = 'http://localhost';

const SCOPES = [
  'https://www.googleapis.com/auth/tagmanager.edit.containers',
  'https://www.googleapis.com/auth/tagmanager.edit.containerversions',
  'https://www.googleapis.com/auth/tagmanager.publish',
  'https://www.googleapis.com/auth/tagmanager.readonly',
];

const creds = JSON.parse(fs.readFileSync(CREDS_PATH, 'utf8')).installed;
const oauth2Client = new google.auth.OAuth2(creds.client_id, creds.client_secret, REDIRECT);

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://localhost:${req.headers.host}`);
    if (url.pathname !== '/' && url.pathname !== '/callback') { res.writeHead(404); return res.end('not found'); }    const code = url.searchParams.get('code');
    if (!code) {
      res.writeHead(400);
      res.end('No code in query');
      return;
    }
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('<h2 style="font-family:system-ui">Autorizado OK — token guardado. Ya puedes cerrar esta pestaña.</h2>');
    console.log('TOKEN_GUARDADO_EN ' + TOKEN_PATH);
    console.log('SCOPES:', tokens.scope || '(en tokeninfo)');
    server.close(() => process.exit(0));
  } catch (e) {
    console.error('ERROR:', e.message);
    res.writeHead(500);
    res.end('Error: ' + e.message);
    server.close(() => process.exit(1));
  }
});

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: SCOPES,
  prompt: 'consent',
  include_granted_scopes: true,
});

server.listen(PORT, () => {
  console.log(`Escuchando en http://localhost:${PORT}/callback`);
  console.log('Abriendo navegador para autorizar...');
  exec(`open "${authUrl}"`);
  console.log('URL (si no se abrió):', authUrl);
});