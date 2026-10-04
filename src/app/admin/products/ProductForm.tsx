"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Product, Category } from "@/types";
import { useToast } from "@/context/ToastContext";
import { Button } from "@/components/storefront/Button/Button";
import { isBeddingProduct, isBeddingCategory } from "@/lib/bedsheet-ar/is-bedding";
import styles from "../admin.module.css";
import { ImageUploader, ImageItem } from "./ImageUploader";
import { ComboboxInput } from "./ComboboxInput";

const FABRIC_OPTIONS = [
  "Cotton Satin",
  "Satin",
  "Satin Silk",
  "100% Pure Cotton",
  "Egyptian Cotton",
  "Tencel / Lyocell",
  "Bamboo Cotton",
  "Flannel",
  "Premium Lawn",
  "Swiss Lawn",
  "Chiffon",
  "Pure Silk",
  "Raw Silk",
  "Organza",
  "Georgette",
  "Linen",
  "Velvet",
  "Jacquard",
  "Cambric",
  "Jersey",
  "Pashmina Wool",
];

const INCLUDES_OPTIONS = [
  // Bedding combinations
  "1 Bed Sheet & 2 Pillow Covers",
  "1 Bed Sheet & 1 Pillow Cover",
  "1 Flat Sheet & 2 Pillow Covers",
  "1 Fitted Sheet & 2 Pillow Covers",
  "1 Bed Sheet Only",
  "1 Fitted Sheet Only",
  "5-Piece: 1 Bed Sheet, 2 Pillow Covers, 2 Filled Cushions",
  "5 Pcs (1 Bed Sheet, 2 Pillow Covers, 2 Filled Cushions)",
  "7-Piece: 1 Quilt Cover, 1 Bed Sheet, 2 Pillow Covers, 2 Cushion Covers, 1 Cushion",
  "7-Piece: 1 Quilt Cover, 1 Bed Sheet, 2 Pillow Covers, 2 Cushion Covers",
  "7-Piece: 1 Quilt Cover, 1 Bed Sheet, 2 Pillow Covers, 2 Quilt Covers",
  "7 Pcs (1 Quilt Cover, 1 Bed Sheet, 2 Pillow Covers, 2 Cushion Covers)",
  "1 Duvet Cover, 1 Bed Sheet & 2 Pillow Covers",
  "1 Duvet Cover & 2 Pillow Covers",
  "1 Comforter, 1 Bed Sheet & 2 Pillow Covers",
  "1 Comforter & 2 Pillow Covers",
  "1 Quilt Cover & 2 Pillow Covers",
  "2 Pillow Covers Only",
  "4-Piece Bedding Set (Sheet, Duvet, 2 Pillow Covers)",
  // Apparel & Pret
  "3-Piece Suit (Shirt, Trouser, Dupatta)",
  "2-Piece Suit (Shirt & Dupatta)",
  "2-Piece Suit (Shirt & Trouser)",
  "1-Piece (Shirt Only)",
  // Hijabs
  "Hijab Only",
  "Hijab & Undercap",
];

const DEFAULT_BED_SHEET_CARE_INSTRUCTIONS = `- Check the care label before washing.
- Machine wash with similar colors in cold or warm water.
- Use a mild detergent; avoid bleach unless specifically recommended.
- Do not overload the washing machine.
- Tumble dry on low heat or line dry.
- Remove promptly to reduce wrinkles.
- Iron on a low setting if needed.
- Store completely dry in a cool, dry place.
- Wash sheets weekly, or more often if needed.`;

interface ProductFormProps {
  productId?: string; // If editing
}

