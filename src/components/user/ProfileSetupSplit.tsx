"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth } from "firebase/auth";

import ProfileForm, { ProfileFormData } from "./ProfileForm";
import LaunchHero from "../brand/LaunchHero";

import { validateUsername } from "@/lib/validation/username";
import {
	checkUsernameUniqueCF,
	updateUserCF,
} from "@/lib/firebase/callables/users";
import { uploadProfileImageWeb } from "@/lib/storage/upload";

export default function ProfileSetupSplit() {
	const router = useRouter();
	const auth = getAuth();

	const [data, setData] = useState<ProfileFormData>({
		username: "",
		displayName: "",
		profileFile: null,
		isBrand: true,
	});
	const [loading, setLoading] = useState(false);
	const [usernameError, setUsernameError] = useState<string | undefined>(
		undefined
	);

	const isValidUsername = useMemo(() => {
		const { ok } = validateUsername(data.username);
		return ok;
	}, [data.username]);

	const isValid = isValidUsername && data.displayName.trim().length > 0;

	const handleLaunch = async () => {
		if (loading) return;
		setUsernameError(undefined);

		// 1) basic guards
		const user = auth.currentUser;
		if (!user) {
			// optionally route to login
			alert("Please sign in first.");
			return;
		}

		// 2) validate username with same Flutter rules
		const { ok, normalized } = validateUsername(data.username);
		if (!ok) {
			setUsernameError(
				"Username can only contain letters, numbers, underscores, and periods.\nNo consecutive special chars. 3–15 chars."
			);
			return;
		}

		setLoading(true);
		try {
			// 3) check uniqueness via callable
			const isFree = await checkUsernameUniqueCF(normalized);
			if (!isFree) {
				setUsernameError("This username is already taken");
				return;
			}

			// 4) upload profile image if provided
			let profileImageUrl: string | null = null;
			if (data.profileFile) {
				profileImageUrl = await uploadProfileImageWeb(
					data.profileFile,
					user.uid
				);
			}

			// 5) call updateUser callable (server sets timestamps & creates doc if needed)
			await updateUserCF({
				email: user.email ?? null,
				username: normalized,
				displayName: data.displayName.trim(),
				profileImageUrl,
				isBrand: data.isBrand,
				brandSpaceSetupComplete: false,
				profileSetupComplete: true,
			});

			// 6) navigate based on isBrand
			if (data.isBrand) {
				// stay on brand flow, or route to brand setup step 2, etc.
				router.push("/brand/setup"); // change to your brand flow route
			} else {
				router.push("/dashboard");
			}
		} catch (e) {
			console.error(e);
			alert(e || "Something went wrong saving your profile.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-dvh bg-bg text-text grid grid-cols-1 lg:grid-cols-2">
			{/* LEFT */}
			<section className="flex justify-center m-8">
				<div className="w-full max-w-xl">
					<ProfileForm
						value={data}
						onChange={setData}
						isValidUsername={isValidUsername}
					/>
					{usernameError && (
						<p className="mt-2 text-sm text-cta whitespace-pre-line">
							{usernameError}
						</p>
					)}
				</div>
			</section>

			{/* RIGHT */}
			<section className="relative m-8 flex">
				<LaunchHero
					previewFile={data.profileFile}
					displayName={data.displayName}
					loading={loading}
					disabled={!isValid || loading} // keep your form validation guard
					isBrand={data.isBrand}
					onLaunch={handleLaunch}
				/>
			</section>
		</div>
	);
}
