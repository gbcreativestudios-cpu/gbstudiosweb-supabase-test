import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useInView } from 'framer-motion';
import {
  ArrowRight, ArrowUpRight, Play, X, Menu, Instagram,
  Twitter, Linkedin, CheckCircle2, ChevronLeft,
  Sparkles, Star, Quote
} from 'lucide-react';
import {
  SITE, ABOUT_CMS, PROJECTS, CATEGORIES, MOTION_PROJECTS, TESTIMONIALS, TEAM,
  resolveVideo, resolveHeroMedia
} from './content/loadContent.js';

// --- THEME ---
// Hero darkening: 0 = no darkening at all, 1 = solid black at the bottom.
// This is the opacity at the BOTTOM of the hero section; it always fades
// to fully transparent at the top, regardless of this number.
const HERO_DARKEN_BOTTOM = 0.5;

// Brand ticker logos: rendered as grey silhouettes regardless of the
// original logo's color (via CSS grayscale), at this opacity (0 to 1).
const TICKER_LOGO_OPACITY = 0.4;

const THEME = {
  gradient: 'bg-gradient-to-r from-[#7519A2] via-[#FC6737] to-[#FCB338]',
  gradientText: 'bg-clip-text text-transparent bg-gradient-to-r from-[#7519A2] via-[#FC6737] to-[#FCB338]',
};

// =========================================================================
// COLOR CONTROL PANEL
// Every background, accent, and gradient color in the site, grouped by
// section, so each can be changed independently — editing one value here
// never affects any other, even where two things currently look the same.
// (Plain white/black body text and its opacity variants, like text-white/60,
// are left as Tailwind classes — those are just readability tints for
// secondary copy, not distinct brand colors.)
// =========================================================================
const COLORS = {
  // Global / shared across the whole site
  pageBackground: '#050505',
  textSelectionBackground: '#3284EF',

  // Logo fallback letter-mark (only used if no logo image is uploaded)
  logoLetterHover: '#3284EF',

  // Primary button (used across Hero, About, etc.)
  primaryButtonBg: '#3284EF',
  primaryButtonHoverBg: '#ffffff',

  // Nav bar
  navScrolledBg: 'rgba(0,0,0,0.8)',
  navLinkActive: '#3284EF',
  navCtaBg: '#ffffff',
  navCtaHoverBg: '#3284EF',
  navMobileMenuBg: '#000000',

  // Brand ticker strip
  tickerBg: '#050505',

  // Video lightbox modal (opened from any play button site-wide)
  lightboxBg: '#111111',

  // Work / Selected Work section
  workHeadingGradientFrom: '#7519A2',
  workHeadingGradientVia: '#FC6737',
  workHeadingGradientTo: '#FCB338',
  workFilterActiveBg: '#ffffff',
  workFilterInactiveBg: '#111111',
  workFilterInactiveHoverBg: '#222222',
  projectCardBg: '#111111',
  projectCardHoverIconBg: '#3284EF',
  motionVideoCardBg: '#111111',
  motionVideoCardHoverBorder: '#3284EF',

  // Our Process section
  processSectionBg: '#0a0a0a',
  processCardBg: '#111111',
  processCardHoverBorder: '#3284EF',

  // Pushing Boundaries stats section
  boundariesSectionBg: '#000000',
  boundariesStatNumber: '#3284EF',

  // Client testimonials marquee
  testimonialsSectionBg: '#3284EF',

  // About page
  aboutPageBg: '#000000',
  aboutHeroSectionBg: '#0a0a0a',
  aboutSectionLabel: '#3284EF', // "Why We Exist" / "Our Goal" labels
  founderSectionLabel: '#3284EF', // "The Founder" label — independent from the above
  aboutTeamSectionBg: '#0a0a0a',
  teamRoleColor: '#3284EF',
  teamSocialHover: '#3284EF',

  // Project detail page
  projectDetailBg: '#000000',
  projectDetailAssetCardBg: '#111111',
  projectDetailOutcomeText: '#3284EF',
  projectDetailUpNextHover: '#3284EF',

  // Start a Project page (form)
  startFormSubmitGradientFrom: '#7519A2',
  startFormSubmitGradientVia: '#FC6737',
  startFormSubmitGradientTo: '#FCB338',
  formInputBg: '#111111',
  formInputFocusBorder: '#3284EF',
  formRadioAccent: '#3284EF',

  // Contact page
  contactSocialIconBg: '#111111',
  contactSocialIconHoverBg: '#3284EF',
  contactEmailHover: '#3284EF',
  contactSendButtonHoverBg: '#3284EF',
  contactFormCardBg: '#0a0a0a',
  contactSuccessIcon: '#3284EF',

  // Footer
  footerBg: '#000000',
  footerAdminLinkHover: '#3284EF',
};

// A generic, always-available fallback image — used whenever a CMS image
// field is empty or the URL it points to 404s, so a broken link never shows
// up as a broken-image icon on the live site.
const FALLBACK_IMAGE = 'https://picsum.photos/seed/gb-studios-fallback/800/1000';

// --- UTILITY COMPONENTS & HELPERS ---

const getThumbnail = (project) => {
  if (project.thumbnail) return project.thumbnail;

  const fullWidthImg = project.content?.blocks?.find(b => b.type === 'full-width-image' || b.type === 'image');
  if (fullWidthImg) return fullWidthImg.url;

  const gallery = project.content?.blocks?.find(b => b.type === 'gallery');
  if (gallery && gallery.images && gallery.images.length > 0) return gallery.images[0];

  return FALLBACK_IMAGE;
};

// Drop-in replacement for <img> that swaps to a fallback if the CMS-supplied
// URL is missing or fails to load, instead of showing a broken image icon.
const SafeImage = ({ src, fallback = FALLBACK_IMAGE, ...props }) => {
  const [current, setCurrent] = useState(src || fallback);
  useEffect(() => { setCurrent(src || fallback); }, [src, fallback]);
  return (
    <img
      {...props}
      src={current}
      onError={() => { if (current !== fallback) setCurrent(fallback); }}
    />
  );
};

