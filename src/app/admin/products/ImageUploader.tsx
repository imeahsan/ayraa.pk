"use client";

import React, { useRef, useState } from "react";
import styles from "./ImageUploader.module.css";

export interface ImageItem {
  id?: string;
  url: string;
  file?: File;
}

interface ImageUploaderProps {
  images: ImageItem[];
  onChange: (images: ImageItem[]) => void;
  onDeleteImage?: (url: string) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  images,
  onChange,
  onDeleteImage,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const addFiles = (fileList: FileList) => {
    const newItems: ImageItem[] = [];
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      if (!file.type.startsWith("image/")) continue;
      newItems.push({
        url: URL.createObjectURL(file),
        file,
      });
    }
    if (newItems.length > 0) {
      onChange([...images, ...newItems]);
    }
  };

  const removeImage = (index: number) => {
    const target = images[index];
    if (!target.file && onDeleteImage) {
      onDeleteImage(target.url);
    }

    if (target.file) {
      URL.revokeObjectURL(target.url);
    }

    const updated = images.filter((_, idx) => idx !== index);
    onChange(updated);
  };

  const moveLeft = (index: number) => {
    if (index === 0) return;
    const updated = [...images];
    const temp = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = temp;
    onChange(updated);
  };

  const moveRight = (index: number) => {
    if (index === images.length - 1) return;
    const updated = [...images];
    const temp = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = temp;
    onChange(updated);
  };

  const setAsPrimary = (index: number) => {
    if (index === 0) return;
    const updated = [...images];
    const target = updated.splice(index, 1)[0];
    updated.unshift(target);
    onChange(updated);
  };

  return (
    <div className={styles.uploaderContainer}>
      {/* Drag & Drop Zone */}
      <div
        className={`${styles.dropZone} ${dragActive ? styles.dragActive : ""}`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={triggerFileInput}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          className={styles.fileInput}
          onChange={handleFileChange}
        />
        <svg
          className={styles.uploadIcon}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
          />
        </svg>
        <p className={styles.dropZoneTitle}>Drag &amp; drop product pictures here</p>
        <p className={styles.dropZoneSubtitle}>or click to upload files manually</p>
      </div>

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className={styles.previewGrid}>
          {images.map((img, idx) => {
            const isCover = idx === 0;
            return (
              <div
                key={img.url + idx}
                className={`${styles.imageCard} ${isCover ? styles.coverCard : ""}`}
              >
                {/* Image Preview */}
                <div
                  className={styles.imageThumbnail}
                  style={{ backgroundImage: `url(${img.url})` }}
                />

                {/* Cover/Primary Badge */}
                {isCover ? (
                  <span className={styles.coverBadge}>Cover Image</span>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setAsPrimary(idx);
                    }}
                    className={styles.makeCoverBtn}
                    title="Make Cover"
                  >
                    Set Cover
                  </button>
                )}

                {/* Control Action Buttons overlay */}
                <div className={styles.actionOverlay}>
                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeImage(idx);
                    }}
                    className={`${styles.actionBtn} ${styles.deleteBtn}`}
                    title="Delete Image"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>

                  {/* Ordering Controls */}
                  <div className={styles.orderControls}>
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={(e) => {
                        e.stopPropagation();
                        moveLeft(idx);
                      }}
                      className={styles.orderBtn}
                      title="Move Left"
                    >
                      &larr;
                    </button>
                    <button
                      type="button"
                      disabled={idx === images.length - 1}
                      onClick={(e) => {
                        e.stopPropagation();
                        moveRight(idx);
                      }}
                      className={styles.orderBtn}
                      title="Move Right"
                    >
                      &rarr;
                    </button>
                  </div>
                </div>

                {/* Upload Status Label for local files */}
                {img.file && (
                  <span className={styles.localFileBadge}>Pending Upload</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
