/**
 * SEO Component
 * 
 * Adds meta tags, Open Graph, and Twitter cards to pages.
 * Usage: <SEO title="Page Title" description="Page description" />
 */

import { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'profile';
  noindex?: boolean;
}

const DEFAULT_TITLE = 'LYC Intelligence';
const DEFAULT_DESCRIPTION = 'Executive search intelligence platform for PE partners and executive candidates.';
const DEFAULT_IMAGE = '/og-image.png';

export function SEO({
  title,
  description,
  keywords,
  image,
  url,
  type = 'website',
  noindex = false,
}: SEOProps) {
  const fullTitle = title ? `${title} | LYC Intelligence` : DEFAULT_TITLE;
  const fullDescription = description || DEFAULT_DESCRIPTION;
  const fullImage = image || DEFAULT_IMAGE;
  const fullUrl = url || (typeof window !== 'undefined' ? window.location.href : '');

  useEffect(() => {
    // Update document title
    document.title = fullTitle;

    // Helper to update meta tag
    const setMeta = (name: string, content: string, isProperty = false) => {
      const selector = isProperty ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let meta = document.querySelector(selector) as HTMLMetaElement;
      
      if (!meta) {
        meta = document.createElement('meta');
        if (isProperty) {
          meta.setAttribute('property', name);
        } else {
          meta.setAttribute('name', name);
        }
        document.head.appendChild(meta);
      }
      
      meta.setAttribute('content', content);
    };

    // Standard meta tags
    setMeta('description', fullDescription);
    if (keywords) setMeta('keywords', keywords);
    if (noindex) {
      setMeta('robots', 'noindex, nofollow');
    } else {
      setMeta('robots', 'index, follow');
    }

    // Open Graph
    setMeta('og:title', fullTitle, true);
    setMeta('og:description', fullDescription, true);
    setMeta('og:image', fullImage, true);
    setMeta('og:url', fullUrl, true);
    setMeta('og:type', type, true);
    setMeta('og:site_name', 'LYC Intelligence', true);

    // Twitter Card
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', fullTitle);
    setMeta('twitter:description', fullDescription);
    setMeta('twitter:image', fullImage);

    // Cleanup function (optional - restore defaults on unmount)
    return () => {
      // Optionally reset to defaults
    };
  }, [fullTitle, fullDescription, keywords, fullImage, fullUrl, type, noindex]);

  return null;
}

// Preset SEO configs for common pages
export const SEO_PRESETS = {
  home: {
    title: 'LYC Intelligence — Executive Search Platform',
    description: 'Connect with exclusive executive opportunities. AI-powered matching, career intelligence, and confidential placement services.',
  },
  council: {
    title: 'The Council — Executive Excellence Community',
    description: 'Join an exclusive community of PE partners and executives. Access coaching, events, and deal flow opportunities.',
  },
  dex: {
    title: 'DEX AI — Your Executive Career Assistant',
    description: 'AI-powered career guidance for executives. Get personalized insights, market intelligence, and career advice.',
  },
  candidates: {
    title: 'Executive Opportunities',
    description: 'Browse exclusive executive mandates across PE, venture, and corporate leadership roles.',
  },
  pricing: {
    title: 'Pricing — LYC Intelligence',
    description: 'Council membership tiers and credit packages. Founding, Individual, Corporate, and PE Partner options.',
  },
};