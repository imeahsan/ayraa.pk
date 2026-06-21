"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/context/ToastContext";
import { Button } from "@/components/storefront/Button/Button";
import { answerQuestion } from "@/app/actions/qa";
import styles from "../admin.module.css";

interface ProductQuestion {
  id: string;
  product_id: string;
  question_text: string;
  answer_text: string | null;
  is_answered: boolean;
  created_at: string;
  answered_at: string | null;
  product?: {
    name: string;
    slug: string;
  };
}

export default function AdminQAPage() {
  const supabase = createClient();
  const toast = useToast();
  const [questions, setQuestions] = useState<ProductQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "answered">("pending");
  const [search, setSearch] = useState("");
  
  // State for composing answers
  const [draftAnswers, setDraftAnswers] = useState<Record<string, string>>({});
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const fetchQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from("product_questions")
        .select("*, product:products(name, slug)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setQuestions((data as any) || []);
    } catch (err) {
      console.error("Failed to load questions:", err);
      toast.error("Failed to load product questions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const handleAnswerSubmit = async (questionId: string) => {
    const draft = draftAnswers[questionId];
    if (!draft || !draft.trim()) {
      toast.warning("Please type an answer first.");
      return;
    }

    setSubmittingId(questionId);
    const result = await answerQuestion(questionId, draft.trim());
    setSubmittingId(null);

    if (result.success) {
      toast.success("Answer submitted successfully!");
      // Update local state
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === questionId
            ? { ...q, is_answered: true, answer_text: draft.trim(), answered_at: new Date().toISOString() }
            : q
        )
      );
      setDraftAnswers((prev) => {
        const next = { ...prev };
        delete next[questionId];
        return next;
      });
    } else {
      toast.error(result.error || "Failed to submit answer.");
    }
  };

  const handleDraftChange = (questionId: string, text: string) => {
    setDraftAnswers((prev) => ({ ...prev, [questionId]: text }));
  };

  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      // Filter by status
      if (filter === "pending" && q.is_answered) return false;
      if (filter === "answered" && !q.is_answered) return false;

      // Filter by search (product name or question text)
      if (search.trim()) {
        const term = search.toLowerCase();
        const prodName = q.product?.name?.toLowerCase() || "";
        const quesText = q.question_text.toLowerCase();
        return prodName.includes(term) || quesText.includes(term);
      }

      return true;
    });
  }, [questions, filter, search]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-PK", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className={styles.pageLayout}>
      <div className={styles.filterContainer}>
        {/* Search */}
        <div className={styles.searchWrapper}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            type="text"
            placeholder="Search questions or products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        {/* Tab Filters */}
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => setFilter("pending")}
            className={styles.topbarButton}
            style={{
              backgroundColor: filter === "pending" ? "var(--color-gold-muted)" : "transparent",
              color: filter === "pending" ? "var(--color-gold)" : "var(--admin-text-sub)",
              borderColor: filter === "pending" ? "var(--color-gold)" : "var(--admin-border)",
            }}
          >
            Pending Answer ({questions.filter((q) => !q.is_answered).length})
          </button>
          <button
            onClick={() => setFilter("answered")}
            className={styles.topbarButton}
            style={{
              backgroundColor: filter === "answered" ? "var(--color-gold-muted)" : "transparent",
              color: filter === "answered" ? "var(--color-gold)" : "var(--admin-text-sub)",
              borderColor: filter === "answered" ? "var(--color-gold)" : "var(--admin-border)",
            }}
          >
            Answered ({questions.filter((q) => q.is_answered).length})
          </button>
          <button
            onClick={() => setFilter("all")}
            className={styles.topbarButton}
            style={{
              backgroundColor: filter === "all" ? "var(--color-gold-muted)" : "transparent",
              color: filter === "all" ? "var(--color-gold)" : "var(--admin-text-sub)",
              borderColor: filter === "all" ? "var(--color-gold)" : "var(--admin-border)",
            }}
          >
            All Questions ({questions.length})
          </button>
        </div>
      </div>

      {loading ? (
        <p className="font-body text-sm text-admin-text-sub text-center py-12">Loading questions list...</p>
      ) : filteredQuestions.length === 0 ? (
        <div className={styles.tableCard} style={{ padding: "48px", textAlign: "center" }}>
          No questions found matching current filter.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {filteredQuestions.map((q) => (
            <div key={q.id} className={styles.formCard} style={{ gap: "16px" }}>
              {/* Question Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid var(--admin-border)", paddingBottom: "12px" }}>
                <div>
                  <span style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-gold)", fontWeight: "bold" }}>
                    Product Q&amp;A
                  </span>
                  <h4 style={{ margin: "4px 0 0 0", fontFamily: "var(--font-headline)", fontSize: "16px" }}>
                    {q.product ? (
                      <Link href={`/product/${q.product.slug}`} target="_blank" style={{ color: "inherit", textDecoration: "none" }} className={styles.tableLink}>
                        {q.product.name}
                      </Link>
                    ) : (
                      "Unknown Product"
                    )}
                  </h4>
                </div>
                <span style={{ fontSize: "12px", color: "var(--admin-text-sub)" }}>
                  Asked on {formatDate(q.created_at)}
                </span>
              </div>

              {/* Question Text */}
              <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                <span style={{ fontWeight: "bold", color: "var(--color-gold)", fontSize: "14px" }}>Q:</span>
                <p style={{ margin: 0, fontSize: "14px", color: "var(--admin-text)", fontWeight: "500", lineHeight: "1.5" }}>
                  {q.question_text}
                </p>
              </div>

              {/* Answer Panel */}
              {q.is_answered ? (
                <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", backgroundColor: "rgba(255,255,255,0.01)", padding: "12px", borderLeft: "3px solid var(--admin-border)" }}>
                  <span style={{ fontWeight: "bold", color: "var(--admin-text-sub)", fontSize: "14px" }}>A:</span>
                  <div style={{ flexGrow: 1 }}>
                    <p style={{ margin: 0, fontSize: "14px", color: "var(--admin-text-sub)", lineHeight: "1.5" }}>
                      {q.answer_text}
                    </p>
                    {q.answered_at && (
                      <span style={{ display: "block", fontSize: "10px", color: "var(--admin-text-sub)", marginTop: "6px" }}>
                        Answered on {formatDate(q.answered_at)}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "4px" }}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel} style={{ fontSize: "11px" }}>Compose Answer</label>
                    <textarea
                      value={draftAnswers[q.id] || ""}
                      onChange={(e) => handleDraftChange(q.id, e.target.value)}
                      placeholder="Type the response to be displayed on the product page..."
                      rows={3}
                      className={styles.formTextarea}
                      disabled={submittingId === q.id}
                    />
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <Button
                      type="button"
                      variant="luxury"
                      onClick={() => handleAnswerSubmit(q.id)}
                      isLoading={submittingId === q.id}
                      disabled={!draftAnswers[q.id]?.trim()}
                      style={{ paddingInline: "24px" }}
                    >
                      Publish Answer &amp; Display Publicly
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
