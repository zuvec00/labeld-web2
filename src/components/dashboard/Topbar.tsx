"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/firebaseConfig";

export default function Topbar() {
	const { user } = useAuth();
	const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchUserProfile = async () => {
			if (!user) {
				setLoading(false);
				return;
			}

			try {
				const userDocRef = doc(db, "users", user.uid);
				const userDoc = await getDoc(userDocRef);

				if (userDoc.exists()) {
					const userData = userDoc.data();
					setProfileImageUrl(userData.profileImageUrl || null);
				}
			} catch (error) {
				console.error("Error fetching user profile:", error);
			} finally {
				setLoading(false);
			}
		};

		fetchUserProfile();
	}, [user]);
	return (
		<div className="h-16 sm:h-18 flex items-center gap-3 px-4 sm:px-6 lg:px-8">
			<div className="flex items-center gap-2">
				<div
					className="flex flex-col justify-center"
					style={{ height: "72px" }}
				>
					<div style={{ height: "5px" }}></div>
					<Image
						src="/1.svg"
						alt="Labeld"
						width={15}
						height={15}
						className="h-15 w-15"
					/>
				</div>
				<span className="font-heading font-semibold text-2xl text-cta">
					LABELD STUDIO
				</span>
			</div>
			<div className="flex-1"></div>
			{/* Search */}
			{/* <div className="flex-1">
				<div className="hidden md:flex items-center gap-2 rounded-xl bg-surface border border-stroke px-3 py-2">
					<span className="text-text-muted">🔎</span>
					<input
						placeholder="Search anything…"
						className="bg-transparent outline-none w-full placeholder:text-text-muted"
					/>
					<kbd className="hidden md:inline-block text-xs text-text-muted">
						/
					</kbd>
				</div>
			</div> */}

			{/* Right actions */}
			<div className="flex items-center gap-2">
				{/* <button className="rounded-xl border border-stroke px-3 py-2 hover:bg-surface">
					⚙️
				</button>
				<button className="rounded-xl border border-stroke px-3 py-2 hover:bg-surface">
					🔔
				</button> */}
				<div className="h-9 w-9 rounded-full overflow-hidden border border-stroke">
					{loading ? (
						<div className="h-full w-full bg-stroke animate-pulse" />
					) : profileImageUrl ? (
						<Image
							src={profileImageUrl}
							alt="Profile"
							width={36}
							height={36}
							className="object-cover h-full w-full"
							onError={() => setProfileImageUrl(null)}
						/>
					) : (
						<Image
							src="/images/profile-hero.JPG"
							alt="Profile"
							width={36}
							height={36}
							className="object-cover h-full w-full"
						/>
					)}
				</div>
			</div>
		</div>
	);
}
