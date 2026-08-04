/** @type {import('next-sitemap').IConfig} */
module.exports = {
	siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://studio.labeld.app',
	generateRobotsTxt: true,
	generateIndexSitemap: false,
	outDir: './public',
	// Studio is primarily an authenticated product. Keep the sitemap allowlisted so
	// dashboards, setup flows, scanners, admin tools, and transactional pages never
	// leak into search discovery.
	transform: async (config, path) => {
		const publicPaths = new Set([
			'/',
			'/pricing',
			'/marketing',
			'/integrations',
			'/event-landing-page',
			'/android-waitlist',
		]);

		if (!publicPaths.has(path)) return null;

		return {
			loc: path,
			changefreq: path === '/' || path === '/android-waitlist' ? 'weekly' : 'monthly',
			priority: path === '/' ? 1.0 : path === '/pricing' ? 0.8 : path === '/android-waitlist' ? 0.7 : 0.6,
			lastmod: new Date().toISOString(),
		};
	},
	
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
		'/scan-booking', // Booking QR scanner
		'/bookings/*', // Protected bookings dashboard
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
					'/api/',
					'/admin/',
					'/dashboard',
					'/dashboard/*',
					'/analytics/',
					'/login',
					'/onboarding',
					'/events/create',
					'/events/create/*',
					'/organizer-space/',
					'/organizer-space/*',
					'/customers/',
					'/customers/*',
					'/brand/setup',
					'/brand/setup/*',
					'/user/setup',
					'/user/setup/*',
					'/scan',
					'/scan/*',
					'/scan-booking', // Booking QR scanner
					'/bookings/*', // Protected bookings dashboard
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
		
		return [];
	},
};
