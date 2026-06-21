"use client";

import React, { useState } from 'react';
import { useARStore } from '@/lib/bedsheet-ar/store';

interface ARControlsProps {
  onCapture: () => void;
  onSave: () => void;
  onShare: () => void;
  onExit: () => void;
  capturing: boolean;
  captured: boolean;
}

export function ARControls({ onCapture, onSave, onShare, onExit, capturing, captured }: ARControlsProps) {
  const { corners, settings, updateSettings, resetCorners, undoLastCorner } = useARStore();
  const isReady = corners.length === 4;
  const [showSettings, setShowSettings] = useState(false);

  const rotationDeg = Math.round(settings.rotation * (180 / Math.PI));

  const handleRotationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const deg = parseFloat(e.target.value);
    const rad = (deg * Math.PI) / 180;
    updateSettings({ rotation: rad });
  };

  return (
    <div className="ar-controls-panel" style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
      <div className="ar-controls-content">
        {/* 1. Pin placement mode */}
        {!isReady ? (
          <div className="ar-align-guide">
            <div className="ar-align-title-row">
              <span className="ar-align-indicator" />
              <span className="ar-align-title">Align Mattress Corners</span>
            </div>

            <div className="ar-align-steps">
              {[0, 1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className={`ar-align-step-dot ${idx < corners.length ? 'active' : ''}`}
                />
              ))}
            </div>

            <p className="ar-align-desc">
              {corners.length === 0
                ? 'Tap any corner of your bed to start mapping'
                : `Placed ${corners.length}/4 — tap the next corner`}
            </p>

            <div className="ar-align-buttons">
              <button onClick={onExit} className="ar-btn-align-action">
                Exit
              </button>
              <button
                disabled={corners.length === 0}
                onClick={undoLastCorner}
                className={`ar-btn-align-action ${corners.length === 0 ? 'disabled' : ''}`}
              >
                Undo
              </button>
            </div>
          </div>
        ) : (
          /* 2. Capture + adjust mode */
          <>
            {/* Texture sliders accordion */}
            {showSettings && (
              <div className="ar-glass-card">
                <h4 className="ar-glass-card-title">Texture Adjustments</h4>

                <div className="ar-slider-group">
                  <div className="ar-slider-label-row">
                    <span>Transparency</span>
                    <span className="ar-slider-val">{Math.round(settings.opacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.20"
                    max="1.00"
                    step="0.05"
                    value={settings.opacity}
                    onChange={(e) => updateSettings({ opacity: parseFloat(e.target.value) })}
                    className="ar-slider-input"
                    style={{ touchAction: 'none' }}
                  />
                </div>

                <div className="ar-slider-group">
                  <div className="ar-slider-label-row">
                    <span>Pattern Scale</span>
                    <span className="ar-slider-val">{settings.scale.toFixed(2)}×</span>
                  </div>
                  <input
                    type="range"
                    min="0.4"
                    max="2.5"
                    step="0.05"
                    value={settings.scale}
                    onChange={(e) => updateSettings({ scale: parseFloat(e.target.value) })}
                    className="ar-slider-input"
                    style={{ touchAction: 'none' }}
                  />
                </div>

                <div className="ar-slider-group">
                  <div className="ar-slider-label-row">
                    <span>Rotation</span>
                    <span className="ar-slider-val">{rotationDeg}°</span>
                  </div>
                  <input
                    type="range"
                    min="-180"
                    max="180"
                    step="5"
                    value={rotationDeg}
                    onChange={handleRotationChange}
                    className="ar-slider-input"
                    style={{ touchAction: 'none' }}
                  />
                </div>
              </div>
            )}

            {/* Save / Share row — shown after capture */}
            {captured && (
              <div className="ar-buttons-row">
                <button onClick={onShare} className="ar-btn-action ar-btn-share">
                  <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                  </svg>
                  Share
                </button>
                <button onClick={onSave} className="ar-btn-action ar-btn-save">
                  <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  Save
                </button>
              </div>
            )}

            {/* Shutter + icon buttons pill */}
            <div className="ar-control-pill-bar">
              {/* Tune toggle */}
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`ar-btn-pill ${showSettings ? 'active' : ''}`}
                title="Tune Texture"
              >
                <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
                </svg>
              </button>

              {/* Shutter / Capture button */}
              <button
                onClick={onCapture}
                disabled={capturing}
                className="ar-shutter-container"
                title="Capture Preview"
              >
                <div className={`ar-shutter-inner ${capturing ? 'capturing' : ''}`} />
                {capturing && <div className="ar-shutter-ping" />}
              </button>

              {/* Reset pins */}
              <button
                onClick={resetCorners}
                className="ar-btn-pill"
                title="Reset Pins"
              >
                <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
              </button>
            </div>

            {/* Capture hint label */}
            {!captured && (
              <p className="ar-hint-label">
                Press the shutter to capture &amp; save your preview
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
