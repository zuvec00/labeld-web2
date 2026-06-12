"use client";

import { useId } from "react";
import TextLabel from "../ui/textlabel";
import UploadImage from "../ui/upload-image";
import { Input } from "../ui/input";
import { Check, X, Loader2 } from "lucide-react";
import type { AvailabilityStatus } from "@/lib/hooks/useUsernameAvailability";

export type ProfileFormData = {
	username: string;
	displayName: string;
	profileFile: File | null;
	isBrand: boolean;
};

export default function ProfileForm({
	value,
	onChange,
	isValidUsername,
	availabilityStatus,
}: {
	value: ProfileFormData;
	onChange: (v: ProfileFormData) => void;
	isValidUsername: boolean;
	availabilityStatus?: AvailabilityStatus;
}) {
	const usernameId = useId();
	const displayId = useId();

	const formatError = value.username && !isValidUsername
		? "Letters, numbers, . or _ only — no consecutive special chars. 3–15 chars."
		: undefined;

	const isChecking = availabilityStatus === "checking";
	const isAvailable = availabilityStatus === "available";
	const isTaken = availabilityStatus === "taken";

	return (
		<div className="items-center">
			<div className="mb-2"></div>
			{/* Title */}
			<div className="mb-6">
				<h1 className="font-heading font-semibold text-2xl">Set Your Label</h1>
				<p className="text-text-muted font-medium mt-2">
					Pick a username and name people will see on your profile. You can
					switch it up anytime.
				</p>
			</div>

			{/* Group container */}
			<div className="rounded-2xl p-6 space-y-5">
				{/* Username */}
				<div>
					<TextLabel label="Username (@handle)" isRequired />
					<div className="relative">
						<Input
							id={usernameId}
							placeholder="e.g eko_boy"
							value={value.username}
							onChange={(e) => onChange({ ...value, username: e.target.value })}
							aria-invalid={!!formatError || isTaken}
							className={
								isTaken || formatError
									? "border-red-500/50 focus:border-red-500"
									: isAvailable
									? "border-green-500/50 focus:border-green-500"
									: undefined
							}
						/>
						<div className="absolute right-3 top-1/2 -translate-y-1/2">
							{isChecking && (
								<Loader2 className="w-4 h-4 text-text-muted animate-spin" />
							)}
							{isAvailable && !isChecking && (
								<Check className="w-4 h-4 text-green-500" />
							)}
							{(isTaken || formatError) && !isChecking && value.username && (
								<X className="w-4 h-4 text-red-500" />
							)}
						</div>
					</div>
					{formatError && (
						<p className="mt-1 text-sm text-red-500">{formatError}</p>
					)}
					{isTaken && !formatError && (
						<p className="mt-1 text-sm text-red-500">
							This username is already taken.
						</p>
					)}
					{isAvailable && !formatError && (
						<p className="mt-1 text-sm text-green-500">Username available!</p>
					)}
					{isChecking && (
						<p className="mt-1 text-sm text-text-muted">Checking availability…</p>
					)}
				</div>

				{/* Display name */}
				<div>
					<TextLabel label="Display Name" isRequired />
					<Input
						id={displayId}
						placeholder="Lagos Native"
						value={value.displayName}
						onChange={(e) =>
							onChange({ ...value, displayName: e.target.value })
						}
					/>
					<p className="mt-2 text-xs text-text-muted flex items-center gap-2">
						<span className="i" /> This name appears on your profile
					</p>
				</div>

				{/* Profile photo */}
				<div>
					<TextLabel label="Profile Photo" />
					<UploadImage
						value={value.profileFile}
						onChange={(file) => onChange({ ...value, profileFile: file })}
						text="This is the face of your drop, it shows on the feed and preview cards."
					/>
				</div>
			</div>

			{/* Are you a brand? — dynamic */}
			<div className="mt-4 flex items-center">
				<TextLabel label="Are you a brand?" isRequired />
				<div className="ml-auto">
					<label className="inline-flex items-center gap-2">
						<input
							type="checkbox"
							checked={value.isBrand}
							onChange={(e) =>
								onChange({ ...value, isBrand: e.target.checked })
							}
							className="accent-cta w-5 h-5"
						/>
						<span className="text-sm">{value.isBrand ? "Yes" : "No"}</span>
					</label>
				</div>
			</div>
		</div>
	);
}
