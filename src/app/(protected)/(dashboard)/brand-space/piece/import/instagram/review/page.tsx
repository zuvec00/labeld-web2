"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { Trash2, Edit2, CheckCircle2, ChevronLeft, Sparkles, Info } from "lucide-react";
import Button from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/app/hooks/use-toast";
import OptimizedImage from "@/components/ui/OptimizedImage";
import { useInstagramImportStore } from "@/lib/stores/instagram-import";
import { addDropProductCF } from "@/lib/firebase/queries/product";
import { uploadFileDirectCloudinary } from "@/lib/storage/cloudinary";
import { useUploadStore } from "@/lib/stores/upload";

export default function InstagramReviewPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { draftProducts, removeDraftProduct, clearDraftProducts } = useInstagramImportStore();
  const { addUpload, updateUpload, removeUpload } = useUploadStore();
  
  const [loading, setLoading] = useState(true);
  const [brandId, setBrandId] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishProgress, setPublishProgress] = useState(0);
  const [publishingStatus, setPublishingStatus] = useState("");

  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/");
        return;
      }
      setBrandId(user.uid);
      setLoading(false);
    });
    return () => unsub();
  }, [router]);

  const handlePublishAll = async () => {
    if (!brandId || draftProducts.length === 0) return;
    
    setIsPublishing(true);
    let successCount = 0;
    
    try {
      for (let i = 0; i < draftProducts.length; i++) {
        const p = draftProducts[i];
        setPublishingStatus(`Processing ${p.dropName}...`);
        
        let finalImageUrl = p.mainVisualUrl;
        let finalGalleryUrls = p.galleryImages || [];
        let finalSizeGuideUrl = p.sizeGuideUrl || null;

        const pMod = p as any; 

        // 1. Upload Main Image if needed
        if (pMod.localFile && (!p.mainVisualUrl || p.mainVisualUrl.startsWith('blob:'))) {
          setPublishingStatus(`Uploading main image for ${p.dropName}...`);
          const uploadId = addUpload({ type: "image", fileName: pMod.localFile.name, progress: 0, status: "uploading" });
          try {
            finalImageUrl = await uploadFileDirectCloudinary(pMod.localFile, { folder: `productImages/${brandId}`, tags: ["product", "instagram-import", brandId], resourceType: "image" }, (progress) => { updateUpload(uploadId, { progress: Math.round(progress) }); });
            updateUpload(uploadId, { status: "completed", progress: 100 });
            setTimeout(() => removeUpload(uploadId), 2000);
          } catch (err) {
            console.error(`Failed to upload main image:`, err);
            updateUpload(uploadId, { status: "error", error: "Upload failed" });
          }
        }

        // 2. Upload Gallery Images if needed
        if (pMod.galleryFiles && Array.isArray(pMod.galleryFiles)) {
            const uploadedGallery: string[] = [];
            for (let j = 0; j < pMod.galleryFiles.length; j++) {
                const file = pMod.galleryFiles[j];
                const existingUrl = p.galleryImages?.[j];
                
                if (file && (!existingUrl || existingUrl.startsWith('blob:'))) {
                   setPublishingStatus(`Uploading gallery ${j+1} for ${p.dropName}...`);
                   const uploadId = addUpload({ type: "image", fileName: file.name, progress: 0, status: "uploading" });
                   try {
                     const url = await uploadFileDirectCloudinary(file, { folder: `productImages/${brandId}`, tags: ["product", "gallery", brandId], resourceType: "image" }, (progress) => { updateUpload(uploadId, { progress: Math.round(progress) }); });
                     uploadedGallery.push(url);
                     updateUpload(uploadId, { status: "completed", progress: 100 });
                     setTimeout(() => removeUpload(uploadId), 2000);
                   } catch (err) {
                     console.error(`Failed to upload gallery image ${j}:`, err);
                     updateUpload(uploadId, { status: "error", error: "Upload failed" });
                     if (existingUrl) uploadedGallery.push(existingUrl);
                   }
                } else if (existingUrl) {
                    uploadedGallery.push(existingUrl);
                }
            }
            finalGalleryUrls = uploadedGallery;
        }

        // 3. Upload Size Guide if needed
        if (pMod.sizeGuideFile && (!p.sizeGuideUrl || p.sizeGuideUrl.startsWith('blob:'))) {
            setPublishingStatus(`Uploading size guide for ${p.dropName}...`);
            const uploadId = addUpload({ type: "image", fileName: pMod.sizeGuideFile.name, progress: 0, status: "uploading" });
            try {
              finalSizeGuideUrl = await uploadFileDirectCloudinary(pMod.sizeGuideFile, { folder: `productImages/${brandId}`, tags: ["product", "size-guide", brandId], resourceType: "image" }, (progress) => { updateUpload(uploadId, { progress: Math.round(progress) }); });
              updateUpload(uploadId, { status: "completed", progress: 100 });
              setTimeout(() => removeUpload(uploadId), 2000);
            } catch (err) {
              console.error(`Failed to upload size guide:`, err);
              updateUpload(uploadId, { status: "error", error: "Upload failed" });
            }
        }

        // 4. Create product in Firestore
        const productData = {
          ...p,
          mainVisualUrl: finalImageUrl,
          galleryImages: finalGalleryUrls.length ? finalGalleryUrls : null,
          sizeGuideUrl: finalSizeGuideUrl,
          brandId: brandId,
          userId: brandId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isActive: true,
        };

        // Clean up internal fields
        delete (productData as any).localFile;
        delete (productData as any).galleryFiles;
        delete (productData as any).sizeGuideFile;

        try {
          await addDropProductCF(productData);
          successCount++;
        } catch (err) {
          console.error(`Failed to publish product ${p.dropName}:`, err);
        }
        
        setPublishProgress(Math.round(((i + 1) / draftProducts.length) * 100));
      }

      toast({
        title: "Import Complete",
        description: `Successfully imported ${successCount} products to your BrandSpace.`,
      });
      
      clearDraftProducts();
      router.push("/brand-space");
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isPublishing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-12 space-y-8 bg-surface-neutral/5">
        <div className="relative w-40 h-40">
          <svg className="w-full h-full -rotate-90">
            <circle
              cx="80"
              cy="80"
              r="70"
              fill="transparent"
              stroke="currentColor"
              strokeWidth="10"
              className="text-stroke/30"
            />
            <circle
              cx="80"
              cy="80"
              r="70"
              fill="transparent"
              stroke="currentColor"
              strokeWidth="10"
              strokeDasharray={2 * Math.PI * 70}
              strokeDashoffset={2 * Math.PI * 70 * (1 - publishProgress / 100)}
              className="text-cta transition-all duration-500 stroke-round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-black text-text">{publishProgress}%</span>
          </div>
        </div>
        <div className="text-center space-y-2">
          <h4 className="text-2xl font-bold text-text">{publishingStatus}</h4>
          <p className="text-text-muted italic">Almost there...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-bg/80 backdrop-blur-md border-b border-stroke/50 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 sm:gap-6 min-w-0">
          <button 
            onClick={() => router.back()}
            className="p-2 hover:bg-surface-neutral rounded-lg transition-colors text-text-muted flex-shrink-0"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-semibold tracking-tight truncate">Review Import</h1>
            <p className="text-[10px] sm:text-[11px] text-text-muted font-medium uppercase tracking-wider">{draftProducts.length} draft{draftProducts.length === 1 ? '' : 's'}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <button 
            onClick={() => {
              if (confirm("Are you sure you want to discard all generated products?")) {
                clearDraftProducts();
                router.push("/brand-space");
              }
            }}
            className="hidden sm:block px-4 py-2 text-sm font-medium text-text-muted hover:text-alert transition-colors"
          >
            Discard All
          </button>
          <Button 
            text="Publish All" 
            variant="primary" 
            className="px-4 sm:px-6 h-9 sm:h-10 text-xs sm:text-sm font-semibold rounded-lg sm:rounded-xl"
            rightIcon={<CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-1" />}
            onClick={handlePublishAll}
            disabled={draftProducts.length === 0}
          />
        </div>
      </div>

      <div className="flex-1 max-w-4xl mx-auto w-full p-4 sm:p-6 space-y-4">
        {draftProducts.length === 0 ? (
          <div className="h-[60vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-surface-neutral flex items-center justify-center text-text-muted">
              <Trash2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold">No products to review</h3>
              <p className="text-sm text-text-muted">Drafts were cleared or generation failed.</p>
            </div>
            <Button text="Go Back" variant="outline" onClick={() => router.push("/brand-space")} className="w-full sm:w-auto" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 pb-24">
            {draftProducts.map((product, index) => (
              <ReviewCard 
                key={product.id}
                product={product}
                index={index}
                onDelete={() => removeDraftProduct(index)}
                onEdit={() => router.push(`/brand-space/piece/import/instagram/edit/${index}`)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Floating Info - Mobile Optimized */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[90%] sm:w-auto">
         <div className="bg-bg/95 border border-stroke shadow-xl rounded-full px-5 py-2.5 flex items-center justify-center sm:justify-start gap-2.5 backdrop-blur-sm animate-in slide-in-from-bottom-6 duration-500">
            <Info className="w-3.5 h-3.5 text-cta flex-shrink-0" />
            <span className="text-[10px] sm:text-[11px] font-medium text-text-muted whitespace-nowrap">Local drafts: Publish to save to BrandSpace</span>
         </div>
      </div>
    </div>
  );
}

function ReviewCard({ product, index, onDelete, onEdit }: { 
  product: any; 
  index: number;
  onDelete: () => void;
  onEdit: () => void;
}) {
  return (
    <div className="bg-surface border border-stroke/60 rounded-xl sm:rounded-2xl p-3 sm:p-4 flex gap-3 sm:gap-5 group hover:border-cta/20 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: `${index * 80}ms` }}>
      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg sm:rounded-xl overflow-hidden bg-bg relative border border-stroke/30 flex-shrink-0">
        <OptimizedImage 
          src={product.mainVisualUrl || ""} 
          fill 
          alt={product.dropName} 
          className="group-hover:scale-105 transition-transform duration-500"
        />
      </div>
      
      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
        <div className="min-w-0">
          <div className="flex items-start justify-between gap-2 mb-0.5">
            <h3 className="font-semibold text-sm sm:text-lg tracking-tight truncate text-text">{product.dropName}</h3>
            <div className="text-sm sm:text-base font-bold text-cta whitespace-nowrap">
              {product.currency?.symbol || ""} {product.price?.toLocaleString()}
            </div>
          </div>
          <p className="text-[11px] sm:text-xs text-text-muted line-clamp-1 sm:line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 mt-2 sm:mt-0">
          <div className="px-2 py-0.5 bg-surface-neutral/60 rounded-md text-[9px] sm:text-[10px] font-medium text-text-muted whitespace-nowrap">
             {product.stockMode === 'variants' ? 'Variant stock' : (product.stockRemaining === null ? 'Unlimited' : `${product.stockRemaining} in stock`)}
          </div>
          {product.sizeOptions?.length > 0 && (
            <div className="px-2 py-0.5 bg-surface-neutral/60 rounded-md text-[9px] sm:text-[10px] font-medium text-text-muted whitespace-nowrap">
              {product.sizeOptions.length} size{product.sizeOptions.length === 1 ? '' : 's'}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-1.5 self-center">
        <button 
          onClick={onEdit}
          className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg sm:rounded-xl text-text-muted hover:text-cta hover:bg-cta/5 transition-all"
          title="Edit Details"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button 
          onClick={onDelete}
          className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg sm:rounded-xl text-text-muted hover:text-alert hover:bg-alert/5 transition-all"
          title="Remove"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
