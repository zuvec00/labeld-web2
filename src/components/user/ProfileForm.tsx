"use client";

import { useId } from "react";
import TextLabel from "../ui/textlabel";
import UploadImage from "../ui/upload-image";
import { Input } from "../ui/input";

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
}: {
	value: ProfileFormData;
	onChange: (v: ProfileFormData) => void;
	isValidUsername: boolean;
}) {
	const usernameId = useId();
	const displayId = useId();

	const usernameError = value.username
		? isValidUsername
			? undefined
			: "Username can only contain letters, numbers, underscores, and periods.\nNo consecutive special chars. 3–15 chars."
		: undefined;

	return (
		<div className="items-center">
			<div className="mb-32"></div>
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
					<Input
						id={usernameId}
						placeholder="e.g eko_boy"
						value={value.username}
						onChange={(e) => onChange({ ...value, username: e.target.value })}
						aria-invalid={!!usernameError}
					/>
					{usernameError && (
						<p className="mt-2 text-sm text-cta whitespace-pre-line">
							{usernameError}
						</p>
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
