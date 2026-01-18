"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Construction } from "lucide-react";
import { useRouter } from "next/navigation";

export default function MaintenanceModal({
	isOpen,
	onClose,
}: {
	isOpen: boolean;
	onClose: () => void;
}) {
	const router = useRouter();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

	if (!isOpen || !mounted) return null; 

	return createPortal(
		<div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 ">
			{/* Backdrop */}
			<div
				className="absolute inset-0 bg-black/50 backdrop-blur-md"
				onClick={onClose}
			/>

			{/* Content */}
			<div className="relative bg-bg border border-stroke rounded-2xl w-full max-w-[90vw] sm:max-w-sm p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-200">
				{/* Close */}
				<button
					onClick={onClose}
					className="absolute top-4 right-4 p-2 text-text-muted hover:text-text"
				>
					<X className="w-5 h-5" />
				</button>

				<div className="text-center">
					<div className="w-16 h-16 bg-surface border border-stroke rounded-2xl flex items-center justify-center mx-auto mb-6 text-text-muted">
						<Construction className="w-8 h-8" />
					</div>

					<h3 className="font-heading font-semibold text-xl mb-2">
						Maintenance Mode
					</h3>
					<p className="text-text-muted text-sm leading-relaxed mb-6">
						Complete the onboarding steps to launch your website.
					</p>

					<button
						onClick={() => {
							onClose();
							router.push("/dashboard");
						}}
						className="w-full py-2.5 bg-cta text-white font-medium rounded-xl hover:opacity-90 transition-opacity"
					>
						Go to Dashboard
					</button>
				</div>
			</div>
		</div>,
        document.body
	);
}
