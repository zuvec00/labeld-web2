"use client";

import { useState, useMemo } from "react";

import {
	ArrowLeft,
	ArrowRight,
	X,
	Loader2,
	CheckCircle2,
	Link as LinkIcon,
	Image as ImageIcon,
} from "lucide-react";
import TextLabel from "../ui/textlabel";
import { Input } from "../ui/input";
import { MultiImagePicker } from "../ui/upload-multiple-image"; // Assuming I can import this, or I'll use the one I saw
import { createBrandRegistration } from "@/lib/firebase/brandRegistration";
import { uploadImageCloudinary } from "@/lib/storage/cloudinary";
import { sendMailGenericCF } from "@/lib/firebase/callables/email";

// Define the form data structure
interface BrandRegistrationForm {
	brandName: string;
	phone: string;
	email: string;
	socials: {
		tiktok: string;
		instagram: string;
	};
	description: string;
	visuals: {
		type: "file" | "link";
		files: File[]; // Local only
		links: { url: string; title: string }[];
	};
}

const INITIAL_DATA: BrandRegistrationForm = {
	brandName: "",
	phone: "",
	email: "",
	socials: {
		tiktok: "",
		instagram: "",
	},
	description: "",
	visuals: {
		type: "file",
		files: [],
		links: [{ url: "", title: "" }],
	},
};

