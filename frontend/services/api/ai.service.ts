import api from "./auth.service";

export interface ChatMessage {
  role: "user" | "model";
  text: string;
}

export interface AiChatResponse {
  answer: string;
  suggestedQuestions: string[];
  courseTitle: string;
}

export async function sendCourseChatMessage(
  courseId: number | string,
  question: string,
  history: ChatMessage[] = []
): Promise<{ success: boolean; data?: AiChatResponse; message?: string }> {
  try {
    const response = await api.post(`/courses/${courseId}/chat`, {
      question,
      history,
    });
    return response.data;
  } catch (error: any) {
    console.error("AI Course Chat error:", error);
    return {
      success: false,
      message: error?.response?.data?.message || "Failed to generate response from AI Assistant.",
    };
  }
}
