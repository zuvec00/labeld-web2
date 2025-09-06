"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useCheckoutCart } from "@/hooks/useCheckoutCart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ContactPage() {
	const params = useParams();
	const router = useRouter();
	const eventId = params.eventId as string;
	const { contact, setContact } = useCheckoutCart();

	const [formData, setFormData] = useState({
		firstName: "",
		lastName: "",
		email: "",
		confirmEmail: "",
		phone: "",
	});
	const [loading, setLoading] = useState(false);
	const [errors, setErrors] = useState<Record<string, string>>({});

	// Countdown timer (mock - 10 minutes)
	const [timeLeft, setTimeLeft] = useState(10 * 60); // 10 minutes in seconds

	// Update countdown
	useState(() => {
		const timer = setInterval(() => {
			setTimeLeft((prev) => {
				if (prev <= 1) {
					clearInterval(timer);
					return 0;
				}
				return prev - 1;
			});
		}, 1000);

		return () => clearInterval(timer);
	});

	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins.toString().padStart(2, "0")}:${secs
			.toString()
			.padStart(2, "0")}`;
	};

	const handleInputChange = (field: string, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
		// Clear error when user starts typing
		if (errors[field]) {
			setErrors((prev) => ({ ...prev, [field]: "" }));
		}

		// Save to cart as user types for real-time validation
		const updatedContact = {
			firstName: formData.firstName,
			lastName: formData.lastName,
			email: formData.email,
			phone: formData.phone,
			// Update the current field
			[field]: value,
		};
		setContact(updatedContact);
	};

	const validateForm = () => {
		const newErrors: Record<string, string> = {};

		if (!formData.firstName.trim()) {
			newErrors.firstName = "First name is required";
		}

		if (!formData.lastName.trim()) {
			newErrors.lastName = "Last name is required";
		}

		if (!formData.email.trim()) {
			newErrors.email = "Email is required";
		} else if (!/\S+@\S+\.\S+/.test(formData.email)) {
			newErrors.email = "Please enter a valid email";
		}

		if (!formData.confirmEmail.trim()) {
			newErrors.confirmEmail = "Please confirm your email";
		} else if (formData.email !== formData.confirmEmail) {
			newErrors.confirmEmail = "Emails do not match";
		}

		if (!formData.phone.trim()) {
			newErrors.phone = "Phone number is required";
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = async () => {
		if (!validateForm()) return;

		setLoading(true);
		try {
			// TODO: Replace with actual API call
			await new Promise((resolve) => setTimeout(resolve, 1000));

			// Save contact info to cart
			setContact({
				firstName: formData.firstName,
				lastName: formData.lastName,
				email: formData.email,
				phone: formData.phone,
			});

			// TODO: Create pending order
			// const response = await fetch('/api/checkout/init', {
			//   method: 'POST',
			//   headers: { 'Content-Type': 'application/json' },
			//   body: JSON.stringify({ cart: cart, contact: formData })
			// });
			// const { orderId } = await response.json();

			// Navigate to payment
			router.push(`/buy/${eventId}/pay`);
		} catch (error) {
			console.error("Failed to submit contact info:", error);
			setErrors({ submit: "Failed to submit. Please try again." });
		} finally {
			setLoading(false);
		}
	};

	return (
		<div>
			{/* Header */}
			<div className="flex items-center gap-3 mb-6">
				<button
					type="button"
					className="text-text-muted hover:text-text transition-colors"
					onClick={() => router.back()}
					aria-label="Go back"
				>
					<ArrowLeft className="w-5 h-5" />
				</button>
				<h1 className="text-2xl font-heading font-bold">Contact Information</h1>
			</div>

			{/* Reservation Message */}
			<div className="bg-accent/10 border border-accent/20 rounded-lg p-4 mb-6">
				<p className="text-sm text-text">
					We&apos;ve reserved your ticket. Please complete checkout within{" "}
					<span className="font-semibold text-cta">{formatTime(timeLeft)}</span>{" "}
					to secure your tickets.
				</p>
			</div>

			{/* Contact Form */}
			<div className="bg-surface rounded-2xl border border-stroke p-6">
				<div className="space-y-4">
					{/* Name Fields */}
					<div className="grid grid-cols-2 gap-4">
						{/* First Name */}
						<div>
							<label className="block text-sm font-medium text-text mb-2">
								First name <span className="text-cta">*</span>
							</label>
							<Input
								type="text"
								placeholder="First name"
								value={formData.firstName}
								onChange={(e) => handleInputChange("firstName", e.target.value)}
								className={errors.firstName ? "border-red-500" : "bg-surface"}
							/>
							{errors.firstName && (
								<p className="text-red-500 text-xs mt-1">{errors.firstName}</p>
							)}
						</div>

						{/* Last Name */}
						<div>
							<label className="block text-sm font-medium text-text mb-2">
								Last name <span className="text-cta">*</span>
							</label>
							<Input
								type="text"
								placeholder="Last name"
								value={formData.lastName}
								onChange={(e) => handleInputChange("lastName", e.target.value)}
								className={errors.lastName ? "border-red-500" : "bg-surface"}
							/>
							{errors.lastName && (
								<p className="text-red-500 text-xs mt-1">{errors.lastName}</p>
							)}
						</div>
					</div>

					{/* Email */}
					<div>
						<label className="block text-sm font-medium text-text mb-2">
							Email address <span className="text-cta">*</span>
						</label>
						<Input
							type="email"
							placeholder="Email address"
							value={formData.email}
							onChange={(e) => handleInputChange("email", e.target.value)}
							className={errors.email ? "border-red-500" : "bg-surface"}
						/>
						{errors.email && (
							<p className="text-red-500 text-xs mt-1">{errors.email}</p>
						)}
					</div>

					{/* Confirm Email */}
					<div>
						<label className="block text-sm font-medium text-text mb-2">
							Confirm email address <span className="text-cta">*</span>
						</label>
						<Input
							type="email"
							placeholder="Confirm email address"
							value={formData.confirmEmail}
							onChange={(e) =>
								handleInputChange("confirmEmail", e.target.value)
							}
							className={errors.confirmEmail ? "border-red-500" : "bg-surface"}
						/>
						{errors.confirmEmail && (
							<p className="text-red-500 text-xs mt-1">{errors.confirmEmail}</p>
						)}
					</div>

					{/* Phone */}
					<div>
						<label className="block text-sm font-medium text-text mb-2">
							Phone number <span className="text-cta">*</span>
						</label>
						<div className="flex">
							<div className="flex-shrink-0">
								<select className="h-13 px-3 bg-surface border border-stroke border-r-0 rounded-l-lg text-sm text-text">
									<option value="+234">+234</option>
									{/* <option value="+1">+1</option>
									<option value="+44">+44</option> */}
								</select>
							</div>
							<Input
								type="tel"
								placeholder="Phone number"
								value={formData.phone}
								onChange={(e) => handleInputChange("phone", e.target.value)}
								className={`flex-1 rounded-l-none ${
									errors.phone ? "border-red-500" : "bg-surface"
								}`}
							/>
						</div>
						{errors.phone && (
							<p className="text-red-500 text-xs mt-1">{errors.phone}</p>
						)}
					</div>

					{/* Submit Error */}
					{errors.submit && (
						<p className="text-red-500 text-sm">{errors.submit}</p>
					)}
				</div>
			</div>
		</div>
	);
}
