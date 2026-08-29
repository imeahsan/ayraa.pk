"use client";

import React, { useState, useEffect, useMemo } from "react";
import { JobOpening } from "@/types";
import { useToast } from "@/context/ToastContext";
import { Button } from "@/components/storefront/Button/Button";
import {
  getAllJobOpeningsAdmin,
  createJobOpening,
  updateJobOpening,
  deleteJobOpening,
  toggleJobOpeningStatus,
} from "@/app/actions/careers";
import styles from "../admin.module.css";

const DEPARTMENTS = [
  "Marketing & Growth",
  "Creative & Photography",
  "E-Commerce & Operations",
  "Fashion & Merchandising",
  "Customer Experience",
  "Technology & Product",
  "Finance & Admin",
  "Other",
];

const EMPLOYMENT_TYPES = [
  "Full-time",
  "Part-time",
  "Remote",
  "Freelance / Project",
  "Internship",
];

export default function AdminCareersPage() {
  const toast = useToast();
  const [jobs, setJobs] = useState<JobOpening[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<JobOpening | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form Fields
  const [title, setTitle] = useState("");
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [customDepartment, setCustomDepartment] = useState("");
  const [location, setLocation] = useState("Lahore, Pakistan");
  const [employmentType, setEmploymentType] = useState("Full-time");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [description, setDescription] = useState("");
  const [requirements, setRequirements] = useState("");
  const [responsibilities, setResponsibilities] = useState("");
  const [benefits, setBenefits] = useState("");
  const [salaryRange, setSalaryRange] = useState("");
  const [applyEmail, setApplyEmail] = useState("careers@ayraa.pk");
  const [sortOrder, setSortOrder] = useState("0");
  const [isActive, setIsActive] = useState(true);

  const fetchJobs = async () => {
    setLoading(true);
    const res = await getAllJobOpeningsAdmin();
    if (res.success) {
      setJobs(res.data);
    } else {
      toast.error(res.error || "Failed to load jobs");
      setJobs([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const resetForm = () => {
    setEditingJob(null);
    setTitle("");
    setDepartment(DEPARTMENTS[0]);
    setCustomDepartment("");
    setLocation("Lahore, Pakistan");
    setEmploymentType("Full-time");
    setExperienceLevel("");
    setDescription("");
    setRequirements("");
    setResponsibilities("");
    setBenefits("");
    setSalaryRange("");
    setApplyEmail("careers@ayraa.pk");
    setSortOrder("0");
    setIsActive(true);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (job: JobOpening) => {
    setEditingJob(job);
    setTitle(job.title);
    if (DEPARTMENTS.includes(job.department)) {
      setDepartment(job.department);
      setCustomDepartment("");
    } else {
      setDepartment("Other");
      setCustomDepartment(job.department);
    }
    setLocation(job.location || "Lahore, Pakistan");
    setEmploymentType(job.employment_type || "Full-time");
    setExperienceLevel(job.experience_level || "");
    setDescription(job.description || "");
    setRequirements(job.requirements || "");
    setResponsibilities(job.responsibilities || "");
    setBenefits(job.benefits || "");
    setSalaryRange(job.salary_range || "");
    setApplyEmail(job.apply_email || "careers@ayraa.pk");
    setSortOrder(String(job.sort_order ?? 0));
    setIsActive(job.is_active);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.warning("Please enter a job title");
      return;
    }
    if (!description.trim()) {
      toast.warning("Please enter a job description");
      return;
    }

    const finalDepartment = department === "Other" && customDepartment.trim() ? customDepartment.trim() : department;

    setSaving(true);
    try {
      if (editingJob) {
        const res = await updateJobOpening(editingJob.id, {
          title,
          department: finalDepartment,
          location,
          employment_type: employmentType,
          experience_level: experienceLevel || null,
          description,
          requirements: requirements || null,
          responsibilities: responsibilities || null,
          benefits: benefits || null,
          salary_range: salaryRange || null,
          apply_email: applyEmail,
          sort_order: Number(sortOrder) || 0,
          is_active: isActive,
        });

        if (res.success && res.data) {
          toast.success("Job opening updated successfully!");
          setJobs((prev) => prev.map((j) => (j.id === editingJob.id ? res.data! : j)));
          setIsModalOpen(false);
          resetForm();
        } else {
          toast.error(res.error || "Failed to update job opening");
        }
      } else {
        const res = await createJobOpening({
          title,
          department: finalDepartment,
          location,
          employment_type: employmentType,
          experience_level: experienceLevel || null,
          description,
          requirements: requirements || null,
          responsibilities: responsibilities || null,
          benefits: benefits || null,
          salary_range: salaryRange || null,
          apply_email: applyEmail,
          sort_order: Number(sortOrder) || 0,
          is_active: isActive,
        });

        if (res.success && res.data) {
          toast.success("Job opening published successfully!");
          setJobs((prev) => [res.data!, ...prev]);
          setIsModalOpen(false);
          resetForm();
        } else {
          toast.error(res.error || "Failed to create job opening");
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (job: JobOpening) => {
    const nextStatus = !job.is_active;
    // Optimistic update
    setJobs((prev) => prev.map((j) => (j.id === job.id ? { ...j, is_active: nextStatus } : j)));

    const res = await toggleJobOpeningStatus(job.id, nextStatus);
    if (res.success) {
      toast.success(`Job is now ${nextStatus ? "active" : "draft / hidden"}`);
    } else {
      // Revert
      setJobs((prev) => prev.map((j) => (j.id === job.id ? { ...j, is_active: job.is_active } : j)));
      toast.error(res.error || "Failed to change job status");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this job posting? This action cannot be undone.")) {
      return;
    }

    setDeletingId(id);
    const res = await deleteJobOpening(id);
    setDeletingId(null);

    if (res.success) {
      toast.success("Job opening deleted");
      setJobs((prev) => prev.filter((j) => j.id !== id));
    } else {
      toast.error(res.error || "Failed to delete job opening");
    }
  };

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      if (statusFilter === "active" && !job.is_active) return false;
      if (statusFilter === "inactive" && job.is_active) return false;
      if (departmentFilter !== "all" && job.department !== departmentFilter) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        const matchTitle = job.title.toLowerCase().includes(q);
        const matchDept = job.department.toLowerCase().includes(q);
        const matchLoc = job.location.toLowerCase().includes(q);
        if (!matchTitle && !matchDept && !matchLoc) return false;
      }

      return true;
    });
  }, [jobs, statusFilter, departmentFilter, search]);

  const stats = useMemo(() => {
    const total = jobs.length;
    const active = jobs.filter((j) => j.is_active).length;
    const inactive = total - active;
    return { total, active, inactive };
  }, [jobs]);

  const uniqueDepartments = useMemo(() => {
    const set = new Set(jobs.map((j) => j.department));
    return Array.from(set);
  }, [jobs]);

  return (
    <div className={styles.mainContent}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Careers & Job Openings</h1>
          <p className={styles.pageSubtitle}>
            Manage job vacancies, postings, and roles displayed on the public /careers page.
          </p>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <a
            href="/careers"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.secondaryButton}
            style={{ textDecoration: "none", display: "inline-flex", alignItems: "center" }}
          >
            View Live Careers Page ↗
          </a>
          <Button onClick={handleOpenCreate} variant="primary">
            + Post New Job
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Total Postings</div>
          <div className={styles.statValue}>{stats.total}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Active on Storefront</div>
          <div className={styles.statValue} style={{ color: "var(--color-success, #22c55e)" }}>
            {stats.active}
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Draft / Hidden</div>
          <div className={styles.statValue} style={{ color: "var(--admin-text-sub)" }}>
            {stats.inactive}
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div
        className={styles.tableCard}
        style={{
          padding: "16px 20px",
          marginBottom: "20px",
          display: "flex",
          gap: "16px",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", flex: 1, minWidth: "280px" }}>
          <input
            type="text"
            placeholder="Search by role title, department, or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.inputField}
            style={{ maxWidth: "340px" }}
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className={styles.inputField}
            style={{ width: "auto" }}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Draft / Hidden</option>
          </select>

          {uniqueDepartments.length > 0 && (
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className={styles.inputField}
              style={{ width: "auto" }}
            >
              <option value="all">All Departments</option>
              {uniqueDepartments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          )}
        </div>

        <div style={{ fontSize: "13px", color: "var(--admin-text-sub)" }}>
          Showing {filteredJobs.length} of {jobs.length} postings
        </div>
      </div>

      {/* Jobs List / Table */}
      <div className={styles.tableCard}>
        {loading ? (
          <div style={{ padding: "48px", textAlign: "center", color: "var(--admin-text-sub)" }}>
            Loading job postings...
          </div>
        ) : filteredJobs.length === 0 ? (
          <div style={{ padding: "56px 24px", textAlign: "center" }}>
            <div style={{ fontSize: "36px", marginBottom: "12px" }}>💼</div>
            <h3 style={{ fontSize: "18px", fontWeight: 600, color: "var(--admin-text)", marginBottom: "8px" }}>
              {jobs.length === 0 ? "No Job Openings Created Yet" : "No Jobs Match Your Filter"}
            </h3>
            <p style={{ fontSize: "14px", color: "var(--admin-text-sub)", maxWidth: "440px", margin: "0 auto 20px" }}>
              {jobs.length === 0
                ? "Your storefront /careers page is currently showing the 'No Active Openings' state. Click below to publish your first position whenever you are hiring."
                : "Try adjusting your search keywords or filter settings."}
            </p>
            {jobs.length === 0 && (
              <Button onClick={handleOpenCreate} variant="primary">
                + Create First Job Posting
              </Button>
            )}
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Job Title & Details</th>
                  <th>Department</th>
                  <th>Type & Location</th>
                  <th>Salary Range</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredJobs.map((job) => (
                  <tr key={job.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: "var(--admin-text)", fontSize: "15px" }}>
                        {job.title}
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "var(--admin-text-sub)",
                          marginTop: "4px",
                          maxWidth: "360px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {job.description}
                      </div>
                    </td>
                    <td>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "4px 10px",
                          borderRadius: "4px",
                          fontSize: "12px",
                          fontWeight: 500,
                          backgroundColor: "rgba(212, 175, 55, 0.12)",
                          color: "var(--color-gold)",
                        }}
                      >
                        {job.department}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: "13px", fontWeight: 500 }}>{job.employment_type}</div>
                      <div style={{ fontSize: "12px", color: "var(--admin-text-sub)" }}>{job.location}</div>
                    </td>
                    <td>
                      <span style={{ fontSize: "13px", color: "var(--admin-text-sub)" }}>
                        {job.salary_range || "—"}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(job)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "4px 12px",
                          borderRadius: "12px",
                          border: "none",
                          cursor: "pointer",
                          fontSize: "12px",
                          fontWeight: 600,
                          backgroundColor: job.is_active ? "rgba(34, 197, 94, 0.15)" : "rgba(255, 255, 255, 0.08)",
                          color: job.is_active ? "#22c55e" : "var(--admin-text-sub)",
                          transition: "all 0.2s ease",
                        }}
                        title="Click to toggle status"
                      >
                        <span
                          style={{
                            width: "6px",
                            height: "6px",
                            borderRadius: "50%",
                            backgroundColor: job.is_active ? "#22c55e" : "#888",
                          }}
                        />
                        {job.is_active ? "Active" : "Draft"}
                      </button>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "8px" }}>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(job)}
                          className={styles.secondaryButton}
                          style={{ padding: "6px 12px", fontSize: "12px" }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(job.id)}
                          disabled={deletingId === job.id}
                          style={{
                            padding: "6px 12px",
                            fontSize: "12px",
                            backgroundColor: "rgba(239, 68, 68, 0.12)",
                            color: "#ef4444",
                            border: "1px solid rgba(239, 68, 68, 0.25)",
                            borderRadius: "4px",
                            cursor: "pointer",
                          }}
                        >
                          {deletingId === job.id ? "..." : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "20px",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
        >
          <div
            style={{
              backgroundColor: "var(--admin-sidebar, #141b2d)",
              border: "1px solid var(--admin-border, rgba(255,255,255,0.1))",
              borderRadius: "8px",
              width: "100%",
              maxWidth: "680px",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "28px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
                paddingBottom: "12px",
                borderBottom: "1px solid var(--admin-border)",
              }}
            >
              <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--admin-text)", margin: 0 }}>
                {editingJob ? "Edit Job Opening" : "Create New Job Opening"}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--admin-text-sub)",
                  fontSize: "20px",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Job Title */}
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 500, marginBottom: "6px" }}>
                  Job Title <span style={{ color: "red" }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior Fashion Merchandiser, Creative Video Editor"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={styles.inputField}
                  style={{ width: "100%" }}
                />
              </div>

              {/* Department & Employment Type */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 500, marginBottom: "6px" }}>
                    Department <span style={{ color: "red" }}>*</span>
                  </label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className={styles.inputField}
                    style={{ width: "100%" }}
                  >
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 500, marginBottom: "6px" }}>
                    Employment Type <span style={{ color: "red" }}>*</span>
                  </label>
                  <select
                    value={employmentType}
                    onChange={(e) => setEmploymentType(e.target.value)}
                    className={styles.inputField}
                    style={{ width: "100%" }}
                  >
                    {EMPLOYMENT_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {department === "Other" && (
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 500, marginBottom: "6px" }}>
                    Custom Department Name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter department name"
                    value={customDepartment}
                    onChange={(e) => setCustomDepartment(e.target.value)}
                    className={styles.inputField}
                    style={{ width: "100%" }}
                  />
                </div>
              )}

              {/* Location & Experience Level */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 500, marginBottom: "6px" }}>
                    Location
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Lahore, Pakistan or Remote"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className={styles.inputField}
                    style={{ width: "100%" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 500, marginBottom: "6px" }}>
                    Experience Level (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 1-2 years, Mid-Senior"
                    value={experienceLevel}
                    onChange={(e) => setExperienceLevel(e.target.value)}
                    className={styles.inputField}
                    style={{ width: "100%" }}
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 500, marginBottom: "6px" }}>
                  Role Summary / Short Description <span style={{ color: "red" }}>*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Provide a clear, engaging overview of this role and what the person will be doing..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={styles.inputField}
                  style={{ width: "100%", resize: "vertical", fontFamily: "inherit" }}
                />
              </div>

              {/* Responsibilities */}
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 500, marginBottom: "6px" }}>
                  Key Responsibilities (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Key day-to-day duties and goals..."
                  value={responsibilities}
                  onChange={(e) => setResponsibilities(e.target.value)}
                  className={styles.inputField}
                  style={{ width: "100%", resize: "vertical", fontFamily: "inherit" }}
                />
              </div>

              {/* Requirements */}
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 500, marginBottom: "6px" }}>
                  Requirements & Qualifications (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Skills, portfolio expectations, tools, background..."
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  className={styles.inputField}
                  style={{ width: "100%", resize: "vertical", fontFamily: "inherit" }}
                />
              </div>

              {/* Salary & Application Email */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 500, marginBottom: "6px" }}>
                    Salary Range / Compensation Note (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. PKR 70,000 - 100,000 / month"
                    value={salaryRange}
                    onChange={(e) => setSalaryRange(e.target.value)}
                    className={styles.inputField}
                    style={{ width: "100%" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 500, marginBottom: "6px" }}>
                    Application Email
                  </label>
                  <input
                    type="email"
                    placeholder="careers@ayraa.pk"
                    value={applyEmail}
                    onChange={(e) => setApplyEmail(e.target.value)}
                    className={styles.inputField}
                    style={{ width: "100%" }}
                  />
                </div>
              </div>

              {/* Active Toggle & Sort Order */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 16px",
                  backgroundColor: "rgba(255,255,255,0.03)",
                  borderRadius: "6px",
                  border: "1px solid var(--admin-border)",
                }}
              >
                <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: "13px" }}>
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    style={{ width: "18px", height: "18px", cursor: "pointer" }}
                  />
                  <span>
                    <strong>Publish as Active</strong> (Visible immediately on /careers page)
                  </span>
                </label>

                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "12px", color: "var(--admin-text-sub)" }}>Sort Order:</span>
                  <input
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className={styles.inputField}
                    style={{ width: "60px", padding: "4px 8px" }}
                  />
                </div>
              </div>

              {/* Form Action Buttons */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "12px" }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className={styles.secondaryButton}
                  disabled={saving}
                >
                  Cancel
                </button>
                <Button type="submit" variant="primary" disabled={saving}>
                  {saving ? "Saving..." : editingJob ? "Update Job Posting" : "Publish Job Opening"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
