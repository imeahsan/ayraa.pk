"use client";

import React, { useEffect, useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useARStore } from '@/lib/bedsheet-ar/store';
import { CameraStream } from './CameraStream';
import { CornerSelector } from './CornerSelector';
import { ThreeTextureOverlay } from './ThreeTextureOverlay';
import { ARControls } from './ARControls';
import { Button } from '@/components/storefront/Button/Button';
import { compositeARCapture, downloadBlob, shareARCapture } from '@/lib/bedsheet-ar/capture';

interface BedsheetARExperienceProps {
  productId: string;
  productName: string;
  productSlug: string;
}

export default function BedsheetARExperience({
  productId,
  productName,
  productSlug
}: BedsheetARExperienceProps) {
  const router = useRouter();
  
  // Store values
  const cameraStatus = useARStore((state) => state.cameraStatus);
  const textureUrl = useARStore((state) => state.textureUrl);
  const corners = useARStore((state) => state.corners);
  const settings = useARStore((state) => state.settings);
  
  const setCameraStatus = useARStore((state) => state.setCameraStatus);
  const setTextureUrl = useARStore((state) => state.setTextureUrl);
  const resetSettings = useARStore((state) => state.resetSettings);
  const resetCorners = useARStore((state) => state.resetCorners);

  // Local UI states
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [error, setError] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [textureLoading, setTextureLoading] = useState(true);
  
  // Capture result states
  const [captureBlob, setCaptureBlob] = useState<Blob | null>(null);
  const [captureImageUrl, setCaptureImageUrl] = useState<string | null>(null);
  const [showCaptureModal, setShowCaptureModal] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);

  // 1. Manage screen dimensions
  useEffect(() => {
    function updateDimensions() {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    }

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // 2. Fetch AR Texture details on mount — separate from cameraStatus
  useEffect(() => {
    // Check for secure context first (camera requires HTTPS or localhost)
    if (typeof window !== 'undefined' && !window.isSecureContext) {
      setError(
        'Camera requires HTTPS. Please access this page via https:// or localhost. '
        + 'If testing on mobile, use an HTTPS tunnel (e.g. ngrok) or connect over USB DevTools.'
      );
      setTextureLoading(false);
      return;
    }

    async function loadTexture() {
      try {
        const res = await fetch(`/api/bedsheet-ar/assets/${productId}`);
        
        if (!res.ok) {
          throw new Error('This product is not enabled for AR preview.');
        }

        const data = await res.json();
        
        setTextureUrl(data.textureUrl);
        resetSettings({
          opacity: data.settings.defaultOpacity,
          scale: data.settings.defaultScale,
          rotation: data.settings.defaultRotation,
          repeatMode: data.settings.repeatMode
        });
      } catch (err: any) {
        console.error("Failed to load AR asset:", err);
        setError(err.message || 'Error loading bedsheet preview data.');
      } finally {
        setTextureLoading(false);
      }
    }

    loadTexture();

    return () => {
      // Clear store state when user exits
      resetCorners();
      setCameraStatus('idle');
    };
  }, [productId, setTextureUrl, resetSettings, resetCorners, setCameraStatus]);

  // 3. Camera callbacks — memoized to avoid CameraStream restarting on each render
  const handleCameraReady = useCallback((video: HTMLVideoElement, stream: MediaStream) => {
    videoElementRef.current = video;
    setCameraStatus('ready');
  }, [setCameraStatus]);

  const handleCameraError = useCallback((status: any, err: Error) => {
    setCameraStatus(status);
    setError(err.message || 'Could not access the device camera.');
  }, [setCameraStatus]);

  // 4. Capture compositing handler
  const handleCapture = async () => {
    const video = videoElementRef.current;
    const threeCanvas = document.getElementById('three-ar-canvas') as HTMLCanvasElement | null;

    if (!video || !threeCanvas || dimensions.width === 0 || dimensions.height === 0) {
      alert('Overlay engine is not fully loaded yet. Align pins first.');
      return;
    }

    setCapturing(true);

    try {
      // Composite layers
      const blob = await compositeARCapture({
        video,
        threeCanvas,
        width: dimensions.width,
        height: dimensions.height
      });

      setCaptureBlob(blob);

      // Create local URL for display in modal
      const localUrl = URL.createObjectURL(blob);
      setCaptureImageUrl(localUrl);
      setShowCaptureModal(true);

      // Prepare form data for server upload
      const formData = new FormData();
      formData.append('file', blob, `ayra-ar-${productSlug}.webp`);
      formData.append('productId', productId);
      formData.append('cornerPoints', JSON.stringify(corners));
      formData.append('settings', JSON.stringify({
        ...settings,
        viewport: { width: dimensions.width, height: dimensions.height }
      }));

      // Upload to remote storage in background
      fetch('/api/bedsheet-ar/captures', {
        method: 'POST',
        body: formData
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            console.log('Capture uploaded successfully! ID:', data.captureId);
          }
        })
        .catch(err => console.error('Failed to upload capture in background:', err));

    } catch (err: any) {
      console.error('Composite failed:', err);
      alert('Failed to capture preview image: ' + err.message);
    } finally {
      setCapturing(false);
    }
  };

  const handleDownload = () => {
    if (captureBlob) {
      downloadBlob(captureBlob, `ayra-bedsheet-preview-${productSlug}.webp`);
    }
  };

  const handleShare = async () => {
    if (captureBlob) {
      const shared = await shareARCapture(captureBlob, `ayra-ar-${productSlug}.webp`, productName);
      if (!shared) {
        // Fallback info
        alert('Web Share is not supported on this browser. Use the Download option instead!');
      }
    }
  };

  const handleExit = () => {
    router.push(`/product/${productSlug}`);
  };

  // Render status components
  const renderLoading = () => (
    <div className="absolute inset-0 bg-[#121111] z-50 flex flex-col items-center justify-center gap-4 text-white p-6">
      <div className="w-10 h-10 border-4 border-white/10 border-t-amber-500 rounded-full animate-spin" />
      <p className="font-body text-xs font-semibold tracking-wider text-white/70 uppercase">
        Initializing Live AR Experience...
      </p>
    </div>
  );

  const renderHttpsError = () => (
    <div className="absolute inset-0 bg-[#121111] z-50 flex flex-col items-center justify-center gap-6 text-white p-8 text-center">
      <div className="text-5xl">🔒</div>
      <div className="flex flex-col gap-2">
        <h2 className="font-headline text-xl font-bold uppercase tracking-wider text-white">
          HTTPS Required
        </h2>
        <p className="font-body text-sm text-white/50 max-w-md">
          Camera access requires a secure (HTTPS) connection. Please open this link over HTTPS or on the same device as the server.
        </p>
      </div>
      <Button variant="luxury" size="sm" onClick={handleExit} style={{ minWidth: '160px' }}>
        Back to Product
      </Button>
    </div>
  );

  const renderError = () => (
    <div className="absolute inset-0 bg-[#121111] z-50 flex flex-col items-center justify-center gap-6 text-white p-8 text-center">
      <div className="text-4xl">⚠️</div>
      <div className="flex flex-col gap-2">
        <h2 className="font-headline text-xl font-bold uppercase tracking-wider text-white">
          Visualizer Unavailable
        </h2>
        <p className="font-body text-sm text-white/50 max-w-md">
          {error || 'An error occurred while loading the camera preview or assets.'}
        </p>
      </div>
      <Button variant="luxury" size="sm" onClick={handleExit} style={{ minWidth: '160px' }}>
        Back to Product
      </Button>
    </div>
  );

  const renderCameraPermissionDenied = () => (
    <div className="absolute inset-0 bg-[#121111] z-50 flex flex-col items-center justify-center gap-6 text-white p-8 text-center">
      <div className="text-5xl">📷</div>
      <div className="flex flex-col gap-2">
        <h2 className="font-headline text-xl font-bold uppercase tracking-wider text-white">
          Camera Access Required
        </h2>
        <p className="font-body text-sm text-white/50 max-w-md">
          Please allow camera access in your browser settings to project the bedsheet texture onto your mattress.
        </p>
      </div>
      <div className="flex gap-4 mt-2">
        <Button variant="outline" size="sm" onClick={handleExit} style={{ color: 'white', borderColor: 'rgba(255,255,255,0.15)' }}>
          Cancel
        </Button>
        <Button variant="luxury" size="sm" onClick={() => window.location.reload()}>
          Retry Access
        </Button>
      </div>
    </div>
  );

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 overflow-hidden bg-black z-50 flex flex-col select-none"
    >
      {/* 1. Header controls */}
      <header className="absolute top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/80 to-transparent pt-safe flex items-center text-white" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="flex items-center justify-between w-full px-4 py-3">
          {/* Exit Button */}
          <button
            onClick={handleExit}
            className="w-10 h-10 rounded-full bg-black/45 border border-white/10 flex items-center justify-center text-lg hover:bg-black/60 transition-colors flex-shrink-0"
            style={{ touchAction: 'manipulation' }}
          >
            ✕
          </button>

          {/* Center text — fixed, no layout shift */}
          <div className="text-center flex-1 mx-3 min-w-0">
            <span className="font-body text-[10px] font-bold tracking-[0.25em] text-amber-500 uppercase block">
              Ayra Live AR
            </span>
            <span className="font-headline text-sm font-semibold text-white/90 block mt-0.5 overflow-hidden text-ellipsis whitespace-nowrap">
              {productName}
            </span>
          </div>

          {/* Spacer to balance layout */}
          <div className="w-10 h-10 flex-shrink-0" />
        </div>
      </header>

      {/* 2. Interactive States overlay */}
      {textureLoading && renderLoading()}
      {!textureLoading && error && !error.includes('HTTPS') && renderError()}
      {!textureLoading && error && error.includes('HTTPS') && renderHttpsError()}
      {!textureLoading && !error && cameraStatus === 'permission_denied' && renderCameraPermissionDenied()}

      {/* 3. Live camera viewport */}
      {dimensions.width > 0 && dimensions.height > 0 && (
        <>
          <CameraStream
            onReady={handleCameraReady}
            onError={handleCameraError}
          />

          {cameraStatus === 'ready' && textureUrl && (
            <>
              {/* WebGL Three.js overlay canvas */}
              <ThreeTextureOverlay
                width={dimensions.width}
                height={dimensions.height}
              />

              {/* Tapping selection overlay */}
              <CornerSelector
                width={dimensions.width}
                height={dimensions.height}
              />
            </>
          )}

          {/* Settings and capturing UI — z-50 to sit above everything including CornerSelector */}
          {cameraStatus === 'ready' && (
            <ARControls
              onCapture={handleCapture}
              onExit={handleExit}
              capturing={capturing}
            />
          )}
        </>
      )}

      {/* 4. Captures Modal Popup */}
      {showCaptureModal && captureImageUrl && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-[#1c1b1b] border border-white/10 rounded-2xl w-full max-w-sm overflow-hidden flex flex-col shadow-2xl relative">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-white/5 flex justify-between items-center">
              <span className="font-headline text-sm font-bold text-white uppercase tracking-wider">
                Preview Captured
              </span>
              <button
                onClick={() => {
                  setShowCaptureModal(false);
                  if (captureImageUrl) URL.revokeObjectURL(captureImageUrl);
                  setCaptureImageUrl(null);
                  setCaptureBlob(null);
                }}
                className="text-white/60 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Captured Image Frame */}
            <div className="relative aspect-[3/4] bg-black w-full overflow-hidden">
              <Image
                src={captureImageUrl}
                alt="Captured Bed Sheet Preview"
                fill
                style={{ objectFit: 'contain' }}
              />
            </div>

            {/* Action Row */}
            <div className="p-4 flex gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                style={{ flex: 1, color: 'white', borderColor: 'rgba(255,255,255,0.15)' }}
              >
                Share
              </Button>
              <Button
                variant="luxury"
                size="sm"
                onClick={handleDownload}
                style={{ flex: 1, fontWeight: 'bold' }}
              >
                Download
              </Button>
            </div>
            
            <p className="font-body text-[10px] text-white/30 text-center pb-4 px-4">
              Image matches live preview cropping. Actual bedsheet may vary.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
