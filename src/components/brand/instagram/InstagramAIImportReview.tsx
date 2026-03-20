"use client";

import { useState } from "react";
import { GeneratedProduct } from "@/lib/models/instagram";
import { Trash2, Edit2, CheckCircle2, Loader2, Save, X } from "lucide-react";
import Button from "@/components/ui/button";
import { addDropProductCF } from "@/lib/firebase/queries/product";
import { useToast } from "@/app/hooks/use-toast";
import OptimizedImage from "@/components/ui/OptimizedImage";

interface InstagramAIImportReviewProps {
	products: GeneratedProduct[];
	brandId: string;
	onComplete: () => void;
}

export default function InstagramAIImportReview({
	products: initialProducts,
	brandId,
	onComplete,
}: InstagramAIImportReviewProps) {
	const [products, setProducts] = useState<GeneratedProduct[]>(initialProducts);
	const [editingIndex, setEditingIndex] = useState<number | null>(null);
	const [isPublishing, setIsPublishing] = useState(false);
	const [publishProgress, setPublishProgress] = useState(0);
	const { toast } = useToast();

	const handleDelete = (index: number) => {
		setProducts((prev) => prev.filter((_, i) => i !== index));
	};

	const handleUpdate = (index: number, updated: GeneratedProduct) => {
		setProducts((prev) => prev.map((p, i) => (i === index ? updated : p)));
		setEditingIndex(null);
	};

	const handlePublishAll = async () => {
		setIsPublishing(true);
		let successCount = 0;

		try {
			for (let i = 0; i < products.length; i++) {
				const p = products[i];

				const productData = {
					dropName: p.name,
					description: p.description,
					price: p.price,
					mainVisualUrl: p.imageUrl,
					brandId: brandId,
					userId: brandId, // Usually same as brandId for flat structure
					isAvailableNow: true,
					launchDate: new Date().toISOString(),
					stockMode: "global",
					currency: "NGN", // Defaulting to NGN as per common app usage
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
				};

				try {
					await addDropProductCF(productData);
					successCount++;
				} catch (err) {
					console.error(`Failed to publish product ${p.name}:`, err);
				}

				setPublishProgress(Math.round(((i + 1) / products.length) * 100));
			}

			toast({
				title: "Import Complete",
				description: `Successfully imported ${successCount} products to your BrandSpace.`,
			});

			onComplete();
		} catch (err) {
			console.error("Error during publish all:", err);
			toast({
				variant: "destructive",
				title: "Import Failed",
				description: "An error occurred while publishing your products.",
			});
		} finally {
			setIsPublishing(false);
		}
	};

	if (isPublishing) {
		return (
			<div className="h-96 flex flex-col items-center justify-center space-y-6">
				<div className="relative w-24 h-24">
					<svg className="w-full h-full -rotate-90">
						<circle
							cx="48"
							cy="48"
							r="40"
							fill="transparent"
							stroke="currentColor"
							strokeWidth="8"
							className="text-stroke"
						/>
						<circle
							cx="48"
							cy="48"
							r="40"
							fill="transparent"
							stroke="currentColor"
							strokeWidth="8"
							strokeDasharray={2 * Math.PI * 40}
							strokeDashoffset={2 * Math.PI * 40 * (1 - publishProgress / 100)}
							className="text-cta transition-all duration-300"
						/>
					</svg>
					<div className="absolute inset-0 flex items-center justify-center font-bold text-lg">
						{publishProgress}%
					</div>
				</div>
				<div className="text-center space-y-1">
					<h4 className="text-xl font-bold">Publishing to BrandSpace</h4>
					<p className="text-text-muted text-sm">
						Please don't close this window...
					</p>
				</div>
			</div>
		);
	}

	if (products.length === 0) {
		return (
			<div className="h-96 flex flex-col items-center justify-center p-12 text-center space-y-4">
				<div className="w-16 h-16 rounded-full bg-surface border border-stroke flex items-center justify-center text-text-muted">
					<Trash2 className="w-8 h-8" />
				</div>
				<div className="space-y-1">
					<h4 className="text-lg font-bold">No products to review</h4>
					<p className="text-text-muted text-sm">
						Go back and select some posts to generate products.
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col h-full bg-surface-neutral/10 overflow-hidden">
			<div className="flex-1 overflow-y-auto p-6 space-y-4">
				{products.map((product, index) => (
					<div key={index}>
						{editingIndex === index ? (
							<EditCard
								product={product}
								onSave={(updated) => handleUpdate(index, updated)}
								onCancel={() => setEditingIndex(null)}
							/>
						) : (
							<ProductReviewCard
								product={product}
								onEdit={() => setEditingIndex(index)}
								onDelete={() => handleDelete(index)}
							/>
						)}
					</div>
				))}
			</div>

			<div className="p-6 border-t border-stroke bg-bg flex items-center justify-between sticky bottom-0 z-20">
				<div className="space-y-1">
					<p className="text-sm font-semibold text-text">
						{products.length} {products.length === 1 ? "Product" : "Products"}{" "}
						Ready
					</p>
					<p className="text-xs text-text-muted">
						All items will be saved to your BrandSpace
					</p>
				</div>

				<Button
					variant="primary"
					className="h-12 px-10 font-bold"
					text="Publish All"
					rightIcon={<CheckCircle2 className="w-4 h-4" />}
					onClick={handlePublishAll}
					disabled={products.length === 0}
				/>
			</div>
		</div>
	);
}

function ProductReviewCard({
	product,
	onEdit,
	onDelete,
}: {
	product: GeneratedProduct;
	onEdit: () => void;
	onDelete: () => void;
}) {
	return (
		<div className="bg-surface border border-stroke rounded-xl overflow-hidden flex gap-4 p-4 hover:shadow-md transition-shadow">
			<div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-surface-neutral relative">
				<OptimizedImage src={product.imageUrl || ""} fill alt={product.name} />
			</div>
			<div className="flex-1 min-w-0 space-y-1">
				<div className="flex items-start justify-between gap-2">
					<h4 className="font-bold text-sm truncate text-text">
						{product.name}
					</h4>
					<div className="text-sm font-bold text-cta">
						₦{product.price.toLocaleString()}
					</div>
				</div>
				<p className="text-xs text-text-muted line-clamp-2 leading-relaxed">
					{product.description}
				</p>
			</div>
			<div className="flex flex-col gap-2">
				<button
					onClick={onEdit}
					className="p-2 hover:bg-surface-neutral rounded-lg text-text-muted hover:text-edit transition-colors"
				>
					<Edit2 className="w-4 h-4" />
				</button>
				<button
					onClick={onDelete}
					className="p-2 hover:bg-surface-neutral rounded-lg text-text-muted hover:text-alert transition-colors"
				>
					<Trash2 className="w-4 h-4" />
				</button>
			</div>
		</div>
	);
}

function EditCard({
	product,
	onSave,
	onCancel,
}: {
	product: GeneratedProduct;
	onSave: (p: GeneratedProduct) => void;
	onCancel: () => void;
}) {
	const [formData, setFormData] = useState(product);

	return (
		<div className="bg-surface border-2 border-cta rounded-xl overflow-hidden p-6 space-y-4 animate-in zoom-in-95 duration-200 shadow-xl">
			<div className="grid grid-cols-[120px_1fr] gap-6">
				<div className="aspect-square rounded-lg overflow-hidden bg-surface-neutral relative">
					<OptimizedImage src={product.imageUrl || ""} fill alt="" />
				</div>
				<div className="space-y-4">
					<div className="space-y-2">
						<label className="text-[10px] font-bold uppercase text-text-muted">
							Product Name
						</label>
						<input
							className="w-full bg-surface-neutral/50 border border-stroke rounded-lg px-3 py-2 text-sm font-medium focus:ring-1 ring-cta outline-none text-text"
							value={formData.name}
							onChange={(e) =>
								setFormData({ ...formData, name: e.target.value })
							}
						/>
					</div>
					<div className="space-y-2">
						<label className="text-[10px] font-bold uppercase text-text-muted">
							Price (₦)
						</label>
						<input
							type="number"
							className="w-full bg-surface-neutral/50 border border-stroke rounded-lg px-3 py-2 text-sm font-bold text-cta focus:ring-1 ring-cta outline-none"
							value={formData.price}
							onChange={(e) =>
								setFormData({ ...formData, price: Number(e.target.value) })
							}
						/>
					</div>
				</div>
			</div>
			<div className="space-y-2">
				<label className="text-[10px] font-bold uppercase text-text-muted">
					Description
				</label>
				<textarea
					rows={3}
					className="w-full bg-surface-neutral/50 border border-stroke rounded-lg px-3 py-2 text-sm resize-none focus:ring-1 ring-cta outline-none text-text"
					value={formData.description}
					onChange={(e) =>
						setFormData({ ...formData, description: e.target.value })
					}
				/>
			</div>
			<div className="flex items-center justify-end gap-3 pt-2">
				<button
					onClick={onCancel}
					className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-text-muted hover:text-text"
				>
					<X className="w-4 h-4" />
					Cancel
				</button>
				<button
					onClick={() => onSave(formData)}
					className="flex items-center gap-1.5 px-5 py-2 bg-cta text-bg rounded-lg text-sm font-bold shadow-lg shadow-cta/20 hover:scale-105 transition-transform"
				>
					<Save className="w-4 h-4" />
					Keep Changes
				</button>
			</div>
		</div>
	);
}
