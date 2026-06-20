"use client";

import React from 'react';
import { useARStore } from '@/lib/bedsheet-ar/store';
import { Button } from '@/components/storefront/Button/Button';

interface ARControlsProps {
  onCapture: () => void;
  onExit: () => void;
  capturing: boolean;
}

export function ARControls({ onCapture, onExit, capturing }: ARControlsProps) {
  const { corners, settings, updateSettings, resetCorners, undoLastCorner } = useARStore();
  const isReady = corners.length === 4;

  // Convert rotation from radians to degrees for user UI
  const rotationDeg = Math.round(settings.rotation * (180 / Math.PI));

  const handleRotationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const deg = parseFloat(e.target.value);
    const rad = (deg * Math.PI) / 180;
    updateSettings({ rotation: rad });
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 z-30 bg-black/80 backdrop-blur-xl border-t border-white/10 p-5 pb-8 flex flex-col gap-4 text-white">
      {/* 1. Placement Guide Mode (if less than 4 corners selected) */}
      {!isReady ? (
        <div className="flex flex-col items-center gap-3 py-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            <span className="font-body text-xs font-bold tracking-widest uppercase text-white/80">
              Guided Bed Mapping
            </span>
          </div>
          
          <div className="flex items-center gap-1.5 justify-center mt-1">
            {[0, 1, 2, 3].map((idx) => (
              <div
                key={idx}
                className={`w-10 h-1.5 rounded-full transition-all duration-300 ${
                  idx < corners.length
                    ? 'bg-amber-500'
                    : 'bg-white/10'
                }`}
              />
            ))}
          </div>

          <p className="font-body text-[11px] text-white/50 text-center mt-1">
            {corners.length === 0
              ? 'Find a clear view of your bed without pillows/blankets'
              : `Point ${corners.length + 1} of 4: Align with the corners of your mattress`}
          </p>

          <div className="flex gap-4 w-full mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onExit}
              style={{ flex: 1, borderColor: 'rgba(255,255,255,0.15)', color: 'white' }}
            >
              Exit
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={corners.length === 0}
              onClick={undoLastCorner}
              style={{
                flex: 1,
                borderColor: 'rgba(255,255,255,0.15)',
                color: corners.length === 0 ? 'rgba(255,255,255,0.2)' : 'white'
              }}
            >
              Undo Point
            </Button>
          </div>
        </div>
      ) : (
        /* 2. Adjustment Mode (if 4 corners selected) */
        <div className="flex flex-col gap-4">
          {/* Sliders Grid */}
          <div className="flex flex-col gap-3">
            {/* Opacity */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-white/60">
                <span>Opacity</span>
                <span className="text-amber-500 font-body">{Math.round(settings.opacity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.10"
                max="1.00"
                step="0.05"
                value={settings.opacity}
                onChange={(e) => updateSettings({ opacity: parseFloat(e.target.value) })}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                style={{ accentColor: 'var(--color-gold)' }}
              />
            </div>

            {/* Pattern Scale */}
            <div className="flex flex-col gap-1 mt-1">
              <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-white/60">
                <span>Pattern Scale</span>
                <span className="text-amber-500 font-body">{settings.scale.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.4"
                max="2.5"
                step="0.05"
                value={settings.scale}
                onChange={(e) => updateSettings({ scale: parseFloat(e.target.value) })}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                style={{ accentColor: 'var(--color-gold)' }}
              />
            </div>

            {/* Rotation */}
            <div className="flex flex-col gap-1 mt-1">
              <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-white/60">
                <span>Pattern Rotation</span>
                <span className="text-amber-500 font-body">{rotationDeg}°</span>
              </div>
              <input
                type="range"
                min="-180"
                max="180"
                step="5"
                value={rotationDeg}
                onChange={handleRotationChange}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                style={{ accentColor: 'var(--color-gold)' }}
              />
            </div>
          </div>

          {/* Action Row */}
          <div className="flex gap-3 w-full mt-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={undoLastCorner}
              style={{
                flex: 1.2,
                borderColor: 'rgba(255,255,255,0.15)',
                color: 'white',
                fontSize: '11px',
                paddingBlock: '10px'
              }}
            >
              Adjust Pin
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={resetCorners}
              style={{
                flex: 1.2,
                borderColor: 'rgba(255,255,255,0.15)',
                color: 'white',
                fontSize: '11px',
                paddingBlock: '10px'
              }}
            >
              Reset Bed
            </Button>
            <Button
              variant="luxury"
              size="sm"
              onClick={onCapture}
              disabled={capturing}
              style={{
                flex: 2,
                fontSize: '11px',
                paddingBlock: '10px',
                fontWeight: 'bold'
              }}
            >
              {capturing ? 'Capturing...' : '📷 Save Preview'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
