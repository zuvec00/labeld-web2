"use client";

import { useEffect, useState, useMemo } from "react";
import { InstagramService } from "@/lib/firebase/functions/instagram";
import { InstagramMedia, InstagramMediaType } from "@/lib/models/instagram";
import { Loader2, CheckCircle2, AlertCircle, Sparkles, RefreshCcw } from "lucide-react";
import Button from "@/components/ui/button";
import OptimizedImage from "@/components/ui/OptimizedImage";

interface InstagramMediaSelectionProps {
  onGenerate: (selected: InstagramMedia[]) => void;
}

export default function InstagramMediaSelection({
  onGenerate,
}: InstagramMediaSelectionProps) {
  const [media, setMedia] = useState<InstagramMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const fetchMedia = async () => {
    try {
      setLoading(true);
      const data = await InstagramService.getInstagramMedia(50);
      // Filter only image and carousel (AI extraction works better there)
      const filtered = data.filter(
        m => m.mediaType === InstagramMediaType.image || m.mediaType === InstagramMediaType.carousel_album
      );
      setMedia(filtered);
    } catch (err) {
      console.error("Error fetching media:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  const toggleSelection = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const selectedMedia = useMemo(() => {
    return media.filter(m => selectedIds.has(m.id));
  }, [media, selectedIds]);

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-cta" />
        <p className="text-text-muted animate-pulse">Fetching your latest posts...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-surface-neutral/10 overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-4">
          {media.map((item) => {
            const isSelected = selectedIds.has(item.id);
            const hasNoCaption = !item.caption || item.caption.trim().length === 0;

            return (
              <div 
                key={item.id}
                onClick={() => toggleSelection(item.id)}
                className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${
                  isSelected ? 'border-cta ring-2 ring-cta/20' : 'border-transparent hover:border-stroke'
                }`}
              >
                <OptimizedImage 
                  src={item.mediaUrl} 
                  alt={item.caption || "Instagram Post"} 
                  className={`w-full h-full object-cover transition-opacity ${isSelected ? 'opacity-80' : 'opacity-100'}`}
                  fill
                />
                
                {isSelected && (
                  <div className="absolute top-2 right-2 bg-cta text-bg rounded-full p-1 shadow-lg animate-in zoom-in duration-200 z-10">
                    <CheckCircle2 className="w-5 h-5 fill-cta text-bg" />
                  </div>
                )}

                {hasNoCaption && (
                  <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-alert/90 backdrop-blur px-2 py-1 rounded text-[10px] font-bold text-white uppercase tracking-wider z-10">
                    <AlertCircle className="w-3 h-3" />
                    No Caption
                  </div>
                )}

                {!isSelected && !hasNoCaption && (
                   <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                     <div className="bg-bg/90 backdrop-blur px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                       Click to Select
                     </div>
                   </div>
                )}
              </div>
            );
          })}
        </div>

        {media.length === 0 && (
          <div className="h-64 flex flex-col items-center justify-center text-center space-y-4">
            <p className="text-text-muted">No suitable posts found (Image/Carousel only).</p>
            <button 
              onClick={fetchMedia}
              className="flex items-center gap-2 text-sm font-medium text-cta"
            >
              <RefreshCcw className="w-4 h-4" />
              Retry Fetch
            </button>
          </div>
        )}
      </div>

      <div className="p-6 border-t border-stroke bg-bg flex items-center justify-between sticky bottom-0 z-20">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-text">
            {selectedIds.size} {selectedIds.size === 1 ? 'post' : 'posts'} selected
          </p>
          <p className="text-xs text-text-muted">
            AI works best with clear product captions
          </p>
        </div>

        <Button 
          variant="primary"
          className="h-12 px-8 font-bold !font-sans"
          text="Generate Products ✨"
          disabled={selectedIds.size === 0}
          onClick={() => onGenerate(selectedMedia)}
        />
      </div>
    </div>
  );
}
