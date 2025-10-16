# SEO Implementation for Labeld Studio

This document outlines the SEO improvements implemented for Labeld Studio to enhance search engine visibility and social media sharing.

## ✅ What Was Implemented

### 1. Enhanced Meta Tags & Open Graph

#### Root Layout (`src/app/layout.tsx`)
- **Title Template**: Dynamic title generation with `%s | Labeld` format
- **Keywords**: Added relevant keywords (streetwear, fashion, african fashion, events, etc.)
- **Open Graph Tags**: Full OG implementation for social media previews
- **Twitter Cards**: Large image cards for rich Twitter/X previews
- **Robots Meta**: Configured for optimal search engine indexing

#### Landing Page (`src/app/page.tsx`)
- Custom metadata with hero image
- Optimized description for homepage conversions
- Specific OG tags for social sharing

#### Event Landing Page (`src/app/event-landing-page/`)
- Separated into server component (metadata) and client component (interactivity)
- Custom metadata for event-focused content
- Event hero image in OG tags

### 2. SEO Helper Library (`src/lib/seo/metadata.ts`)

Created reusable functions for generating metadata:

- `generateSEO()` - Base SEO generator
- `generateBrandMetadata()` - For brand profile pages
- `generateEventMetadata()` - For event detail pages
- `generateProductMetadata()` - For merch/product pages

**Usage Example:**
```typescript
import { generateBrandMetadata } from "@/lib/seo/metadata";

export async function generateMetadata({ params }) {
  const brand = await getBrand(params.slug);
  
  return generateBrandMetadata({
    brandName: brand.name,
    bio: brand.bio,
    logoUrl: brand.logoUrl,
    username: brand.username,
  });
}
```

### 3. Sitemap Generation (`next-sitemap.config.js`)

- **Automated Sitemap**: Generates `sitemap.xml` on every build
- **Robots.txt**: Auto-generated with proper allow/disallow rules
- **Protected Routes**: Excludes dashboard, settings, admin areas from indexing
- **Dynamic Routes Support**: Ready for brand/event pages (see TODO section)

**Protected Routes (Not Indexed):**
- `/dashboard/*`
- `/events/create/*`
- `/brand/setup/*`
- `/user/setup/*`
- `/scan/*`
- `/orders/*`
- `/settings/*`
- `/wallet`
- And more...

**Public Routes (Indexed):**
- `/` (Homepage)
- `/event-landing-page`
- `/marketing`
- Future: `/brandspace/[username]`
- Future: `/events/[eventId]`

### 4. Build Configuration

Added `postbuild` script to `package.json`:
```json
"scripts": {
  "build": "next build",
  "postbuild": "next-sitemap"
}
```

Sitemap is automatically generated after every production build.

## 📋 Next Steps (TODO)

### Dynamic Routes for Brands & Events

To fully leverage SEO for dynamic content, you'll need to:

#### 1. Add Dynamic Sitemap Generation

Update `next-sitemap.config.js` to fetch from Firestore:

```javascript
additionalPaths: async (config) => {
  const result = [];
  
  // Fetch brands from Firestore
  const brandsSnapshot = await db.collection('brands').get();
  brandsSnapshot.forEach(doc => {
    const brand = doc.data();
    result.push({
      loc: `/brandspace/${brand.username}`,
      changefreq: 'weekly',
      priority: 0.9,
      lastmod: brand.updatedAt?.toDate().toISOString(),
    });
  });
  
  // Fetch events from Firestore
  const eventsSnapshot = await db.collection('events').get();
  eventsSnapshot.forEach(doc => {
    const event = doc.data();
    result.push({
      loc: `/events/${doc.id}`,
      changefreq: 'daily',
      priority: 0.8,
      lastmod: event.updatedAt?.toDate().toISOString(),
    });
  });
  
  return result;
}
```

#### 2. Create Public Brand Pages

If not already created, add:
```
src/app/brandspace/[username]/page.tsx
```

