import React from 'react';

// Minimal root-level loading state — only shown during initial server-side navigation.
// Keep this lightweight; heavy loaders (e.g., AR) belong inside their own route segment.
export default function Loading() {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '3px',
        zIndex: 9999,
        background: 'linear-gradient(90deg, #e9c349 0%, #ffe088 50%, #e9c349 100%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.2s ease-in-out infinite',
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      ` }} />
    </div>
  );
}
