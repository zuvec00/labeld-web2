// app/(protected)/(dashboard)/bookings/availability/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { useBookingSettings } from "@/hooks/useBookingSettings";
import { OpeningHours, SlotInterval } from "@/lib/models/booking";
import OpeningHoursEditor from "@/components/bookings/OpeningHoursEditor";
import BookingRulesForm from "@/components/bookings/BookingRulesForm";
import Card from "@/components/dashboard/Card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Clock, Save } from "lucide-react";
import { useToast } from "@/app/hooks/use-toast";

export default function AvailabilityPage() {
	const { user } = useAuth();
	const { toast } = useToast();
	const { settings, loading, saving, updateSettings } = useBookingSettings(
		user?.uid || null,
		true,
	);

	const [acceptBookings, setAcceptBookings] = useState(true);
	const [openingHours, setOpeningHours] = useState<OpeningHours>({});
	const [slotIntervalMinutes, setSlotIntervalMinutes] =
		useState<SlotInterval>(60);
	const [maxBookingsPerSlot, setMaxBookingsPerSlot] = useState(5);
	const [maxPartySize, setMaxPartySize] = useState(12);
	const [minLeadTimeMinutes, setMinLeadTimeMinutes] = useState(120);
	const [maxAdvanceDays, setMaxAdvanceDays] = useState(90);

	// Load settings when they're available
	useEffect(() => {
		if (settings) {
			setAcceptBookings(settings.acceptBookings);
			setOpeningHours(settings.openingHours);
			setSlotIntervalMinutes(settings.slotIntervalMinutes);
			setMaxBookingsPerSlot(settings.maxBookingsPerSlot);
			setMaxPartySize(settings.maxPartySize);
			setMinLeadTimeMinutes(settings.minLeadTimeMinutes);
			setMaxAdvanceDays(settings.maxAdvanceDays);
		}
	}, [settings]);

	const handleSave = async () => {
		try {
			await updateSettings({
				acceptBookings,
				openingHours,
				slotIntervalMinutes,
				maxBookingsPerSlot,
				maxPartySize,
				minLeadTimeMinutes,
				maxAdvanceDays,
			});
			toast({
				title: "Availability settings saved successfully",
				duration: 3000,
			});
		} catch (error) {
			toast({
				title: "Failed to save settings",
				variant: "destructive",
			});
		}
	};

	const handleRuleChange = (field: string, value: number) => {
		switch (field) {
			case "slotIntervalMinutes":
				setSlotIntervalMinutes(value as SlotInterval);
				break;
			case "maxBookingsPerSlot":
				setMaxBookingsPerSlot(value);
				break;
			case "maxPartySize":
				setMaxPartySize(value);
				break;
			case "minLeadTimeMinutes":
				setMinLeadTimeMinutes(value);
				break;
			case "maxAdvanceDays":
				setMaxAdvanceDays(value);
				break;
		}
	};

	if (loading) {
		return (
			<div className="p-6 space-y-6">
				<div className="h-8 w-48 bg-stroke/50 rounded animate-pulse" />
				<div className="h-64 bg-stroke/50 rounded animate-pulse" />
			</div>
		);
	}

	return (
		<div className="p-6 space-y-6">
			{/* Page Header */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div>
					<div className="flex items-center gap-2 mb-1 sm:mb-2">
						<Clock className="w-6 h-6 text-primary" />
						<h1 className="text-xl sm:text-2xl font-heading font-semibold text-text">
							Availability
						</h1>
					</div>
					<p className="text-xs sm:text-sm text-text-muted">
						Configure when your venue accepts reservations
					</p>
				</div>
			</div>

			{/* Accept Bookings Toggle */}
			<Card>
				<div className="flex items-center justify-between">
					<div>
						<Label className="text-base font-semibold text-text">
							Accept Bookings
						</Label>
						<p className="text-sm text-text-muted mt-1">
							Enable or disable reservation requests from customers
						</p>
					</div>
					<Switch
						checked={acceptBookings}
						onCheckedChange={setAcceptBookings}
					/>
				</div>
			</Card>

			{/* Opening Hours */}
			<Card>
				<div className="space-y-4">
					<div>
						<h2 className="text-lg font-semibold text-text">Opening Hours</h2>
						<p className="text-sm text-text-muted">
							Set your weekly schedule for accepting reservations
						</p>
					</div>
					<OpeningHoursEditor hours={openingHours} onChange={setOpeningHours} />
				</div>
			</Card>

			{/* Booking Rules */}
			<Card>
				<div className="space-y-4">
					<div>
						<h2 className="text-lg font-semibold text-text">Booking Rules</h2>
						<p className="text-sm text-text-muted">
							Configure constraints for reservations
						</p>
					</div>
					<BookingRulesForm
						slotIntervalMinutes={slotIntervalMinutes}
						maxBookingsPerSlot={maxBookingsPerSlot}
						maxPartySize={maxPartySize}
						minLeadTimeMinutes={minLeadTimeMinutes}
						maxAdvanceDays={maxAdvanceDays}
						onChange={handleRuleChange}
					/>
				</div>
			</Card>

			{/* Save Button */}
			<div className="flex justify-end">
				<Button onClick={handleSave} disabled={saving} size="lg">
					<Save className="w-4 h-4 mr-2" />
					{saving ? "Saving..." : "Save Settings"}
				</Button>
			</div>
		</div>
	);
}
