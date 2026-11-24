import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const modal = readFileSync(new URL('../src/components/LeadModal.astro', import.meta.url), 'utf8');
const contact = readFileSync(new URL('../src/components/home/ContactForm.astro', import.meta.url), 'utf8');
const handler = readFileSync(new URL('../functions/api/lead.js', import.meta.url), 'utf8');

for (const [name, source] of [['modal', modal], ['contact', contact]]) {
  assert.match(source, /name="zona"[^>]*required|required[^>]*name="zona"/, `${name}: zona must be required`);
  assert.match(source, /name="cantidad"[^>]*required|required[^>]*name="cantidad"/, `${name}: cantidad must be required`);
  assert.match(source, /cantidad:\s*data\.cantidad/, `${name}: cantidad must be sent to /api/lead`);
}

assert.match(handler, /const cantidad = String\(data\.cantidad/, 'handler must parse cantidad');
assert.match(handler, /!zona \|\| !cantidad/, 'handler must require zona and cantidad');
assert.match(handler, /Empresa:<\/b> Mayprotec/, 'Telegram must identify Mayprotec');
assert.match(handler, /Website:<\/b> mallas-barranquilla\.com/, 'Telegram must identify website');
assert.match(handler, /Cantidad:<\/b>/, 'Telegram must show cantidad separately');
assert.doesNotMatch(handler, /📞/, 'Telegram message must not contain emoji');

console.log('Mayprotec lead contract OK');
