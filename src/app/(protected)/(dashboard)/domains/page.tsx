"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { useDashboardContext } from "@/hooks/useDashboardContext";
import {
	registerCustomDomain,
	toggleCustomDomainUsage,
	isCustomDomainTaken,
	triggerDomainVerification,
	triggerDomainRemoval,
} from "@/lib/firebase/domains";
import Button from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
	Globe,
	Check,
	Copy,
	ArrowRight,
	AlertCircle,
	ChevronRight,
	ShieldCheck,
	RefreshCw,
	Trash2,
	X,
	Link2,
	ArrowLeft,
} from "lucide-react";
import { useToast } from "@/app/hooks/use-toast";

type Step = 1 | 2 | 3;

export default function DomainsPage() {
	const router = useRouter();
	const { user } = useAuth();
	const { roleDetection, activeRole } = useDashboardContext();
	const { toast } = useToast();

	const [step, setStep] = useState<Step>(1);
	const [domainInput, setDomainInput] = useState("");
	const [isChecking, setIsChecking] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);

	const isPro = roleDetection?.brandSubscriptionTier === "pro";
	const currentDomain =
		roleDetection?.brandSlug || roleDetection?.brandUsername;
	const customDomain = roleDetection?.customDomain;
	const useCustomDomain = roleDetection?.useCustomDomain;
	const domainStatus = roleDetection?.customDomainStatus || "pending";

	const SERVER_IP = "216.198.79.1";

	useEffect(() => {
		if (activeRole !== "brand") {
			router.push("/dashboard");
			return;
		}
		setLoading(false);
	}, [activeRole, router]);

	const handleNextStep = async () => {
		if (step === 1) {
			setError(null);
			const normalized = domainInput
				.toLowerCase()
				.trim()
				.replace(/^https?:\/\//, "")
				.replace(/\/$/, "");
			if (!normalized || !normalized.includes(".")) {
				setError("Please enter a valid domain (e.g. shop.com)");
				return;
			}

			setIsChecking(true);
			try {
				const taken = await isCustomDomainTaken(normalized);
				if (taken) {
					setError("This domain is already connected.");
					setIsChecking(false);
					return;
				}
				setDomainInput(normalized);
				setStep(2);
			} catch (err) {
				setError("Validation failed. Please try again.");
			} finally {
				setIsChecking(false);
			}
		} else if (step === 2) {
			setStep(3);
		} else if (step === 3) {
			setIsChecking(true);
			try {
				const slug =
					roleDetection?.brandSlug || roleDetection?.brandUsername || "";
				await registerCustomDomain(user!.uid, domainInput, slug);

				// Automatically trigger first verification
				const result = await triggerDomainVerification(domainInput);
				if (result.verified) {
					toast({
						title: "Success! 🎉",
						description: "Domain verified and activated.",
					});
				} else {
					toast({
						title: "Domain Linked",
						description:
							"Domain added, but DNS records are not yet detected. This is normal and can take some time.",
					});
				}
			} catch (err: any) {
				toast({
					title: "Error",
					description: err.message,
					variant: "destructive",
				});
			} finally {
				setIsChecking(false);
			}
		}
	};

	const copyToClipboard = (text: string, label: string) => {
		navigator.clipboard.writeText(text);
		toast({ title: "Copied", description: `${label} copied.` });
	};

	if (loading)
		return (
			<div className="p-8 flex justify-center items-center h-[60vh]">
				<Spinner />
			</div>
		);

	if (!isPro) {
		return (
			<div className="p-8 max-w-xl mx-auto space-y-12 pt-20">
				<div className="space-y-4">
					<h1 className="text-3xl font-heading font-medium tracking-tight">
						Custom Domain
					</h1>
					<p className="text-text-muted text-lg leading-relaxed">
						Connect your own domain to your Labeld storefront for a professional
						identity.
					</p>
				</div>

				<div className="bg-surface p-8 rounded-3xl border border-stroke space-y-10 shadow-sm">
					<div className="space-y-6">
						<div className="flex items-center gap-2 px-2 py-0.5 bg-accent/5 text-accent text-[10px] font-bold uppercase tracking-wider rounded w-fit border border-accent/10">
							Pro Membership Required
						</div>
						<div className="space-y-4">
							<h3 className="text-xl font-medium">Benefits:</h3>
							<ul className="space-y-3">
								<li className="flex items-center gap-3 text-sm text-text-muted">
									<Check className="w-4 h-4 text-accent" />
									<span>Establish trust with your own address</span>
								</li>
								<li className="flex items-center gap-3 text-sm text-text-muted">
									<Check className="w-4 h-4 text-accent" />
									<span>Improved brand recognition</span>
								</li>
								<li className="flex items-center gap-3 text-sm text-text-muted">
									<Check className="w-4 h-4 text-accent" />
									<span>Remove third-party branding from URLs</span>
								</li>
							</ul>
						</div>
					</div>

					<Button
						text="Upgrade to Pro"
						variant="primary"
						className="w-full py-4 text-base rounded-2xl"
						onClick={() => router.push("/pricing")}
					/>
				</div>
			</div>
		);
	}

	if (customDomain) {
		return (
			<div className="p-6 md:p-12 max-w-4xl mx-auto space-y-12">
				<header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
					<div className="space-y-1">
						<h1 className="text-3xl font-heading font-medium tracking-tight">
							Domain Control
						</h1>
						<p className="text-text-muted text-base">
							You are currently using <b>{customDomain}</b>
						</p>
					</div>
					<button
						className="text-xs text-red-500 hover:text-red-600 font-medium flex items-center gap-2 group transition-colors"
						onClick={async () => {
							if (
								confirm(
									"Are you sure you want to disconnect this domain?",
								)
							) {
								const domainToRemoval = customDomain;
								if (!domainToRemoval) return;

								setIsChecking(true);
								try {
									const result =
										await triggerDomainRemoval(domainToRemoval);

									if (result.success) {
										toast({
											title: "Disconnected",
											description: result.message,
										});
									} else {
										toast({
											title: "Error",
											description: result.message,
											variant: "destructive",
										});
									}
								} catch (err: any) {
									toast({
										title: "Removal Failed",
										description: err.message,
										variant: "destructive",
									});
								} finally {
									setIsChecking(false);
								}
							}
						}}
					>
						<Trash2 className="w-3.5 h-3.5" />
						Disconnect Domain
					</button>
				</header>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div className="bg-surface p-8 rounded-3xl border border-stroke space-y-8 shadow-sm">
						<div className="flex items-center justify-between">
							<span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
								Linked Domain
							</span>
							<span
								className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
									domainStatus === "active"
										? "bg-green-500/10 text-green-500"
										: "bg-amber-500/10 text-amber-500"
								}`}
							>
								{domainStatus}
							</span>
						</div>
						<p className="text-2xl font-mono font-medium tracking-tight truncate">
							{customDomain}
						</p>

						<div className="pt-6 border-t border-stroke flex items-center justify-between">
							<div className="flex flex-col gap-0.5">
								<span className="text-sm font-medium">Use as Primary</span>
								<span className="text-[10px] text-text-muted">
									Redirect visitors to this domain
								</span>
							</div>
							<button
								onClick={() =>
									toggleCustomDomainUsage(user!.uid, !useCustomDomain)
								}
								className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${useCustomDomain ? "bg-accent" : "bg-stroke/50"}`}
							>
								<span
									className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${useCustomDomain ? "translate-x-6" : "translate-x-1"}`}
								/>
							</button>
						</div>
					</div>

					<div className="bg-bg/50 p-8 rounded-3xl border border-stroke flex flex-col justify-between space-y-8">
						<div className="space-y-2">
							<span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
								Backup Link
							</span>
							<p className="text-xl font-mono text-text-muted truncate">
								{currentDomain}.labeld.app
							</p>
						</div>
						<p className="text-[10px] text-text-muted leading-relaxed italic opacity-70">
							This link remains active even if your custom domain is propagating
							or offline.
						</p>
					</div>
				</div>

				{domainStatus !== "active" && (
					<section className="bg-surface p-8 md:p-12 rounded-[2.5rem] border border-stroke space-y-10 shadow-sm relative overflow-hidden">
						<div className="space-y-2">
							<h3 className="text-xl font-medium">DNS Configuration</h3>
							<p className="text-sm text-text-muted">
								Update your records at your domain registrar to activate your
								link.
							</p>
						</div>

						<div className="space-y-6">
							<div className="bg-bg/30 rounded-2xl border border-stroke p-6 space-y-6">
								<div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-6 md:items-end">
									<div className="space-y-2">
										<span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
											A Record (Host)
										</span>
										<div className="px-4 py-2 bg-surface rounded-lg border border-stroke font-mono text-sm">
											@
										</div>
									</div>
									<div className="space-y-2">
										<span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
											Points To (Value)
										</span>
										<div className="px-4 py-2 bg-surface rounded-lg border border-stroke font-mono text-sm tracking-tight">
											{SERVER_IP}
										</div>
									</div>
									<button
										onClick={() => copyToClipboard(SERVER_IP, "IP Value")}
										className="flex items-center gap-2 text-[10px] font-bold text-accent hover:opacity-70 transition-opacity uppercase px-4 py-2 bg-accent/5 rounded-lg border border-accent/10"
									>
										<Copy className="w-3 h-3" />
										Copy
									</button>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-6 md:items-end border-t border-stroke pt-6">
									<div className="space-y-2">
										<span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
											CNAME (Host)
										</span>
										<div className="px-4 py-2 bg-surface rounded-lg border border-stroke font-mono text-sm tracking-tight">
											www
										</div>
									</div>
									<div className="space-y-2">
										<span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
											Points To (Value)
										</span>
										<div className="px-4 py-2 bg-surface rounded-lg border border-stroke font-mono text-sm tracking-tight truncate">
											{currentDomain}.labeld.app
										</div>
									</div>
									<button
										onClick={() =>
											copyToClipboard(
												`${currentDomain}.labeld.app`,
												"Target Domain",
											)
										}
										className="flex items-center gap-2 text-[10px] font-bold text-accent hover:opacity-70 transition-opacity uppercase px-4 py-2 bg-accent/5 rounded-lg border border-accent/10"
									>
										<Copy className="w-3 h-3" />
										Copy
									</button>
								</div>
							</div>
						</div>

						<div className="flex flex-col items-center gap-6 border-t border-stroke pt-10">
							<Button
								variant="secondary"
								className="w-full md:w-auto px-12 py-3.5 bg-text text-bg border-none hover:opacity-90 transition-opacity rounded-xl font-medium"
								leftIcon={
									<RefreshCw
										className={`w-4 h-4 ${isChecking ? "animate-spin" : ""}`}
									/>
								}
								text={isChecking ? "Checking..." : "Re-test Connection"}
								onClick={async () => {
									if (!customDomain) return;
									setIsChecking(true);
									try {
										const result =
											await triggerDomainVerification(customDomain);
										if (result.verified) {
											toast({
												title: "Verified! 🎉",
												description: "Your domain is now active.",
											});
										} else {
											toast({
												title: "Not yet active",
												description: result.message,
											});
										}
									} catch (err: any) {
										toast({
											title: "Verification failed",
											description: err.message,
											variant: "destructive",
										});
									} finally {
										setIsChecking(false);
									}
								}}
							/>
							<div className="flex items-center gap-4 text-[10px] text-text-muted uppercase tracking-[0.2em] font-medium">
								<ShieldCheck className="w-3.5 h-3.5" />
								SSL Certificates are handled automatically once verified
							</div>
						</div>
					</section>
				)}
			</div>
		);
	}

	return (
		<main className="p-6 md:p-12 max-w-2xl mx-auto space-y-12">
			<nav className="flex items-center justify-between">
				<button
					onClick={() =>
						step > 1
							? setStep((s) => (s - 1) as Step)
							: router.push("/dashboard")
					}
					className="text-xs text-text-muted hover:text-text flex items-center gap-2 transition-colors"
				>
					<ArrowLeft className="w-3.5 h-3.5" />
					Back
				</button>
				<div className="flex items-center gap-1.5">
					{[1, 2, 3].map((s) => (
						<div
							key={s}
							className={`h-1 rounded-full transition-all duration-300 ${
								step === s
									? "w-6 bg-accent"
									: step > s
										? "w-2 bg-accent/30"
										: "w-2 bg-stroke"
							}`}
						/>
					))}
				</div>
			</nav>

			<div className="space-y-2">
				<h1 className="text-3xl font-heading font-medium tracking-tight">
					Connect Domain
				</h1>
				<p className="text-text-muted text-base">
					Setup a custom address for your storefront.
				</p>
			</div>

			<section className="bg-surface rounded-3xl border border-stroke p-8 md:p-10 shadow-sm transition-all duration-500">
				{step === 1 && (
					<div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
						<div className="space-y-2">
							<h2 className="text-lg font-medium">Step 1: Enter Domain</h2>
							<p className="text-xs text-text-muted">
								Provide the domain name you own (e.g. shop.com).
							</p>
						</div>

						<div className="space-y-4">
							<input
								type="text"
								placeholder="e.g. shop.com"
								className="w-full bg-bg px-6 py-4 rounded-xl border border-stroke outline-none focus:border-accent font-mono text-lg transition-colors"
								value={domainInput}
								onChange={(e) => setDomainInput(e.target.value)}
								onKeyDown={(e) => e.key === "Enter" && handleNextStep()}
								autoFocus
							/>
							{error && (
								<p className="text-[10px] text-red-500 font-bold flex items-center gap-1.5 px-1">
									<AlertCircle className="w-3 h-3" />
									{error}
								</p>
							)}
						</div>
					</div>
				)}

				{step === 2 && (
					<div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
						<div className="space-y-2">
							<h2 className="text-lg font-medium">
								Step 2: Root Configuration
							</h2>
							<p className="text-xs text-text-muted">
								Add an A Record at your registrar pointing to the server.
							</p>
						</div>

						<div className="bg-bg/50 p-6 rounded-2xl border border-stroke space-y-4">
							<div className="flex justify-between items-center text-[10px] uppercase tracking-widest text-text-muted font-bold">
								<span>A Record (Host)</span>
								<span className="text-text font-mono">@</span>
							</div>
							<div className="flex justify-between items-center text-[10px] uppercase tracking-widest text-text-muted font-bold">
								<span>Value (IP)</span>
								<div className="flex items-center gap-3">
									<span className="text-text font-mono text-sm">
										{SERVER_IP}
									</span>
									<button
										onClick={() => copyToClipboard(SERVER_IP, "IP Value")}
										className="text-accent hover:opacity-70 transition-opacity"
									>
										<Copy className="w-3.5 h-3.5" />
									</button>
								</div>
							</div>
						</div>
					</div>
				)}

				{step === 3 && (
					<div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
						<div className="space-y-2">
							<h2 className="text-lg font-medium">Step 3: Subdomain Setup</h2>
							<p className="text-xs text-text-muted">
								Add a CNAME record for the "www" prefix.
							</p>
						</div>

						<div className="bg-bg/50 p-6 rounded-2xl border border-stroke space-y-4 font-mono">
							<div className="flex justify-between items-center text-[10px] uppercase tracking-widest text-text-muted font-bold">
								<span>CNAME (Host)</span>
								<span className="text-text">www</span>
							</div>
							<div className="flex justify-between items-center text-[10px] uppercase tracking-widest text-text-muted font-bold">
								<span>Target</span>
								<div className="flex items-center gap-3 overflow-hidden">
									<span className="text-text text-sm truncate">
										{currentDomain}.labeld.app
									</span>
									<button
										onClick={() =>
											copyToClipboard(
												`${currentDomain}.labeld.app`,
												"Target Domain",
											)
										}
										className="text-accent hover:opacity-70 transition-opacity flex-shrink-0"
									>
										<Copy className="w-3.5 h-3.5" />
									</button>
								</div>
							</div>
						</div>
					</div>
				)}

				<footer className="mt-10 flex flex-col items-center gap-6 border-t border-stroke pt-8">
					<Button
						text={
							step === 3
								? isChecking
									? "Verifying..."
									: "Finish Setup"
								: "Next Step"
						}
						variant="primary"
						className="w-full py-4 rounded-xl text-base font-medium shadow-none hover:bg-accent/90"
						rightIcon={!isChecking && <ArrowRight className="w-4 h-4" />}
						isLoading={isChecking}
						onClick={handleNextStep}
					/>
					<div className="flex items-center gap-2 text-[10px] text-text-muted uppercase tracking-[0.2em] font-medium opacity-50">
						<Link2 className="w-3 h-3" />
						Requires DNS propagation
					</div>
				</footer>
			</section>
		</main>
	);
}