export const ProductForm: React.FC<ProductFormProps> = ({ productId }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const toast = useToast();
  const isEditing = !!productId;

  const getReturnUrl = useCallback(() => {
    const queryStr = searchParams.toString();
    if (queryStr) {
      return `/admin/products?${queryStr}`;
    }
    try {
      if (typeof window !== "undefined") {
        const saved = sessionStorage.getItem("ayra_admin_products_params");
        if (saved) {
          return `/admin/products?${saved}`;
        }
      }
    } catch {
      // ignore storage access errors
    }
    return "/admin/products";
  }, [searchParams]);

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  // Form Fields
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [barcode, setBarcode] = useState("");
  const [price, setPrice] = useState(0);
  const [compareAtPrice, setCompareAtPrice] = useState<number | "">("");
  const [costPrice, setCostPrice] = useState<number | "">("");
  const [categoryId, setCategoryId] = useState("");
  const [fabric, setFabric] = useState("");
  const [color, setColor] = useState("");
  const [includes, setIncludes] = useState("");
  const [careInstructions, setCareInstructions] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isOnSale, setIsOnSale] = useState(false);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [deletedImageUrls, setDeletedImageUrls] = useState<string[]>([]);

  // Configuration toggles
  const [hasSizes, setHasSizes] = useState(true);
  const [hasColors, setHasColors] = useState(false);
  const [singleStock, setSingleStock] = useState(0);

  // For color-specific stock inputs
  interface ColorVariantInput {
    color: string;
    stockXS: number;
    stockS: number;
    stockM: number;
    stockL: number;
    stockXL: number;
    singleStock: number;
  }
  const [colorVariants, setColorVariants] = useState<ColorVariantInput[]>([]);
  const [newColorName, setNewColorName] = useState("");

  // Stock quantities (used if hasColors is false)
  const [stockXS, setStockXS] = useState(0);
  const [stockS, setStockS] = useState(0);
  const [stockM, setStockM] = useState(0);
  const [stockL, setStockL] = useState(0);
  const [stockXL, setStockXL] = useState(0);

  // Fetch initial category data
  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase
        .from("categories")
        .select("*")
        .order("name", { ascending: true });
      if (data) setCategories(data as Category[]);
    };

    fetchCategories();
  }, [supabase]);

  // Fetch product data if editing
  useEffect(() => {
    if (!isEditing) return;

    const fetchProduct = async () => {
      try {
        const { data, error } = await supabase
          .from("products")
          .select("*, images:product_images(*), variants:product_variants(*)")
          .eq("id", productId)
          .single();

        if (data && !error) {
          const p = data as Product;
          setName(p.name);
          setSku((p.sku || "").toUpperCase());
          const { data: barcodeData } = await supabase
            .from("product_barcodes")
            .select("barcode")
            .eq("product_id", productId)
            .maybeSingle();
          setBarcode(barcodeData?.barcode || "");
          setPrice(p.price);
          setCompareAtPrice(p.compare_at_price || "");
          setCostPrice(p.cost_price || "");
          setCategoryId(p.category_id || "");
          setFabric(p.fabric || "");
          setColor(p.color || "");
          setIncludes(p.includes || "");
          setCareInstructions(p.care_instructions || "");
          setDescription(p.description || "");
          setIsActive(p.is_active);
          setIsFeatured(p.is_featured);
          setIsOnSale(p.is_on_sale || false);

          // Map images
          if (p.images) {
            setImages(
              [...p.images]
                .sort((a, b) => a.sort_order - b.sort_order)
                .map((img) => ({
                  id: img.id,
                  url: img.url,
                }))
            );
          }

          // Map variants
          if (p.variants && p.variants.length > 0) {
            const hasStandardSizes = p.variants.some((v) =>
              ["XS", "S", "M", "L", "XL"].includes(v.size)
            );
            const hasCustomColors = p.variants.some((v) =>
              v.color && v.color !== "Standard"
            );

            setHasSizes(hasStandardSizes);
            setHasColors(hasCustomColors);

            if (hasCustomColors) {
              const colorMap: Record<string, ColorVariantInput> = {};
              p.variants.forEach((v: any) => {
                const col = v.color || "Standard";
                if (!colorMap[col]) {
                  colorMap[col] = {
                    color: col,
                    stockXS: 0,
                    stockS: 0,
                    stockM: 0,
                    stockL: 0,
                    stockXL: 0,
                    singleStock: 0,
                  };
                }
                if (v.size === "XS") colorMap[col].stockXS = v.stock_quantity;
                else if (v.size === "S") colorMap[col].stockS = v.stock_quantity;
                else if (v.size === "M") colorMap[col].stockM = v.stock_quantity;
                else if (v.size === "L") colorMap[col].stockL = v.stock_quantity;
                else if (v.size === "XL") colorMap[col].stockXL = v.stock_quantity;
                else colorMap[col].singleStock = v.stock_quantity;
              });
              setColorVariants(Object.values(colorMap));
            } else {
              if (hasStandardSizes) {
                p.variants.forEach((v) => {
                  if (v.size === "XS") setStockXS(v.stock_quantity);
                  if (v.size === "S") setStockS(v.stock_quantity);
                  if (v.size === "M") setStockM(v.stock_quantity);
                  if (v.size === "L") setStockL(v.stock_quantity);
                  if (v.size === "XL") setStockXL(v.stock_quantity);
                });
              } else {
                setSingleStock(p.variants[0]?.stock_quantity || 0);
              }
            }
          } else {
            setHasSizes(false);
            setHasColors(false);
            setSingleStock(0);
          }
        }
      } catch (err) {
        console.error("Error fetching product details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [isEditing, productId, supabase]);

  const handleAddColor = () => {
    if (!newColorName.trim()) return;
    const colName = newColorName.trim();
    if (colorVariants.some((cv) => cv.color.toLowerCase() === colName.toLowerCase())) {
      toast.warning("Color already exists.");
      return;
    }
    setColorVariants((prev) => [
      ...prev,
      {
        color: colName,
        stockXS: 0,
        stockS: 0,
        stockM: 0,
        stockL: 0,
        stockXL: 0,
        singleStock: 0,
      },
    ]);
    setNewColorName("");
  };

  const handleRemoveColor = (colorName: string) => {
    setColorVariants((prev) => prev.filter((cv) => cv.color !== colorName));
  };

  const handleColorStockChange = (
    colorName: string,
    field: keyof ColorVariantInput,
    value: number
  ) => {
    setColorVariants((prev) =>
      prev.map((cv) => {
        if (cv.color === colorName) {
          return { ...cv, [field]: value };
        }
        return cv;
      })
    );
  };

  const handleCategoryChange = (newCatId: string) => {
    setCategoryId(newCatId);
    const selectedCat = categories.find((c) => c.id === newCatId);
    if (selectedCat && isBeddingCategory(selectedCat, categories)) {
      if (!careInstructions.trim()) {
        setCareInstructions(DEFAULT_BED_SHEET_CARE_INSTRUCTIONS);
        toast.info("Auto-filled bed sheet care instructions.");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price || !categoryId) {
      toast.error("Name, Price, and Sub-collection are required.");
      return;
    }

    setSaving(true);
    const normalizedSku = sku.trim().toUpperCase();
    const slugBase = normalizedSku ? `${name}-${normalizedSku}` : name;
    const slug = slugBase
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const productPayload = {
      name,
      slug,
      sku: normalizedSku || null,
      price,
      compare_at_price: compareAtPrice === "" ? null : compareAtPrice,
      cost_price: costPrice === "" ? null : Number(costPrice),
      category_id: categoryId || null,
      fabric: fabric.trim() || null,
      color: color.trim() || null,
      includes: includes.trim() || null,
      care_instructions: careInstructions.trim() || null,
      description: description || null,
      is_active: isActive,
      is_featured: isFeatured,
      is_on_sale: isOnSale,
    };

    try {
      const normalizedBarcode = barcode.trim();

      if (normalizedBarcode) {
        const { data: existingBarcode, error: barcodeLookupError } = await supabase
          .from("product_barcodes")
          .select("product_id")
          .eq("barcode", normalizedBarcode)
          .maybeSingle();

        if (barcodeLookupError) throw barcodeLookupError;

        if (existingBarcode && existingBarcode.product_id !== productId) {
          toast.error("This barcode is already assigned to another product.");
          setSaving(false);
          return;
        }
      }

      let insertedProduct: Product | null = null;

      if (isEditing) {
        const { data, error } = await supabase
          .from("products")
          .update(productPayload)
          .eq("id", productId)
          .select()
          .single();

        if (error) throw error;
        insertedProduct = data as Product;
      } else {
        const { data, error } = await supabase
          .from("products")
          .insert(productPayload)
          .select()
          .single();

        if (error) throw error;
        insertedProduct = data as Product;
      }

      const id = insertedProduct.id;

      if (normalizedBarcode) {
        const { error: barcodeError } = await supabase
          .from("product_barcodes")
          .upsert(
            { product_id: id, barcode: normalizedBarcode },
            { onConflict: "product_id" }
          );

        if (barcodeError) {
          if (barcodeError.code === "23505") {
            toast.error("This barcode is already assigned to another product.");
            setSaving(false);
            return;
          }
          throw barcodeError;
        }
      } else if (isEditing) {
        await supabase.from("product_barcodes").delete().eq("product_id", id);
      }

      // Handle product images save
      // 1. Delete removed images from storage bucket
      if (deletedImageUrls.length > 0) {
        const pathsToDelete = deletedImageUrls
          .filter((url) => url.includes("/storage/v1/object/public/products/"))
          .map((url) => {
            const parts = url.split("/storage/v1/object/public/products/");
            return parts[1];
          });
        if (pathsToDelete.length > 0) {
          await supabase.storage.from("products").remove(pathsToDelete);
        }
      }

      // 2. Upload new image files and collect all final URLs
      const finalUrls: string[] = [];

      for (let i = 0; i < images.length; i++) {
          const img = images[i];
          if (img.file) {
            const fileExt = img.file.name.split(".").pop() || "jpg";
            const fileName = `${id}/${Date.now()}-${crypto.randomUUID()}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from("products")
            .upload(fileName, img.file, {
              cacheControl: "31536000",
            });

          if (uploadError) {
            console.error("Error uploading file:", uploadError);
            throw uploadError;
          }

          const { data: publicUrlData } = supabase.storage
            .from("products")
            .getPublicUrl(fileName);

          if (!publicUrlData || !publicUrlData.publicUrl) {
            throw new Error("Failed to get public URL for uploaded file.");
          }

          finalUrls.push(publicUrlData.publicUrl);
        } else {
          finalUrls.push(img.url);
        }
      }

      // 3. Clear old images in DB
      await supabase.from("product_images").delete().eq("product_id", id);

      // 4. Save new images in DB
      if (finalUrls.length > 0) {
        const imagesPayload = finalUrls.map((url, idx) => ({
          product_id: id,
          url,
          sort_order: idx + 1,
          is_primary: idx === 0,
        }));
        await supabase.from("product_images").insert(imagesPayload);
      }

      // Handle variants save
      // Clear old variants
      await supabase.from("product_variants").delete().eq("product_id", id);

      const variantsPayload: any[] = [];

      if (hasColors) {
        colorVariants.forEach((cv) => {
          if (hasSizes) {
            const sizesList = [
              { size: "XS", qty: cv.stockXS },
              { size: "S", qty: cv.stockS },
              { size: "M", qty: cv.stockM },
              { size: "L", qty: cv.stockL },
              { size: "XL", qty: cv.stockXL },
            ];
            sizesList.forEach((s) => {
              variantsPayload.push({
                product_id: id,
                size: s.size,
                color: cv.color,
                stock_quantity: Math.max(0, Number(s.qty) || 0),
                is_available: Number(s.qty) > 0,
              });
            });
          } else {
            variantsPayload.push({
              product_id: id,
              size: "Standard",
              color: cv.color,
              stock_quantity: Math.max(0, Number(cv.singleStock) || 0),
              is_available: Number(cv.singleStock) > 0,
            });
          }
        });
      } else {
        if (hasSizes) {
          const sizesList = [
            { size: "XS", qty: stockXS },
            { size: "S", qty: stockS },
            { size: "M", qty: stockM },
            { size: "L", qty: stockL },
            { size: "XL", qty: stockXL },
          ];
          sizesList.forEach((s) => {
            variantsPayload.push({
              product_id: id,
              size: s.size,
              color: "Standard",
              stock_quantity: Math.max(0, Number(s.qty) || 0),
              is_available: Number(s.qty) > 0,
            });
          });
        } else {
          variantsPayload.push({
            product_id: id,
            size: "Standard",
            color: "Standard",
            stock_quantity: Math.max(0, Number(singleStock) || 0),
            is_available: Number(singleStock) > 0,
          });
        }
      }

      if (variantsPayload.length > 0) {
        const { error: variantError } = await supabase
          .from("product_variants")
          .insert(variantsPayload);
        if (variantError) throw variantError;
      }

      // Trigger on-demand cache revalidation for storefront
      await fetch("/api/revalidate?tag=products").catch(() => {});
      await fetch("/api/revalidate?tag=categories").catch(() => {});

      toast.success("Product saved successfully!");
      router.push(getReturnUrl());
      router.refresh();
    } catch (err: any) {
      console.error("Failed to save product:", err);
      toast.error(err.message || "Failed to save product.");
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = () => {
    if (!name.trim()) {
      toast.warning("Please enter a product name first to generate a preview.");
      return;
    }

    const normalizedSku = sku.trim().toUpperCase();
    const slugBase = normalizedSku ? `${name}-${normalizedSku}` : name;
    const calculatedSlug = slugBase
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const previewProduct = {
      id: productId || "preview-id",
      name,
      slug: calculatedSlug,
      sku: normalizedSku || null,
      barcode: barcode || null,
      price,
      compare_at_price: compareAtPrice === "" ? null : Number(compareAtPrice),
      category_id: categoryId || null,
      fabric: fabric.trim() || null,
      color: color.trim() || null,
      includes: includes.trim() || null,
      care_instructions: careInstructions.trim() || null,
      description: description || null,
      is_active: isActive,
      is_featured: isFeatured,
      is_on_sale: isOnSale,
      created_at: new Date().toISOString(),
      images: images.map((img, idx) => ({
        id: img.id || `preview-img-${idx}`,
        product_id: productId || "preview-id",
        url: img.url,
        alt_text: name,
        sort_order: idx + 1,
        is_primary: idx === 0,
      })),
      variants: hasColors
        ? colorVariants.flatMap((cv, cvIdx) => {
            if (hasSizes) {
              return [
                { size: "XS", qty: cv.stockXS },
                { size: "S", qty: cv.stockS },
                { size: "M", qty: cv.stockM },
                { size: "L", qty: cv.stockL },
                { size: "XL", qty: cv.stockXL },
              ].map((s) => ({
                id: `preview-var-${cvIdx}-${s.size}`,
                product_id: productId || "preview-id",
                size: s.size,
                color: cv.color,
                stock_quantity: s.qty,
                is_available: s.qty > 0,
              }));
            } else {
              return [{
                id: `preview-var-${cvIdx}-Standard`,
                product_id: productId || "preview-id",
                size: "Standard",
                color: cv.color,
                stock_quantity: cv.singleStock,
                is_available: cv.singleStock > 0,
              }];
            }
          })
        : hasSizes
        ? [
            { size: "XS", qty: stockXS },
            { size: "S", qty: stockS },
            { size: "M", qty: stockM },
            { size: "L", qty: stockL },
            { size: "XL", qty: stockXL },
          ].map((s) => ({
            id: `preview-var-${s.size}`,
            product_id: productId || "preview-id",
            size: s.size,
            color: "Standard",
            stock_quantity: s.qty,
            is_available: s.qty > 0,
          }))
        : [{
            id: `preview-var-Standard`,
            product_id: productId || "preview-id",
            size: "Standard",
            color: "Standard",
            stock_quantity: singleStock,
            is_available: singleStock > 0,
          }],
    };

    localStorage.setItem("ayra-preview-product", JSON.stringify(previewProduct));
    window.open(`/product/${calculatedSlug}?preview=true`, "_blank");
  };

  if (loading) return <p className="font-body text-sm text-admin-text-sub text-center py-12">Loading product details...</p>;

  return (
    <form onSubmit={handleSubmit} className={styles.pageLayout}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
        <button
          type="button"
          onClick={() => router.push(getReturnUrl())}
          className={styles.backLink}
          style={{ background: "none", border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px", padding: 0 }}
        >
          ← Back to Products
        </button>
      </div>
      <div className={styles.twoColLayout}>
        {/* Left Side: General Info */}
        <div className={styles.mainFormCol}>
          <div className={styles.formCard}>
            <h3 className={styles.formCardTitle}>General Details</h3>
            
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Product Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={styles.formInput}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>SKU</label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value.toUpperCase())}
                placeholder="e.g. AYR-BED-001"
                className={styles.formInput}
                style={{ textTransform: "uppercase" }}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Barcode</label>
              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                onInput={(e) => setBarcode(e.currentTarget.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    setBarcode(e.currentTarget.value.trim());
                  }
                }}
                onBlur={(e) => setBarcode(e.currentTarget.value.trim())}
                className={styles.formInput}
                autoComplete="off"
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={styles.formTextarea}
                rows={5}
              />
            </div>
          </div>

          {/* Pricing & Stock */}
          <div className={styles.formCard}>
            <h3 className={styles.formCardTitle}>Pricing &amp; Inventory</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Price (PKR) *</label>
                <input
                  type="number"
                  value={price !== undefined ? price : ""}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  onWheel={(e) => e.currentTarget.blur()}
                  className={styles.formInput}
                  min="0"
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Compare Price (PKR)</label>
                <input
                  type="number"
                  value={compareAtPrice}
                  onChange={(e) =>
                    setCompareAtPrice(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  onWheel={(e) => e.currentTarget.blur()}
                  className={styles.formInput}
                  min="0"
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Cost Price / COGS (PKR)</label>
                <input
                  type="number"
                  placeholder="e.g. 2800"
                  value={costPrice}
                  onChange={(e) =>
                    setCostPrice(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  onWheel={(e) => e.currentTarget.blur()}
                  className={styles.formInput}
                  min="0"
                />
                <span style={{ fontSize: "11px", color: "var(--admin-text-sub)", marginTop: "2px", display: "block" }}>
                  Manufacturing cost for P&amp;L
                </span>
              </div>
            </div>

            {/* Variant options checkboxes */}
            <div className={styles.formGroup} style={{ marginTop: "16px", marginBottom: "8px", display: "flex", gap: "24px" }}>
              <label className={styles.checkboxLabel} style={{ cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={hasSizes}
                  onChange={(e) => setHasSizes(e.target.checked)}
                  className={styles.checkboxInput}
                />
                <span>Enable Size Variants</span>
              </label>

              <label className={styles.checkboxLabel} style={{ cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={hasColors}
                  onChange={(e) => setHasColors(e.target.checked)}
                  className={styles.checkboxInput}
                />
                <span>Enable Color Variants</span>
              </label>
            </div>

            <hr className={styles.divider} style={{ margin: "16px 0" }} />

            {/* Inventory Display Logic */}
            {!hasSizes && !hasColors && (
              <div className={styles.formGroup} style={{ maxWidth: "200px" }}>
                <label className={styles.formLabel}>Total Stock Inventory *</label>
                <input
                  type="number"
                  value={singleStock !== undefined ? singleStock : 0}
                  onChange={(e) => setSingleStock(e.target.value === "" ? 0 : Math.max(0, Number(e.target.value)))}
                  onWheel={(e) => e.currentTarget.blur()}
                  className={styles.formInput}
                  min="0"
                  required
                />
              </div>
            )}

            {hasSizes && !hasColors && (
              <>
                <h4 className="font-body text-sm font-bold text-admin-text mt-2 mb-0" style={{ textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--admin-text-sub)" }}>Stock by Size</h4>
                <div className={styles.grid5Col}>
                  {["XS", "S", "M", "L", "XL"].map((size) => {
                    let val = 0;
                    let setter = (n: number) => {};
                    if (size === "XS") { val = stockXS; setter = setStockXS; }
                    if (size === "S") { val = stockS; setter = setStockS; }
                    if (size === "M") { val = stockM; setter = setStockM; }
                    if (size === "L") { val = stockL; setter = setStockL; }
                    if (size === "XL") { val = stockXL; setter = setStockXL; }

                    return (
                      <div key={size} className={styles.sizeStockBox}>
                        <span className={styles.sizeStockLabel}>{size}</span>
                        <input
                          type="number"
                          value={val !== undefined ? val : 0}
                          onChange={(e) => setter(e.target.value === "" ? 0 : Math.max(0, Number(e.target.value)))}
                          onWheel={(e) => e.currentTarget.blur()}
                          className={styles.sizeStockInput}
                          min="0"
                        />
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {hasColors && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <h4 className="font-body text-sm font-bold text-admin-text mt-2 mb-0" style={{ textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--admin-text-sub)" }}>Color Variant Stock</h4>
                
                {/* Add new color input */}
                <div style={{ display: "flex", gap: "12px", alignItems: "flex-end" }}>
                  <div className={styles.formGroup} style={{ flexGrow: 1, margin: 0 }}>
                    <label className={styles.formLabel}>Color Name (e.g. Ruby Red, Emerald Green)</label>
                    <input
                      type="text"
                      placeholder="Enter color variant..."
                      value={newColorName}
                      onChange={(e) => setNewColorName(e.target.value)}
                      className={styles.formInput}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="luxury"
                    onClick={handleAddColor}
                    style={{ height: "42px", paddingInline: "20px" }}
                  >
                    + Add Color
                  </Button>
                </div>

                {/* List of color variants */}
                <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "8px" }}>
                  {colorVariants.length === 0 ? (
                    <p style={{ fontStyle: "italic", fontSize: "12px", color: "var(--admin-text-sub)", margin: 0 }}>No color variants added yet. Add colors above.</p>
                  ) : (
                    colorVariants.map((cv) => (
                      <div
                        key={cv.color}
                        style={{
                          border: "1px solid var(--color-border)",
                          padding: "16px",
                          borderRadius: "var(--radius-md)",
                          backgroundColor: "rgba(255,255,255,0.02)",
                          display: "flex",
                          flexDirection: "column",
                          gap: "12px"
                        }}
                      >
                        {/* Color header with Delete button */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontFamily: "var(--font-headline)", fontSize: "16px", fontWeight: "600", color: "var(--color-gold)" }}>{cv.color}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveColor(cv.color)}
                            style={{
                              backgroundColor: "transparent",
                              border: "none",
                              color: "var(--color-error)",
                              fontSize: "12px",
                              fontWeight: "600",
                              cursor: "pointer",
                              textTransform: "uppercase",
                              letterSpacing: "0.05em"
                            }}
                          >
                            Remove Color
                          </button>
                        </div>

                        {/* Stock inputs for this color */}
                        {hasSizes ? (
                          <div className={styles.grid5Col} style={{ margin: 0 }}>
                            {["XS", "S", "M", "L", "XL"].map((size) => {
                              let val = 0;
                              let field: keyof ColorVariantInput = "stockXS";
                              if (size === "XS") { val = cv.stockXS; field = "stockXS"; }
                              if (size === "S") { val = cv.stockS; field = "stockS"; }
                              if (size === "M") { val = cv.stockM; field = "stockM"; }
                              if (size === "L") { val = cv.stockL; field = "stockL"; }
                              if (size === "XL") { val = cv.stockXL; field = "stockXL"; }

                              return (
                                <div key={size} className={styles.sizeStockBox}>
                                  <span className={styles.sizeStockLabel}>{size}</span>
                                  <input
                                    type="number"
                                    value={val !== undefined ? val : 0}
                                    onChange={(e) => handleColorStockChange(cv.color, field, e.target.value === "" ? 0 : Math.max(0, Number(e.target.value)))}
                                    onWheel={(e) => e.currentTarget.blur()}
                                    className={styles.sizeStockInput}
                                    min="0"
                                  />
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className={styles.formGroup} style={{ maxWidth: "200px", margin: 0 }}>
                            <label className={styles.formLabel}>Stock Quantity</label>
                            <input
                              type="number"
                              value={cv.singleStock !== undefined ? cv.singleStock : 0}
                              onChange={(e) => handleColorStockChange(cv.color, "singleStock", e.target.value === "" ? 0 : Math.max(0, Number(e.target.value)))}
                              onWheel={(e) => e.currentTarget.blur()}
                              className={styles.formInput}
                              min="0"
                            />
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Images */}
          <div className={styles.formCard}>
            <h3 className={styles.formCardTitle}>Product Images</h3>
            <div className={styles.formGroup}>
              <ImageUploader
                images={images}
                onChange={setImages}
                onDeleteImage={(url) => setDeletedImageUrls((prev) => [...prev, url])}
              />
              <span className={styles.sidebarSubtitle} style={{ textTransform: "none", fontSize: "11px", marginTop: "8px" }}>
                First image will be used as the primary catalog cover image. Reorder images using &larr; and &rarr; or set cover.
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Specifications & Toggles */}
        <div className={styles.sidebarFormCol}>
          <div className={styles.formCard}>
            <h3 className={styles.formCardTitle}>Status &amp; Collection</h3>
            
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Sub-collection *</label>
              <select
                value={categoryId}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className={styles.formSelect}
                required
              >
                <option value="" className={styles.filterOption}>Select Sub-collection</option>
                {categories
                  .filter((cat) => cat.parent_id !== null)
                  .map((cat) => {
                    const parent = categories.find((c) => c.id === cat.parent_id);
                    const displayName = parent ? `${parent.name} › ${cat.name}` : cat.name;
                    return (
                      <option key={cat.id} value={cat.id} className={styles.filterOption}>
                        {displayName}
                      </option>
                    );
                  })}
              </select>
            </div>

            <div className={styles.checkboxGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className={styles.checkboxInput}
                />
                <span>Active (Visible in storefront)</span>
              </label>

              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className={styles.checkboxInput}
                />
                <span>Featured (Display on homepage)</span>
              </label>

              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={isOnSale}
                  onChange={(e) => setIsOnSale(e.target.checked)}
                  className={styles.checkboxInput}
                />
                <span>On Sale (Display in sale section)</span>
              </label>
            </div>
          </div>

          <div className={styles.formCard}>
            <h3 className={styles.formCardTitle}>Product Details</h3>

            <div className={styles.formGroup}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label className={styles.formLabel} htmlFor="product-fabric">Fabric</label>
                <span style={{ fontSize: "11px", color: "var(--admin-text-sub)" }}>
                  Dropdown or custom
                </span>
              </div>
              <ComboboxInput
                id="product-fabric"
                value={fabric}
                onChange={setFabric}
                options={FABRIC_OPTIONS}
                placeholder="e.g. Cotton Satin, Silk..."
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Color</label>
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="e.g. Midnight Black, Ivory"
                className={styles.formInput}
              />
            </div>

            <div className={styles.formGroup}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label className={styles.formLabel} htmlFor="product-includes">Includes</label>
                <span style={{ fontSize: "11px", color: "var(--admin-text-sub)" }}>
                  Dropdown or custom
                </span>
              </div>
              <ComboboxInput
                id="product-includes"
                value={includes}
                onChange={setIncludes}
                options={INCLUDES_OPTIONS}
                placeholder="e.g. 1 Bed Sheet & 2 Pillow Covers..."
              />
            </div>

            <div className={styles.formGroup}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label className={styles.formLabel}>Care Instructions</label>
                <button
                  type="button"
                  onClick={() => {
                    setCareInstructions(DEFAULT_BED_SHEET_CARE_INSTRUCTIONS);
                    toast.info("Applied bed sheet care instructions.");
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--color-gold)",
                    fontSize: "11px",
                    fontWeight: "600",
                    cursor: "pointer",
                    textDecoration: "underline",
                    padding: "0 2px",
                  }}
                  title="Insert 9-point bed sheet care guidelines"
                >
                  ✨ Auto-fill Bedding Care
                </button>
              </div>
              <textarea
                value={careInstructions}
                onChange={(e) => setCareInstructions(e.target.value)}
                placeholder="Care guidelines..."
                className={styles.formTextarea}
                rows={10}
              />
            </div>
          </div>

          <div className={styles.formActionGroup}>
            <Button type="submit" variant="luxury" size="lg" fullWidth isLoading={saving}>
              {isEditing ? "Save Product Changes" : "Publish Product"}
            </Button>
            {isEditing && isBeddingProduct({ category_id: categoryId, name, fabric, slug: name }, categories) && (
              <Button
                type="button"
                variant="outline"
                size="lg"
                fullWidth
                style={{ borderColor: "var(--color-gold)", color: "var(--color-gold)" }}
                onClick={() => {
                  const queryStr = searchParams.toString();
                  router.push(queryStr ? `/admin/products/${productId}/bedsheet-ar?${queryStr}` : `/admin/products/${productId}/bedsheet-ar`);
                }}
              >
                🛏️ Configure AR & Texture
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="lg"
              fullWidth
              style={{ borderColor: "#38bdf8", color: "#38bdf8" }}
              onClick={handlePreview}
            >
              👁️ Preview Storefront
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              fullWidth
              onClick={() => router.push(getReturnUrl())}
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
};
