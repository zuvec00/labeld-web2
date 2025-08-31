import { Spinner } from "@/components/ui/spinner";
import {
	fetchBrandDoc,
	watchBrandDoc,
	watchUserDoc,
} from "@/lib/firebase/queries/brandspace";
import { UserModel } from "@/lib/models/user";
import { BrandModel } from "@/lib/stores/brandOnboard";
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

	// Initial fetch + live updates (heat/follow counts)
	useEffect(() => {
		let unsubBrand: ReturnType<typeof watchBrandDoc> | null = null;
		let unsubUser: ReturnType<typeof watchUserDoc> | null = null;

		(async () => {
			setLoading(true);
			const [brandDoc] = await Promise.all([fetchBrandDoc(uid)]);
			setBrand(brandDoc);
			setLoading(false);
			// subscribe live
			unsubBrand = watchBrandDoc(uid, setBrand);
			unsubUser = watchUserDoc(uid, setUser);
		})();

		return () => {
			unsubBrand?.();
			unsubUser?.();
		};
	}, [uid]);

	if (loading || !brand) {
		return (
			<div className="min-h-dvh grid place-items-center gap-2">
				<Spinner size="lg" />
				<p className="text-text-muted">Loading BrandSpace…</p>
			</div>
		);
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
			/>

			<BrandTabs uid={uid} />
		</div>
	);
}
