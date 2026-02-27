import { groq } from "next-sanity";

/* ═══════════════════════════════════════════════════
   NEXAVISION — SANITY GROQ QUERIES
   All data fetching centralized here.
   ═══════════════════════════════════════════════════ */

// ── Site Settings (global config) ──
export const siteSettingsQuery = groq`
  *[_type == "siteSettings"][0] {
    siteName,
    tagline,
    description,
    logo {
      image { asset->, hotspot, crop },
      width,
      height,
      offsetX,
      offsetY
    },
    logoMark {
      image { asset->, hotspot, crop },
      width,
      height
    },
    favicon { asset-> },
    socialImage { asset-> },
    contactEmail,
    contactPhone,
    socialLinks[] {
      platform,
      url
    },
    announcement {
      enabled,
      text,
      link,
      linkText
    },
    navigation {
      items[] {
        label,
        href,
        children[] {
          label,
          href,
          description
        }
      },
      ctaButton {
        label,
        href
      }
    },
    footer {
      tagline,
      columns[] {
        title,
        links[] {
          label,
          href,
          isExternal
        }
      },
      bottomText,
      showSocials
    },
    seo {
      metaTitle,
      metaDescription,
      ogImage { asset-> }
    }
  }
`;

// ── Homepage ──
export const homepageQuery = groq`
  *[_type == "homepage"][0] {
    // Hero
    hero {
      headline,
      highlightedText,
      subheadline,
      primaryCta { label, href },
      secondaryCta { label, href },
      consolePanel {
        statusText,
        statusColor,
        deploymentText,
        modules[],
        industries[]
      }
    },

    // Anthill Section
    anthillSection {
      sectionLabel,
      headline,
      description,
      surfaceItems[] { icon, label, description },
      undergroundItems[] { icon, label, description }
    },

    // Industry Selector
    industrySection {
      sectionLabel,
      headline,
      description,
      industries[]-> {
        _id,
        name,
        slug,
        shortDescription,
        icon,
        color
      }
    },

    // Modules
    modulesSection {
      sectionLabel,
      headline,
      description,
      modules[] {
        name,
        description,
        icon,
        features[],
        tier
      }
    },

    // Demos Gallery
    demosSection {
      sectionLabel,
      headline,
      description,
      demos[]-> {
        _id,
        title,
        slug,
        industry->,
        shortDescription,
        thumbnail { asset->, hotspot, crop },
        modules[],
        status
      }
    },

    // Results & Proof
    proofSection {
      sectionLabel,
      headline,
      description,
      stats[] {
        value,
        label,
        icon
      },
      processSteps[] {
        step,
        title,
        description
      },
      testimonials[] {
        quote,
        name,
        role,
        company,
        avatar { asset->, hotspot, crop }
      }
    },

    // Pricing
    pricingSection {
      sectionLabel,
      headline,
      description,
      tiers[] {
        name,
        slug,
        tagline,
        priceRange,
        timeline,
        featured,
        features[],
        addOns[],
        ctaLabel,
        ctaHref
      }
    },

    // CTA Close
    ctaSection {
      headline,
      description,
      primaryCta { label, href },
      secondaryCta { label, href }
    },

    // SEO
    seo {
      metaTitle,
      metaDescription,
      ogImage { asset-> }
    }
  }
`;

// ── Industries ──
export const industriesListQuery = groq`
  *[_type == "industry"] | order(orderRank asc) {
    _id,
    name,
    slug,
    shortDescription,
    icon,
    color,
    thumbnail { asset->, hotspot, crop }
  }
`;

export const industryBySlugQuery = groq`
  *[_type == "industry" && slug.current == $slug][0] {
    _id,
    name,
    slug,
    shortDescription,
    longDescription,
    icon,
    color,
    heroImage { asset->, hotspot, crop },
    painPoints[] {
      title,
      description,
      icon
    },
    keyModules[] {
      name,
      description,
      icon
    },
    signatureModule {
      name,
      description,
      features[]
    },
    demoLink,
    stats[] {
      value,
      label
    },
    seo {
      metaTitle,
      metaDescription,
      ogImage { asset-> }
    }
  }
`;

// ── Pricing ──
export const pricingPageQuery = groq`
  *[_type == "pricingPage"][0] {
    headline,
    description,
    tiers[] {
      name,
      slug,
      tagline,
      priceRange,
      timeline,
      featured,
      features[] {
        text,
        included
      },
      addOns[],
      ctaLabel,
      ctaHref
    },
    faq[] {
      question,
      answer
    },
    seo {
      metaTitle,
      metaDescription
    }
  }
`;

// ── Demos ──
export const demosListQuery = groq`
  *[_type == "demo"] | order(orderRank asc) {
    _id,
    title,
    slug,
    industry-> { name, slug, icon, color },
    shortDescription,
    longDescription,
    thumbnail { asset->, hotspot, crop },
    modules[],
    features[],
    liveUrl,
    status
  }
`;

// ── Systems Lab (Case Studies) ──
export const caseStudiesQuery = groq`
  *[_type == "caseStudy"] | order(orderRank asc) {
    _id,
    title,
    slug,
    client,
    industry-> { name, slug },
    shortDescription,
    thumbnail { asset->, hotspot, crop },
    modules[],
    featured
  }
`;

export const caseStudyBySlugQuery = groq`
  *[_type == "caseStudy" && slug.current == $slug][0] {
    _id,
    title,
    slug,
    client,
    industry-> { name, slug, icon },
    shortDescription,
    longDescription[],
    heroImage { asset->, hotspot, crop },
    thumbnail { asset->, hotspot, crop },
    modules[] {
      name,
      description,
      screenshot { asset->, hotspot, crop }
    },
    flowDiagram { asset->, hotspot, crop },
    results[] {
      metric,
      value,
      description
    },
    techStack[],
    seo {
      metaTitle,
      metaDescription,
      ogImage { asset-> }
    }
  }
`;
