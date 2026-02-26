"use client";

import { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/firebaseConfig";
import { AnnouncementType } from "@/types/announcement";
import { Loader2 } from "lucide-react";

export default function SeedAnnouncementsPage() {
	const [title, setTitle] = useState("");
	const [content, setContent] = useState("");
	const [type, setType] = useState<AnnouncementType>("New");
	const [isActive, setIsActive] = useState(true);
	const [isLoading, setIsLoading] = useState(false);
	const [message, setMessage] = useState("");

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!title || !content) {
			setMessage("Please fill out all fields.");
			return;
		}

		setIsLoading(true);
		setMessage("");

		try {
			await addDoc(collection(db, "announcements"), {
				title,
				content,
				type,
				isActive,
				createdAt: serverTimestamp(),
			});

			setMessage("Announcement successfully added!");
			setTitle("");
			setContent("");
			// Keep type and isActive same for rapid entry
		} catch (error: any) {
			console.error("Error adding document: ", error);
			setMessage(`Error: ${error.message}`);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="max-w-2xl mx-auto py-12 px-6">
			<h1 className="text-2xl font-bold font-heading text-text mb-6">
				Seed Announcements
			</h1>
			<p className="text-text-muted mb-8 text-sm">
				This is a temporary development page to add announcements to the
				dashboard.
			</p>

			<form onSubmit={handleSubmit} className="space-y-6">
				<div className="space-y-2">
					<label className="text-sm font-medium text-text">Title</label>
					<input
						type="text"
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						className="w-full px-4 py-2 rounded-xl border border-stroke bg-surface text-text focus:outline-none focus:border-accent"
						placeholder="e.g. Introducing Pay with OPay"
					/>
				</div>

				<div className="space-y-2">
					<label className="text-sm font-medium text-text">Type</label>
					<select
						value={type}
						onChange={(e) => setType(e.target.value as AnnouncementType)}
						className="w-full px-4 py-2 rounded-xl border border-stroke bg-surface text-text focus:outline-none focus:border-accent"
					>
						<option value="New">New</option>
						<option value="Update">Update</option>
						<option value="Fix">Fix</option>
						<option value="Promo">Promo</option>
					</select>
				</div>

				<div className="space-y-2">
					<label className="text-sm font-medium text-text">Content</label>
					<textarea
						value={content}
						onChange={(e) => setContent(e.target.value)}
						className="w-full px-4 py-2 rounded-xl border border-stroke bg-surface text-text focus:outline-none focus:border-accent min-h-[120px]"
						placeholder="Write the announcement details here..."
					/>
				</div>

				<div className="flex items-center gap-2">
					<input
						type="checkbox"
						id="isActive"
						checked={isActive}
						onChange={(e) => setIsActive(e.target.checked)}
						className="h-4 w-4 rounded border-stroke text-accent focus:ring-accent"
					/>
					<label htmlFor="isActive" className="text-sm font-medium text-text">
						Is Active (visible to users)
					</label>
				</div>

				<button
					type="submit"
					disabled={isLoading}
					className="w-full flex justify-center py-2.5 px-4 rounded-xl bg-accent text-white font-medium hover:bg-accent/90 transition-colors disabled:opacity-50"
				>
					{isLoading ? (
						<Loader2 className="w-5 h-5 animate-spin" />
					) : (
						"Save Announcement"
					)}
				</button>

				{message && (
					<div
						className={`p-4 rounded-xl text-sm ${
							message.includes("Error")
								? "bg-red-500/10 text-red-500"
								: "bg-green-500/10 text-green-500"
						}`}
					>
						{message}
					</div>
				)}
			</form>
		</div>
	);
}
