/**
 * Phase 17 / T01 (#1287) — SEO component.
 *
 * Lightweight, dependency-free head manager for SPAs.
 * Sets document title, meta tags, Open Graph, Twitter cards, canonical link,
 * and JSON-LD structured data.
 *
 * Usage:
 *   <SEO page="landing" />
 *   <SEO page="pricing" />
 *   <SEO assessment={meta} />
 *   <SEO title="Custom" description="Custom" path="/custom" />
 */
import React, { useEffect } from 'react';
import { PAGE_META, SITE_URL, type PageMeta, type AssessmentMeta } from '@/lib/seo/pageMetadata';

interface SEOProps {
  /** Use a pre-defined page from PAGE_META registry */
  page?: keyof typeof PAGE_META;
  /** Use assessment-specific metadata (Product schema) */
  assessment?: AssessmentMeta;
  /** Override: custom title (50-60 chars) */
  title?: string;
  /** Override: custom description (150-160 chars) */
  description?: string;
  /** Override: canonical path (e.g. /pricing) */
  path?: string;
  /** Override: OG image URL */
  ogImage?: string;
  /** Override: OG type */
  type?: 'website' | 'product' | 'article';
  /** Override: structured data object */
  structuredData?: object | null;
}

function upsertMeta(attr: 'name' | 'property', key: string, content: string): void {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertLink(rel: string, href: string): void {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

function upsertJsonLd(id: string, data: object): void {
  const scriptId = `json-ld-${id}`;
  let el = document.getElementById(scriptId) as HTMLScriptElement | null;
  if (!el) {
    el = document.createElement('script');
    el.type = 'application/ld+json';
    el.id = scriptId;
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

function removeJsonLd(id: string): void {
  const el = document.getElementById(`json-ld-${id}`);
  if (el) el.remove();
}

export function SEO(props: SEOProps): null {
  const {
    page,
    assessment,
    title: overrideTitle,
    description: overrideDesc,
    path: overridePath,
    ogImage: overrideOgImage,
    type: overrideType,
    structuredData: overrideStructuredData,
  } = props;

  useEffect(() => {
    // Resolve metadata source
    let meta: PageMeta;
    if (assessment) {
      meta = assessment;
    } else if (page && PAGE_META[page]) {
      meta = PAGE_META[page];
    } else {
      // Fallback to landing defaults
      meta = PAGE_META.landing;
    }

    const title = overrideTitle || meta.title;
    const description = overrideDesc || meta.description;
    const path = overridePath || meta.path;
    const canonicalUrl = `${SITE_URL}${path}`;
    const ogImage = overrideOgImage || meta.ogImage || buildOgImage(title);
    const type = overrideType || meta.type || 'website';
    const structuredData = overrideStructuredData !== undefined ? overrideStructuredData : meta.structuredData;

    // Title tag
    document.title = title;

    // Meta description
    upsertMeta('name', 'description', description);

    // Open Graph
    upsertMeta('property', 'og:type', type);
    upsertMeta('property', 'og:url', canonicalUrl);
    upsertMeta('property', 'og:title', title);
    upsertMeta('property', 'og:description', description);
    upsertMeta('property', 'og:image', ogImage);
    upsertMeta('property', 'og:image:width', '1200');
    upsertMeta('property', 'og:image:height', '630');
    upsertMeta('property', 'og:site_name', 'LYC Intelligence');

    // Twitter Card
    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertMeta('name', 'twitter:title', title);
    upsertMeta('name', 'twitter:description', description);
    upsertMeta('name', 'twitter:image', ogImage);

    // Canonical
    upsertLink('canonical', canonicalUrl);

    // Structured data (JSON-LD)
    removeJsonLd('page');
    if (structuredData) {
      upsertJsonLd('page', structuredData);
    }

    // Cleanup on unmount
    return () => {
      removeJsonLd('page');
    };
  }, [
    page,
    assessment,
    overrideTitle,
    overrideDesc,
    overridePath,
    overrideOgImage,
    overrideType,
    overrideStructuredData,
  ]);

  return null;
}

/** Build OG image URL from a title */
function buildOgImage(title: string): string {
  const params = new URLSearchParams({ title });
  return `${SITE_URL}/api/og?${params.toString()}`;
}

export default SEO;
