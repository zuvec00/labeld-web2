"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import {
	ShippingInfo,
	ShippingAddress,
	ShippingMethod,
} from "@/hooks/useCheckoutCart";

interface ShippingFormProps {
	shipping?: ShippingInfo;
	onShippingChange: (shipping: ShippingInfo) => void;
	errors?: Record<string, string>;
	contactData?: {
		firstName?: string;
		lastName?: string;
		phone?: string;
	};
}

export default function ShippingForm({
	shipping,
	onShippingChange,
	errors = {},
	contactData,
}: ShippingFormProps) {
	const [method, setMethod] = useState<ShippingMethod>(
		shipping?.method || "delivery"
	);
	const [address, setAddress] = useState<ShippingAddress>({
		name:
			shipping?.address?.name ||
			(contactData
				? `${contactData.firstName || ""} ${contactData.lastName || ""}`.trim()
				: ""),
		phone: shipping?.address?.phone || contactData?.phone || "",
		address: shipping?.address?.address || "",
		city: shipping?.address?.city || "",
		state: shipping?.address?.state || "",
		postalCode: shipping?.address?.postalCode || "",
	});

	// Use ref to track the last shipping info to prevent unnecessary updates
	const lastShippingRef = useRef<ShippingInfo | null>(null);
	const userEditedName = useRef(false);
	const userEditedPhone = useRef(false);

	// Update parent when shipping info changes
	useEffect(() => {
		const newShippingInfo: ShippingInfo = {
			method,
			address: method === "delivery" ? address : undefined,
		};

		// Only call onShippingChange if the shipping info has actually changed
		const lastShipping = lastShippingRef.current;
		if (
			!lastShipping ||
			lastShipping.method !== newShippingInfo.method ||
			JSON.stringify(lastShipping.address) !==
				JSON.stringify(newShippingInfo.address)
		) {
			lastShippingRef.current = newShippingInfo;
			onShippingChange(newShippingInfo);
		}
	}, [method, address, onShippingChange]);

	// Update name and phone from contact data when it changes (only if user hasn't edited them)
	useEffect(() => {
		console.log("ShippingForm: contactData changed", {
			contactData,
			userEditedName: userEditedName.current,
			currentName: address.name,
		});
		if (contactData && !userEditedName.current) {
			const fullName = `${contactData.firstName || ""} ${
				contactData.lastName || ""
			}`.trim();
			console.log("ShippingForm: Setting full name", {
				fullName,
				currentName: address.name,
			});
			if (fullName && fullName !== address.name) {
				setAddress((prev) => ({ ...prev, name: fullName }));
			}
		}
	}, [contactData, address.name]);

	useEffect(() => {
		console.log("ShippingForm: phone contactData changed", {
			phone: contactData?.phone,
			userEditedPhone: userEditedPhone.current,
			currentPhone: address.phone,
		});
		if (
			contactData?.phone &&
			!userEditedPhone.current &&
			contactData.phone !== address.phone
		) {
			console.log("ShippingForm: Setting phone", {
				newPhone: contactData.phone,
				currentPhone: address.phone,
			});
			setAddress((prev) => ({ ...prev, phone: contactData.phone || "" }));
		}
	}, [contactData?.phone, address.phone]);

	const handleAddressChange = (field: keyof ShippingAddress, value: string) => {
		// Track if user has manually edited name or phone
		if (field === "name") {
			userEditedName.current = true;
		} else if (field === "phone") {
			userEditedPhone.current = true;
		}

		// Debug logging
		console.log("Shipping form update:", {
			field,
			value,
			newAddress: { ...address, [field]: value },
		});

		setAddress((prev) => ({ ...prev, [field]: value }));
	};

	return (
		<div className="space-y-6">
			{/* Debug Info - Remove this in production */}
			{process.env.NODE_ENV === "development" && (
				<div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
					<p className="text-xs text-blue-600 font-mono">
						Debug Shipping: Method: {method} | Address:{" "}
						{JSON.stringify(address)} | ContactData:{" "}
						{JSON.stringify(contactData)}
					</p>
				</div>
			)}

			{/* Shipping Method */}
			<div>
				<h3 className="text-lg font-medium text-text mb-4">Shipping Method</h3>
				<div className="space-y-3">
					<label className="flex items-center space-x-3 cursor-pointer">
						<input
							type="radio"
							name="shippingMethod"
							value="delivery"
							checked={method === "delivery"}
							onChange={(e) => setMethod(e.target.value as ShippingMethod)}
							className="w-4 h-4 text-cta bg-surface border-stroke focus:ring-cta focus:ring-2"
						/>
						<div>
							<span className="text-text font-medium">Delivery</span>
							<p className="text-sm text-text-muted">Ship to your address</p>
						</div>
					</label>

					<label className="flex items-center space-x-3 cursor-pointer">
						<input
							type="radio"
							name="shippingMethod"
							value="pickup"
							checked={method === "pickup"}
							onChange={(e) => setMethod(e.target.value as ShippingMethod)}
							className="w-4 h-4 text-cta bg-surface border-stroke focus:ring-cta focus:ring-2"
						/>
						<div>
							<span className="text-text font-medium">Pickup</span>
							<p className="text-sm text-text-muted">Pick up at event venue</p>
						</div>
					</label>
				</div>
			</div>

			{/* Shipping Address - Only show for delivery */}
			{method === "delivery" && (
				<div>
					<h3 className="text-lg font-medium text-text mb-4">
						Shipping Address
					</h3>
					<div className="space-y-4">
						{/* Name and Phone Fields */}
						<div className="grid grid-cols-2 gap-4">
							<div>
								<label className="block text-sm font-medium text-text mb-2">
									Full Name <span className="text-cta">*</span>
								</label>
								<Input
									type="text"
									placeholder="Full name"
									value={address.name}
									onChange={(e) => handleAddressChange("name", e.target.value)}
									className={errors.name ? "border-red-500" : "bg-surface"}
								/>
								{errors.name && (
									<p className="text-red-500 text-xs mt-1">{errors.name}</p>
								)}
							</div>

							<div>
								<label className="block text-sm font-medium text-text mb-2">
									Phone Number <span className="text-cta">*</span>
								</label>
								<div className="flex">
									<div className="flex-shrink-0">
										<select className="h-13 px-3 bg-surface border border-stroke border-r-0 rounded-l-lg text-sm text-text">
											<option value="+234">+234</option>
										</select>
									</div>
									<Input
										type="tel"
										placeholder="Phone number"
										value={address.phone}
										onChange={(e) =>
											handleAddressChange("phone", e.target.value)
										}
										className={`flex-1 rounded-l-none ${
											errors.phone ? "border-red-500" : "bg-surface"
										}`}
									/>
								</div>
								{errors.phone && (
									<p className="text-red-500 text-xs mt-1">{errors.phone}</p>
								)}
							</div>
						</div>

						{/* Address */}
						<div>
							<label className="block text-sm font-medium text-text mb-2">
								Street Address <span className="text-cta">*</span>
							</label>
							<Input
								type="text"
								placeholder="Street address, building, apartment"
								value={address.address}
								onChange={(e) => handleAddressChange("address", e.target.value)}
								className={errors.address ? "border-red-500" : "bg-surface"}
							/>
							{errors.address && (
								<p className="text-red-500 text-xs mt-1">{errors.address}</p>
							)}
						</div>

						{/* City and State */}
						<div className="grid grid-cols-2 gap-4">
							<div>
								<label className="block text-sm font-medium text-text mb-2">
									City <span className="text-cta">*</span>
								</label>
								<Input
									type="text"
									placeholder="City"
									value={address.city}
									onChange={(e) => handleAddressChange("city", e.target.value)}
									className={errors.city ? "border-red-500" : "bg-surface"}
								/>
								{errors.city && (
									<p className="text-red-500 text-xs mt-1">{errors.city}</p>
								)}
							</div>

							<div>
								<label className="block text-sm font-medium text-text mb-2">
									State <span className="text-cta">*</span>
								</label>
								<select
									value={address.state}
									onChange={(e) => handleAddressChange("state", e.target.value)}
									className={`w-full h-13 px-3 bg-surface border border-stroke rounded-lg text-sm text-text ${
										errors.state ? "border-red-500" : ""
									}`}
								>
									<option value="">Select State</option>
									<option value="Abia">Abia</option>
									<option value="Adamawa">Adamawa</option>
									<option value="Akwa Ibom">Akwa Ibom</option>
									<option value="Anambra">Anambra</option>
									<option value="Bauchi">Bauchi</option>
									<option value="Bayelsa">Bayelsa</option>
									<option value="Benue">Benue</option>
									<option value="Borno">Borno</option>
									<option value="Cross River">Cross River</option>
									<option value="Delta">Delta</option>
									<option value="Ebonyi">Ebonyi</option>
									<option value="Edo">Edo</option>
									<option value="Ekiti">Ekiti</option>
									<option value="Enugu">Enugu</option>
									<option value="FCT">FCT</option>
									<option value="Gombe">Gombe</option>
									<option value="Imo">Imo</option>
									<option value="Jigawa">Jigawa</option>
									<option value="Kaduna">Kaduna</option>
									<option value="Kano">Kano</option>
									<option value="Katsina">Katsina</option>
									<option value="Kebbi">Kebbi</option>
									<option value="Kogi">Kogi</option>
									<option value="Kwara">Kwara</option>
									<option value="Lagos">Lagos</option>
									<option value="Nasarawa">Nasarawa</option>
									<option value="Niger">Niger</option>
									<option value="Ogun">Ogun</option>
									<option value="Ondo">Ondo</option>
									<option value="Osun">Osun</option>
									<option value="Oyo">Oyo</option>
									<option value="Plateau">Plateau</option>
									<option value="Rivers">Rivers</option>
									<option value="Sokoto">Sokoto</option>
									<option value="Taraba">Taraba</option>
									<option value="Yobe">Yobe</option>
									<option value="Zamfara">Zamfara</option>
								</select>
								{errors.state && (
									<p className="text-red-500 text-xs mt-1">{errors.state}</p>
								)}
							</div>
						</div>

						{/* Postal Code (Optional) */}
						<div>
							<label className="block text-sm font-medium text-text mb-2">
								Postal Code (Optional)
							</label>
							<Input
								type="text"
								placeholder="Postal code"
								value={address.postalCode}
								onChange={(e) =>
									handleAddressChange("postalCode", e.target.value)
								}
								className="bg-surface"
							/>
						</div>
					</div>
				</div>
			)}

			{/* Pickup Info */}
			{method === "pickup" && (
				<div className="bg-accent/10 border border-accent/20 rounded-lg p-4">
					<h4 className="font-medium text-text mb-2">Pickup Information</h4>
					<p className="text-sm text-text-muted">
						You can pick up your merchandise at the event venue. Details will be
						sent to your email after purchase.
					</p>
				</div>
			)}
		</div>
	);
}
