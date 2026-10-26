import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../supabase/client.js';

const COLLECTIONS = [
  ['site', 'Site settings'],
  ['about', 'About page'],
  ['projects', 'Projects'],
  ['categories', 'Project categories'],
  ['motion_categories', 'Motion categories'],
  ['testimonials', 'Testimonials'],
  ['team', 'Team'],
];
const SINGLETONS = new Set(['site', 'about']);
const IMAGE_FIELD = /(image|thumbnail|logo|photo|avatar|favicon)/i;
const LONG_TEXT_FIELD = /(text|bio|description|message|subtitle|headline|problem|strategy|outcome|approach|results|goal|why|blurb)/i;

function labelFor(key) {
  return key.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ').replace(/^./, (letter) => letter.toUpperCase());
}

function cloneValue(value) {
  return value === undefined ? {} : JSON.parse(JSON.stringify(value));
}

function blankLike(value, key = '') {
  if (Array.isArray(value)) return [];
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([childKey, childValue]) => [childKey, blankLike(childValue, childKey)]));
  if (typeof value === 'string') return /(type|ratio|category|subcategory)/i.test(key) ? value : '';
  if (typeof value === 'boolean') return false;
  if (typeof value === 'number') return 0;
  return '';
}

function newArrayItem(field, items) {
  if (items.length) return blankLike(items[0]);
  if (/^(blocks)$/i.test(field)) return { type: 'text', text: '' };
  if (/^(motionassets|videos)$/i.test(field)) return { title: '', video_url: '' };
  return '';
}

function newRecord(collection) {
  if (collection === 'projects') return {
    title: '', client: '', year: new Date().getFullYear().toString(), category: '', industry: '', thumbnail: '', services: [],
    content: { problem: '', approach: '', results: '', blocks: [] },
  };
  if (collection === 'testimonials') return { text: '', author: '', role: '', image: '', stars: 5 };
  if (collection === 'team') return { name: '', role: '', image: '', bio: '', socials: [], visible: true };
  if (collection === 'categories') return { title: '', slug: '', order: 0 };
  if (collection === 'motion_categories') return { title: '', subcategory: '', order: 0, videos: [] };
  return {};
}

function ContentFields({ value, onChange, depth = 0 }) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return <div className={depth ? 'space-y-4' : 'grid gap-x-5 gap-y-4 md:grid-cols-2'}>
    {Object.entries(value).map(([key, fieldValue]) => <FieldEditor
      key={key}
      name={key}
      value={fieldValue}
      depth={depth}
      onChange={(next) => onChange({ ...value, [key]: next })}
    />)}
  </div>;
}

