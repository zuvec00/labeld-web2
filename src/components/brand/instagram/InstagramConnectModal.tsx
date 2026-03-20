"use client";

import { useEffect, useState } from "react";
import { X, Instagram, CheckCircle2, Loader2, ArrowRight, ExternalLink } from "lucide-react";
import Button from "@/components/ui/button";
import { useInstagram } from "@/hooks/useInstagram";

interface InstagramConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function InstagramConnectModal({
  isOpen,
  onClose,
  onSuccess,
}: InstagramConnectModalProps) {
  const { connection, loading, error, connect, refresh } = useInstagram();
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    if (connection?.isConnected && isConnecting) {
      // Success!
      setIsConnecting(false);
      setTimeout(() => {
        onSuccess?.();
      }, 1500);
    }
  }, [connection?.isConnected, isConnecting, onSuccess]);

  if (!isOpen) return null;

  const handleConnect = async () => {
    setIsConnecting(true);
    await connect();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface border border-stroke rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-stroke">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 flex items-center justify-center text-white">
              <Instagram className="w-5 h-5" />
            </div>
            <h3 className="font-heading font-semibold text-lg">Connect Instagram</h3>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 text-center space-y-6">
          {connection?.isConnected ? (
            <div className="space-y-4 animate-in zoom-in-90 duration-500">
              <div className="mx-auto w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xl font-bold">Successfully Connected!</h4>
                <p className="text-text-muted text-sm">
                  Linked to <span className="text-text font-medium">@{connection.username}</span>
                </p>
              </div>
              <p className="text-xs text-text-muted animate-pulse">
                Taking you to the import screen...
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                <h4 className="text-xl font-bold">Import from Instagram</h4>
                <p className="text-text-muted text-sm leading-relaxed px-4">
                  Turn your posts into products in seconds. Connect your account to select media and let AI generate the details for you.
                </p>
              </div>

              <div className="py-4 space-y-4">
                <div className="flex items-center justify-center gap-4 text-text-muted">
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-10 h-10 rounded-full bg-surface border border-stroke flex items-center justify-center">
                      <Instagram className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-medium uppercase">Step 1</span>
                  </div>
                  <ArrowRight className="w-4 h-4 opacity-30" />
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-10 h-10 rounded-full bg-surface border border-stroke flex items-center justify-center">
                      <Loader2 className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-medium uppercase">Step 2</span>
                  </div>
                  <ArrowRight className="w-4 h-4 opacity-30" />
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-10 h-10 rounded-full bg-surface border border-stroke flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-medium uppercase">Step 3</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <Button
                  variant="primary"
                  className="w-full h-12 text-base font-semibold"
                  text={isConnecting ? "Waiting for authorization..." : "Continue with Instagram"}
                  rightIcon={isConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
                  onClick={handleConnect}
                  disabled={isConnecting}
                />
                
                {isConnecting && (
                  <button 
                    onClick={() => refresh()}
                    className="text-xs text-text-muted hover:text-text underline underline-offset-4"
                  >
                    Already authorized? Click here to refresh status
                  </button>
                )}

                {error && (
                  <p className="text-xs text-alert font-medium">{error}</p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-4 bg-surface-neutral/30 border-t border-stroke text-[10px] text-text-muted text-center uppercase tracking-wider font-medium">
          Secure authentication via Instagram API
        </div>
      </div>
    </div>
  );
}