export default function BrandRegistrationModal({
	isOpen,
	onClose,
	onLaunchBrand, // Callback to trigger auth flow
}: {
	isOpen: boolean;
	onClose: () => void;
	onLaunchBrand?: () => void;
}) {
	const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
	const [formData, setFormData] = useState<BrandRegistrationForm>(INITIAL_DATA);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Progress Calculation
	const progress = useMemo(() => {
		if (step === 4) return 100;
		return Math.round(((step - 1) / 3) * 100);
	}, [step]);

	// Validation
	const canProceed = useMemo(() => {
		if (step === 1) {
			return (
				formData.brandName.trim().length > 0 &&
				formData.phone.trim().length > 0 &&
				formData.email.trim().length > 0 &&
				formData.email.includes("@")
			);
		}
		if (step === 2) {
			return (
				formData.description.trim().length > 0 &&
				(formData.socials.instagram.trim().length > 0 ||
					formData.socials.tiktok.trim().length > 0)
			);
		}
		if (step === 3) {
			if (formData.visuals.type === "file") {
				return formData.visuals.files.length > 0;
			}
			// For links, at least one valid link
			return formData.visuals.links.some((l) => l.url.trim().length > 0);
		}
		return true;
	}, [step, formData]);

	const handleNext = async () => {
		if (step === 3) {
			await handleSubmit();
		} else {
			setStep((prev) => (prev + 1) as any);
		}
	};

	const handleBack = () => {
		if (step === 1) return;
		setStep((prev) => (prev - 1) as any);
	};

	const handleSubmit = async () => {
		setLoading(true);
		setError(null);
		try {
			let visualData: any[] = [];

			// Handle File Uploads
			if (formData.visuals.type === "file") {
				const uploadPromises = formData.visuals.files.map((file) =>
					uploadImageCloudinary(file, {
						folder: "brand_registrations",
						tags: ["registration", formData.brandName],
					})
				);
				visualData = await Promise.all(uploadPromises);
			} else {
				visualData = formData.visuals.links.filter((l) => l.url.trim());
			}

			// Save to Firebase
			await createBrandRegistration({
				brandName: formData.brandName,
				phone: formData.phone,
				email: formData.email,
				socials: {
					tiktok: formData.socials.tiktok,
					instagram: formData.socials.instagram,
				},
				description: formData.description,
				visuals: {
					type: formData.visuals.type,
					data: visualData,
				},
			});

			// Send Email Notification (Non-blocking)
			const emailHtml = `
                <div style="background-color: #0B0B0B; color: #FAF7F1; font-family: sans-serif; padding: 40px 20px;">
                    <div style="max-width: 600px; margin: 0 auto; background-color: #1C1C1C; border-radius: 12px; overflow: hidden; border: 1px solid #2A2A2A;">
                        <div style="background-color: #C4FF30; padding: 30px; text-align: center;">
                            <h1 style="color: #0B0B0B; margin: 0; font-size: 24px; font-weight: 700; text-transform: uppercase; letter-spacing: -0.5px;">New Brand Registration</h1>
                        </div>
                        
                        <div style="padding: 30px;">
                            <p style="font-size: 16px; line-height: 1.5; color: #FAF7F1; margin-bottom: 24px;">
                                A new brand has applied to join Labeld Studio.
                            </p>

                            <div style="margin-bottom: 24px;">
                                <h2 style="font-size: 18px; color: #C4FF30; margin: 0 0 12px 0; border-bottom: 1px solid #2A2A2A; padding-bottom: 8px;">Brand Details</h2>
                                <table style="width: 100%; border-collapse: collapse;">
                                    <tr>
                                        <td style="padding: 8px 0; color: #9E9E9E; width: 120px; font-size: 14px;">Brand Name</td>
                                        <td style="padding: 8px 0; color: #FAF7F1; font-weight: 600;">${
																					formData.brandName
																				}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; color: #9E9E9E; font-size: 14px;">Phone</td>
                                        <td style="padding: 8px 0; color: #FAF7F1;">${
																					formData.phone
																				}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; color: #9E9E9E; font-size: 14px;">Email</td>
                                        <td style="padding: 8px 0; color: #FAF7F1;">${
																					formData.email
																				}</td>
                                    </tr>
                                </table>
                            </div>

                            <div style="margin-bottom: 24px;">
                                <h2 style="font-size: 18px; color: #C4FF30; margin: 0 0 12px 0; border-bottom: 1px solid #2A2A2A; padding-bottom: 8px;">Socials</h2>
                                <table style="width: 100%; border-collapse: collapse;">
                                    <tr>
                                        <td style="padding: 8px 0; color: #9E9E9E; width: 120px; font-size: 14px;">Instagram</td>
                                        <td style="padding: 8px 0; color: #FAF7F1;">${
																					formData.socials.instagram || "N/A"
																				}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; color: #9E9E9E; font-size: 14px;">TikTok</td>
                                        <td style="padding: 8px 0; color: #FAF7F1;">${
																					formData.socials.tiktok || "N/A"
																				}</td>
                                    </tr>
                                </table>
                            </div>
                            
                            <div style="margin-bottom: 24px;">
                                <h2 style="font-size: 18px; color: #C4FF30; margin: 0 0 12px 0; border-bottom: 1px solid #2A2A2A; padding-bottom: 8px;">Description</h2>
                                <div style="background-color: #0B0B0B; padding: 16px; border-radius: 8px; color: #FAF7F1; line-height: 1.6; border: 1px solid #2A2A2A; white-space: pre-wrap; font-size: 14px;">${
																	formData.description
																}</div>
                            </div>

                            <div style="margin-bottom: 8px;">
                                <h2 style="font-size: 18px; color: #C4FF30; margin: 0 0 12px 0; border-bottom: 1px solid #2A2A2A; padding-bottom: 8px;">Visuals</h2>
                                <p style="margin: 0 0 12px 0; color: #9E9E9E; font-size: 14px;">Type: <span style="color: #FAF7F1; text-transform: capitalize;">${
																	formData.visuals.type
																}</span></p>
                                ${
																	formData.visuals.type === "link"
																		? `
                                        <ul style="margin: 0; padding-left: 20px; color: #C4FF30;">
                                            ${formData.visuals.links
																							.map(
																								(l) =>
																									`<li style="margin-bottom: 8px;"><a href="${
																										l.url
																									}" style="color: #C4FF30; text-decoration: none; border-bottom: 1px dotted #C4FF30;">${
																										l.title || l.url
																									}</a></li>`
																							)
																							.join("")}
                                        </ul>
                                    `
																		: `
                                        <p style="color: #9E9E9E; font-style: italic; font-size: 14px; background: #2A2A2A; padding: 10px; border-radius: 6px; display: inline-block;">Check Dashboard for uploaded images.</p>
                                    `
																}
                            </div>
                        </div>
                        <div style="background-color: #0B0B0B; padding: 20px; text-align: center; border-top: 1px solid #2A2A2A;">
                            <p style="color: #555; font-size: 12px; margin: 0;">Sent from Labeld Studio Web</p>
                        </div>
                    </div>
                </div>
            `;

			sendMailGenericCF({
				to: [
					"labeldapp@gmail.com",
					"thefunktionng@gmail.com",
					"seyanumoradeyo@gmail.com",
				],
				subject: `New Brand Registration: ${formData.brandName}`,
				html: emailHtml,
				text: `New Brand Registration: ${formData.brandName}\n\nPhone: ${formData.phone}\nEmail: ${formData.email}\n\nSee full details in dashboard.`,
			}).catch((e) => console.error("Failed to send notification email:", e));

			setStep(4);
		} catch (err: any) {
			console.error(err);
			setError(err.message || "Something went wrong. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
			<div
				className="absolute inset-0 bg-bg/80 backdrop-blur-sm"
				onClick={onClose}
			/>

			<div className="relative bg-bg border border-stroke rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
				{/* Header */}
				<div className="flex items-center justify-between p-6 border-b border-stroke">
					<div className="flex items-center gap-3">
						{step > 1 && step < 4 && (
							<button
								onClick={handleBack}
								className="p-1 hover:bg-surface rounded-md"
							>
								<ArrowLeft className="w-5 h-5 text-text-muted" />
							</button>
						)}
						<div>
							<h2 className="font-heading font-semibold text-xl">
								{step === 4
									? "Application Received"
									: "Register Your Brand for thefunKtion"}
							</h2>
							{step < 4 && (
								<p className="text-xs text-text-muted">Step {step} of 3</p>
							)}
						</div>
					</div>
					<button
						onClick={onClose}
						className="p-1 hover:text-text text-text-muted transition-colors"
					>
						<X className="w-6 h-6" />
					</button>
				</div>

				{/* Progress Bar */}
				{step < 4 && (
					<div className="w-full bg-surface h-1">
						<div
							className="bg-accent h-full transition-all duration-300 ease-out"
							style={{ width: `${progress}%` }}
						/>
					</div>
				)}

				{/* Content */}
				<div className="flex-1 overflow-y-auto p-6">
					{error && (
						<div className="mb-4 p-3 bg-red-500/10 text-red-500 rounded-lg text-sm border border-red-500/20">
							{error}
						</div>
					)}

					{step === 1 && (
						<div className="space-y-4">
							<div>
								<TextLabel label="Brand Name" isRequired />
								<Input
									placeholder="e.g. Broken Planet"
									value={formData.brandName}
									onChange={(e) =>
										setFormData({ ...formData, brandName: e.target.value })
									}
								/>
							</div>
							<div>
								<TextLabel label="Phone Number" isRequired />
								<Input
									placeholder="+234..."
									value={formData.phone}
									onChange={(e) =>
										setFormData({ ...formData, phone: e.target.value })
									}
								/>
							</div>
							<div>
								<TextLabel label="Email Address" isRequired />
								<Input
									type="email"
									placeholder="brand@example.com"
									value={formData.email}
									onChange={(e) =>
										setFormData({ ...formData, email: e.target.value })
									}
								/>
							</div>
						</div>
					)}

					{step === 2 && (
						<div className="space-y-5">
							<div>
								<TextLabel label="Brand Description" isRequired />
								<textarea
									className="w-full p-3 rounded-xl bg-surface border border-stroke focus:border-accent outline-none min-h-[100px] text-sm resize-none"
									placeholder="Tell us about your brand, your vibe, and what you're planning to drop..."
									value={formData.description}
									onChange={(e) =>
										setFormData({ ...formData, description: e.target.value })
									}
								/>
							</div>
							<div className="grid grid-cols-2 gap-4">
								<div>
									<TextLabel label="Instagram" />
									<Input
										placeholder="@brand"
										value={formData.socials.instagram}
										onChange={(e) =>
											setFormData({
												...formData,
												socials: {
													...formData.socials,
													instagram: e.target.value,
												},
											})
										}
									/>
								</div>
								<div>
									<TextLabel label="TikTok" />
									<Input
										placeholder="@brand"
										value={formData.socials.tiktok}
										onChange={(e) =>
											setFormData({
												...formData,
												socials: {
													...formData.socials,
													tiktok: e.target.value,
												},
											})
										}
									/>
								</div>
							</div>
						</div>
					)}

					{step === 3 && (
						<div className="space-y-6">
							<div className="flex p-1 bg-surface rounded-lg border border-stroke">
								<button
									onClick={() =>
										setFormData({
											...formData,
											visuals: { ...formData.visuals, type: "file" },
										})
									}
									className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${
										formData.visuals.type === "file"
											? "bg-bg shadow-sm text-text"
											: "text-text-muted hover:text-text"
									}`}
								>
									<ImageIcon className="w-4 h-4" /> Upload Images
								</button>
								<button
									onClick={() =>
										setFormData({
											...formData,
											visuals: { ...formData.visuals, type: "link" },
										})
									}
									className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${
										formData.visuals.type === "link"
											? "bg-bg shadow-sm text-text"
											: "text-text-muted hover:text-text"
									}`}
								>
									<LinkIcon className="w-4 h-4" /> Use Links
								</button>
							</div>

							{formData.visuals.type === "file" ? (
								<MultiImagePicker
									existingUrls={[]}
									files={formData.visuals.files}
									maxFiles={10}
									description="Upload images of the pieces/stock you intend to display at thefunKtion."
									onPick={(files) =>
										setFormData({
											...formData,
											visuals: { ...formData.visuals, files },
										})
									}
									onClearExisting={() => {}}
									onRemoveExisting={() => {}}
								/>
							) : (
								<div className="space-y-3">
									{formData.visuals.links.map((link, idx) => (
										<div key={idx} className="flex gap-2">
											<div className="flex-1 space-y-2">
												<Input
													placeholder="Link URL (e.g. Google Drive, Dropbox)"
													value={link.url}
													onChange={(e) => {
														const newLinks = [...formData.visuals.links];
														newLinks[idx].url = e.target.value;
														setFormData({
															...formData,
															visuals: { ...formData.visuals, links: newLinks },
														});
													}}
												/>
												<Input
													placeholder="Title (Optional)"
													value={link.title}
													onChange={(e) => {
														const newLinks = [...formData.visuals.links];
														newLinks[idx].title = e.target.value;
														setFormData({
															...formData,
															visuals: { ...formData.visuals, links: newLinks },
														});
													}}
												/>
											</div>
											{formData.visuals.links.length > 1 && (
												<button
													onClick={() => {
														const newLinks = formData.visuals.links.filter(
															(_, i) => i !== idx
														);
														setFormData({
															...formData,
															visuals: { ...formData.visuals, links: newLinks },
														});
													}}
													className="p-2 text-red-500 hover:bg-surface rounded-lg self-start"
												>
													<X className="w-4 h-4" />
												</button>
											)}
										</div>
									))}
									<button
										onClick={() =>
											setFormData({
												...formData,
												visuals: {
													...formData.visuals,
													links: [
														...formData.visuals.links,
														{ url: "", title: "" },
													],
												},
											})
										}
										className="text-sm text-accent font-medium hover:underline"
									>
										+ Add Another Link
									</button>
								</div>
							)}
						</div>
					)}

					{step === 4 && (
						<div className="text-center py-8 space-y-6">
							<div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
								<CheckCircle2 className="w-8 h-8" />
							</div>
							<div className="space-y-2">
								<h3 className="text-2xl font-heading font-semibold">
									You're on the list!
								</h3>
								<p className="text-text-muted max-w-xs mx-auto">
									We've received your registration. While you wait, why not set
									up your brand account?
								</p>
							</div>

							<div className="space-y-3 pt-4">
								<button
									onClick={() => {
										onClose();
										onLaunchBrand?.();
									}}
									className="w-full py-3 bg-cta text-white font-semibold rounded-xl hover:opacity-90 transition-opacity"
								>
									Launch My Brand Now
								</button>
								<button
									onClick={onClose}
									className="w-full py-3 text-text-muted hover:text-text font-medium"
								>
									Maybe Later
								</button>
							</div>
						</div>
					)}
				</div>

				{/* Footer Buttons */}
				{step < 4 && (
					<div className="p-6 border-t border-stroke bg-bg">
						<button
							onClick={handleNext}
							disabled={!canProceed || loading}
							className="w-full py-3 bg-cta text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
						>
							{loading && <Loader2 className="w-4 h-4 animate-spin" />}
							{step === 3 ? "Submit Application" : "Continue"}
						</button>
					</div>
				)}
			</div>
		</div>
	);
}
