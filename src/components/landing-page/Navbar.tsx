"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ButtonVite } from "../ui/buttonVite";

const Navbar = () => {
	const router = useRouter();

	return (
		<motion.nav
			initial={{ opacity: 0, y: -10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.6 }}
			className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-bg/80 backdrop-blur-xl"
		>
			<div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
				<a
					href="#"
					className="font-heading text-lg font-bold tracking-tight text-foreground"
				>
					LABELD
				</a>
				<div className="hidden items-center gap-8 md:flex">
					<a
						href="#audience"
						className="text-sm text-muted-foreground transition-colors hover:text-foreground"
					>
						Who It's For
					</a>
					<a
						href="#features"
						className="text-sm text-muted-foreground transition-colors hover:text-foreground"
					>
						Features
					</a>
					<a
						href="#pricing"
						className="text-sm text-muted-foreground transition-colors hover:text-foreground"
					>
						Pricing
					</a>
					<a
						href="#faq"
						className="text-sm text-muted-foreground transition-colors hover:text-foreground"
					>
						FAQ
					</a>
				</div>
				<ButtonVite
					size="sm"
					className="bg-cta text-text hover:bg-cta/90 font-heading text-xs tracking-wide"
					onClick={() => router.push("/login")}
				>
					Start Your Studio
				</ButtonVite>
			</div>
		</motion.nav>
	);
};

export default Navbar;
