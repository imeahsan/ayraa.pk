"use server";

import { createClient } from "@/lib/supabase/server";

export async function submitQuestion(productId: string, questionText: string) {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("product_questions")
      .insert({
        product_id: productId,
        question_text: questionText,
        is_answered: false,
      });

    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error("Failed to submit question:", err);
    return { success: false, error: err.message || "Failed to submit question" };
  }
}

export async function answerQuestion(questionId: string, answerText: string) {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("product_questions")
      .update({
        answer_text: answerText,
        is_answered: true,
        answered_at: new Date().toISOString(),
      })
      .eq("id", questionId);

    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error("Failed to answer question:", err);
    return { success: false, error: err.message || "Failed to submit answer" };
  }
}