function FieldEditor({ name, value, onChange, depth = 0 }) {
  const imageField = IMAGE_FIELD.test(name);
  const fieldLabel = labelFor(name);
  const inputClass = 'mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-orange-400';

  if (Array.isArray(value)) {
    return <fieldset className="rounded-xl border border-black/10 p-4 md:col-span-2">
      <legend className="px-1 text-sm font-semibold text-slate-700">{fieldLabel}</legend>
      <div className="space-y-3">
        {value.map((item, index) => <div key={index} className="rounded-lg bg-slate-50 p-3">
          <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-400">
            <span>{fieldLabel} {index + 1}</span>
            <button type="button" onClick={() => onChange(value.filter((_, itemIndex) => itemIndex !== index))} className="normal-case tracking-normal text-red-600 hover:text-red-700">Remove</button>
          </div>
          {item && typeof item === 'object'
            ? <ContentFields value={item} depth={depth + 1} onChange={(next) => onChange(value.map((entry, itemIndex) => itemIndex === index ? next : entry))} />
            : <FieldEditor name={name} value={item} depth={depth + 1} onChange={(next) => onChange(value.map((entry, itemIndex) => itemIndex === index ? next : entry))} />}
        </div>)}
      </div>
      <button type="button" onClick={() => onChange([...value, newArrayItem(name, value)])} className="mt-3 rounded-lg border border-black/10 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">Add {fieldLabel.toLowerCase()}</button>
    </fieldset>;
  }

  if (value && typeof value === 'object') {
    return <fieldset className="rounded-xl border border-black/10 p-4 md:col-span-2">
      <legend className="px-1 text-sm font-semibold text-slate-700">{fieldLabel}</legend>
      <ContentFields value={value} depth={depth + 1} onChange={onChange} />
    </fieldset>;
  }

  if (typeof value === 'boolean') {
    return <label className="flex items-center gap-3 rounded-lg border border-black/10 px-3 py-3 text-sm text-slate-700">
      <input type="checkbox" checked={value} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 accent-orange-500" />
      {fieldLabel}
    </label>;
  }

  const isNumber = typeof value === 'number';
  const isLongText = !isNumber && (LONG_TEXT_FIELD.test(name) || String(value ?? '').length > 110);
  const stringValue = value ?? '';
  return <label className={depth === 0 ? '' : 'block'}>
    <span className="text-sm font-medium text-slate-600">{fieldLabel}</span>
    {isLongText
      ? <textarea value={stringValue} onChange={(event) => onChange(event.target.value)} rows={4} className={inputClass + ' resize-y'} />
      : <input type={isNumber ? 'number' : 'text'} value={stringValue} onChange={(event) => onChange(isNumber ? Number(event.target.value) : event.target.value)} className={inputClass} />}
    {imageField && typeof stringValue === 'string' && stringValue && <img src={stringValue} alt={fieldLabel + ' preview'} className="mt-2 h-24 w-36 rounded-lg border border-black/10 bg-slate-100 object-cover" />}
  </label>;
}

function LoginScreen({ onLogin, error, busy }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  return (
    <main className="min-h-screen bg-[#08090d] text-white lg:grid lg:grid-cols-2">
      <section className="flex min-h-screen items-center justify-center px-6 py-12">
        <form onSubmit={(event) => { event.preventDefault(); onLogin(email, password); }} className="w-full max-w-md">
          <img src="/uploads/colored-white-500x.webp" alt="GB Studios" className="mb-12 h-8 max-w-48 object-contain object-left" />
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-orange-400">Content workspace</p>
          <h1 className="mb-3 text-4xl font-semibold tracking-tight">Welcome back</h1>
          <p className="mb-8 text-white/60">Sign in to manage the GB Studios website.</p>
          <label className="mb-2 block text-sm text-white/80" htmlFor="email">Email</label>
          <input id="email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} className="mb-5 w-full rounded-xl border border-white/15 bg-white/[0.04] px-4 py-3 outline-none transition focus:border-orange-400" placeholder="you@example.com" />
          <label className="mb-2 block text-sm text-white/80" htmlFor="password">Password</label>
          <input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mb-3 w-full rounded-xl border border-white/15 bg-white/[0.04] px-4 py-3 outline-none transition focus:border-orange-400" placeholder="Enter your password" />
          {error && <p role="alert" className="my-4 rounded-lg border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-200">{error}</p>}
          <button disabled={busy} className="mt-4 w-full rounded-xl bg-orange-500 px-4 py-3 font-semibold text-white transition hover:bg-orange-400 disabled:opacity-60">{busy ? 'Signing in…' : 'Sign in'}</button>
          <a href="/" className="mt-6 inline-block text-sm text-white/50 hover:text-white">← Back to the website</a>
        </form>
      </section>
      <aside className="relative hidden min-h-screen overflow-hidden bg-[#102533] lg:block">
        <img src="/uploads/gb.jpeg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-55" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#08090d] via-[#071725]/15 to-[#071725]/30" />
        <div className="absolute bottom-16 left-12 right-12">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.25em] text-orange-300">GB Studios</p>
          <h2 className="max-w-lg text-5xl font-semibold leading-tight">Make every detail count.</h2>
          <p className="mt-4 max-w-md text-white/75">Your work, your projects, and your story in one place.</p>
        </div>
      </aside>
    </main>
  );
}

