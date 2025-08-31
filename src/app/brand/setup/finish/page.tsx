"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth } from "firebase/auth";
import PreviewHero from "@/components/brand/PreviewHero";
import { useBrandOnboard } from "@/lib/stores/brandOnboard";
import BrandStoryForm from "@/components/brand/forms/BrandStory";
import BrandLocationForm from "@/components/brand/forms/BrandLocation";
import Button from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

import { validateUsername } from "@/lib/validation/username";
import {
	checkBrandUsernameUniqueCF,
	addBrandCF,
} from "@/lib/firebase/callables/brand";
import { uploadBrandImageWeb } from "@/lib/storage/upload";
import { updateUserCF } from "@/lib/firebase/callables/users";

export default function BrandSetupStep2() {
	const router = useRouter();
	const auth = getAuth();

	const {
		brandName,
		brandUsername,
		brandCategory,
		logoFile,
		coverFile,
		bio,
		tags,
		state,
		country,
		instagram,
		youtube,
		tiktok,
	} = useBrandOnboard();

	const [loading, setLoading] = useState(false);

	// minimal final validation (you can tighten later)
	const canLaunch = useMemo(
		() =>
			!!brandName.trim() &&
			!!brandCategory &&
			!!logoFile &&
			!!brandUsername.trim(),
		[brandName, brandCategory, logoFile, brandUsername]
	);

	const skip = () => router.push("/dashboard");

	const handleLaunchBrand = async () => {
		if (loading) return;

		const user = auth.currentUser;
		if (!user) {
			router.push("/auth"); // or show toast
			return;
		}

		// same username rule as Flutter
		const { ok, normalized } = validateUsername(brandUsername || "");
		if (!ok) {
			alert(
				"Brand username is invalid. Use 3–15 chars; letters, numbers, underscores, periods; no consecutive specials."
			);
			return;
		}

		setLoading(true);
		try {
			// 1) Check brand username uniqueness
			const isFree = await checkBrandUsernameUniqueCF(normalized);
			if (!isFree) {
				alert("That brand username is already taken.");
				return;
			}

			// 2) Upload images
			const logoUrl = await uploadBrandImageWeb(logoFile!, user.uid);
			let coverImageUrl: string | null = null;
			if (coverFile) {
				coverImageUrl = await uploadBrandImageWeb(coverFile, user.uid);
			}

			// 3) Create brand (doc id == uid is enforced server-side)
			await addBrandCF({
				brandName: brandName.trim(),
				username: normalized,
				bio: bio?.trim() || null,
				category: brandCategory!,
				brandTags: tags?.length ? tags : null,
				logoUrl,
				coverImageUrl,
				state: state || null,
				country: country || null,
				instagram: instagram || null,
				youtube: youtube || null,
				tiktok: tiktok || null,
			});

			// 4) Update user flags
			await updateUserCF({
				brandSpaceSetupComplete: true,
				profileSetupComplete: true,
				isBrand: true,
			});

			// 5) Done → go to dashboard
			router.push("/dashboard");
		} catch (e) {
			console.error(e);
			alert(e || "Something went wrong creating your brand.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-dvh bg-bg text-text grid grid-cols-1 lg:grid-cols-2">
			{/* LEFT: two sections */}
			<section className="flex justify-center m-8">
				<div className="w-full max-w-xl space-y-6">
					<BrandStoryForm />
					<BrandLocationForm />
				</div>
			</section>

			{/* RIGHT: hero preview */}
			<section className="relative m-8 flex">
				<PreviewHero
					bgFile={coverFile ?? logoFile}
					headline="Ready to Launch?"
					subtext={
						bio ? (
							<>
								“{bio}” — looks clean. When you’re set, launch your BrandSpace.
							</>
						) : (
							<>Add your one-liner and location, then launch your BrandSpace.</>
						)
					}
					ctaText="Launch My BrandSpace"
					disabled={!canLaunch || loading}
					loading={loading} // <-- use this in your PreviewHero Button
					onClick={handleLaunchBrand}
				/>
			</section>

			{/* Floating Skip (bottom-left) */}
			<div className="fixed left-4 bottom-4 lg:left-8 lg:bottom-8 z-50">
				<Button
					text="Skip"
					variant="secondary"
					className="shadow-sm"
					onClick={skip}
					rightIcon={
						<ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
					}
				/>
			</div>
		</div>
	);
}