```typescript
import { generateBrandMetadata } from "@/lib/seo/metadata";
import { getBrandByUsername } from "@/lib/firebase/queries/brands";

export async function generateMetadata({ params }) {
  const brand = await getBrandByUsername(params.username);
  
  if (!brand) {
    return {
      title: "Brand Not Found | Labeld",
    };
  }
  
  return generateBrandMetadata({
    brandName: brand.name,
    bio: brand.bio,
    logoUrl: brand.logoUrl,
    username: brand.username,
  });
}

export default async function BrandPage({ params }) {
  const brand = await getBrandByUsername(params.username);
  // Render brand profile
}
```

#### 3. Create Public Event Pages

Add public event detail pages:
```
src/app/events/[eventId]/public/page.tsx
```

```typescript
import { generateEventMetadata } from "@/lib/seo/metadata";
import { getEventById } from "@/lib/firebase/queries/events";

export async function generateMetadata({ params }) {
  const event = await getEventById(params.eventId);
  
  if (!event) {
    return {
      title: "Event Not Found | Labeld",
    };
  }
  
  return generateEventMetadata({
    eventTitle: event.title,
    description: event.description,
    coverImageUrl: event.coverImageURL,
    eventId: params.eventId,
    startDate: event.startAt?.toDate(),
    venue: event.venue?.city,
  });
}

export default async function EventPage({ params }) {
  const event = await getEventById(params.eventId);
  // Render event details
}
```

## 🔍 SEO Best Practices Applied

### 1. Structured Data (Schema.org)
While not fully implemented yet, the metadata structure supports adding:
- Organization schema
- Event schema
- Product schema

### 2. Mobile Optimization
- Viewport meta tags already configured
- PWA support with manifest.webmanifest

### 3. Social Media Optimization
- Open Graph tags for Facebook, LinkedIn
- Twitter Cards for Twitter/X
- Proper image dimensions (1200x630)

### 4. Performance
- Next.js 15 with automatic image optimization
- Server-side rendering for public pages
- Efficient metadata generation

## 🚀 Deployment Checklist

Before deploying to production:

1. ✅ Set `NEXT_PUBLIC_SITE_URL` environment variable
2. ✅ Ensure all public images are optimized
3. ✅ Test sitemap generation: `npm run build`
4. ✅ Verify robots.txt at `/robots.txt`
5. ✅ Verify sitemap at `/sitemap.xml`
6. ⬜ Add dynamic brand/event routes
7. ⬜ Submit sitemap to Google Search Console
8. ⬜ Submit sitemap to Bing Webmaster Tools

## 📊 Monitoring SEO Performance

### Google Search Console
1. Add your site: https://search.google.com/search-console
2. Submit sitemap: `https://studio.labeld.app/sitemap.xml`
3. Monitor:
   - Indexing status
   - Search queries
   - Core Web Vitals
   - Mobile usability

### Social Media Debuggers
- **Facebook**: https://developers.facebook.com/tools/debug/
- **Twitter**: https://cards-dev.twitter.com/validator
- **LinkedIn**: https://www.linkedin.com/post-inspector/

## 🛠️ Maintenance

### Regular Updates
- Update metadata when brand/event content changes
- Regenerate sitemap on major content updates
- Monitor and fix 404s via Search Console

### Adding New Pages
1. Create page with `generateMetadata` export
2. Update `next-sitemap.config.js` if route is dynamic
3. Test metadata with social debuggers
4. Verify sitemap includes new route

## 📚 Resources

- [Next.js Metadata API](https://nextjs.org/docs/app/api-reference/functions/generate-metadata)
- [next-sitemap Documentation](https://github.com/iamvishnusankar/next-sitemap)
- [Google SEO Starter Guide](https://developers.google.com/search/docs/beginner/seo-starter-guide)
- [Open Graph Protocol](https://ogp.me/)
- [Twitter Card Documentation](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)

---

**Implementation Date**: January 2025  
**Next Review**: After adding dynamic brand/event pages

