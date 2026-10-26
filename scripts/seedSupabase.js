import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;
if (!url || !secretKey) {
  throw new Error('Set SUPABASE_URL and SUPABASE_SECRET_KEY in your local .env file before importing content.');
}

const root = process.cwd();
const records = [];
async function addFolder(collection, folder) {
  const directory = path.join(root, 'content', folder);
  let names = [];
  try { names = (await readdir(directory)).filter((name) => name.endsWith('.json')); } catch { return; }
  for (const name of names) {
    records.push({
      collection,
      slug: path.basename(name, '.json'),
      data: JSON.parse(await readFile(path.join(directory, name), 'utf8')),
      is_published: true,
    });
  }
}
for (const [collection, filename] of [['site', 'site'], ['about', 'about']]) {
  records.push({
    collection,
    slug: collection,
    data: JSON.parse(await readFile(path.join(root, 'content', filename + '.json'), 'utf8')),
    is_published: true,
  });
}
await addFolder('projects', 'projects');
await addFolder('categories', 'categories');
await addFolder('motion_categories', 'motion-categories');
await addFolder('testimonials', 'testimonials');
await addFolder('team', 'team');

const response = await fetch(`${url.replace(/\/$/, '')}/rest/v1/site_content?on_conflict=collection,slug`, {
  method: 'POST',
  headers: {
    apikey: secretKey,
    Authorization: `Bearer ${secretKey}`,
    'Content-Type': 'application/json',
    Prefer: 'resolution=merge-duplicates,return=minimal',
  },
  body: JSON.stringify(records),
});
if (!response.ok) {
  throw new Error(`Supabase import failed (${response.status}): ${await response.text()}`);
}
console.log(`Imported ${records.length} content records into Supabase.`);
