import Link from "next/link";
import Button2 from "../ui/button";
import { useRouter, usePathname } from "next/navigation";

export default function EventsNavbar() {
	const router = useRouter();
	const pathname = usePathname();

	const isActive = (path: string) => {
		return pathname === path;
	};

	return (
		<header className="border-b border-stroke bg-bg backdrop-blur-sm sticky top-0 z-50">
			<div className="container mx-auto px-10 sm:px-10 lg:px-10 py-2">
				<div className="flex items-center justify-between h-16">
					{/* Logo */}
					<div className="flex items-center">
						{/* <img
								src="/labeld_logo.png"
								alt="Labeld Logo"
								className="h-10 w-10"
							/> */}
						<span className="ml-2 text-2xl font-bold font-heading text-cta">
							LABELD
						</span>
					</div>

					{/* Navigation */}
					<nav className="hidden md:flex items-center space-x-8 text-[16px]">
						<Link
							href="/e/discover"
							className={`transition-colors ${
								isActive("/e/discover")
									? "text-cta font-medium"
									: "text-secondary hover:text-accent"
							}`}
						>
							Discover
						</Link>
						<Link
							href="/e/all-events"
							className={`transition-colors ${
								isActive("/e/all-events")
									? "text-cta font-medium"
									: "text-secondary hover:text-accent"
							}`}
						>
							Events
						</Link>
						<Link
							href="/e/all-moments"
							className={`transition-colors ${
								isActive("/e/all-moments")
									? "text-cta font-medium"
									: "text-secondary hover:text-accent"
							}`}
						>
							Moments
						</Link>
						<Link
							href="/e/all-merch"
							className={`transition-colors ${
								isActive("/e/all-merch")
									? "text-cta font-medium"
									: "text-secondary hover:text-accent"
							}`}
						>
							Merch
						</Link>
					</nav>

					{/* Right side */}
					<div className="flex items-center space-x-4">
						{/* {user?.isAnonymous ? (
								<>
									<Button2
										text="Sign Up"
										variant="outline"
										onClick={() => router.push("/auth")}
									/>
									<Button2
										text="Create Event"
										variant="cta"
										onClick={() => router.push("/auth")}
									/>
								</>
							) : (
								<Button2
									text="Create Event"
									variant="cta"
									onClick={() => router.push("/events/create/details")}
								/>
							)} */}
						<Button2
							text="Drop Your Event"
							variant="cta"
							onClick={() => router.push("/events/create/details")}
						/>
					</div>
				</div>
			</div>
		</header>
	);
}
