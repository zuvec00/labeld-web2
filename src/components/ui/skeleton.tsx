import { cn } from "@/lib/utils";

function Skeleton({
	className,
	...props
}: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={cn("animate-pulse rounded-md bg-stroke/50", className)}
			{...props}
		/>
	);
}

/** Grid of square tiles, e.g. recent posts. */
function SkeletonGrid({
	count = 6,
	className,
}: {
	count?: number;
	className?: string;
}) {
	return (
		<div
			className={cn("grid grid-cols-2 sm:grid-cols-3 gap-3", className)}
			aria-hidden="true"
		>
			{Array.from({ length: count }).map((_, i) => (
				<Skeleton key={i} className="aspect-square rounded-xl" />
			))}
		</div>
	);
}

/** Stack of list rows with a thumbnail, e.g. recent products. */
function SkeletonRows({
	count = 4,
	className,
}: {
	count?: number;
	className?: string;
}) {
	return (
		<div className={cn("space-y-3", className)} aria-hidden="true">
			{Array.from({ length: count }).map((_, i) => (
				<div
					key={i}
					className="flex items-center gap-3 p-3 rounded-xl border border-stroke bg-surface"
				>
					<Skeleton className="w-14 h-14 rounded-lg flex-shrink-0" />
					<div className="flex-1 space-y-2">
						<Skeleton className="h-3 w-3/4" />
						<Skeleton className="h-3 w-1/4" />
					</div>
				</div>
			))}
		</div>
	);
}

export { Skeleton, SkeletonGrid, SkeletonRows };
