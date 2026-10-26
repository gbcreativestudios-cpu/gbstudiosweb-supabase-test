// Content starts from repository JSON files and can be replaced by published
// Supabase records at startup.
import { supabase } from '../supabase/client.js';
const siteModule = import.meta.glob('../../content/site.json', { eager: true });
const aboutModule = import.meta.glob('../../content/about.json', { eager: true });
const projectModules = import.meta.glob('../../content/projects/*.json', { eager: true });
const categoryModules = import.meta.glob('../../content/categories/*.json', { eager: true });
const motionCategoryModules = import.meta.glob('../../content/motion-categories/*.json', { eager: true });
const testimonialModules = import.meta.glob('../../content/testimonials/*.json', { eager: true });
const teamModules = import.meta.glob('../../content/team/*.json', { eager: true });
const unwrap = (mod) => mod.default ?? mod;
const localSite = unwrap(Object.values(siteModule)[0]);
const localAbout = unwrap(Object.values(aboutModule)[0]);
const localProjects = Object.values(projectModules).map(unwrap).map((p, i) => ({ id: p.id || `project-${i}`, ...p }));
const localCategories = Object.values(categoryModules).map(unwrap).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
const localMotionCategories = Object.values(motionCategoryModules).map(unwrap).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
const localTestimonials = Object.values(testimonialModules).map(unwrap);
const localTeam = Object.values(teamModules).map((mod, i) => ({ id: `team-${i}`, ...unwrap(mod) })).filter(member => member.visible !== false);
const groupMotion = (categories) => categories.reduce((acc, cat) => {
  acc[cat.subcategory] = (cat.videos || []).map((v, i) => ({ id: `${cat.subcategory}-${i}`, ...v }));
  return acc;
}, {});
export let SITE = localSite;
export let ABOUT_CMS = localAbout;
export let PROJECTS = localProjects;
export let CATEGORIES = localCategories;
export let MOTION_PROJECTS = groupMotion(localMotionCategories);
export let TESTIMONIALS = localTestimonials;
export let TEAM = localTeam;
export async function hydrateContent() {
  if (!supabase) return;
  const { data, error } = await supabase.from('site_content').select('collection, slug, data').eq('is_published', true);
  if (error) {
    console.warn('Supabase content unavailable; using bundled site content.', error.message);
    return;
  }
  if (!data?.length) return;
  const rows = (collection) => (data || []).filter((row) => row.collection === collection);
  const singleton = (collection, fallback) => rows(collection)[0]?.data ?? fallback;
  const entries = (collection) => rows(collection).map((row) => ({ id: row.slug, ...row.data }));
  SITE = singleton('site', localSite);
  ABOUT_CMS = singleton('about', localAbout);
  PROJECTS = entries('projects');
  CATEGORIES = entries('categories').sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  MOTION_PROJECTS = groupMotion(entries('motion_categories').sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
  TESTIMONIALS = entries('testimonials');
  TEAM = entries('team').filter((member) => member.visible !== false);
}
export const resolveVideo = (v) => {
  if (!v) return null;
  const url = v.video_upload || v.video_url;
  if (!url) return null;
  return { ...v, url };
};
export const resolveHeroMedia = (hero) => {
  if (!hero) return null;
  if (hero.media_type === 'image' && hero.media_image) return { type: 'image', url: hero.media_image };
  const url = hero.media_video_upload || hero.media_video_url;
  return url ? { url } : null;
};