// Renders the CMS-uploaded logo (content/site.json -> navLogo / footerLogo)
// for whichever spot it's used in, falling back to the default letter mark
// if nothing has been uploaded for that spot. Nav and footer are fully
// independent: different image, and each has its own height class below
// so you can size them separately.
const Logo = ({ variant = "nav" }) => {
  const src = variant === "footer" ? SITE.footerLogo : SITE.navLogo;
  // Change h-8 to resize the nav logo, h-8 in the footer branch to resize
  // the footer logo — independently of each other.
  const sizeClass = variant === "footer" ? "h-4 w-auto" : "h-4 w-auto";

  if (src) {
    return (
      <div className="flex items-center group cursor-pointer z-50 relative">
        <img
          src={src}
          alt="GB Studios"
          className={`${sizeClass} object-contain transition-opacity duration-500 group-hover:opacity-80`}
        />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 group cursor-pointer z-50 relative" style={{ '--logo-hover': COLORS.logoLetterHover }}>
      <div className="w-8 h-8 rounded-sm bg-white flex items-center justify-center text-black font-bold text-xl group-hover:bg-[var(--logo-hover)] transition-colors duration-500">G</div>
      <div className="w-8 h-8 rounded-sm border border-white flex items-center justify-center text-white font-bold text-xl group-hover:border-[var(--logo-hover)] transition-colors duration-500">B</div>
      <span className="font-semibold text-lg ml-1 tracking-wider hidden sm:block group-hover:text-[var(--logo-hover)] transition-colors duration-500">STUDIOS</span>
    </div>
  );
};

const MagneticButton = ({ children, onClick, className = '', variant = 'primary' }) => {
  const buttonRef = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    const { clientX, clientY } = e;
    const { left, top, width, height } = buttonRef.current.getBoundingClientRect();
    setPosition({ x: (clientX - (left + width / 2)) * 0.3, y: (clientY - (top + height / 2)) * 0.3 });
  };
  const handleMouseLeave = () => setPosition({ x: 0, y: 0 });

  const baseStyles = "relative inline-flex items-center justify-center px-8 py-4 rounded-full font-medium tracking-wide overflow-hidden group transition-all duration-300";
  const variants = {
    primary: `text-white hover:text-black`,
    secondary: `border border-white/20 text-white hover:border-white bg-black/50 backdrop-blur-sm`,
    gradient: `${THEME.gradient} text-white`
  };
  const variantStyle = variant === 'primary'
    ? { '--btn-bg': COLORS.primaryButtonBg, '--btn-hover-bg': COLORS.primaryButtonHoverBg }
    : {};

  return (
    <motion.button
      ref={buttonRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
      className={`${baseStyles} ${variants[variant]} ${variant === 'primary' ? 'bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)]' : ''} ${className}`}
      style={variantStyle}
    >
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </motion.button>
  );
};

// --- GLOBAL MEDIA HANDLER ---
const UniversalMedia = ({ media, className, muted = true, loop = true, controls = false, autoPlayInView = true }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { margin: "0px 0px 200px 0px" });
  const videoRef = useRef(null);
  const [videoFailed, setVideoFailed] = useState(false);

  useEffect(() => {
    if (autoPlayInView && videoRef.current) {
      if (isInView) videoRef.current.play().catch(() => {});
      else videoRef.current.pause();
    }
  }, [isInView, autoPlayInView]);

  if (!media || !media.url) return null;

  let type = media.type;
  if (!type) {
    if (media.url.includes('youtube.com') || media.url.includes('youtu.be')) type = 'youtube';
    else if (media.url.includes('vimeo.com')) type = 'vimeo';
    else if (media.url.match(/\.(mp4|webm|mov|gif)$/i)) type = 'video';
    else type = 'image';
  }

  if (type === 'youtube') {
    const videoId = media.url.split('v=')[1]?.split('&')[0] || media.url.split('youtu.be/')[1];
    return (
      <iframe
        className={className}
        src={`https://www.youtube.com/embed/${videoId}?autoplay=${autoPlayInView ? 1 : 0}&mute=${muted ? 1 : 0}&loop=${loop ? 1 : 0}&controls=${controls ? 1 : 0}&playlist=${videoId}`}
        allow="autoplay; encrypted-media"
        allowFullScreen
      />
    );
  }

  if (type === 'vimeo') {
    const vimeoUrl = media.url.includes('player.vimeo.com') ? media.url : `https://player.vimeo.com/video/${media.url.split('/').pop()}`;
    const separator = vimeoUrl.includes('?') ? '&' : '?';
    return (
      <iframe
        className={className}
        src={`${vimeoUrl}${separator}autoplay=${autoPlayInView ? 1 : 0}&muted=${muted ? 1 : 0}&loop=${loop ? 1 : 0}&background=${!controls ? 1 : 0}`}
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
      />
    );
  }

  if (type === 'video') {
    // If a video file 404s or fails to decode, fall back to a static image
    // instead of leaving a black box on the page.
    if (videoFailed) {
      return <SafeImage src={FALLBACK_IMAGE} alt={media.title || 'Media unavailable'} className={className} />;
    }
    return (
      <div ref={ref} className="w-full h-full relative">
        <video
          ref={videoRef}
          src={media.url}
          className={className}
          muted={muted}
          loop={loop}
          controls={controls}
          playsInline
          preload="metadata"
          onError={() => setVideoFailed(true)}
        />
      </div>
    );
  }

  return <SafeImage src={media.url} alt={media.title || "Media"} className={className} loading="lazy" />;
};

