"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/context/ToastContext";
import { Button } from "@/components/storefront/Button/Button";
import styles from "../admin.module.css";

interface TickerAnnouncement {
  id: string;
  message: string;
  sort_order: number;
  is_active: boolean;
}

interface HeroSlide {
  id: string;
  image_url: string;
  badge: string;
  title: string;
  subtitle: string;
  button_text: string;
  button_link: string;
  sort_order: number;
  is_active: boolean;
}

export default function AdminHomepageEditor() {
  const supabase = createClient();
  const toast = useToast();

  const [announcements, setAnnouncements] = useState<TickerAnnouncement[]>([]);
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);
  const [loadingSlides, setLoadingSlides] = useState(true);

  // Form states
  const [newAnnouncement, setNewAnnouncement] = useState({ message: "", sort_order: 0, is_active: true });
  const [newSlide, setNewSlide] = useState({
    image_url: "",
    badge: "",
    title: "",
    subtitle: "",
    button_text: "",
    button_link: "",
    sort_order: 0,
    is_active: true,
  });

  const [editingSlideId, setEditingSlideId] = useState<string | null>(null);
  const [editingAnnouncementId, setEditingAnnouncementId] = useState<string | null>(null);

  // Action loading states
  const [submittingAnnouncement, setSubmittingAnnouncement] = useState(false);
  const [submittingSlide, setSubmittingSlide] = useState(false);

  // Fetch Announcements
  const fetchAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from("ticker_announcements")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load ticker announcements.");
    } finally {
      setLoadingAnnouncements(false);
    }
  };

  // Fetch Slides
  const fetchSlides = async () => {
    try {
      const { data, error } = await supabase
        .from("hero_slides")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      setSlides(data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load hero slides.");
    } finally {
      setLoadingSlides(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
    fetchSlides();
  }, []);

  // Announcements CRUD
  const handleAnnouncementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnouncement.message.trim()) {
      toast.warning("Message cannot be empty.");
      return;
    }
    setSubmittingAnnouncement(true);

    try {
      if (editingAnnouncementId) {
        // Update
        const { error } = await supabase
          .from("ticker_announcements")
          .update(newAnnouncement)
          .eq("id", editingAnnouncementId);

        if (error) throw error;
        toast.success("Announcement updated successfully.");
      } else {
        // Create
        const { error } = await supabase
          .from("ticker_announcements")
          .insert([newAnnouncement]);

        if (error) throw error;
        toast.success("Announcement added successfully.");
      }

      setNewAnnouncement({ message: "", sort_order: 0, is_active: true });
      setEditingAnnouncementId(null);
      await fetch("/api/revalidate?path=/").catch(() => {});
      fetchAnnouncements();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save announcement.");
    } finally {
      setSubmittingAnnouncement(false);
    }
  };

  const handleEditAnnouncement = (ann: TickerAnnouncement) => {
    setEditingAnnouncementId(ann.id);
    setNewAnnouncement({ message: ann.message, sort_order: ann.sort_order, is_active: ann.is_active });
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm("Are you sure you want to delete this announcement?")) return;

    try {
      const { error } = await supabase
        .from("ticker_announcements")
        .delete()
        .eq("id", id);

      if (error) throw error;
      await fetch("/api/revalidate?path=/").catch(() => {});
      toast.success("Announcement deleted.");
      fetchAnnouncements();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete announcement.");
    }
  };

  const toggleAnnouncementActive = async (ann: TickerAnnouncement) => {
    try {
      const { error } = await supabase
        .from("ticker_announcements")
        .update({ is_active: !ann.is_active })
        .eq("id", ann.id);

      if (error) throw error;
      await fetch("/api/revalidate?path=/").catch(() => {});
      fetchAnnouncements();
    } catch (err) {
      console.error(err);
      toast.error("Failed to toggle status.");
    }
  };

  // Hero Slides CRUD
  const handleSlideSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSlide.image_url.trim() || !newSlide.title.trim()) {
      toast.warning("Image URL and Title are required.");
      return;
    }
    setSubmittingSlide(true);

    try {
      if (editingSlideId) {
        // Update
        const { error } = await supabase
          .from("hero_slides")
          .update(newSlide)
          .eq("id", editingSlideId);

        if (error) throw error;
        toast.success("Hero slide updated successfully.");
      } else {
        // Create
        const { error } = await supabase
          .from("hero_slides")
          .insert([newSlide]);

        if (error) throw error;
        toast.success("Hero slide added successfully.");
      }

      setNewSlide({
        image_url: "",
        badge: "",
        title: "",
        subtitle: "",
        button_text: "",
        button_link: "",
        sort_order: 0,
        is_active: true,
      });
      setEditingSlideId(null);
      await fetch("/api/revalidate?tag=hero-slides").catch(() => {});
      await fetch("/api/revalidate?path=/").catch(() => {});
      fetchSlides();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save hero slide.");
    } finally {
      setSubmittingSlide(false);
    }
  };

  const handleEditSlide = (slide: HeroSlide) => {
    setEditingSlideId(slide.id);
    setNewSlide({
      image_url: slide.image_url,
      badge: slide.badge || "",
      title: slide.title,
      subtitle: slide.subtitle || "",
      button_text: slide.button_text || "",
      button_link: slide.button_link || "",
      sort_order: slide.sort_order,
      is_active: slide.is_active,
    });
  };

  const handleDeleteSlide = async (id: string) => {
    if (!confirm("Are you sure you want to delete this slide?")) return;

    try {
      const { error } = await supabase
        .from("hero_slides")
        .delete()
        .eq("id", id);

      if (error) throw error;
      await fetch("/api/revalidate?tag=hero-slides").catch(() => {});
      await fetch("/api/revalidate?path=/").catch(() => {});
      toast.success("Hero slide deleted.");
      fetchSlides();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete slide.");
    }
  };

  const toggleSlideActive = async (slide: HeroSlide) => {
    try {
      const { error } = await supabase
        .from("hero_slides")
        .update({ is_active: !slide.is_active })
        .eq("id", slide.id);

      if (error) throw error;
      await fetch("/api/revalidate?tag=hero-slides").catch(() => {});
      await fetch("/api/revalidate?path=/").catch(() => {});
      fetchSlides();
    } catch (err) {
      console.error(err);
      toast.error("Failed to toggle status.");
    }
  };

  return (
    <div className={styles.pageLayout} style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
      
      {/* ─── ANNOUNCEMENT TICKER SECTION ─── */}
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <h2 style={{ fontFamily: "var(--font-headline)", fontSize: "24px", color: "var(--color-gold)", borderBottom: "1px solid var(--admin-border)", paddingBottom: "8px" }}>
          Announcement Ticker Editor
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
          {/* Ticker Form */}
          <div className={styles.formCard}>
            <h3 className={styles.formCardTitle}>
              {editingAnnouncementId ? "Edit Announcement" : "Add Announcement"}
            </h3>
            <form onSubmit={handleAnnouncementSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Announcement Message</label>
                <input
                  type="text"
                  placeholder="e.g. Free shipping on orders above PKR 5,000"
                  value={newAnnouncement.message}
                  onChange={(e) => setNewAnnouncement(p => ({ ...p, message: e.target.value }))}
                  className={styles.formInput}
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Sort Order</label>
                  <input
                    type="number"
                    value={newAnnouncement.sort_order}
                    onChange={(e) => setNewAnnouncement(p => ({ ...p, sort_order: parseInt(e.target.value) || 0 }))}
                    className={styles.formInput}
                  />
                </div>

                <div className={styles.formGroup} style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  <label className={styles.formLabel} style={{ marginBottom: "8px" }}>Status</label>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <input
                      type="checkbox"
                      id="ann_active"
                      checked={newAnnouncement.is_active}
                      onChange={(e) => setNewAnnouncement(p => ({ ...p, is_active: e.target.checked }))}
                      style={{ cursor: "pointer", width: "18px", height: "18px", accentColor: "var(--color-gold)" }}
                    />
                    <label htmlFor="ann_active" style={{ fontSize: "14px", cursor: "pointer", color: "var(--admin-text)" }}>Active</label>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                <Button type="submit" variant="primary" style={{ flexGrow: 1 }} disabled={submittingAnnouncement}>
                  {submittingAnnouncement ? "Saving..." : editingAnnouncementId ? "Update Announcement" : "Add Announcement"}
                </Button>
                {editingAnnouncementId && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setEditingAnnouncementId(null);
                      setNewAnnouncement({ message: "", sort_order: 0, is_active: true });
                    }}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </div>

          {/* Ticker List */}
          <div className={styles.formCard}>
            <h3 className={styles.formCardTitle}>Announcements List</h3>
            {loadingAnnouncements ? (
              <p style={{ color: "var(--admin-text-sub)", fontSize: "14px" }}>Loading announcements...</p>
            ) : announcements.length === 0 ? (
              <p style={{ color: "var(--admin-text-sub)", fontSize: "14px" }}>No announcements configured.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "350px", overflowY: "auto" }}>
                {announcements.map((ann) => (
                  <div key={ann.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px", border: "1px solid var(--admin-border)", borderRadius: "var(--radius-sm)", backgroundColor: "var(--admin-sidebar-hover)" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px", flexGrow: 1 }}>
                      <span style={{ fontSize: "14px", fontWeight: "500", color: ann.is_active ? "var(--admin-text)" : "var(--admin-text-sub)", textDecoration: ann.is_active ? "none" : "line-through" }}>
                        {ann.message}
                      </span>
                      <span style={{ fontSize: "11px", color: "var(--admin-text-sub)" }}>
                        Order: {ann.sort_order} | Status: <span style={{ color: ann.is_active ? "#4ade80" : "#f87171" }}>{ann.is_active ? "Active" : "Inactive"}</span>
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: "8px", marginLeft: "12px" }}>
                      <button onClick={() => toggleAnnouncementActive(ann)} className={styles.topbarButton} style={{ padding: "6px 10px", fontSize: "12px" }}>
                        {ann.is_active ? "Disable" : "Enable"}
                      </button>
                      <button onClick={() => handleEditAnnouncement(ann)} className={styles.topbarButton} style={{ padding: "6px 10px", fontSize: "12px", color: "var(--color-gold)", borderColor: "var(--color-gold-border)" }}>
                        Edit
                      </button>
                      <button onClick={() => handleDeleteAnnouncement(ann.id)} className={styles.topbarButton} style={{ padding: "6px 10px", fontSize: "12px", color: "#f87171", borderColor: "rgba(248, 113, 113, 0.3)" }}>
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── HERO SLIDER EDITOR ─── */}
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <h2 style={{ fontFamily: "var(--font-headline)", fontSize: "24px", color: "var(--color-gold)", borderBottom: "1px solid var(--admin-border)", paddingBottom: "8px" }}>
          Hero Slider Editor
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
          {/* Slide Form */}
          <div className={styles.formCard}>
            <h3 className={styles.formCardTitle}>
              {editingSlideId ? "Edit Hero Slide" : "Add Hero Slide"}
            </h3>
            <form onSubmit={handleSlideSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Image URL</label>
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/... or Supabase storage link"
                  value={newSlide.image_url}
                  onChange={(e) => setNewSlide(p => ({ ...p, image_url: e.target.value }))}
                  className={styles.formInput}
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Badge Text (e.g. Summer 2025)</label>
                  <input
                    type="text"
                    value={newSlide.badge}
                    onChange={(e) => setNewSlide(p => ({ ...p, badge: e.target.value }))}
                    className={styles.formInput}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Sort Order</label>
                  <input
                    type="number"
                    value={newSlide.sort_order}
                    onChange={(e) => setNewSlide(p => ({ ...p, sort_order: parseInt(e.target.value) || 0 }))}
                    className={styles.formInput}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Slide Title (use \n for line break / italics)</label>
                <input
                  type="text"
                  placeholder="e.g. New Lawn Prints\nSummer Collection"
                  value={newSlide.title}
                  onChange={(e) => setNewSlide(p => ({ ...p, title: e.target.value }))}
                  className={styles.formInput}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Subtitle</label>
                <textarea
                  value={newSlide.subtitle}
                  onChange={(e) => setNewSlide(p => ({ ...p, subtitle: e.target.value }))}
                  className={styles.formTextarea}
                  rows={2}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Button Text (Action)</label>
                  <input
                    type="text"
                    placeholder="e.g. Shop Collection"
                    value={newSlide.button_text}
                    onChange={(e) => setNewSlide(p => ({ ...p, button_text: e.target.value }))}
                    className={styles.formInput}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Button Link</label>
                  <input
                    type="text"
                    placeholder="e.g. /collections/lawn-prints"
                    value={newSlide.button_link}
                    onChange={(e) => setNewSlide(p => ({ ...p, button_link: e.target.value }))}
                    className={styles.formInput}
                  />
                </div>
              </div>

              <div className={styles.formGroup} style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                <input
                  type="checkbox"
                  id="slide_active"
                  checked={newSlide.is_active}
                  onChange={(e) => setNewSlide(p => ({ ...p, is_active: e.target.checked }))}
                  style={{ cursor: "pointer", width: "18px", height: "18px", accentColor: "var(--color-gold)" }}
                />
                <label htmlFor="slide_active" style={{ fontSize: "14px", cursor: "pointer", color: "var(--admin-text)" }}>Active Status (Display on Storefront)</label>
              </div>

              <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                <Button type="submit" variant="primary" style={{ flexGrow: 1 }} disabled={submittingSlide}>
                  {submittingSlide ? "Saving..." : editingSlideId ? "Update Hero Slide" : "Add Hero Slide"}
                </Button>
                {editingSlideId && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setEditingSlideId(null);
                      setNewSlide({
                        image_url: "",
                        badge: "",
                        title: "",
                        subtitle: "",
                        button_text: "",
                        button_link: "",
                        sort_order: 0,
                        is_active: true,
                      });
                    }}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </div>

          {/* Slide List */}
          <div className={styles.formCard}>
            <h3 className={styles.formCardTitle}>Hero Slides List</h3>
            {loadingSlides ? (
              <p style={{ color: "var(--admin-text-sub)", fontSize: "14px" }}>Loading slides...</p>
            ) : slides.length === 0 ? (
              <p style={{ color: "var(--admin-text-sub)", fontSize: "14px" }}>No hero slides configured.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxHeight: "600px", overflowY: "auto" }}>
                {slides.map((slide) => (
                  <div key={slide.id} style={{ display: "flex", gap: "16px", padding: "16px", border: "1px solid var(--admin-border)", borderRadius: "var(--radius-sm)", backgroundColor: "var(--admin-sidebar-hover)" }}>
                    
                    {/* Thumbnail preview */}
                    <div style={{ position: "relative", width: "100px", height: "80px", overflow: "hidden", borderRadius: "var(--radius-sm)", flexShrink: 0, backgroundColor: "#000" }}>
                      <img
                        src={slide.image_url}
                        alt="Slide preview"
                        style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.8 }}
                      />
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "4px", flexGrow: 1 }}>
                      <span style={{ fontSize: "15px", fontWeight: "bold", color: slide.is_active ? "var(--admin-text)" : "var(--admin-text-sub)" }}>
                        {slide.title.replace("\\n", " ")}
                      </span>
                      {slide.badge && <span style={{ fontSize: "11px", color: "var(--color-gold)", fontWeight: "bold" }}>Badge: {slide.badge}</span>}
                      {slide.subtitle && <span style={{ fontSize: "12px", color: "var(--admin-text-sub)" }}>{slide.subtitle.slice(0, 75)}...</span>}
                      <span style={{ fontSize: "11px", color: "var(--admin-text-sub)", marginTop: "4px" }}>
                        Order: {slide.sort_order} | Link: {slide.button_link || "None"} | Status: <span style={{ color: slide.is_active ? "#4ade80" : "#f87171" }}>{slide.is_active ? "Active" : "Inactive"}</span>
                      </span>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", justifyContent: "center" }}>
                      <button onClick={() => toggleSlideActive(slide)} className={styles.topbarButton} style={{ padding: "6px 12px", fontSize: "12px" }}>
                        {slide.is_active ? "Disable" : "Enable"}
                      </button>
                      <button onClick={() => handleEditSlide(slide)} className={styles.topbarButton} style={{ padding: "6px 12px", fontSize: "12px", color: "var(--color-gold)", borderColor: "var(--color-gold-border)" }}>
                        Edit
                      </button>
                      <button onClick={() => handleDeleteSlide(slide.id)} className={styles.topbarButton} style={{ padding: "6px 12px", fontSize: "12px", color: "#f87171", borderColor: "rgba(248, 113, 113, 0.3)" }}>
                        Delete
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
