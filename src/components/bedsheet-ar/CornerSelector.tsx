"use client";

import React, { useRef, useState } from 'react';
import { CornerPoint, CornerLabel } from '@/lib/bedsheet-ar/types';
import { useARStore } from '@/lib/bedsheet-ar/store';

interface CornerSelectorProps {
  width: number;
  height: number;
}

export function CornerSelector({ width, height }: CornerSelectorProps) {
  const { corners, addCorner, updateCorner } = useARStore();
  const [activeDragLabel, setActiveDragLabel] = useState<CornerLabel | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const getGuideMessage = () => {
    switch (corners.length) {
      case 0:
        return "Tap the TOP-LEFT corner of your mattress";
      case 1:
        return "Tap the TOP-RIGHT corner of your mattress";
      case 2:
        return "Tap the BOTTOM-RIGHT corner of your mattress";
      case 3:
        return "Tap the BOTTOM-LEFT corner of your mattress";
      default:
        return "Drag the pins to refine the alignment";
    }
  };

  const handleContainerPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // If we already have 4 points, don't add more on click/tap
    if (corners.length >= 4) return;

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    addCorner({ x, y });
  };

  const handleMarkerPointerDown = (e: React.PointerEvent<HTMLDivElement>, label: CornerLabel) => {
    e.stopPropagation(); // Prevent container click
    e.currentTarget.setPointerCapture(e.pointerId);
    setActiveDragLabel(label);
  };

  const handleMarkerPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!activeDragLabel || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, width));
    const y = Math.max(0, Math.min(e.clientY - rect.top, height));

    updateCorner(activeDragLabel, x, y);
  };

  const handleMarkerPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!activeDragLabel) return;
    e.currentTarget.releasePointerCapture(e.pointerId);
    setActiveDragLabel(null);
  };

  const getMarkerColorClass = (label: CornerLabel) => {
    switch (label) {
      case 'topLeft': return 'bg-red-500';
      case 'topRight': return 'bg-blue-500';
      case 'bottomRight': return 'bg-green-500';
      case 'bottomLeft': return 'bg-yellow-500';
      default: return 'bg-white';
    }
  };

  const getMarkerLabelShort = (label: CornerLabel) => {
    switch (label) {
      case 'topLeft': return 'TL';
      case 'topRight': return 'TR';
      case 'bottomRight': return 'BR';
      case 'bottomLeft': return 'BL';
    }
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={handleContainerPointerDown}
      className="absolute inset-0 z-20 cursor-crosshair select-none"
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      {/* Top Banner Guide — positioned below the header bar, hide once all 4 pins placed */}
      {corners.length < 4 && (
        <div className="absolute left-1/2 -translate-x-1/2 px-6 py-3 bg-black/75 backdrop-blur-md border border-white/10 rounded-full shadow-2xl z-30 pointer-events-none transition-all duration-300" style={{ top: '80px' }}>
          <p className="font-body text-xs font-bold tracking-wider text-white text-center uppercase whitespace-nowrap">
            {getGuideMessage()}
          </p>
        </div>
      )}

      {/* Render selected corner pins */}
      {corners.map((corner) => {
        const isDragging = activeDragLabel === corner.label;
        return (
          <div
            key={corner.label}
            onPointerDown={(e) => handleMarkerPointerDown(e, corner.label)}
            onPointerMove={handleMarkerPointerMove}
            onPointerUp={handleMarkerPointerUp}
            className="absolute -translate-x-1/2 -translate-y-1/2 z-30 cursor-grab active:cursor-grabbing flex items-center justify-center"
            style={{
              left: `${corner.x}px`,
              top: `${corner.y}px`,
              width: '44px', // Large touch target
              height: '44px',
              touchAction: 'none'
            }}
          >
            {/* Outer pulse animation on select/drag */}
            <div
              className={`absolute inset-0 rounded-full transition-all duration-200 ${
                isDragging ? 'bg-amber-500/30 scale-125 border border-amber-500/50' : 'bg-transparent'
              }`}
            />
            
            {/* Visual Pin */}
            <div
              style={{
                backgroundColor: 'var(--color-gold)',
                color: '#1a1a1a',
                boxShadow: '0 0 12px rgba(220,180,92,0.8), inset 0 0 4px rgba(255,255,255,0.6)'
              }}
              className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border border-white/20 select-none pointer-events-none"
            >
              {getMarkerLabelShort(corner.label)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
