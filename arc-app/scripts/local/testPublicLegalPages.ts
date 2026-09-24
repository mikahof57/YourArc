import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const read = (p: string) => readFileSync(resolve(p), 'utf8');
const routes = ['privacy', 'impressum', 'support'];
for (const configPath of ['vercel.json', '../vercel.json']) {
  const config = JSON.parse(read(configPath));
  for (const route of routes) for (const suffix of ['', '/']) {
    const index = config.rewrites.findIndex((r: { source: string }) => r.source === `/${route}${suffix}`);
    assert.ok(index >= 0 && index < config.rewrites.length - 1);
    assert.equal(config.rewrites[index].destination, `/${route}/index.html`);
  }
  assert.deepEqual(config.rewrites.at(-1), { source: '/(.*)', destination: '/index.html' });
}
for (const route of routes) {
  const html = read(`public/${route}/index.html`);
  assert.match(html, /<html lang="de">/);
  assert.match(html, /name="viewport"/);
  assert.equal((html.match(/<h1>/g) ?? []).length, 1);
  assert.match(html, /<main id="inhalt">/);
  assert.match(html, /aria-current="page"/);
  assert.doesNotMatch(html, /class="placeholder"|class="draft"|OFFENE RECHTLICHE PRÜFUNG|Kontaktadresse wird vor Veröffentlichung/);
  assert.ok(html.includes('href="mailto:MyArcApp@proton.me"'));
  assert.doesNotMatch(html, /\[DATENSCHUTZ-KONTAKT-E-MAIL\]|\[ÖFFENTLICHE KONTAKT-E-MAIL\]|\[SUPPORT-E-MAIL EINFÜGEN\]|\[STRASSE UND HAUSNUMMER\]|\[POSTLEITZAHL/);
  if (route !== 'support') {
    assert.match(html, /Alter Postweg 87a/);
    assert.match(html, /21075 Hamburg/);
    assert.match(html, /Germany/);
  }
  assert.doesNotMatch(html, /Christine|ZenBusiness|reportaproblem\.apple\.com/i);

  assert.doesNotMatch(html, /Kaufanbindung muss zuvor entfernt|noch vorhandene technische Kaufanbindung|noch nicht entfernte Kaufanbindung|Im derzeitigen Entwicklungsstand|technische Entwurfsvorbehalt/);
  assert.doesNotMatch(html, /<script|<iframe|<form|VITE_|localhost|mailto:.*\[/i);
  for (const target of routes) assert.ok(html.includes(`href="/${target}"`));
  for (const match of html.matchAll(/(?:href|src)="([^"#]+)"/g)) {
    const link = match[1];
    if (link.startsWith('https://') || link === 'mailto:MyArcApp@proton.me') continue;
    assert.ok(link.startsWith('/'));
    assert.ok(existsSync(resolve('public', link.slice(1))), `Local link exists: ${link}`);
  }
  assert.equal(read(`dist/${route}/index.html`), html, 'production copies the standalone page');
}
assert.equal(read('dist/legal-pages.css'), read('public/legal-pages.css'));
assert.doesNotMatch(read('public/legal-pages.css'), /@import|url\(https?:/);
assert.match(read('public/legal-pages.css'), /safe-area-inset-bottom/);
assert.match(read('public/privacy/index.html'), /nicht gesondert verschlüsselt/);
assert.match(read('public/privacy/index.html'), /externe Bildadresse/);
assert.match(read('public/privacy/index.html'), /Mika Hofmann/);
assert.match(read('public/impressum/index.html'), /Mika Hofmann/);
assert.doesNotMatch(read('public/privacy/index.html'), /VOLLSTÄNDIGER RECHTLICHER NAME/);
assert.match(read('public/privacy/index.html'), /ausschließlich durch Gameplay/);
assert.match(read('public/privacy/index.html'), /Werbung ist nicht implementiert/);
for (const route of ['privacy', 'support']) {
  const html = read(`public/${route}/index.html`);
  assert.match(html, /keine In-App-Käufe/);
  assert.match(html, /keine Credit-Käufe mit echtem Geld/);
  assert.match(html, /100 Credits/);
  assert.match(html, /interne Spielwährung/);
}
assert.doesNotMatch(read('docs/public-legal-pages.md'), /IAP — release blocker|IAP removal is a separate task|NOT yet this final release|Android billing also remains/);
assert.match(read('docs/public-legal-pages.md'), /successfully tested on a physical iPhone/);
assert.doesNotMatch(read('public/support/index.html'), /Fragen zu Käufen|Credit-Pakete werden/);
console.log('Public legal pages passed: DE documents, links, completed contact details, standalone production files, mobile CSS and direct-route rewrites.');

// Exercise the built directory routes twice (direct request and refresh).
// Vercel's extensionless aliases are checked above; its routing engine isn't Vite.
const { preview } = await import('vite');
const server = await preview({ preview: { host: '127.0.0.1', port: 0, open: false } });
try {
  const address = server.httpServer.address();
  assert.ok(address && typeof address !== 'string');
  for (const route of routes) for (let request = 0; request < 2; request++) {
    const response = await fetch(`http://127.0.0.1:${address.port}/${route}/`);
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type') ?? '', /text\/html/);
    assert.equal(await response.text(), read(`public/${route}/index.html`));
  }
  const response = await fetch(`http://127.0.0.1:${address.port}/legal-pages.css`);
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type') ?? '', /text\/css/);
} finally {
  await new Promise<void>((resolve, reject) => server.httpServer.close(error => error ? reject(error) : resolve()));
}
console.log('Production preview HTTP passed: all three direct directory routes, refresh and stylesheet.');

const privacy = read('public/privacy/index.html');
assert.match(privacy, /Vercel Inc\./);
assert.match(privacy, /Proton AG/);
assert.match(privacy, /Ludwig-Erhard-Straße 22/);
assert.match(privacy, /Art\. 9 Abs\. 2/);
assert.match(privacy, /keine gesonderte ausdrückliche Einwilligung/);
assert.match(privacy, /keine.*pauschale|pauschale feste Frist wird nicht angegeben/);
assert.doesNotMatch(privacy, /VOR VERÖFFENTLICHUNG ERGÄNZEN|ZUSTÄNDIGE DATENSCHUTZAUFSICHT/);
const imprint = read('public/impressum/index.html');
assert.match(imprint, /weder verpflichtet noch bereit/);
assert.doesNotMatch(imprint, /Umsatzsteuer-Identifikationsnummer|Registernummer|VERBRAUCHERSTREITBEILEGUNG:/);
assert.doesNotMatch(read('public/support/index.html'), /class="placeholder"|class="draft"/);

for (const route of ['privacy', 'support']) {
  const html = read(`public/${route}/index.html`);
  assert.match(html, /Bitte sende keine Gesundheitsdaten, religiösen Überzeugungen/);
  assert.match(html, /nicht unbedingt für deine Support-Anfrage erforderlich/);
  assert.match(html, /nicht als ausdrückliche Einwilligung/);
}
assert.match(privacy, /nicht automatisch an Mika Hofmann übertragen/);
assert.match(privacy, /keine Ausnahme nach Art\. 9 Abs\. 2 DSGVO behauptet/);
