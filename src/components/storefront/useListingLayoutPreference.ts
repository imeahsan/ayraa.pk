"use client";

import React from "react";
import {
  DEFAULT_LISTING_LAYOUT,
  isListingLayout,
  LISTING_LAYOUT_STORAGE_KEY,
  ListingLayout,
} from "@/lib/listing-layout";

export function useListingLayoutPreference() {
  const [layout, setLayout] = React.useState<ListingLayout>(DEFAULT_LISTING_LAYOUT);

  React.useEffect(() => {
    try {
      const storedLayout = window.localStorage.getItem(LISTING_LAYOUT_STORAGE_KEY);
      if (isListingLayout(storedLayout)) {
        setLayout(storedLayout);
      }
    } catch (error) {
      console.error("Failed to load listing layout preference:", error);
    }
  }, []);

  React.useEffect(() => {
    try {
      window.localStorage.setItem(LISTING_LAYOUT_STORAGE_KEY, layout);
    } catch (error) {
      console.error("Failed to save listing layout preference:", error);
    }
  }, [layout]);

  return { layout, setLayout };
}
