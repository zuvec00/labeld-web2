/** @type {import('next-sitemap').IConfig} */
module.exports = {
	siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://studio.labeld.app',
	generateRobotsTxt: true,
	generateIndexSitemap: false,
	
	// Exclude protected and internal routes
	exclude: [
		'/dashboard',
		'/dashboard/*',
		'/events/create/*',
		'/events/*/edit',
		'/events/*/details',
		'/events/*/merch',
		'/events/*/tickets',
		'/events/*/moments',
		'/events/*/review',
		'/brand/setup',
		'/brand/setup/*',
		'/user/setup',
		'/user/setup/*',
		'/scan',
		'/scan/*',
		'/brand-space/*',
		'/collections/*',
		'/pieces/*',
		'/orders/*',
		'/settings',
		'/settings/*',
		'/staff/*',
		'/tickets',
		'/wallet',
		'/radar/*',
		'/auth/*',
	],
	
	// Robots.txt configuration
	robotsTxtOptions: {
		policies: [
			{
				userAgent: '*',
				allow: '/',
				disallow: [
					'/dashboard',
					'/dashboard/*',
					'/events/create',
					'/events/create/*',
					'/brand/setup',
					'/brand/setup/*',
					'/user/setup',
					'/user/setup/*',
					'/scan',
					'/scan/*',
					'/brand-space/*',
					'/collections/*',
					'/pieces/*',
					'/orders/*',
					'/settings',
					'/settings/*',
					'/staff/*',
					'/tickets',
					'/wallet',
					'/radar/*',
					'/auth/*',
				],
			},
		],
		additionalSitemaps: [
			// You can add dynamic sitemaps here later
			// `${process.env.NEXT_PUBLIC_SITE_URL}/sitemap-brands.xml`,
			// `${process.env.NEXT_PUBLIC_SITE_URL}/sitemap-events.xml`,
		],
	},
	
	// Default change frequency and priority
	changefreq: 'daily',
	priority: 0.7,
	
	// Additional paths to include
	additionalPaths: async (config) => {
		const result = [];
		
		// Add high-priority static pages
		result.push({
			loc: '/',
			changefreq: 'daily',
			priority: 1.0,
			lastmod: new Date().toISOString(),
		});
		
		result.push({
			loc: '/event-landing-page',
			changefreq: 'weekly',
			priority: 0.8,
			lastmod: new Date().toISOString(),
		});
		
		result.push({
			loc: '/marketing',
			changefreq: 'weekly',
			priority: 0.8,
			lastmod: new Date().toISOString(),
		});
		
		// TODO: Add dynamic routes from Firestore
		// You can fetch from Firestore here and add dynamic brand/event pages
		// Example:
		// const brands = await fetchBrands();
		// brands.forEach(brand => {
		//   result.push({
		//     loc: `/brandspace/${brand.username}`,
		//     changefreq: 'weekly',
		//     priority: 0.9,
		//     lastmod: brand.updatedAt,
		//   });
		// });
		
		return result;
	},
};