export default function AdminApp() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [records, setRecords] = useState([]);
  const [collection, setCollection] = useState('projects');
  const [activeSlug, setActiveSlug] = useState('');
  const [draft, setDraft] = useState({});
  const [published, setPublished] = useState(true);
  const [notice, setNotice] = useState('');
  const [newEntry, setNewEntry] = useState(false);

  const isAdmin = user?.app_metadata?.role === 'admin';
  const collectionLabel = useMemo(() => COLLECTIONS.find(([key]) => key === collection)?.[1] || collection, [collection]);

  useEffect(() => {
    if (!supabase) { setAuthChecked(true); return; }
    supabase.auth.getUser().then(({ data }) => setUser(data.user || null)).finally(() => setAuthChecked(true));
  }, []);

  useEffect(() => {
    if (!supabase || !isAdmin) return;
    supabase.from('site_content').select('*').order('collection').order('slug')
      .then(({ data, error: queryError }) => {
        if (queryError) setError(queryError.message);
        else setRecords(data || []);
      });
  }, [isAdmin]);

  const visibleRecords = records.filter((record) => record.collection === collection);
  const selected = visibleRecords.find((record) => record.slug === activeSlug);

  useEffect(() => {
    if (newEntry) return;
    if (!selected) { setDraft({}); setPublished(true); return; }
    setDraft(cloneValue(selected.data));
    setPublished(selected.is_published);
  }, [selected?.id, selected?.updated_at, newEntry]);

  async function login(email, password) {
    setBusy(true); setError('');
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (authError) { setError(authError.message); return; }
    setUser(data.user);
  }

  async function saveRecord() {
    setError(''); setNotice('');
    const parsed = draft;

    const slug = newEntry ? (SINGLETONS.has(collection) ? collection : (parsed.slug || parsed.title || parsed.name || crypto.randomUUID()).toString().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')) : activeSlug;
    if (!slug) { setError('Add a title or name before saving this item.'); return; }
    const { data, error: saveError } = await supabase.from('site_content').upsert(
      { collection, slug, data: parsed, is_published: published },
      { onConflict: 'collection,slug' },
    ).select().single();
    if (saveError) { setError(saveError.message); return; }
    setRecords((current) => [...current.filter((item) => !(item.collection === collection && item.slug === slug)), data]);
    setActiveSlug(slug); setNewEntry(false); setNotice('Saved to Supabase.');
  }

  async function deleteRecord() {
    if (!selected || SINGLETONS.has(collection)) return;
    const { error: deleteError } = await supabase.from('site_content').delete().eq('id', selected.id);
    if (deleteError) { setError(deleteError.message); return; }
    setRecords((current) => current.filter((item) => item.id !== selected.id));
    setActiveSlug(''); setDraft({}); setNotice('Content removed.');
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null); setRecords([]); setActiveSlug('');
  }

  if (!supabase) {
    return <main className="min-h-screen bg-[#08090d] px-6 py-16 text-white"><div className="mx-auto max-w-xl rounded-2xl border border-white/10 bg-white/[0.04] p-8"><h1 className="text-2xl font-semibold">Connect this test copy to Supabase</h1><p className="mt-3 text-white/70">Add the project URL and publishable key to your local .env file, then restart the dev server. See README-SUPABASE.md for the setup steps.</p><a className="mt-6 inline-block text-orange-300" href="/">← Back to the website</a></div></main>;
  }
  if (!authChecked) return <div className="min-h-screen bg-[#08090d]" />;
  if (!user) return <LoginScreen onLogin={login} error={error} busy={busy} />;
  if (!isAdmin) return <main className="min-h-screen bg-[#08090d] p-8 text-white"><div className="mx-auto max-w-lg rounded-2xl border border-white/10 p-8"><h1 className="text-2xl font-semibold">Admin access required</h1><p className="mt-3 text-white/70">This account is signed in, but it has not been assigned the admin role. Follow the “Add your first admin” step in README-SUPABASE.md.</p><button onClick={signOut} className="mt-6 text-orange-300">Sign out</button></div></main>;

  return (
    <main className="min-h-screen bg-[#f5f5f4] text-slate-900">
      <header className="flex items-center justify-between border-b border-black/10 bg-white px-6 py-4">
        <a href="/" className="flex items-center gap-3"><img src="/uploads/colored-white-500x.webp" alt="GB Studios" className="h-7 w-28 object-contain object-left" /><span className="border-l border-black/10 pl-3 text-sm text-slate-500">Content Studio</span></a>
        <div className="flex items-center gap-4 text-sm"><span className="hidden text-slate-500 sm:inline">{user.email}</span><button onClick={signOut} className="rounded-lg border border-black/10 px-3 py-2 hover:bg-slate-50">Sign out</button></div>
      </header>
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[240px_300px_minmax(0,1fr)]">
        <nav className="rounded-2xl border border-black/10 bg-white p-3">
          <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Collections</p>
          {COLLECTIONS.map(([key, label]) => <button key={key} onClick={() => { setCollection(key); setActiveSlug(''); setNewEntry(false); setError(''); }} className={`mb-1 w-full rounded-lg px-3 py-2.5 text-left text-sm ${collection === key ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>{label}<span className="float-right opacity-60">{records.filter((r) => r.collection === key).length}</span></button>)}
        </nav>
        <section className="rounded-2xl border border-black/10 bg-white p-3">
          <div className="flex items-center justify-between px-3 py-2"><h2 className="font-semibold">{collectionLabel}</h2>{!SINGLETONS.has(collection) && <button onClick={() => { setNewEntry(true); setActiveSlug(''); setDraft(newRecord(collection)); setPublished(false); setError(''); }} className="rounded-md bg-orange-500 px-2.5 py-1.5 text-xs font-semibold text-white">New</button>}</div>
          <div className="mt-2 space-y-1">{visibleRecords.map((record) => <button key={record.id} onClick={() => { setNewEntry(false); setActiveSlug(record.slug); setError(''); }} className={`w-full rounded-lg px-3 py-2 text-left text-sm ${activeSlug === record.slug && !newEntry ? 'bg-orange-50 text-orange-800' : 'hover:bg-slate-50'}`}><span className="block truncate font-medium">{record.data.title || record.data.name || record.data.subcategory || record.slug}</span><span className="text-xs text-slate-400">{record.is_published ? 'Published' : 'Draft'}</span></button>)}</div>
          {!visibleRecords.length && <p className="px-3 py-5 text-sm text-slate-400">No records yet. Import the current content to begin.</p>}
        </section>
        <section className="min-h-[560px] rounded-2xl border border-black/10 bg-white p-5">
          {!selected && !newEntry ? <div className="flex h-full min-h-[500px] items-center justify-center text-center text-slate-400"><p>Select an item to edit<br/>or create a new one.</p></div> : <>
            <div className="mb-4 flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs uppercase tracking-wider text-slate-400">{collectionLabel}</p><h2 className="mt-1 text-xl font-semibold">{newEntry ? 'New item' : (selected?.data.title || selected?.data.name || selected?.slug)}</h2></div><label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} /> Published</label></div>
            <p className="mb-4 text-sm text-slate-500">Edit the content using these fields. Images can be set with an image URL.</p>
            <ContentFields value={draft} onChange={setDraft} />
            {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
            {notice && <p role="status" className="mt-3 text-sm text-emerald-700">{notice}</p>}
            <div className="mt-4 flex justify-between"><button onClick={deleteRecord} disabled={!selected || SINGLETONS.has(collection)} className="rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:hidden">Delete</button><button onClick={saveRecord} className="ml-auto rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700">Save changes</button></div>
          </>}
        </section>
      </div>
    </main>
  );
}

