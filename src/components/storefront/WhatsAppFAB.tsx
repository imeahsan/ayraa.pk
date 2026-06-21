"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

export const WhatsAppFAB: React.FC = () => {
  const pathname = usePathname();
  const [currentUrl, setCurrentUrl] = useState("");
  const [isHovered, setIsHovered] = useState(false);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentUrl(window.location.href);
    }
  }, [pathname]);

  // WhatsApp number
  const phoneNumber = "923295822495";

  // Build inquiry message
  const getWhatsAppUrl = () => {
    const isProductPage = pathname && pathname.startsWith("/product/");
    let message = "Assalamu Alaikum! I would like to make an inquiry with Ayraa Collection.";
    
    if (isProductPage && currentUrl) {
      message = `Assalamu Alaikum! I am interested in this product: ${currentUrl}. Please provide more details.`;
    }

    return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
  };

  // Do not render FAB on admin routes or if route is unknown yet
  if (!pathname || pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <a
      href={getWhatsAppUrl()}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsActive(false);
      }}
      onMouseDown={() => setIsActive(true)}
      onMouseUp={() => setIsActive(false)}
      style={{
        position: "fixed",
        bottom: "32px",
        right: "32px",
        backgroundColor: "#25D366",
        color: "white",
        width: "60px",
        height: "60px",
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 8px 24px rgba(37, 211, 102, 0.4)",
        zIndex: 9999,
        transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
        cursor: "pointer",
        outline: "none",
        transform: isActive
          ? "scale(0.92)"
          : isHovered
          ? "scale(1.1) translateY(-4px)"
          : "scale(1)",
      }}
      title="Chat with us on WhatsApp"
    >
      <svg
        viewBox="0 0 24 24"
        style={{
          width: "32px",
          height: "32px",
          fill: "currentColor",
        }}
      >
        <path d="M19.071 4.929A9.936 9.936 0 0 0 12.008 2c-5.513 0-10 4.487-10 10 0 1.761.46 3.473 1.332 4.985L2 22l5.166-1.356A9.914 9.914 0 0 0 12.004 22c5.513 0 10-4.487 10-10a9.936 9.936 0 0 0-2.933-7.071zm-7.067 15.352c-1.562 0-3.093-.418-4.43-1.21l-.317-.188-3.292.863.878-3.21-.207-.33a8.232 8.232 0 0 1-1.263-4.331c0-4.549 3.702-8.251 8.257-8.251 2.204 0 4.276.859 5.836 2.42a8.212 8.212 0 0 1 2.418 5.836c-.004 4.553-3.706 8.251-8.257 8.251zm4.532-6.195c-.248-.124-1.468-.724-1.695-.807-.227-.083-.393-.124-.558.124-.165.248-.64.807-.785.973-.145.165-.29.186-.537.062a6.764 6.764 0 0 1-1.996-1.23 7.458 7.458 0 0 1-1.38-1.72c-.145-.248-.015-.383.109-.506.112-.112.248-.29.372-.435.124-.145.165-.248.248-.414.083-.165.041-.31-.02-.435-.062-.124-.558-1.345-.765-1.841-.2-.483-.4-.414-.558-.423-.144-.008-.31-.008-.475-.008a.91.91 0 0 0-.661.31c-.227.248-.868.848-.868 2.068 0 1.22.888 2.397 1.012 2.563.124.165 1.747 2.668 4.233 3.74.59.254 1.052.406 1.412.52.593.189 1.133.162 1.56.098.475-.07 1.468-.6 1.674-1.179.207-.579.207-1.075.145-1.179-.062-.104-.227-.165-.475-.29z" />
      </svg>
    </a>
  );
};