const LightboxVideoPlayer = ({ video, onClose }) => {
  if (!video) return null;
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-4"
    >
      <button onClick={onClose} className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors z-50">
        <X size={32} />
      </button>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className={`relative w-full max-w-6xl max-h-[90vh] flex items-center justify-center overflow-hidden rounded-xl`}
        style={{ aspectRatio: video.ratio === '9:16' ? 9 / 16 : video.ratio === '1:1' ? 1 / 1 : 16 / 9, backgroundColor: COLORS.lightboxBg }}
      >
        <UniversalMedia media={video} className="w-full h-full object-contain" controls={true} autoPlayInView={true} muted={false} />
        {video.title && (
          <div className="absolute bottom-4 left-4 text-white z-20">
            <p className="font-medium text-lg drop-shadow-md bg-black/50 px-3 py-1 rounded backdrop-blur">{video.title}</p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

// --- HOME PAGE SECTIONS ---

const Hero = ({ onNavigate }) => {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 1000], [0, 300]);
  const heroMedia = resolveHeroMedia(SITE.hero);

  const getAlignmentClasses = (alignment) => {
    switch (alignment) {
      case 'bottom-left': return 'justify-end items-start text-left pb-24';
      case 'bottom-center': return 'justify-end items-center text-center pb-24';
      case 'bottom-right': return 'justify-end items-end text-right pb-24';
      case 'center-left': return 'justify-center items-start text-left';
      case 'center': return 'justify-center items-center text-center';
      case 'center-right': return 'justify-center items-end text-right';
      default: return 'justify-end items-start text-left pb-24';
    }
  };

  return (
    <section className="relative h-screen flex flex-col overflow-hidden">
      <motion.div style={{ y, backgroundColor: COLORS.pageBackground }} className="absolute inset-0 z-0">
        <UniversalMedia media={heroMedia} className="w-full h-full object-cover opacity-90" autoPlayInView={true} />
      </motion.div>

      {/* Hero darkening overlay — controls text readability over the media.
          Change HERO_DARKEN_BOTTOM below (0 to 1) to adjust strength.
          It's a gradient: HERO_DARKEN_BOTTOM opacity black at the bottom of
          the hero, fading to fully transparent at the top. */}
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{ background: `linear-gradient(to top, rgba(0,0,0,${HERO_DARKEN_BOTTOM}), rgba(0,0,0,0))` }}
      />
      {/* Separate, second layer: fades to the site's dark background color
          right at the very bottom edge of the hero, so it blends into the
          section below it. Independent from the darkening overlay above. */}
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#050505] via-transparent to-transparent pointer-events-none" />

      <div className={`relative z-20 px-6 md:px-12 w-full h-full max-w-[1400px] mx-auto flex flex-col ${getAlignmentClasses(SITE.hero.alignment)}`}>
        <motion.div
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-4xl"
        >
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter mb-4 leading-[1] text-white drop-shadow-xl">
            {SITE.hero.headline}
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-10 font-light max-w-2xl drop-shadow-md">
            {SITE.hero.subheadline}
          </p>

          <div className={`flex flex-col sm:flex-row gap-4 ${SITE.hero.alignment.includes('right') ? 'justify-end' : SITE.hero.alignment.includes('center') ? 'justify-center' : 'justify-start'}`}>
            <MagneticButton onClick={() => document.getElementById('work').scrollIntoView({ behavior: 'smooth' })}>
              View Projects <ArrowRight size={18} />
            </MagneticButton>
            <MagneticButton variant="secondary" onClick={() => onNavigate('start')}>
              Start A Project
            </MagneticButton>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

const BrandTicker = () => {
  const brands = (SITE.brands || []).filter(Boolean);
  const tickerItems = [...brands, ...brands, ...brands, ...brands];

  if (brands.length === 0) return null;

  return (
    <div className="py-8 border-y border-white/5 overflow-hidden flex relative" style={{ backgroundColor: COLORS.tickerBg }}>
      <div className="absolute left-0 top-0 bottom-0 w-32 z-10 pointer-events-none" style={{ background: `linear-gradient(to right, ${COLORS.tickerBg}, transparent)` }} />
      <div className="absolute right-0 top-0 bottom-0 w-32 z-10 pointer-events-none" style={{ background: `linear-gradient(to left, ${COLORS.tickerBg}, transparent)` }} />
      <motion.div
        animate={{ x: ["0%", "-50%"] }}
        transition={{ ease: "linear", duration: 30, repeat: Infinity }}
        className="flex gap-16 md:gap-32 min-w-max px-8 items-center"
      >
        {tickerItems.map((logoUrl, i) => (
          <img
            key={i}
            src={logoUrl}
            alt="Brand logo"
            className="h-8 md:h-10 w-auto object-contain grayscale transition-opacity duration-300 hover:opacity-100"
            style={{ opacity: TICKER_LOGO_OPACITY }}
          />
        ))}
      </motion.div>
    </div>
  );
};

const ProjectCard = ({ project, onClick }) => {
  const thumbUrl = getThumbnail(project);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -10 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="group cursor-pointer flex flex-col gap-4"
      onClick={() => onClick(project)}
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-xl border border-white/5" style={{ backgroundColor: COLORS.projectCardBg }}>
        <SafeImage src={thumbUrl} alt={project.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-500" />
        <div className="absolute top-4 left-4 px-3 py-1 bg-black/50 backdrop-blur-md rounded-full text-xs font-medium border border-white/10 uppercase tracking-wide text-white">{project.category}</div>
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10">
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-white transform scale-50 group-hover:scale-100 transition-transform duration-500 ease-out shadow-xl" style={{ backgroundColor: COLORS.projectCardHoverIconBg, boxShadow: `0 20px 25px -5px ${COLORS.projectCardHoverIconBg}4d` }}>
            <ArrowUpRight size={24} />
          </div>
        </div>
      </div>
      <div>
        <h3 className="text-2xl font-semibold tracking-tight">{project.title}</h3>
        <p className="text-white/50 text-sm mt-1">{project.client} &mdash; {project.year}</p>
      </div>
    </motion.div>
  );
};

const WorkSection = ({ onProjectSelect }) => {
  const categories = ['All', 'Motion', ...CATEGORIES.map(c => c.name)];
  const [activeCategory, setActiveCategory] = useState('All');
  const [playingVideo, setPlayingVideo] = useState(null);

  const filteredProjects = activeCategory === 'All' ? PROJECTS.slice(0, 6) : PROJECTS.filter(p => p.category === activeCategory);

  const renderMotionSubcategories = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-24 w-full">
      {Object.entries(MOTION_PROJECTS).map(([subcat, videos]) => (
        <div key={subcat} className="space-y-8">
          <h3 className="text-3xl font-bold tracking-tight border-b border-white/10 pb-4">{subcat}</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {videos.map((vid) => {
              const resolved = resolveVideo(vid);
              return (
                <div
                  key={vid.id}
                  className="relative group cursor-pointer overflow-hidden rounded-lg border border-white/5 hover:border-[var(--motion-hover-border)]/50 transition-all"
                  style={{ aspectRatio: vid.ratio === '9:16' ? 9 / 16 : vid.ratio === '1:1' ? 1 / 1 : 16 / 9, backgroundColor: COLORS.motionVideoCardBg, '--motion-hover-border': COLORS.motionVideoCardHoverBorder }}
                  onClick={() => setPlayingVideo(resolved)}
                >
                  <UniversalMedia media={resolved} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" autoPlayInView={false} />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border border-white/20">
                      <Play fill="white" size={16} />
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="text-sm font-medium truncate drop-shadow-md text-white">{vid.title}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </motion.div>
  );

  return (
    <section id="work" className="py-24 px-6 max-w-[1400px] mx-auto min-h-screen">
      <div className="flex flex-col mb-16 gap-8">
        <h2
          className="text-4xl md:text-6xl font-bold tracking-tight pb-2 max-w-max bg-clip-text text-transparent"
          style={{ backgroundImage: `linear-gradient(to right, ${COLORS.workHeadingGradientFrom}, ${COLORS.workHeadingGradientVia}, ${COLORS.workHeadingGradientTo})` }}
        >
          Selected Work
        </h2>
        <div className="flex flex-wrap gap-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${activeCategory === cat ? 'text-black' : 'text-white/70 hover:text-white border border-white/5 hover:bg-[var(--filter-hover-bg)]'}`}
              style={{ backgroundColor: activeCategory === cat ? COLORS.workFilterActiveBg : COLORS.workFilterInactiveBg, '--filter-hover-bg': COLORS.workFilterInactiveHoverBg }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeCategory === 'Motion' ? renderMotionSubcategories() : (
          <motion.div key="standard-grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 gap-y-16">
            {filteredProjects.map((project) => (
              <ProjectCard key={project.id} project={project} onClick={onProjectSelect} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {playingVideo && <LightboxVideoPlayer video={playingVideo} onClose={() => setPlayingVideo(null)} />}
      </AnimatePresence>
    </section>
  );
};

const ProcessSection = () => {
  const steps = [
    { title: 'Discover', desc: 'Deep dive into brand ethos, objectives, and market landscape to find the unique angle.' },
    { title: 'Strategy', desc: 'Architecting a roadmap that aligns creative vision with tangible business outcomes.' },
    { title: 'Design', desc: 'Iterative crafting of visual assets using cutting-edge tools and artistic intuition.' },
    { title: 'Deliver', desc: 'Flawless execution and handover of scalable, production-ready assets.' }
  ];

  const allThumbnails = PROJECTS.map(p => getThumbnail(p)).filter(Boolean);
  const tickerItems = [...allThumbnails, ...allThumbnails, ...allThumbnails];

  return (
    <section className="py-24 overflow-hidden" style={{ backgroundColor: COLORS.processSectionBg }}>
      <div className="max-w-[1400px] mx-auto px-6 mb-24">
        <h2 className="text-4xl md:text-5xl font-bold mb-16 tracking-tight">Our Process</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-8 rounded-2xl border border-white/5 hover:border-[var(--process-hover-border)]/30 transition-colors group"
              style={{ backgroundColor: COLORS.processCardBg, '--process-hover-border': COLORS.processCardHoverBorder }}
            >
              <div className="text-5xl font-light text-white/10 mb-6 group-hover:text-[var(--process-hover-border)]/50 transition-colors">0{i + 1}</div>
              <h3 className="text-2xl font-semibold mb-4">{step.title}</h3>
              <p className="text-white/60 leading-relaxed text-sm">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="relative w-full overflow-hidden flex">
        <div className="absolute left-0 top-0 bottom-0 w-32 z-10 pointer-events-none" style={{ background: `linear-gradient(to right, ${COLORS.processSectionBg}, transparent)` }} />
        <div className="absolute right-0 top-0 bottom-0 w-32 z-10 pointer-events-none" style={{ background: `linear-gradient(to left, ${COLORS.processSectionBg}, transparent)` }} />
        <motion.div animate={{ x: ["0%", "-50%"] }} transition={{ ease: "linear", duration: 40, repeat: Infinity }} className="flex gap-4 min-w-max">
          {tickerItems.map((img, i) => (
            <div key={i} className="w-[200px] h-[280px] md:w-[280px] md:h-[400px] rounded-xl overflow-hidden flex-shrink-0 border border-white/5">
              <SafeImage src={img} className="w-full h-full object-cover" loading="lazy" alt="Project snapshot" />
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

const PushingBoundariesSection = () => {
  const yearsOfExperience = new Date().getFullYear() - SITE.startYear;

  return (
    <section className="py-32 px-6 relative overflow-hidden border-y border-white/5" style={{ backgroundColor: COLORS.boundariesSectionBg }}>
      <div className="max-w-[1400px] mx-auto text-center flex flex-col items-center">
        <h2 className="text-4xl md:text-6xl font-bold mb-8 tracking-tight max-w-3xl">Pushing visual boundaries.</h2>
        <p className="text-lg text-white/70 mb-16 leading-relaxed max-w-2xl font-light">
          GB Studios was founded on a simple principle: aesthetic excellence combined with strategic rigor. We are a collective of directors, designers, and technologists who believe that every brand deserves to move beautifully.
        </p>
        <div className="grid grid-cols-2 gap-16 md:gap-32">
          <div>
            <div className="text-5xl md:text-7xl font-bold mb-4" style={{ color: COLORS.boundariesStatNumber }}>250+</div>
            <div className="text-sm text-white/50 uppercase tracking-widest font-medium">Projects Delivered</div>
          </div>
          <div>
            <div className="text-5xl md:text-7xl font-bold mb-4" style={{ color: COLORS.boundariesStatNumber }}>{yearsOfExperience}+</div>
            <div className="text-sm text-white/50 uppercase tracking-widest font-medium">Years Experience</div>
          </div>
        </div>
      </div>
    </section>
  );
};

const TestimonialsMarquee = () => {
  const items = [...TESTIMONIALS, ...TESTIMONIALS];

  return (
    <section className="py-32 text-black overflow-hidden relative" style={{ backgroundColor: COLORS.testimonialsSectionBg }}>
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
      <div className="max-w-[1400px] mx-auto px-6 relative z-10 mb-16 flex justify-between items-end">
        <h2 className="text-sm font-bold uppercase tracking-widest opacity-80">Client Outcomes</h2>
      </div>
      <div className="relative w-full overflow-hidden flex">
        <motion.div animate={{ x: ["0%", "-50%"] }} transition={{ ease: "linear", duration: 40, repeat: Infinity }} className="flex gap-8 min-w-max px-4">
          {items.map((t, i) => (
            <div key={i} className="w-[400px] md:w-[500px] bg-black/10 backdrop-blur-md p-10 rounded-3xl flex flex-col justify-between flex-shrink-0 border border-black/10">
              <div>
                <Quote size={40} className="text-black/20 mb-6" />
                <p className="text-xl md:text-2xl font-medium leading-relaxed mb-8">"{t.text}"</p>
              </div>
              <div className="flex items-center gap-4">
                <SafeImage src={t.image} alt={t.author} className="w-14 h-14 rounded-full object-cover border-2 border-black/20" />
                <div>
                  <div className="font-bold text-lg">{t.author}</div>
                  <div className="opacity-70 text-sm">{t.role}</div>
                  <div className="flex gap-1 mt-1">{[...Array(t.stars)].map((_, s) => <Star key={s} size={14} fill="currentColor" />)}</div>
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

// --- DYNAMIC PROJECT PAGE BUILDER ---

const BlockRenderer = ({ block }) => {
  switch (block.type) {
    case 'text':
      return <p className="text-xl md:text-2xl font-light leading-relaxed text-white/80 max-w-4xl">{block.text}</p>;
    case 'full-width-image':
    case 'image':
      return (
        <div className="w-full rounded-2xl overflow-hidden border border-white/5" style={{ aspectRatio: block.ratio === '1:1' ? 1 / 1 : 21 / 9, backgroundColor: COLORS.projectDetailAssetCardBg }}>
          <UniversalMedia media={{ url: block.url, type: 'image' }} className="w-full h-full object-cover" />
        </div>
      );
    case 'two-column-image':
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="aspect-[4/5] rounded-2xl overflow-hidden border border-white/5"><SafeImage src={block.img1} className="w-full h-full object-cover" loading="lazy" /></div>
          <div className="aspect-[4/5] rounded-2xl overflow-hidden border border-white/5"><SafeImage src={block.img2} className="w-full h-full object-cover" loading="lazy" /></div>
        </div>
      );
    case 'gallery':
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {block.images.map((img, i) => (
            <div key={i} className="aspect-square rounded-xl overflow-hidden border border-white/5"><SafeImage src={img} className="w-full h-full object-cover" loading="lazy" /></div>
          ))}
        </div>
      );
    case 'video':
      return (
        <div className="w-full rounded-2xl overflow-hidden border border-white/5" style={{ aspectRatio: block.ratio === '1:1' ? 1 / 1 : 16 / 9, backgroundColor: COLORS.projectDetailAssetCardBg }}>
          <UniversalMedia media={resolveVideo(block)} className="w-full h-full object-cover" controls={false} muted={true} autoPlayInView={true} loop={true} />
        </div>
      );
    default:
      return null;
  }
};

const ProjectDetailPage = ({ project, onBack }) => {
  const [playingVideo, setPlayingVideo] = useState(null);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  if (!project) return null;

  const thumbUrl = getThumbnail(project);
  const brandMotion = project.content.brandMotion?.active ? resolveVideo(project.content.brandMotion) : null;

  return (
    <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="pt-24 pb-32 min-h-screen" style={{ backgroundColor: COLORS.projectDetailBg }}>
      <div className="max-w-[1400px] mx-auto px-6">
        <button onClick={onBack} className="mb-12 flex items-center gap-2 text-white/60 hover:text-white transition-colors">
          <ChevronLeft size={20} /> Back to Work
        </button>

        <div className="mb-24">
          <div className="w-full aspect-[21/9] rounded-3xl overflow-hidden mb-12 relative border border-white/5">
            <SafeImage src={thumbUrl} alt={project.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
          </div>

          <div className="flex flex-col md:flex-row gap-12 justify-between">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter max-w-2xl">{project.title}</h1>
            <div className="grid grid-cols-2 md:grid-cols-1 gap-6 text-sm">
              <div><div className="text-white/40 uppercase tracking-widest mb-1">Client</div><div className="font-medium">{project.client}</div></div>
              <div><div className="text-white/40 uppercase tracking-widest mb-1">Year</div><div className="font-medium">{project.year}</div></div>
              {project.industry && <div><div className="text-white/40 uppercase tracking-widest mb-1">Industry</div><div className="font-medium">{project.industry}</div></div>}
              {project.services && <div><div className="text-white/40 uppercase tracking-widest mb-1">Services</div><div className="font-medium">{project.services.join(', ')}</div></div>}
            </div>
          </div>
        </div>

        <div className="space-y-24">
          {project.content.problem && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start border-t border-white/10 pt-16">
              <div className="md:col-span-4 text-white/40 uppercase tracking-widest text-sm font-medium">The Problem</div>
              <div className="md:col-span-8 text-2xl font-light leading-relaxed">{project.content.problem}</div>
            </div>
          )}
          {project.content.approach && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start border-t border-white/10 pt-16">
              <div className="md:col-span-4 text-white/40 uppercase tracking-widest text-sm font-medium">Approach</div>
              <div className="md:col-span-8 text-2xl font-light leading-relaxed">{project.content.approach}</div>
            </div>
          )}
          {project.content.strategy && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start border-t border-white/10 pt-16">
              <div className="md:col-span-4 text-white/40 uppercase tracking-widest text-sm font-medium">Strategy</div>
              <div className="md:col-span-8 text-2xl font-light leading-relaxed">{project.content.strategy}</div>
            </div>
          )}
          {project.content.identityDevelopment && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start border-t border-white/10 pt-16">
              <div className="md:col-span-4 text-white/40 uppercase tracking-widest text-sm font-medium">Identity Dev.</div>
              <div className="md:col-span-8 text-2xl font-light leading-relaxed">{project.content.identityDevelopment}</div>
            </div>
          )}

          {project.content.blocks && project.content.blocks.length > 0 && (
            <div className="space-y-16">
              {project.content.blocks.map((block, idx) => (
                <div key={idx} className={project.category === 'Music Covers' && block.type !== 'text' ? 'max-w-4xl mx-auto' : ''}>
                  <BlockRenderer block={block} />
                </div>
              ))}
            </div>
          )}

          {project.content.outcome && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start border-t border-white/10 pt-16">
              <div className="md:col-span-4 text-white/40 uppercase tracking-widest text-sm font-medium">Outcome</div>
              <div className="md:col-span-8 text-2xl font-light leading-relaxed" style={{ color: COLORS.projectDetailOutcomeText }}>{project.content.outcome}</div>
            </div>
          )}
          {project.content.results && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start border-t border-white/10 pt-16">
              <div className="md:col-span-4 text-white/40 uppercase tracking-widest text-sm font-medium">Results</div>
              <div className="md:col-span-8 text-2xl font-light leading-relaxed" style={{ color: COLORS.projectDetailOutcomeText }}>{project.content.results}</div>
            </div>
          )}

          {brandMotion && (
            <div className="border-t border-white/10 pt-16">
              <h3 className="text-3xl font-bold mb-8 tracking-tight">Brand Motion Anthem</h3>
              <div className="w-full aspect-video border border-white/5 rounded-2xl overflow-hidden cursor-pointer group relative" style={{ backgroundColor: COLORS.projectDetailAssetCardBg }} onClick={() => setPlayingVideo(brandMotion)}>
                <UniversalMedia media={brandMotion} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" autoPlayInView={false} />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-16 h-16 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border border-white/20">
                    <Play fill="white" size={24} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {project.content.motionAssets && project.content.motionAssets.length > 0 && (
            <div className="border-t border-white/10 pt-16">
              <h3 className="text-3xl font-bold mb-8 tracking-tight">Motion Assets</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {project.content.motionAssets.map((asset, i) => {
                  const resolved = resolveVideo(asset);
                  return (
                    <div key={i} className="relative group cursor-pointer overflow-hidden rounded-lg border border-white/5" style={{ aspectRatio: asset.ratio === '9:16' ? 9 / 16 : 16 / 9, backgroundColor: COLORS.projectDetailAssetCardBg }} onClick={() => setPlayingVideo(resolved)}>
                      <UniversalMedia media={resolved} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" autoPlayInView={false} />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border border-white/20">
                          <Play fill="white" size={16} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="mt-32 pt-16 border-t border-white/10 text-center">
          <div className="text-white/40 uppercase tracking-widest text-sm mb-4">Up Next</div>
          <button onClick={onBack} className="text-4xl md:text-6xl font-bold transition-colors hover:text-[var(--upnext-hover)]" style={{ '--upnext-hover': COLORS.projectDetailUpNextHover }}>View All Projects</button>
        </div>
      </div>
      <AnimatePresence>{playingVideo && <LightboxVideoPlayer video={playingVideo} onClose={() => setPlayingVideo(null)} />}</AnimatePresence>
    </motion.div>
  );
};

// --- DEDICATED ABOUT PAGE ---

const AboutPage = ({ onNavigate }) => {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen" style={{ backgroundColor: COLORS.aboutPageBg }}>
      <section className="pt-40 pb-24 px-6 border-b border-white/5" style={{ backgroundColor: COLORS.aboutHeroSectionBg }}>
        <div className="max-w-[1400px] mx-auto">
          <h1 className="text-5xl md:text-8xl font-bold tracking-tighter mb-8 max-w-4xl leading-[1.1]">{ABOUT_CMS.heroTitle}</h1>
          <p className="text-xl md:text-3xl text-white/60 font-light max-w-3xl leading-relaxed">{ABOUT_CMS.heroSubtitle}</p>
        </div>
      </section>

      {(ABOUT_CMS.whyWeExist || ABOUT_CMS.ourGoal) && (
        <section className="py-32 px-6 border-b border-white/5">
          <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-16">
            {ABOUT_CMS.whyWeExist && (
              <div>
                <h2 className="text-sm font-bold uppercase tracking-widest mb-6" style={{ color: COLORS.aboutSectionLabel }}>Why We Exist</h2>
                <p className="text-2xl md:text-3xl font-light leading-relaxed">{ABOUT_CMS.whyWeExist}</p>
              </div>
            )}
            {ABOUT_CMS.ourGoal && (
              <div>
                <h2 className="text-sm font-bold uppercase tracking-widest mb-6" style={{ color: COLORS.aboutSectionLabel }}>Our Goal</h2>
                <p className="text-2xl md:text-3xl font-light leading-relaxed">{ABOUT_CMS.ourGoal}</p>
              </div>
            )}
          </div>
        </section>
      )}

      <section className="py-32 px-6">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-12 gap-16 items-center">
          <div className="md:col-span-5 relative">
            <div className="aspect-[4/5] rounded-3xl overflow-hidden border border-white/5">
              <SafeImage src={ABOUT_CMS.founder.image} alt={ABOUT_CMS.founder.name} className="w-full h-full object-cover" />
            </div>
          </div>
          <div className="md:col-span-7">
            <h2 className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: COLORS.founderSectionLabel }}>The Founder</h2>
            <h3 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">{ABOUT_CMS.founder.name}</h3>
            <p className="text-white/50 text-lg uppercase tracking-widest mb-10">{ABOUT_CMS.founder.title}</p>
            <Quote size={40} className="text-white/10 mb-6" />
            <p className="text-2xl md:text-3xl font-light leading-relaxed mb-8">"{ABOUT_CMS.founder.message}"</p>
            <MagneticButton variant="secondary" onClick={() => onNavigate('contact')}>Get in touch</MagneticButton>
          </div>
        </div>
      </section>

      <section className="py-32 px-6 border-t border-white/5" style={{ backgroundColor: COLORS.aboutTeamSectionBg }}>
        <div className="max-w-[1400px] mx-auto">
          <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-16">The Collective</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {TEAM.map(member => (
              <div key={member.id} className="group" style={{ '--team-social-hover': COLORS.teamSocialHover }}>
                <div className="aspect-square rounded-2xl overflow-hidden mb-6 border border-white/5" style={{ backgroundColor: COLORS.projectCardBg }}>
                  <SafeImage src={member.image} alt={member.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 grayscale group-hover:grayscale-0" />
                </div>
                <h4 className="text-2xl font-bold mb-1">{member.name}</h4>
                <p className="text-sm uppercase tracking-widest font-medium mb-4" style={{ color: COLORS.teamRoleColor }}>{member.role}</p>
                <p className="text-white/60 text-sm leading-relaxed mb-6">{member.bio}</p>
                <div className="flex gap-4 opacity-50 group-hover:opacity-100 transition-opacity">
                  {member.socials?.includes('instagram') && <a href="#" className="hover:text-[var(--team-social-hover)]"><Instagram size={18} /></a>}
                  {member.socials?.includes('twitter') && <a href="#" className="hover:text-[var(--team-social-hover)]"><Twitter size={18} /></a>}
                  {member.socials?.includes('linkedin') && <a href="#" className="hover:text-[var(--team-social-hover)]"><Linkedin size={18} /></a>}
                  {member.socials?.includes('vimeo') && <a href="#" className="hover:text-[var(--team-social-hover)]"><Play size={18} /></a>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-32 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-8">Ready to elevate your brand?</h2>
          <MagneticButton onClick={() => onNavigate('start')}>Start a project</MagneticButton>
        </div>
      </section>
    </motion.div>
  );
};

// --- FORMS & PAGES ---

// Encodes a FormData object the way Netlify Forms expects it (application/x-www-form-urlencoded).
const encodeForNetlify = (formData) => {
  const params = new URLSearchParams();
  for (const [key, value] of formData.entries()) params.append(key, value);
  return params.toString();
};

const StartProjectPage = ({ onBack }) => {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(false);
  const [fileNames, setFileNames] = useState([]);
  const [selectedService, setSelectedService] = useState('');
  const [showBrandFormModal, setShowBrandFormModal] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Uses the raw FormData (multipart/form-data) rather than the
    // urlencoded helper below — file inputs can't be represented as a
    // urlencoded string, and letting fetch set its own Content-Type header
    // (with the correct multipart boundary) is required for uploads to work.
    const formData = new FormData(e.target);
    fetch('/', {
      method: 'POST',
      body: formData,
    })
      .then(() => setSubmitted(true))
      .catch(() => setError(true));
  };

  useEffect(() => { window.scrollTo(0, 0); }, []);

  if (submitted) {
    return (
      <div className="min-h-screen pt-32 pb-24 px-6 flex flex-col items-center justify-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
          <CheckCircle2 size={80} className="mx-auto mb-8" style={{ color: COLORS.contactSuccessIcon }} />
          <h1 className="text-5xl font-bold mb-4">Brief Received.</h1>
          <p className="text-white/60 mb-8 max-w-md mx-auto">Thank you for reaching out. A producer from GB Studios will review your requirements and contact you within 24 hours.</p>
          <MagneticButton onClick={onBack}>Return Home</MagneticButton>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen pt-32 pb-24 px-6 max-w-4xl mx-auto">
      <button onClick={onBack} className="mb-12 flex items-center gap-2 text-white/60 hover:text-white transition-colors"><ChevronLeft size={20} /> Back</button>

      <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-4">Start a Project</h1>
      <p className="text-white/60 text-lg mb-12">Fill out the details below to give us an understanding of your needs. The more information, the better.</p>

      {error && <p className="text-red-400 mb-6">Something went wrong sending your brief — please try again or email us directly.</p>}

      <form name="project-brief" data-netlify="true" netlify-honeypot="bot-field" onSubmit={handleSubmit} className="space-y-12" style={{ '--form-input-bg': COLORS.formInputBg, '--form-focus-border': COLORS.formInputFocusBorder }}>
        <input type="hidden" name="form-name" value="project-brief" />
        <p className="hidden"><label>Don't fill this out: <input name="bot-field" /></label></p>

        <div className="space-y-6">
          <h3 className="text-2xl font-semibold border-b border-white/10 pb-4">01. Personal Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div><label className="block text-sm font-medium text-white/70 mb-2">Full Name</label><input required name="fullName" type="text" className="w-full bg-[var(--form-input-bg)] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--form-focus-border)] transition-colors" /></div>
            <div><label className="block text-sm font-medium text-white/70 mb-2">Company / Organization</label><input name="company" type="text" className="w-full bg-[var(--form-input-bg)] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--form-focus-border)] transition-colors" /></div>
            <div><label className="block text-sm font-medium text-white/70 mb-2">Email Address</label><input required name="email" type="email" className="w-full bg-[var(--form-input-bg)] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--form-focus-border)] transition-colors" /></div>
            <div><label className="block text-sm font-medium text-white/70 mb-2">Phone Number</label><input name="phone" type="tel" className="w-full bg-[var(--form-input-bg)] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--form-focus-border)] transition-colors" /></div>
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-2xl font-semibold border-b border-white/10 pb-4">02. Project Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Primary Service Needed</label>
              <select required name="service" onChange={(e) => setSelectedService(e.target.value)} className="w-full bg-[var(--form-input-bg)] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--form-focus-border)] transition-colors appearance-none">
                <option value="">Select a service...</option>
                <option value="motion">Motion Design / Reels</option>
                <option value="brand">Brand Identity</option>
                <option value="event">Event Visuals</option>
                <option value="music">Music Covers</option>
                <option value="campaign">Campaign Visuals</option>
                <option value="other">Other / Multi-disciplinary</option>
              </select>
              {selectedService === 'brand' && SITE.brandIdentityFormUrl && (
                <button
                  type="button"
                  onClick={() => setShowBrandFormModal(true)}
                  className="mt-3 w-full flex items-center justify-between gap-3 rounded-lg border border-white/10 px-4 py-3 text-sm text-left transition-colors hover:border-[var(--brand-form-hover)]"
                  style={{ backgroundColor: COLORS.formInputBg, '--brand-form-hover': COLORS.primaryButtonBg }}
                >
                  <span>Brand Identity projects use a dedicated intake form — click to fill it out</span>
                  <ArrowUpRight size={16} className="flex-shrink-0" />
                </button>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Estimated Budget Range</label>
              <select name="budget" className="w-full bg-[var(--form-input-bg)] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--form-focus-border)] transition-colors appearance-none">
                <option value="">Select budget...</option>
                <option value="<500">Less than $500</option>
                <option value="500-1000">$500 – $1,000</option>
                <option value="1000-1500">$1,000 – $1,500</option>
                <option value="1500-2000">$1,500 – $2,000</option>
                <option value="2000-5000">$2,000 – $5,000</option>
                <option value="5000+">Above $5,000</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-white/70 mb-2">Project Description</label>
              <textarea required name="description" rows={5} placeholder="Tell us about the project goals, target audience, and specific deliverables..." className="w-full bg-[var(--form-input-bg)] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--form-focus-border)] transition-colors"></textarea>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-2xl font-semibold border-b border-white/10 pb-4">03. Assets & Additional Info</h3>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Attach Files / Brief (Optional)</label>
            <label htmlFor="attachments" className="w-full border-2 border-dashed border-white/20 rounded-lg p-8 flex flex-col items-center justify-center text-white/50 text-sm text-center cursor-pointer hover:border-white/40 transition-colors" style={{ backgroundColor: COLORS.formInputBg }}>
              {fileNames.length > 0 ? (
                <span className="text-white">{fileNames.join(', ')}</span>
              ) : (
                <span>Click to attach files (briefs, references, mockups — up to 10MB total)</span>
              )}
              <input
                id="attachments"
                type="file"
                name="attachments"
                multiple
                className="hidden"
                onChange={(e) => setFileNames(Array.from(e.target.files || []).map(f => f.name))}
              />
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Preferred Contact Method</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="contactMethod" value="email" defaultChecked style={{ accentColor: COLORS.formRadioAccent }} /> Email</label>
              <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="contactMethod" value="phone" style={{ accentColor: COLORS.formRadioAccent }} /> Phone</label>
            </div>
          </div>
        </div>

        <button type="submit" className="w-full py-5 rounded-lg font-bold text-lg tracking-wide hover:opacity-90 transition-opacity text-white" style={{ backgroundImage: `linear-gradient(to right, ${COLORS.startFormSubmitGradientFrom}, ${COLORS.startFormSubmitGradientVia}, ${COLORS.startFormSubmitGradientTo})` }}>Submit Project Brief</button>
      </form>

      <AnimatePresence>
        {showBrandFormModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center px-6 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowBrandFormModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="max-w-md w-full rounded-2xl border border-white/10 p-8 text-center"
              style={{ backgroundColor: COLORS.contactFormCardBg }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold mb-3">One more step</h3>
              <p className="text-white/60 text-sm leading-relaxed mb-8">
                You're about to open our Brand Identity intake form in a new tab. Come back to this tab afterward to finish and submit your project brief here.
              </p>
              <div className="flex flex-col gap-3">
                <a
                  href={SITE.brandIdentityFormUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setShowBrandFormModal(false)}
                  className="w-full py-3 rounded-lg font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: COLORS.primaryButtonBg }}
                >
                  OK, take me there
                </a>
                <button
                  type="button"
                  onClick={() => setShowBrandFormModal(false)}
                  className="w-full py-3 rounded-lg font-medium text-white/60 hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const ContactPage = ({ onBack }) => {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: encodeForNetlify(formData),
    })
      .then(() => setSent(true))
      .catch(() => setError(true));
  };

  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen pt-32 pb-24 px-6 max-w-7xl mx-auto flex flex-col md:flex-row gap-16">
      <div className="w-full md:w-1/2">
        <button onClick={onBack} className="mb-12 flex items-center gap-2 text-white/60 hover:text-white transition-colors"><ChevronLeft size={20} /> Back</button>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">Let's talk.</h1>
        <p className="text-xl text-white/60 mb-12">Whether you have a general inquiry or just want to say hello, we'd love to hear from you.</p>

        <div className="space-y-8">
          <div>
            <div className="text-sm font-medium text-white/40 uppercase tracking-widest mb-1">Email</div>
            <a href={`mailto:${SITE.contactEmail}`} className="text-2xl font-light transition-colors hover:text-[var(--contact-email-hover)]" style={{ '--contact-email-hover': COLORS.contactEmailHover }}>{SITE.contactEmail}</a>
          </div>
          <div>
            <div className="text-sm font-medium text-white/40 uppercase tracking-widest mb-1">Social</div>
            <div className="flex gap-4 mt-2" style={{ '--contact-icon-hover': COLORS.contactSocialIconHoverBg }}>
              <a href="#" className="w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:bg-[var(--contact-icon-hover)]" style={{ backgroundColor: COLORS.contactSocialIconBg }}><Instagram size={18} /></a>
              <a href="#" className="w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:bg-[var(--contact-icon-hover)]" style={{ backgroundColor: COLORS.contactSocialIconBg }}><Twitter size={18} /></a>
              <a href="#" className="w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:bg-[var(--contact-icon-hover)]" style={{ backgroundColor: COLORS.contactSocialIconBg }}><Linkedin size={18} /></a>
            </div>
          </div>
          <div><MagneticButton variant="secondary" className="mt-4">Chat on WhatsApp</MagneticButton></div>
        </div>
      </div>

      <div className="w-full md:w-1/2 p-8 md:p-12 rounded-3xl border border-white/5" style={{ backgroundColor: COLORS.contactFormCardBg }}>
        {sent ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-12">
            <CheckCircle2 size={56} className="mb-6" style={{ color: COLORS.contactSuccessIcon }} />
            <h3 className="text-2xl font-bold mb-2">Message sent.</h3>
            <p className="text-white/60">We'll get back to you shortly.</p>
          </div>
        ) : (
          <form name="contact" data-netlify="true" netlify-honeypot="bot-field" onSubmit={handleSubmit} className="space-y-6" style={{ '--form-input-bg': COLORS.formInputBg, '--form-focus-border': COLORS.formInputFocusBorder }}>
            <input type="hidden" name="form-name" value="contact" />
            <p className="hidden"><label>Don't fill this out: <input name="bot-field" /></label></p>
            {error && <p className="text-red-400 text-sm">Something went wrong — please try again or email us directly.</p>}
            <div><label className="block text-sm font-medium text-white/70 mb-2">Name</label><input required name="name" type="text" className="w-full bg-[var(--form-input-bg)] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--form-focus-border)] transition-colors" /></div>
            <div><label className="block text-sm font-medium text-white/70 mb-2">Email</label><input required name="email" type="email" className="w-full bg-[var(--form-input-bg)] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--form-focus-border)] transition-colors" /></div>
            <div><label className="block text-sm font-medium text-white/70 mb-2">Subject</label><input required name="subject" type="text" className="w-full bg-[var(--form-input-bg)] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--form-focus-border)] transition-colors" /></div>
            <div><label className="block text-sm font-medium text-white/70 mb-2">Message</label><textarea required name="message" rows={4} className="w-full bg-[var(--form-input-bg)] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--form-focus-border)] transition-colors"></textarea></div>
            <button type="submit" className="w-full py-4 text-black font-bold rounded-lg transition-colors hover:bg-[var(--send-hover)] hover:text-white" style={{ backgroundColor: '#ffffff', '--send-hover': COLORS.contactSendButtonHoverBg }}>Send Message</button>
          </form>
        )}
      </div>
    </motion.div>
  );
};

// --- ROOT APP ---

const App = () => {
  const [currentRoute, setCurrentRoute] = useState('home');
  const [selectedProject, setSelectedProject] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // index.html ships a static default favicon link. If an editor has
  // uploaded a custom one via Decap (content/site.json -> favicon), swap
  // the tag's href on load so the browser tab icon reflects it — no build
  // step required, just a small runtime DOM update.
  useEffect(() => {
    if (!SITE.favicon) return;
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = SITE.favicon;
  }, []);

  const navigate = (route, project = null) => {
    setSelectedProject(project);
    setCurrentRoute(route);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen text-white font-sans overflow-x-hidden" style={{ backgroundColor: COLORS.pageBackground }}>
      <style>{`::selection { background-color: ${COLORS.textSelectionBackground}; color: #fff; }`}</style>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 px-6 py-4 flex justify-between items-center ${scrolled ? 'backdrop-blur-md border-b border-white/5 py-4' : 'bg-transparent py-6'}`} style={scrolled ? { backgroundColor: COLORS.navScrolledBg } : {}}>
        <div onClick={() => navigate('home')} className="cursor-pointer"><Logo variant="nav" /></div>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium" style={{ '--nav-active': COLORS.navLinkActive }}>
          <button onClick={() => navigate('home')} className={`hover:text-[var(--nav-active)] transition-colors ${currentRoute === 'home' ? 'text-[var(--nav-active)]' : ''}`}>Work</button>
          <button onClick={() => navigate('about')} className={`hover:text-[var(--nav-active)] transition-colors ${currentRoute === 'about' ? 'text-[var(--nav-active)]' : ''}`}>About</button>
          <button onClick={() => navigate('contact')} className={`hover:text-[var(--nav-active)] transition-colors ${currentRoute === 'contact' ? 'text-[var(--nav-active)]' : ''}`}>Contact</button>
          <button onClick={() => navigate('start')} className="px-5 py-2 rounded-full transition-colors hover:bg-[var(--nav-cta-hover)] hover:text-white" style={{ backgroundColor: COLORS.navCtaBg, color: '#000000', '--nav-cta-hover': COLORS.navCtaHoverBg }}>Start Project</button>
        </div>

        <button className="md:hidden relative z-50" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </nav>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-8 text-2xl font-semibold" style={{ backgroundColor: COLORS.navMobileMenuBg, '--nav-active': COLORS.navLinkActive }}>
            <button onClick={() => navigate('home')} className={`hover:text-[var(--nav-active)] transition-colors ${currentRoute === 'home' ? 'text-[var(--nav-active)]' : ''}`}>Work</button>
            <button onClick={() => navigate('about')} className={`hover:text-[var(--nav-active)] transition-colors ${currentRoute === 'about' ? 'text-[var(--nav-active)]' : ''}`}>About</button>
            <button onClick={() => navigate('contact')} className={`hover:text-[var(--nav-active)] transition-colors ${currentRoute === 'contact' ? 'text-[var(--nav-active)]' : ''}`}>Contact</button>
            <button onClick={() => navigate('start')} className="px-8 py-3 rounded-full transition-colors hover:bg-[var(--nav-cta-hover)] hover:text-white mt-4" style={{ backgroundColor: COLORS.navCtaBg, color: '#000000', '--nav-cta-hover': COLORS.navCtaHoverBg }}>Start Project</button>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="relative z-10">
        <AnimatePresence mode="wait">
          {currentRoute === 'home' && (
            <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -50 }} transition={{ duration: 0.5 }}>
              <Hero onNavigate={navigate} />
              <BrandTicker />
              <WorkSection onProjectSelect={(p) => navigate('project', p)} />
              <ProcessSection />
              <PushingBoundariesSection />
              <TestimonialsMarquee />
            </motion.div>
          )}
          {currentRoute === 'about' && (
            <motion.div key="about" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.5 }}>
              <AboutPage onNavigate={navigate} />
            </motion.div>
          )}
          {currentRoute === 'project' && (
            <motion.div key="project" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.5 }}>
              <ProjectDetailPage project={selectedProject} onBack={() => navigate('home')} />
            </motion.div>
          )}
          {currentRoute === 'start' && (
            <motion.div key="start" initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -100 }} transition={{ duration: 0.5 }}>
              <StartProjectPage onBack={() => navigate('home')} />
            </motion.div>
          )}
          {currentRoute === 'contact' && (
            <motion.div key="contact" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.5 }}>
              <ContactPage onBack={() => navigate('home')} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="pt-32 pb-12 px-6 border-t border-white/10 relative z-10" style={{ backgroundColor: COLORS.footerBg }}>
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row justify-between items-start gap-16 mb-24">
          <div className="max-w-md">
            <Logo variant="footer" />
            <p className="text-white/50 mt-6 leading-relaxed">{SITE.footerBlurb}</p>
          </div>
          <div className="flex gap-16">
            <div>
              <h4 className="font-semibold mb-6">Studio</h4>
              <ul className="space-y-3 text-white/60">
                <li><button onClick={() => navigate('home')} className="hover:text-white transition-colors">Work</button></li>
                <li><button onClick={() => navigate('about')} className="hover:text-white transition-colors">About</button></li>
                <li><button onClick={() => navigate('contact')} className="hover:text-white transition-colors">Contact</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-6">Social</h4>
              <ul className="space-y-3 text-white/60">
                <li><a href="#" className="hover:text-white transition-colors">Instagram</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Twitter (X)</a></li>
                <li><a href="#" className="hover:text-white transition-colors">LinkedIn</a></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row justify-between items-center pt-8 border-t border-white/10 text-sm text-white/40">
          <p>&copy; {new Date().getFullYear()} GB Studios. All rights reserved.</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            {/* Real CMS — takes you to the live Decap CMS admin panel */}
            <a href="/admin/" className="transition-colors hover:text-[var(--admin-hover)]" style={{ '--admin-hover': COLORS.footerAdminLinkHover }} title="Edit this site"><Sparkles size={14} /></a>
            <a href="/supabase-admin/" className="text-xs text-white/50 transition-colors hover:text-orange-400" title="Open the Supabase test admin">Supabase test admin</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
