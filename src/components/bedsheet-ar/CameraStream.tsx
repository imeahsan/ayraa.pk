"use client";

import { useEffect, useRef, useState } from 'react';
import { CameraStatus } from '@/lib/bedsheet-ar/types';

interface CameraStreamProps {
  onReady?: (video: HTMLVideoElement, stream: MediaStream) => void;
  onError?: (status: CameraStatus, error: Error) => void;
}

export function CameraStream({ onReady, onError }: CameraStreamProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;

    async function start() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error('Camera API not supported in this browser');
        }

        // Request camera with back-camera preference
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1920 }, // High res ideal
            height: { ideal: 1080 }
          },
          audio: false
        });

        if (cancelled) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        const video = videoRef.current;
        if (!video) return;

        video.srcObject = stream;
        video.muted = true;
        video.playsInline = true;
        await video.play();

        setStarted(true);
        onReady?.(video, stream);
      } catch (err: any) {
        console.error("Camera access failed:", err);
        let status: CameraStatus = 'error';
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          status = 'permission_denied';
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          status = 'not_supported';
        }
        onError?.(status, err instanceof Error ? err : new Error('Camera access failed'));
      }
    }

    start();

    return () => {
      cancelled = true;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [onReady, onError]);

  return (
    <video
      ref={videoRef}
      autoPlay
      muted
      playsInline
      className="absolute inset-0 h-full w-full object-cover z-0"
      style={{ pointerEvents: 'none' }}
    />
  );
}
