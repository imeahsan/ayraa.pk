"use client";

import React, { useEffect, useState, useRef, useCallback } from 'react';
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
  const setCorners = useARStore((state) => state.setCorners);
  const resetSettings = useARStore((state) => state.resetSettings);
  const resetCorners = useARStore((state) => state.resetCorners);

  // Local UI states
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [error, setError] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [textureLoading, setTextureLoading] = useState(true);
  
  // Capture result states
  const [captureBlob, setCaptureBlob] = useState<Blob | null>(null);

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

  // Pre-populate default corners in the center of the viewport on load
  useEffect(() => {
    if (dimensions.width > 0 && dimensions.height > 0 && corners.length === 0) {
      const w = dimensions.width;
      const h = dimensions.height;
      setCorners([
        { label: 'topLeft', x: w * 0.2, y: h * 0.3 },
        { label: 'topRight', x: w * 0.8, y: h * 0.3 },
        { label: 'bottomRight', x: w * 0.8, y: h * 0.7 },
        { label: 'bottomLeft', x: w * 0.2, y: h * 0.7 }
      ]);
    }
  }, [dimensions, corners.length, setCorners]);

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
      className="ar-experience-container"
    >
      {/* 1. Header controls */}
      <header className="ar-header" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="ar-header-content">
          {/* Exit Button */}
          <button
            onClick={handleExit}
            className="ar-exit-btn"
          >
            ✕
          </button>

          {/* Center text — fixed, no layout shift */}
          <div className="ar-header-title-container">
            <span className="ar-header-subtitle">
              Ayra Live AR
            </span>
            <span className="ar-header-title">
              {productName}
            </span>
          </div>

          {/* Spacer to balance layout */}
          <div style={{ width: '40px', height: '40px' }} />
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

          {/* Settings and capturing UI */}
          {cameraStatus === 'ready' && (
            <ARControls
              onCapture={handleCapture}
              onSave={handleDownload}
              onShare={handleShare}
              onExit={handleExit}
              capturing={capturing}
              captured={!!captureBlob}
            />
          )}
        </>
      )}

    </div>
  );
}
