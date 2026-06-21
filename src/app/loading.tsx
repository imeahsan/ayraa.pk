import React from 'react';

export default function Loading() {
  return (
    <div className="ar-loader-wrapper">
      <style dangerouslySetInnerHTML={{ __html: `
        .ar-loader-wrapper {
          position: fixed;
          inset: 0;
          z-index: 99999;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background-color: #1c1b1b;
          color: #ffffff;
          font-family: var(--font-body), sans-serif;
          user-select: none;
          -webkit-user-select: none;
        }

        .ar-spinner-container {
          position: relative;
          width: 80px;
          height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .ar-ring-1 {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 2px solid rgba(255, 255, 255, 0.03);
          border-top: 2px solid var(--color-gold, #e9c349);
          animation: ar-spin 1s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }

        .ar-ring-2 {
          position: absolute;
          inset: 10px;
          border-radius: 50%;
          border: 2px solid rgba(255, 255, 255, 0.03);
          border-bottom: 2px solid var(--color-gold-bright, #ffe088);
          animation: ar-spin-reverse 1.4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }

        .ar-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: var(--color-gold, #e9c349);
          box-shadow: 0 0 15px var(--color-gold, #e9c349);
          animation: ar-pulse 1.5s ease-in-out infinite alternate;
        }

        .ar-loader-text-group {
          margin-top: 24px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          animation: ar-pulse-text 2s ease-in-out infinite alternate;
        }

        .ar-loader-title {
          font-family: var(--font-headline), serif;
          font-size: 16px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.35em;
          color: var(--color-gold, #e9c349);
          margin: 0;
          padding-left: 0.35em;
        }

        .ar-loader-subtitle {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.25em;
          color: rgba(255, 255, 255, 0.35);
          text-transform: uppercase;
          margin: 0;
          padding-left: 0.25em;
        }

        @keyframes ar-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes ar-spin-reverse {
          0% { transform: rotate(360deg); }
          100% { transform: rotate(0deg); }
        }

        @keyframes ar-pulse {
          0% { transform: scale(0.85); opacity: 0.7; box-shadow: 0 0 8px var(--color-gold, #e9c349); }
          100% { transform: scale(1.1); opacity: 1; box-shadow: 0 0 18px var(--color-gold, #e9c349); }
        }

        @keyframes ar-pulse-text {
          0% { opacity: 0.55; }
          100% { opacity: 0.95; }
        }
      ` }} />

      <div className="ar-spinner-container">
        <div className="ar-ring-1" />
        <div className="ar-ring-2" />
        <div className="ar-dot" />
      </div>

      <div className="ar-loader-text-group">
        <h1 className="ar-loader-title">Ayraa</h1>
        <p className="ar-loader-subtitle">Loading Elegance</p>
      </div>
    </div>
  );
}
