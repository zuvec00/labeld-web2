"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import {
	addOrganizerByEmail,
	listOrganizers,
	removeOrganizer,
	updateOrganizerRoles,
	ensureOwnerIfEmpty,
	Role,
} from "@/lib/firebase/callables/organizers";
import Button from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
	UserPlus,
	Users,
	Shield,
	Settings,
	QrCode,
	Trash2,
	AlertTriangle,
	CheckCircle,
} from "lucide-react";

type OrganizerRow = {
	id: string;
	userId: string;
	roles: Role[];
	email?: string;
	displayName?: string;
};

interface OrganizersPanelProps {
	eventId: string;
	currentUserId?: string;
	currentUserRoles?: Role[];
}

const roleConfig = {
	owner: {
		label: "Owner",
		icon: Shield,
		description: "Full access to event management",
		color: "text-red-500",
	},
	manager: {
		label: "Manager",
		icon: Settings,
		description: "Manage tickets, merch, and organizers",
		color: "text-blue-500",
	},
	scanner: {
		label: "Scanner",
		icon: QrCode,
		description: "Scan tickets at the event",
		color: "text-green-500",
	},
};

export function OrganizersPanel({
	eventId,
	currentUserId,
	currentUserRoles,
}: OrganizersPanelProps) {
	const [loading, setLoading] = useState(true);
	const [organizers, setOrganizers] = useState<OrganizerRow[]>([]);
	const [email, setEmail] = useState("");
	const [addRoles, setAddRoles] = useState<Role[]>(["scanner"]);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);

	const canManage = useMemo(
		() =>
			(currentUserRoles ?? []).some((r) => r === "owner" || r === "manager"),
		[currentUserRoles]
	);

	const isOwner = (currentUserRoles ?? []).includes("owner");

	const loadOrganizers = useCallback(
		async (withAutoSeed = true) => {
			setLoading(true);
			setError(null);
			try {
				const list = await listOrganizers(eventId);
				const rows = list.map((o) => ({
					id: o.id,
					userId: o.userId,
					roles: o.roles as Role[],
				}));

				// If empty and we want to auto-seed, try to seed and reload once
				if (withAutoSeed && rows.length === 0 && currentUserId) {
					const result = await ensureOwnerIfEmpty(eventId);
					if (result?.seeded) {
						const list2 = await listOrganizers(eventId);
						setOrganizers(
							list2.map((o) => ({
								id: o.id,
								userId: o.userId,
								roles: o.roles as Role[],
							}))
						);
						return;
					}
				}

				setOrganizers(rows);
			} catch (err: unknown) {
				console.error("Failed to load organizers:", err);

				// Try auto-seed on "first run" errors (new feature / missing subcollection)
				if (withAutoSeed && currentUserId) {
					try {
						const result = await ensureOwnerIfEmpty(eventId);
						if (result?.seeded) {
							const list2 = await listOrganizers(eventId);
							setOrganizers(
								list2.map((o) => ({
									id: o.id,
									userId: o.userId,
									roles: o.roles as Role[],
								}))
							);
							return;
						}
					} catch {
						// fall-through to error UI
					}
				}

				setError("Failed to load organizers");
			} finally {
				setLoading(false);
			}
		},
		[eventId, currentUserId]
	);

	useEffect(() => {
		loadOrganizers(true);
	}, [eventId, loadOrganizers]);

	async function handleAddOrganizer() {
		if (!email.trim()) return;

		setSaving(true);
		setError(null);
		setSuccessMessage(null);
		try {
			// Pass current origin as baseUrl for invite links (supports localhost testing)
			const baseUrl =
				typeof window !== "undefined" ? window.location.origin : undefined;
			const result = await addOrganizerByEmail(
				eventId,
				email.trim(),
				addRoles,
				baseUrl
			);
			const addedEmail = email.trim();
			setEmail("");
			setAddRoles(["scanner"]);
			await loadOrganizers(false);

			// Show appropriate success message
			if (result.invited) {
				setSuccessMessage(
					`Invite sent to ${addedEmail}! They'll receive an email with instructions.`
				);
			} else if (result.added) {
				setSuccessMessage(`${addedEmail} has been added as an organizer.`);
			}

			// Clear success message after 5 seconds
			setTimeout(() => setSuccessMessage(null), 5000);
		} catch (err: unknown) {
			console.error("Failed to add organizer:", err);
			setError(err instanceof Error ? err.message : "Failed to add organizer");
		} finally {
			setSaving(false);
		}
	}

	async function handleRoleToggle(targetUserId: string, role: Role) {
		const organizer = organizers.find((o) => o.userId === targetUserId);
		if (!organizer) return;

		const nextRoles = organizer.roles.includes(role)
			? organizer.roles.filter((r) => r !== role)
			: [...organizer.roles, role];

		// Prevent removing last owner
		if (organizer.roles.includes("owner") && !nextRoles.includes("owner")) {
			const owners = organizers.filter((o) => o.roles.includes("owner"));
			if (owners.length <= 1) {
				setError("Cannot remove the last owner");
				return;
			}
		}

		setSaving(true);
		setError(null);
		try {
			await updateOrganizerRoles(eventId, targetUserId, nextRoles);
			await loadOrganizers(false);
		} catch (err: unknown) {
			console.error("Failed to update roles:", err);
			setError(err instanceof Error ? err.message : "Failed to update roles");
		} finally {
			setSaving(false);
		}
	}

	async function handleRemoveOrganizer(targetUserId: string) {
		const organizer = organizers.find((o) => o.userId === targetUserId);
		if (!organizer) return;

		if (!confirm(`Remove ${organizer.userId} from organizers?`)) return;

		setSaving(true);
		setError(null);
		try {
			await removeOrganizer(eventId, targetUserId);
			await loadOrganizers(false);
		} catch (err: unknown) {
			console.error("Failed to remove organizer:", err);
			setError(
				err instanceof Error ? err.message : "Failed to remove organizer"
			);
		} finally {
			setSaving(false);
		}
	}

	function handleUnpublishEvent() {
		// TODO: Implement unpublish functionality
		alert("Unpublish functionality will be implemented soon");
	}

	return (
		<div className="bg-surface border border-stroke rounded-xl sm:rounded-2xl p-4 sm:p-6 space-y-4 sm:space-y-6">
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
				<div className="flex items-center gap-2 sm:gap-3">
					<Users className="w-5 h-5 sm:w-6 sm:h-6 text-accent" />
					<h3 className="font-heading font-semibold text-lg sm:text-xl">
						Organizers & Roles
					</h3>
				</div>

				{canManage && (
					<button
						className="flex items-center justify-center gap-2 text-xs sm:text-sm px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl border border-stroke hover:bg-stroke/20 transition-colors disabled:opacity-50"
						disabled={saving}
						onClick={handleUnpublishEvent}
					>
						<AlertTriangle className="w-4 h-4" />
						<span className="hidden sm:inline">Unpublish Event</span>
						<span className="sm:hidden">Unpublish</span>
					</button>
				)}
			</div>

			{/* Error Message */}
			{error && (
				<div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
					<div className="flex items-center gap-2 text-red-400">
						<AlertTriangle className="w-4 h-4" />
						<span className="text-sm">{error}</span>
					</div>
				</div>
			)}

			{/* Success Message */}
			{successMessage && (
				<div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
					<div className="flex items-center gap-2 text-green-400">
						<CheckCircle className="w-4 h-4" />
						<span className="text-sm">{successMessage}</span>
					</div>
				</div>
			)}

			{/* Add Organizer Section */}
			{canManage && (
				<div className="rounded-lg sm:rounded-xl border border-stroke p-4 sm:p-6 bg-bg/30">
					<div className="flex items-center gap-2 mb-3 sm:mb-4">
						<UserPlus className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
						<h4 className="font-medium text-sm sm:text-base">
							Add New Organizer
						</h4>
					</div>

					<div className="space-y-3 sm:space-y-4">
						<div>
							<label className="block text-xs sm:text-sm font-medium mb-2">
								Email Address
							</label>
							<input
								className="w-full rounded-lg sm:rounded-xl bg-bg border border-stroke px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
								placeholder="organizer@example.com"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								disabled={saving}
							/>
						</div>

						<div>
							<label className="block text-xs sm:text-sm font-medium mb-2 sm:mb-3">
								Assign Roles
							</label>
							<div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
								{(["scanner", "manager", "owner"] as Role[]).map((role) => {
									const config = roleConfig[role];
									const Icon = config.icon;
									return (
										<label
											key={role}
											className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg sm:rounded-xl border border-stroke hover:bg-stroke/10 transition-colors cursor-pointer"
										>
											<input
												type="checkbox"
												className="w-4 h-4 text-accent focus:ring-accent/50"
												checked={addRoles.includes(role)}
												onChange={() =>
													setAddRoles(
														addRoles.includes(role)
															? addRoles.filter((r) => r !== role)
															: [...addRoles, role]
													)
												}
												disabled={saving}
											/>
											<Icon className={`w-4 h-4 ${config.color}`} />
											<div className="min-w-0 flex-1">
												<div className="text-xs sm:text-sm font-medium">
													{config.label}
												</div>
												<div className="text-xs text-text-muted hidden sm:block">
													{config.description}
												</div>
											</div>
										</label>
									);
								})}
							</div>
						</div>

						<Button
							variant="primary"
							text={saving ? "Adding..." : "Add Organizer"}
							onClick={handleAddOrganizer}
							disabled={!email.trim() || saving || addRoles.length === 0}
							className="w-full sm:w-auto text-sm"
						/>
					</div>

					<p className="text-xs text-text-muted mt-2 sm:mt-3">
						The user must already have an account with this email address.
					</p>
				</div>
			)}

			{/* Current Organizers */}
			<div>
				<div className="flex items-center gap-2 mb-3 sm:mb-4">
					<Users className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
					<h4 className="font-medium text-sm sm:text-base">
						Current Organizers
					</h4>
				</div>

				{loading ? (
					<div className="py-8 sm:py-12 flex items-center justify-center">
						<Spinner size="lg" />
					</div>
				) : organizers.length === 0 ? (
					<div className="text-center py-8 sm:py-12">
						<Users className="mx-auto w-10 h-10 sm:w-12 sm:h-12 text-text-muted mb-3" />
						<p className="text-text-muted text-sm sm:text-base">
							No organizers added yet
						</p>
						{!canManage && (
							<p className="text-xs text-text-muted mt-1">
								Contact an owner or manager to add organizers
							</p>
						)}
					</div>
				) : (
					<div className="space-y-2 sm:space-y-3">
						{organizers.map((organizer) => (
							<div
								key={organizer.userId}
								className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg sm:rounded-xl border border-stroke hover:bg-stroke/5 transition-colors"
							>
								<div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
									<div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
										<span className="text-xs sm:text-sm font-medium text-accent">
											{organizer.userId.charAt(0).toUpperCase()}
										</span>
									</div>

									<div className="min-w-0 flex-1">
										<div className="font-medium text-xs sm:text-sm truncate">
											{organizer.userId}
										</div>
										<div className="flex items-center gap-1 sm:gap-2 mt-1 flex-wrap">
											{organizer.roles.map((role) => {
												const config = roleConfig[role];
												const Icon = config.icon;
												return (
													<span
														key={role}
														className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md ${config.color} bg-current/10`}
													>
														<Icon className="w-3 h-3" />
														<span className="hidden sm:inline">
															{config.label}
														</span>
													</span>
												);
											})}
										</div>
									</div>
								</div>

								{canManage && (
									<div className="flex items-center gap-2 sm:gap-3">
										{/* Role Toggles */}
										<div className="flex items-center gap-1 sm:gap-2">
											{(["scanner", "manager", "owner"] as Role[]).map(
												(role) => {
													const config = roleConfig[role];
													const Icon = config.icon;
													const isDisabled =
														saving ||
														(organizer.userId === currentUserId &&
															role === "owner" &&
															!isOwner);

													return (
														<button
															key={role}
															className={`p-2 rounded-lg border transition-colors ${
																organizer.roles.includes(role)
																	? `border-current ${config.color} bg-current/10`
																	: "border-stroke hover:bg-stroke/20"
															} ${
																isDisabled
																	? "opacity-50 cursor-not-allowed"
																	: ""
															}`}
															disabled={isDisabled}
															onClick={() =>
																handleRoleToggle(organizer.userId, role)
															}
															title={config.description}
														>
															<Icon className="w-4 h-4" />
														</button>
													);
												}
											)}
										</div>

										{/* Remove Button */}
										<button
											className="p-2 rounded-lg border border-stroke hover:bg-red-500/10 hover:border-red-500/50 transition-colors disabled:opacity-50"
											disabled={
												saving ||
												(organizer.roles.includes("owner") &&
													organizers.filter((o) => o.roles.includes("owner"))
														.length <= 1)
											}
											onClick={() => handleRemoveOrganizer(organizer.userId)}
											title="Remove organizer"
										>
											<Trash2 className="w-4 h-4 text-red-500" />
										</button>
									</div>
								)}
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
