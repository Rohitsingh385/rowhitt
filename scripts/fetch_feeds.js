#!/usr/bin/env node
/*
 Minimal feed fetcher/merger for Hashnode RSS, GitHub Atom, optional X/LinkedIn JSON.
 Subcommands:
   node scripts/fetch_feeds.js blog   -> writes data/blog.json
   node scripts/fetch_feeds.js github -> writes data/github.json
   node scripts/fetch_feeds.js merge  -> reads intermediates (+optional X/LinkedIn) and writes public/activity.json
*/

const fs = require('fs');
const path = require('path');

// Use node-fetch for older Node versions, built-in fetch for Node 18+
let fetch;
try {
  fetch = globalThis.fetch || require('node-fetch');
} catch {
  console.error('fetch not available. Install node-fetch: npm install node-fetch@2');
  process.exit(1);
}

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, 'data');
const PUBLIC_DIR = path.join(ROOT, 'public');

function ensureDirs() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(PUBLIC_DIR)) fs.mkdirSync(PUBLIC_DIR, { recursive: true });
}

function readConfig() {
  const cfgPath = path.join(ROOT, 'config.json');
  if (!fs.existsSync(cfgPath)) {
    return { hashnode_rss_url: '', github_username: '', x_feed_url: '', linkedin_feed_url: '' };
  }
  try { return JSON.parse(fs.readFileSync(cfgPath, 'utf8')); } catch { return { hashnode_rss_url: '', github_username: '', x_feed_url: '', linkedin_feed_url: '' }; }
}

