
"use client";

import { useAuth } from "@/lib/auth/AuthContext";
// optional spinner if you want a loading state
import { Spinner } from "@/components/ui/spinner";
import RadarTab from "@/components/brand/brandspace/Radar/RadarTab";

export default function RadarPage() {
	const { user, loading } = useAuth();

	if (loading) {
		return (
			<div className="min-h-dvh grid place-items-center">
				<Spinner size="lg" />
			</div>
		);
	}

	if (!user) return null; // or redirect to sign-in

	return <RadarTab brandId={user.uid} isBrand={true} />;
}
