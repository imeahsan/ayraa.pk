import React from "react";
import { ProductVariant } from "@/types";
import styles from "./SizeSelector.module.css";

interface SizeSelectorProps {
  variants: ProductVariant[];
  selectedSize: string | null;
  onChange: (size: string) => void;
}

export const SizeSelector: React.FC<SizeSelectorProps> = ({
  variants,
  selectedSize,
  onChange,
}) => {
  return (
    <div className={styles.container}>
      <span className={styles.label}>Select Size:</span>
      <div className={styles.list}>
        {variants.map((variant) => {
          const isSelected = selectedSize === variant.size;
          const isOutOfStock = variant.stock_quantity <= 0;

          return (
            <button
              key={variant.id}
              type="button"
              className={[
                styles.sizeBtn,
                isSelected ? styles.selected : "",
                isOutOfStock ? styles.outOfStock : "",
              ]
                .filter(Boolean)
                .join(" ")}
              disabled={isOutOfStock}
              onClick={() => !isOutOfStock && onChange(variant.size)}
              aria-label={`Size ${variant.size} ${
                isOutOfStock ? "(Out of stock)" : ""
              }`}
            >
              {variant.size}
            </button>
          );
        })}
      </div>
    </div>
  );
};
