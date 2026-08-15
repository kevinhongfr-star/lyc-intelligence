/**
 * Phase 17 / P1-1 — usePageMetadata()
 *
 * Mount this ONE TIME near the router root (inside App.tsx) and every route
 * change will apply title + <meta name="description"/>, og:*, twitter:*,
 * robots, and canonical to the host document. We don't use react-helmet or
 * helmet-async to avoid another dependency — direct DOM mutation is fine on
 * a single-writer SPA.
 *
 * Noindex surfaces (e.g. /member/*, /admin/*) emit `robots: noindex,nofollow`
 * and skip canonical writing since they're never meant for crawlers.
 */
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { resolveMetadata, DEFAULT_META, PageMetadata } from '@/seo/pageMetadata';

/** Upsert (or create) a <meta> tag by property or name selector. */
function upsertMeta(selector: 'property' | 'name', key: string, content: string | undefined) {
  if (!content) return;
  const safeContent = content.trim();
  if (!safeContent) return;
  let el: HTMLMetaElement | null = document.head.querySelector(
    `meta[${selector}="${key}"]`,
  );
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(selector, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', safeContent);
}

function upsertCanonical(href: string | undefined) {
  let el: HTMLLinkElement | null = document.head.querySelector('link[rel="canonical"]');
  if (!href) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

function apply(m: PageMetadata, fullUrl: string) {
  // 1. <title> (document-level + og:title)
  document.title = m.title;
  upsertMeta('property', 'og:title', m.title);
  upsertMeta('name',     'twitter:title', m.title);

  // 2. description (meta description + og:description + twitter:description)
  upsertMeta('name',     'description',    m.description);
  upsertMeta('property', 'og:description', m.description);
  upsertMeta('name',     'twitter:description', m.description);

  // 3. og:image / twitter:image — fall back to DEFAULT's OG image
  const ogImage = m.ogImage ?? DEFAULT_META.ogImage;
  upsertMeta('property', 'og:image', ogImage);
  upsertMeta('name',     'twitter:image', ogImage);
  upsertMeta('name',     'twitter:card', 'summary_large_image');

  // 4. og:url
  upsertMeta('property', 'og:url', fullUrl);
  upsertMeta('property', 'og:type', m.ogType ?? DEFAULT_META.ogType);
  upsertMeta('property', 'og:site_name', 'LYC Intelligence');

  // 5. keywords
  upsertMeta('name', 'keywords', m.keywords?.join(', '));

  // 6. robots (noindex surfaces) / canonical
  if (m.noindex) {
    upsertMeta('name', 'robots', 'noindex,nofollow');
    upsertCanonical(undefined);
  } else {
    upsertMeta('name', 'robots', 'index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1');
    upsertCanonical(m.canonical ?? fullUrl);
  }
}

export function usePageMetadata() {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    const fullUrl =
      typeof window !== 'undefined'
        ? window.location.origin + path + (location.search || '')
        : path + (location.search || '');
    const meta = resolveMetadata(path);
    apply(meta, fullUrl);
  }, [location.pathname, location.search]);
}
