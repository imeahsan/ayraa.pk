"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { JobOpening } from "@/types";

export async function getActiveJobOpenings(): Promise<{ success: boolean; data: JobOpening[]; error?: string }> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("job_openings")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      // If table doesn't exist yet, return empty list gracefully
      console.warn("job_openings query issue (table might be newly created):", error.message);
      return { success: true, data: [] };
    }

    return { success: true, data: (data as JobOpening[]) || [] };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to fetch job openings";
    console.error("Failed to fetch active job openings:", err);
    return { success: false, data: [], error: errorMsg };
  }
}

export async function getAllJobOpeningsAdmin(): Promise<{ success: boolean; data: JobOpening[]; error?: string }> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("job_openings")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("job_openings admin query notice:", error.message);
      return { success: true, data: [] };
    }

    return { success: true, data: (data as JobOpening[]) || [] };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to fetch jobs";
    console.error("Admin fetch job openings error:", err);
    return { success: false, data: [], error: errorMsg };
  }
}

export async function createJobOpening(input: Omit<JobOpening, "id" | "created_at" | "updated_at">): Promise<{ success: boolean; data?: JobOpening; error?: string }> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("job_openings")
      .insert({
        title: input.title.trim(),
        department: input.department.trim(),
        location: input.location?.trim() || "Lahore, Pakistan",
        employment_type: input.employment_type?.trim() || "Full-time",
        experience_level: input.experience_level?.trim() || null,
        description: input.description.trim(),
        requirements: input.requirements?.trim() || null,
        responsibilities: input.responsibilities?.trim() || null,
        benefits: input.benefits?.trim() || null,
        salary_range: input.salary_range?.trim() || null,
        is_active: input.is_active ?? true,
        apply_email: input.apply_email?.trim() || "careers@ayraa.pk",
        sort_order: Number(input.sort_order) || 0,
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath("/careers");
    revalidatePath("/admin/careers");
    return { success: true, data: data as JobOpening };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to create job posting";
    console.error("Failed to create job opening:", err);
    return { success: false, error: errorMsg };
  }
}

export async function updateJobOpening(
  id: string,
  input: Partial<Omit<JobOpening, "id" | "created_at">>
): Promise<{ success: boolean; data?: JobOpening; error?: string }> {
  try {
    const supabase = await createClient();
    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (input.title !== undefined) updatePayload.title = input.title.trim();
    if (input.department !== undefined) updatePayload.department = input.department.trim();
    if (input.location !== undefined) updatePayload.location = input.location.trim();
    if (input.employment_type !== undefined) updatePayload.employment_type = input.employment_type.trim();
    if (input.experience_level !== undefined) updatePayload.experience_level = input.experience_level?.trim() || null;
    if (input.description !== undefined) updatePayload.description = input.description.trim();
    if (input.requirements !== undefined) updatePayload.requirements = input.requirements?.trim() || null;
    if (input.responsibilities !== undefined) updatePayload.responsibilities = input.responsibilities?.trim() || null;
    if (input.benefits !== undefined) updatePayload.benefits = input.benefits?.trim() || null;
    if (input.salary_range !== undefined) updatePayload.salary_range = input.salary_range?.trim() || null;
    if (input.is_active !== undefined) updatePayload.is_active = input.is_active;
    if (input.apply_email !== undefined) updatePayload.apply_email = input.apply_email?.trim() || "careers@ayraa.pk";
    if (input.sort_order !== undefined) updatePayload.sort_order = Number(input.sort_order) || 0;

    const { data, error } = await supabase
      .from("job_openings")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    revalidatePath("/careers");
    revalidatePath("/admin/careers");
    return { success: true, data: data as JobOpening };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to update job posting";
    console.error("Failed to update job opening:", err);
    return { success: false, error: errorMsg };
  }
}

export async function toggleJobOpeningStatus(id: string, isActive: boolean): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("job_openings")
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) throw error;

    revalidatePath("/careers");
    revalidatePath("/admin/careers");
    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to update job status";
    console.error("Failed to toggle job opening status:", err);
    return { success: false, error: errorMsg };
  }
}

export async function deleteJobOpening(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("job_openings").delete().eq("id", id);

    if (error) throw error;

    revalidatePath("/careers");
    revalidatePath("/admin/careers");
    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to delete job opening";
    console.error("Failed to delete job opening:", err);
    return { success: false, error: errorMsg };
  }
}
