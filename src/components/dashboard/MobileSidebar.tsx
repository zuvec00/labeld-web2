"use client";

import { useEffect } from "react";
import Sidebar from "./SideBar";
import { X } from "lucide-react";

interface MobileSidebarProps {
	open: boolean;
	setOpen: (open: boolean) => void;
}

export default function MobileSidebar({ open, setOpen }: MobileSidebarProps) {
	// Prevent body scroll when menu is open
	useEffect(() => {
		if (open) {
			document.body.style.overflow = "hidden";
		} else {
			document.body.style.overflow = "unset";
		}
		return () => {
			document.body.style.overflow = "unset";
		};
	}, [open]);

	return (
		<>
			{/* Backdrop */}
			<div
				className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
					open ? "opacity-100" : "opacity-0 pointer-events-none"
				}`}
				onClick={() => setOpen(false)}
			/>

			{/* Sidebar Panel */}
			<div
				className={`fixed top-0 left-0 bottom-0 z-50 w-[280px] bg-surface border-r border-stroke shadow-2xl transition-transform duration-300 ease-in-out lg:hidden ${
					open ? "translate-x-0" : "-translate-x-full"
				}`}
			>
				<div className="flex flex-col h-full bg-surface">
					{/* Mobile Close Button - Overlay or part of header? 
                        The Sidebar now has a header with Logo. 
                        We can place the Close button absolutely in the top right.
                    */}
					<button
						onClick={() => setOpen(false)}
						className="absolute top-4 right-4 z-50 p-2 text-text-muted hover:text-text rounded-lg hover:bg-stroke/50"
					>
						<X className="w-6 h-6" />
					</button>

					{/* Sidebar Content */}
					<div className="flex-1 overflow-hidden h-full">
						<Sidebar onItemClick={() => setOpen(false)} isMobile={true} />
					</div>
				</div>
			</div>
		</>
	);
}
