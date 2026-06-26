import React from "react";

export default function Loading() {
  return (
    <div className="loader-overlay">
      <div className="loader-container">
        <div className="loader-emblem">
          {/* Outer dashed orbit circle */}
          <svg className="loader-orbit" width="84" height="84" viewBox="0 0 84 84" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="42" cy="42" r="39" stroke="var(--color-gold)" strokeWidth="1.2" strokeDasharray="5 5" opacity="0.4" />
          </svg>
          
          {/* Central 8-petal luxury flower */}
          <svg className="loader-flower" width="56" height="56" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g>
              {/* Petal 1 */}
              <path d="M32 32 C32 20, 29 10, 32 10 C35 10, 32 20, 32 32 Z" fill="var(--color-gold-muted)" stroke="var(--color-gold)" strokeWidth="1.5" />
              {/* Petal 2 */}
              <path d="M32 32 C32 20, 29 10, 32 10 C35 10, 32 20, 32 32 Z" fill="var(--color-gold-muted)" stroke="var(--color-gold)" strokeWidth="1.5" transform="rotate(45 32 32)" />
              {/* Petal 3 */}
              <path d="M32 32 C32 20, 29 10, 32 10 C35 10, 32 20, 32 32 Z" fill="var(--color-gold-muted)" stroke="var(--color-gold)" strokeWidth="1.5" transform="rotate(90 32 32)" />
              {/* Petal 4 */}
              <path d="M32 32 C32 20, 29 10, 32 10 C35 10, 32 20, 32 32 Z" fill="var(--color-gold-muted)" stroke="var(--color-gold)" strokeWidth="1.5" transform="rotate(135 32 32)" />
              {/* Petal 5 */}
              <path d="M32 32 C32 20, 29 10, 32 10 C35 10, 32 20, 32 32 Z" fill="var(--color-gold-muted)" stroke="var(--color-gold)" strokeWidth="1.5" transform="rotate(180 32 32)" />
              {/* Petal 6 */}
              <path d="M32 32 C32 20, 29 10, 32 10 C35 10, 32 20, 32 32 Z" fill="var(--color-gold-muted)" stroke="var(--color-gold)" strokeWidth="1.5" transform="rotate(225 32 32)" />
              {/* Petal 7 */}
              <path d="M32 32 C32 20, 29 10, 32 10 C35 10, 32 20, 32 32 Z" fill="var(--color-gold-muted)" stroke="var(--color-gold)" strokeWidth="1.5" transform="rotate(270 32 32)" />
              {/* Petal 8 */}
              <path d="M32 32 C32 20, 29 10, 32 10 C35 10, 32 20, 32 32 Z" fill="var(--color-gold-muted)" stroke="var(--color-gold)" strokeWidth="1.5" transform="rotate(315 32 32)" />
              {/* Flower Center core */}
              <circle cx="32" cy="32" r="5.5" fill="var(--color-gold)" stroke="var(--color-bg)" strokeWidth="1" />
            </g>
          </svg>
        </div>
        <div className="loader-brand">Ayra</div>
      </div>
    </div>
  );
}
