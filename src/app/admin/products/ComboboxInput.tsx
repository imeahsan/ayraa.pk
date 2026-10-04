"use client";

import React, { useState, useRef, useEffect, useId } from "react";
import styles from "../admin.module.css";

interface ComboboxInputProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  id?: string;
  name?: string;
  disabled?: boolean;
}

export const ComboboxInput: React.FC<ComboboxInputProps> = ({
  value,
  onChange,
  options,
  placeholder,
  id,
  name,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const reactGeneratedId = useId();
  const datalistId = id ? `${id}-datalist` : `combobox-${reactGeneratedId}`;

  // Close dropdown on click outside or Escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const trimmedQuery = value.trim().toLowerCase();
  const matchingOptions = options.filter((opt) =>
    opt.toLowerCase().includes(trimmedQuery)
  );

  return (
    <div
      ref={containerRef}
      style={{ position: "relative", width: "100%" }}
    >
      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
        <input
          type="text"
          id={id}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={styles.formInput}
          style={{ paddingRight: "36px" }}
          list={datalistId}
          autoComplete="off"
        />

        {/* Native datalist fallback for browser search / autocomplete */}
        <datalist id={datalistId}>
          {options.map((opt) => (
            <option key={opt} value={opt} />
          ))}
        </datalist>

        {/* Custom Chevron Toggle Button */}
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          disabled={disabled}
          style={{
            position: "absolute",
            right: "4px",
            top: "50%",
            transform: "translateY(-50%)",
            background: "transparent",
            border: "none",
            color: isOpen ? "var(--color-gold, #e9c349)" : "var(--admin-text-sub, #a1a1aa)",
            padding: "8px",
            cursor: disabled ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "color 0.15s ease",
            borderRadius: "var(--radius-sm, 4px)",
          }}
          title="Browse preset suggestions or select from dropdown"
          aria-label="Toggle options dropdown"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              transition: "transform 0.2s ease",
              transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>

      {/* Floating Dropdown Menu */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            maxHeight: "230px",
            overflowY: "auto",
            backgroundColor: "var(--admin-card, #181717)",
            border: "1px solid var(--admin-border, #2e2a27)",
            borderRadius: "var(--radius-sm, 4px)",
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.55)",
            zIndex: 100,
            padding: "4px 0",
          }}
        >
          {matchingOptions.length > 0 ? (
            matchingOptions.map((opt) => {
              const isSelected = value.trim().toLowerCase() === opt.toLowerCase();
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    onChange(opt);
                    setIsOpen(false);
                  }}
                  style={{
                    width: "100%",
                    padding: "9px 14px",
                    textAlign: "left",
                    background: isSelected ? "rgba(233, 195, 73, 0.14)" : "transparent",
                    color: isSelected ? "var(--color-gold, #e9c349)" : "var(--admin-text, #fbf9f8)",
                    border: "none",
                    borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontFamily: "var(--font-body, inherit)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    transition: "background-color 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = isSelected
                      ? "rgba(233, 195, 73, 0.22)"
                      : "rgba(255, 255, 255, 0.05)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = isSelected
                      ? "rgba(233, 195, 73, 0.14)"
                      : "transparent";
                  }}
                >
                  <span>{opt}</span>
                  {isSelected && (
                    <span style={{ color: "var(--color-gold, #e9c349)", fontWeight: "bold" }}>
                      ✓
                    </span>
                  )}
                </button>
              );
            })
          ) : (
            <>
              {value.trim() && (
                <div
                  style={{
                    padding: "8px 14px",
                    fontSize: "12px",
                    color: "var(--admin-text-sub, #a1a1aa)",
                    borderBottom: "1px solid var(--admin-border, #2e2a27)",
                  }}
                >
                  Custom value: &ldquo;
                  <span style={{ color: "var(--admin-text, #fff)", fontWeight: "500" }}>
                    {value}
                  </span>
                  &rdquo; (kept as custom)
                </div>
              )}
              <div
                style={{
                  padding: "6px 14px",
                  fontSize: "11px",
                  fontWeight: "600",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  color: "var(--color-gold, #e9c349)",
                }}
              >
                All Presets:
              </div>
              {options.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    onChange(opt);
                    setIsOpen(false);
                  }}
                  style={{
                    width: "100%",
                    padding: "8px 14px",
                    textAlign: "left",
                    background: "transparent",
                    color: "var(--admin-text, #fbf9f8)",
                    border: "none",
                    borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontFamily: "var(--font-body, inherit)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  {opt}
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
};
