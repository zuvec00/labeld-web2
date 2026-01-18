import { Spinner } from "@/components/ui/spinner";
import {
	fetchBrandDoc,
	watchBrandDoc,
	watchUserDoc,
} from "@/lib/firebase/queries/brandspace";
import { UserModel } from "@/lib/models/user";
import { BrandModel } from "@/lib/stores/brandOnboard";
import { getProductListForBrand } from "@/lib/firebase/queries/product";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import CoverAndLogo from "./CoverAndLogo";
import BrandHeader from "./Header";
import BrandTabs from "./Tabs";

export function BrandSpaceView({ uid }: { uid: string }) {
	const router = useRouter();
	const [brand, setBrand] = useState<BrandModel | null>(null);
	const [user, setUser] = useState<UserModel | null>(null);
	const [loading, setLoading] = useState(true);

	// Fetch product stats for Header context
	const [productStats, setProductStats] = useState<{
		count: number;
		lastDrop: Date | null;
	}>({ count: 0, lastDrop: null });

	// Initial fetch + live updates (heat/follow counts)
	useEffect(() => {
		let unsubBrand: ReturnType<typeof watchBrandDoc> | null = null;
		let unsubUser: ReturnType<typeof watchUserDoc> | null = null;

		(async () => {
			setLoading(true);
			try {
				// Fetch brand and user
				const [brandDoc] = await Promise.all([fetchBrandDoc(uid)]);
				setBrand(brandDoc);

				// Fetch products for stats (Context Layer)
				// Optimization: In a real app, use a dedicated aggregate query
				const products = await getProductListForBrand(uid);
				// Sort desc by launchedAt/createdAt just to be safe (mostly guaranteed by query)
				const sorted = products.sort((a, b) => {
					const dateA = a.launchDate?.getTime() || 0;
					const dateB = b.launchDate?.getTime() || 0;
					return dateB - dateA;
				});

				setProductStats({
					count: products.length,
					lastDrop: sorted[0]?.launchDate || null,
				});

				// subscribe live
				unsubBrand = watchBrandDoc(uid, setBrand);
				unsubUser = watchUserDoc(uid, setUser);
			} catch (err) {
				console.error("BrandSpaceView: init error", err);
			} finally {
				setLoading(false);
			}
		})();

		return () => {
			unsubBrand?.();
			unsubUser?.();
		};
	}, [uid]);

	if (loading || !brand) {
		return <BrandSpaceShimmer />;
	}

	const followers = user?.followersCount ?? 0;
	const following = user?.followingCount ?? 0;
	const heat = typeof brand.heat === "number" ? brand.heat : 0;

	return (
		<div className="min-h-dvh bg-bg text-text">
			<CoverAndLogo
				coverUrl={brand.coverImageUrl || undefined}
				logoUrl={brand.logoUrl}
				alt={brand.brandName}
			/>
			{/* offset = half of 96px (mobile) / 112px (sm) logo */}
			<div className="mt-14 sm:mt-16" />
			<BrandHeader
				brandName={brand.brandName}
				username={brand.username}
				bio={brand.bio}
				heat={heat}
				followers={followers}
				following={following}
				isOwner={true}
				onEdit={() => router.push("/brand-space/profile/edit")}
				joinedAt={toJSDate(brand.createdAt)}
				productCount={productStats.count}
				lastDropDate={productStats.lastDrop}
				subscriptionTier={brand.subscriptionTier}
			/>

			<BrandTabs uid={uid} />
		</div>
	);
}

function BrandSpaceShimmer() {
	return (
		<div className="min-h-dvh bg-bg">
			{/* Cover */}
			<div className="h-48 sm:h-64 w-full bg-surface animate-pulse" />
			<div className="px-4 sm:px-6 -mt-12 sm:-mt-14 relative z-10">
				{/* Logo */}
				<div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-surface border-4 border-bg animate-pulse" />

				{/* Header Content */}
				<div className="mt-4 sm:mt-6 space-y-4">
					<div className="h-8 w-48 bg-surface rounded-lg animate-pulse" />
					<div className="h-4 w-32 bg-surface rounded animate-pulse" />
					<div className="h-4 w-64 bg-surface rounded animate-pulse" />

					{/* Stats */}
					<div className="flex gap-6 pt-2">
						<div className="h-12 w-20 bg-surface rounded-lg animate-pulse" />
						<div className="h-12 w-20 bg-surface rounded-lg animate-pulse" />
					</div>

					{/* Actions */}
					<div className="flex gap-3 pt-4 border-t border-stroke">
						<div className="h-10 w-28 bg-surface rounded-lg animate-pulse" />
						<div className="h-10 w-28 bg-surface rounded-lg animate-pulse" />
					</div>
				</div>

				{/* Tabs */}
				<div className="mt-8 flex gap-6 border-b border-stroke pb-px">
					{[1, 2, 3].map((i) => (
						<div
							key={i}
							className="h-10 w-20 bg-surface rounded-t-lg animate-pulse"
						/>
					))}
				</div>

				{/* Grid */}
				<div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
					{[1, 2, 3, 4].map((i) => (
						<div
							key={i}
							className="aspect-[4/5] bg-surface rounded-2xl animate-pulse"
						/>
					))}
				</div>
			</div>
		</div>
	);
}

function toJSDate(date: any): Date | undefined {
	if (!date) return undefined;
	if (typeof date.toDate === "function") return date.toDate();
	return new Date(date);
}