function toISO(dateStr) {
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

// Extremely small XML helpers for RSS/Atom
function extractAll(xml, tag) {
  const re = new RegExp(`<${tag}[^>]*>([\s\S]*?)<\/${tag}>`, 'gi');
  const out = []; let m;
  while ((m = re.exec(xml))) out.push(m[1]);
  return out;
}
function extractFirst(xml, tag) {
  const m = new RegExp(`<${tag}[^>]*>([\s\S]*?)<\/${tag}>`, 'i').exec(xml);
  return m ? m[1].trim() : '';
}
function extractAttr(xml, tag, attr) {
  const m = new RegExp(`<${tag}[^>]*${attr}="([^"]+)"[^>]*>`, 'i').exec(xml);
  return m ? m[1] : '';
}

function parseRss(xml) {
  // RSS 2.0: <item><title/><link/><pubDate/></item>
  const items = extractAll(xml, 'item');
  return items.map((chunk) => ({
    title: extractFirst(chunk, 'title') || '(untitled)',
    url: extractFirst(chunk, 'link'),
    published: toISO(extractFirst(chunk, 'pubDate')) || toISO(extractFirst(chunk, 'published'))
  })).filter(x => x.url);
}

function parseAtom(xml) {
  // Atom: <entry><title/><link href=""/><updated/></entry>
  const entries = extractAll(xml, 'entry');
  return entries.map((chunk) => ({
    title: extractFirst(chunk, 'title') || '(untitled)',
    url: extractAttr(chunk, 'link', 'href') || extractFirst(chunk, 'id'),
    published: toISO(extractFirst(chunk, 'updated')) || toISO(extractFirst(chunk, 'published'))
  })).filter(x => x.url);
}

async function fetchText(url) {
  const res = await fetch(url, { headers: { 'user-agent': 'rowhit-activity-bot' } });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return { text: await res.text(), contentType: res.headers.get('content-type') || '' };
}

function writeJSON(file, data) {
  ensureDirs();
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

async function runBlog(config) {
  const url = (config.hashnode_rss_url || '').trim();
  if (!url) { console.log('hashnode_rss_url not set; writing empty blog.json'); writeJSON(path.join(DATA_DIR, 'blog.json'), []); return; }
  try {
    const { text } = await fetchText(url);
    const items = parseRss(text).map(x => ({ source: 'Blog', icon: '📝', title: x.title, url: x.url, published: x.published }));
    writeJSON(path.join(DATA_DIR, 'blog.json'), items);
    console.log(`Wrote ${items.length} blog items.`);
  } catch (e) {
    console.error('Blog fetch failed:', e.message);
    writeJSON(path.join(DATA_DIR, 'blog.json'), []);
  }
}

async function runGithub(config) {
  const user = (config.github_username || '').trim();
  if (!user) { console.log('github_username not set; writing empty github.json'); writeJSON(path.join(DATA_DIR, 'github.json'), []); return; }
  const url = `https://github.com/${encodeURIComponent(user)}.atom`;
  try {
    const { text } = await fetchText(url);
    const items = parseAtom(text).map(x => ({ source: 'GitHub', icon: '🐙', title: x.title, url: x.url, published: x.published }));
    writeJSON(path.join(DATA_DIR, 'github.json'), items);
    console.log(`Wrote ${items.length} GitHub items.`);
  } catch (e) {
    console.error('GitHub fetch failed:', e.message);
    writeJSON(path.join(DATA_DIR, 'github.json'), []);
  }
}

async function maybeLoadJsonFromUrl(name, url) {
  if (!url) return [];
  try {
    const res = await fetch(url, { headers: { 'user-agent': 'rowhit-activity-bot', 'accept': 'application/json,text/plain,*/*' } });
    const ct = (res.headers.get('content-type') || '').toLowerCase();
    if (!ct.includes('application/json')) { console.log(`${name}: non-JSON content-type, skipping`); return [];
    }
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data;
  } catch (e) {
    console.log(`${name}: fetch failed (${e.message}), skipping`);
    return [];
  }
}

function maybeLoadLocal(file) {
  try {
    const full = path.join(ROOT, file);
    if (!fs.existsSync(full)) return [];
    const data = JSON.parse(fs.readFileSync(full, 'utf8'));
    return Array.isArray(data) ? data : [];
  } catch { return []; }
}

function normalizeItems(arr, source, icon) {
  return (arr || []).map(x => ({
    source,
    icon,
    title: x.title || x.text || '(untitled)',
    url: x.url || x.link || '',
    published: x.published || x.date || x.created_at || null
  })).filter(i => i.url);
}

async function runMerge(config) {
  const blog = maybeLoadLocal('data/blog.json');
  const github = maybeLoadLocal('data/github.json');

  // Optional X/LinkedIn (either remote JSON endpoint or local manual files)
  const xRemote = await maybeLoadJsonFromUrl('X', (config.x_feed_url || '').trim());
  const xLocal = maybeLoadLocal('data/x.json');
  const liRemote = await maybeLoadJsonFromUrl('LinkedIn', (config.linkedin_feed_url || '').trim());
  const liLocal = maybeLoadLocal('data/linkedin.json');

  const all = []
    .concat(normalizeItems(blog, 'Blog', '📝'))
    .concat(normalizeItems(github, 'GitHub', '🐙'))
    .concat(normalizeItems(xRemote.length ? xRemote : xLocal, 'X', '𝕏'))
    .concat(normalizeItems(liRemote.length ? liRemote : liLocal, 'LinkedIn', 'in'))
    .filter(Boolean);

  const cleaned = all
    .filter(i => i.published && !isNaN(new Date(i.published).getTime()))
    .sort((a, b) => new Date(b.published) - new Date(a.published))
    .slice(0, 20);

  writeJSON(path.join(PUBLIC_DIR, 'activity.json'), cleaned);
  console.log(`Merged ${cleaned.length} items -> public/activity.json`);
}

(async function main() {
  ensureDirs();
  const config = readConfig();
  const cmd = (process.argv[2] || '').toLowerCase();
  if (cmd === 'blog') return runBlog(config);
  if (cmd === 'github') return runGithub(config);
  if (cmd === 'merge') return runMerge(config);
  console.log('Usage: node scripts/fetch_feeds.js [blog|github|merge]');
})(); 