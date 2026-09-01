import { PrismaClient } from "@prisma/client";
import { GoogleGenAI } from "@google/genai";
import { YoutubeTranscript } from "youtube-transcript";
import fs from "fs";
import path from "path";
import https from "https";
import dotenv from "dotenv";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const prisma = new PrismaClient();

export interface ChatMessagePayload {
  role: "user" | "model";
  text: string;
}

interface CourseContextCache {
  curriculumSummary: string;
  attachedPdfParts: Array<{ inlineData: { mimeType: string; data: string } }>;
  attachedFileNames: string[];
  timestamp: number;
}

// In-Memory Course Context Cache (15 min TTL) for sub-second responses
const courseContextCacheMap = new Map<string, CourseContextCache>();
const CACHE_TTL_MS = 15 * 60 * 1000;

// Helper to safely fetch HTTPS with SSL bypass for corporate environments
function fetchHttps(url: string, timeoutMs: number = 3000): Promise<string> {
  return new Promise((resolve) => {
    const req = https.get(
      url,
      {
        rejectUnauthorized: false,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept-Language": "en-US,en;q=0.9",
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => resolve(data));
      }
    );

    req.setTimeout(timeoutMs, () => {
      req.destroy();
      resolve("");
    });

    req.on("error", () => resolve(""));
  });
}

// Helper to execute Groq API call (Llama 3 70B / groq/compound)
function callGroqApi(apiKey: string, model: string, messages: any[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ model, messages, temperature: 0.3 });
    const urlObj = new URL("https://api.groq.com/openai/v1/chat/completions");

    const req = https.request(
      urlObj,
      {
        method: "POST",
        rejectUnauthorized: false,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(postData),
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const json = JSON.parse(data);
            if (json.choices && json.choices[0] && json.choices[0].message) {
              resolve(json.choices[0].message.content || "");
            } else if (json.error && json.error.message) {
              reject(new Error(json.error.message));
            } else {
              resolve(data);
            }
          } catch (e) {
            reject(e);
          }
        });
      }
    );

    req.on("error", reject);
    req.write(postData);
    req.end();
  });
}

function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  return match ? match[1] : null;
}

// Helper to fetch YouTube Video Title & Spoken Subtitle Transcript with timeout
async function getYouTubeVideoInfo(videoUrl: string): Promise<{ title?: string; author?: string; transcript?: string }> {
  const videoId = extractYouTubeId(videoUrl);
  if (!videoId) return {};

  let title: string | undefined;
  let author: string | undefined;
  let transcript: string | undefined;

  try {
    const rawMeta = await fetchHttps(`https://noembed.com/embed?url=${encodeURIComponent(videoUrl)}`, 2500);
    if (rawMeta) {
      const data = JSON.parse(rawMeta);
      title = data.title;
      author = data.author_name;
    }
  } catch (_) {}

  try {
    const items = await YoutubeTranscript.fetchTranscript(videoUrl);
    if (items && items.length > 0) {
      transcript = items.map((i) => i.text).join(" ");
    }
  } catch (_) {}

  return { title, author, transcript };
}

// Universal Web Content Scraper with fast timeout
async function fetchExternalWebPageContent(url: string): Promise<{ title?: string; text?: string }> {
  if (!url || !url.startsWith("http")) return {};
  if (extractYouTubeId(url)) return {};

  try {
    const rawHtml = await fetchHttps(url, 3000);
    if (!rawHtml || rawHtml.length < 50) return {};

    let title: string | undefined;
    const titleMatch = rawHtml.match(/<title[^>]*>(.*?)<\/title>/i);
    if (titleMatch && titleMatch[1]) {
      title = titleMatch[1].replace(/&amp;/g, "&").replace(/&#39;/g, "'").trim();
    }

    let cleanText = rawHtml
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, " ")
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, " ")
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (cleanText.length > 3500) {
      cleanText = cleanText.substring(0, 3500) + "...";
    }

    return { title, text: cleanText };
  } catch (_) {}
  return {};
}

export class AiCourseService {
  async processCourseChat(
    courseId: bigint,
    userQuestion: string,
    history: ChatMessagePayload[] = []
  ) {
    dotenv.config();

    const courseKey = String(courseId);
    const groqApiKey = (process.env.GROQ_API_KEY || "").trim();
    const geminiApiKey = (process.env.GEMINI_API_KEY || "").trim();

    const activeKey = groqApiKey || (geminiApiKey.startsWith("gsk_") ? geminiApiKey : "");
    const fallbackGeminiKey = geminiApiKey.startsWith("AIza") ? geminiApiKey : "";

    if (!activeKey && !fallbackGeminiKey) {
      return {
        answer:
          "⚠️ **AI API Key Missing**: Please paste your Groq API key (`gsk_...`) or Gemini API key into `GROQ_API_KEY` in `backend/.env` to enable live AI answers!",
        suggestedQuestions: [
          "Summarize this course",
          "What topics are covered in Module 1?",
          "Give me 3 practice quiz questions",
        ],
        courseTitle: "Course",
      };
    }

    let curriculumSummary = "";
    let attachedPdfParts: Array<{ inlineData: { mimeType: string; data: string } }> = [];
    let attachedFileNames: string[] = [];

    // 1. FAST PATH: Check In-Memory Context Cache for Course
    const cached = courseContextCacheMap.get(courseKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      curriculumSummary = cached.curriculumSummary;
      attachedPdfParts = cached.attachedPdfParts;
      attachedFileNames = cached.attachedFileNames;
    } else {
      // 2. CACHE MISS: Build Course Context with Parallel Web & YouTube Fetches
      const course = await prisma.course.findFirst({
        where: { id: courseId, isActive: true },
        include: {
          category: true,
          department: true,
          sections: {
            where: { isActive: true },
            orderBy: { sectionOrder: "asc" },
            include: {
              contents: {
                where: { isActive: true },
                orderBy: { contentOrder: "asc" },
              },
            },
          },
        },
      });

      if (!course) {
        throw new Error("Course not found");
      }

      curriculumSummary = `Course Overview:\n`;
      curriculumSummary += `- Title: ${course.title}\n`;
      curriculumSummary += `- Category: ${course.category?.name || "General"}\n`;
      curriculumSummary += `- Short Overview: ${course.shortDescription || "N/A"}\n`;
      curriculumSummary += `- Description: ${course.description || "N/A"}\n\n`;
      curriculumSummary += `Curriculum Modules & Detailed Content:\n`;

      const asyncFetchTasks: Array<Promise<void>> = [];

      for (let sIdx = 0; sIdx < (course.sections || []).length; sIdx++) {
        const sec = course.sections[sIdx];
        curriculumSummary += `\nModule ${sIdx + 1}: ${sec.title}\n`;
        if (sec.description) curriculumSummary += `  Module Description: ${sec.description}\n`;

        for (let cIdx = 0; cIdx < (sec.contents || []).length; cIdx++) {
          const cnt = sec.contents[cIdx];
          curriculumSummary += `  - [Type: ${cnt.contentType}] Title: "${cnt.title}"\n`;
          if (cnt.description) curriculumSummary += `    Description: ${cnt.description}\n`;

          // Quiz questions
          if (cnt.quizConfigJson) {
            try {
              const quizData = JSON.parse(cnt.quizConfigJson);
              if (quizData.questions && Array.isArray(quizData.questions)) {
                curriculumSummary += `    [Quiz Content Questions & Answers]:\n`;
                quizData.questions.forEach((q: any, qIdx: number) => {
                  curriculumSummary += `      Q${qIdx + 1}: ${q.question || q.text}\n`;
                  if (Array.isArray(q.options)) {
                    curriculumSummary += `        Options: ${q.options.join(" | ")}\n`;
                  }
                  if (q.explanation) {
                    curriculumSummary += `        Explanation: ${q.explanation}\n`;
                  }
                });
              }
            } catch (e) {}
          }

          // Assignment instructions
          if (cnt.assignmentConfigJson) {
            try {
              const assignData = JSON.parse(cnt.assignmentConfigJson);
              if (assignData.instructions || assignData.prompt || assignData.title) {
                curriculumSummary += `    [Assignment Details]: ${assignData.instructions || assignData.prompt || ""}\n`;
              }
            } catch (e) {}
          }

          // YouTube Transcripts (Parallel)
          if (
            cnt.contentType?.toUpperCase() === "YOUTUBE" ||
            cnt.contentType?.toUpperCase() === "VIDEO" ||
            (cnt.contentUrl && extractYouTubeId(cnt.contentUrl))
          ) {
            if (cnt.contentUrl) {
              const targetUrl = cnt.contentUrl;
              const targetTitle = cnt.title;
              asyncFetchTasks.push(
                getYouTubeVideoInfo(targetUrl).then((ytInfo) => {
                  if (ytInfo.title || ytInfo.transcript) {
                    curriculumSummary += `    [YouTube Video Metadata]: Title: "${ytInfo.title || targetTitle}" | Channel: "${ytInfo.author || "N/A"}"\n`;
                    if (ytInfo.transcript) {
                      curriculumSummary += `    [YouTube Video Spoken Transcript]: "${ytInfo.transcript.substring(0, 3500)}"\n`;
                    }
                  }
                })
              );
            }
          }

          // External Web Links (Parallel)
          if (
            cnt.contentUrl &&
            cnt.contentUrl.startsWith("http") &&
            !extractYouTubeId(cnt.contentUrl)
          ) {
            const targetUrl = cnt.contentUrl;
            const targetTitle = cnt.title;
            asyncFetchTasks.push(
              fetchExternalWebPageContent(targetUrl).then((webContent) => {
                if (webContent.title || webContent.text) {
                  curriculumSummary += `    [External Link Title]: "${webContent.title || targetTitle}"\n`;
                  if (webContent.text) {
                    curriculumSummary += `    [External Link Page Text]: "${webContent.text}"\n`;
                  }
                }
              })
            );
          }

          // SCORM HTML File Text Content from Disk
          if (
            (cnt.contentType?.toUpperCase() === "SCORM" || cnt.contentUrl?.includes("/scorm/")) &&
            cnt.contentUrl
          ) {
            try {
              let relPath = cnt.contentUrl.startsWith("/") ? cnt.contentUrl.substring(1) : cnt.contentUrl;
              let scormFolder = path.join(process.cwd(), "public", relPath);

              if (fs.existsSync(scormFolder) && fs.statSync(scormFolder).isDirectory()) {
                const files = fs.readdirSync(scormFolder);
                const htmlFiles = files.filter((f) => f.endsWith(".html") || f.endsWith(".htm"));
                for (const hf of htmlFiles.slice(0, 2)) {
                  const htmlPath = path.join(scormFolder, hf);
                  const htmlContent = fs.readFileSync(htmlPath, "utf-8");
                  const scormText = htmlContent
                    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
                    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
                    .replace(/<[^>]+>/g, " ")
                    .replace(/\s+/g, " ")
                    .trim();
                  if (scormText.length > 50) {
                    curriculumSummary += `    [SCORM Module Text Content (${hf})]: "${scormText.substring(0, 2500)}"\n`;
                  }
                }
              }
            } catch (_) {}
          }

          // PDF and PPTX Attachments
          if (cnt.contentUrl && typeof cnt.contentUrl === "string") {
            let relPath = cnt.contentUrl.startsWith("/") ? cnt.contentUrl.substring(1) : cnt.contentUrl;
            let fullFilePath = path.join(process.cwd(), "public", relPath);

            if (!fs.existsSync(fullFilePath)) {
              const baseName = path.basename(cnt.contentUrl);
              fullFilePath = path.join(process.cwd(), "public", "storage", "uploads", baseName);
            }

            if (!fs.existsSync(fullFilePath) && fullFilePath.toLowerCase().endsWith(".pptx")) {
              const pdfName = path.basename(fullFilePath).replace(/\.pptx$/i, ".converted.pdf");
              fullFilePath = path.join(process.cwd(), "public", "storage", "uploads", pdfName);
            }

            if (fs.existsSync(fullFilePath)) {
              const ext = path.extname(fullFilePath).toLowerCase();
              if (ext === ".pdf") {
                try {
                  const stat = fs.statSync(fullFilePath);
                  if (stat.size <= 20 * 1024 * 1024) {
                    const pdfBuf = fs.readFileSync(fullFilePath);
                    attachedPdfParts.push({
                      inlineData: {
                        mimeType: "application/pdf",
                        data: pdfBuf.toString("base64"),
                      },
                    });
                    attachedFileNames.push(cnt.title || path.basename(fullFilePath));
                    curriculumSummary += `    [Attached PDF Document]: ${cnt.title} (${path.basename(fullFilePath)})\n`;
                  }
                } catch (pdfErr) {}
              }
            }
          }
        }
      }

      // Execute all async fetches concurrently with short timeouts
      await Promise.all(asyncFetchTasks);

      // Store in memory cache
      courseContextCacheMap.set(courseKey, {
        curriculumSummary,
        attachedPdfParts,
        attachedFileNames,
        timestamp: Date.now(),
      });
    }

    const systemPrompt = `You are an expert AI Tutor and Learning Assistant for this course.

CRITICAL INSTRUCTIONS:
1. Base your answer EXCLUSIVELY and ACCURATELY on the course materials, uploaded PDF documents, PPT presentations, YouTube transcripts, SCORM module text, External Web Links, Udemy Links, Quizzes, and module contents provided below.
2. If the student asks about an external web link, article, or Udemy link, search through [External Link Page Text] to answer directly from the page text.
3. If the student asks about a SCORM package, search through [SCORM Module Text Content] to provide a detailed summary.
4. If the student asks to "summarize the YouTube video" or asks about the video, search through [YouTube Video Spoken Transcript] and [YouTube Video Metadata] to give an exact, detailed video summary.
5. If the student asks for information "from the PDF" or "from the document", search through attached PDF document(s) and provide the exact answer.
6. Attached PDF Document(s): ${attachedFileNames.length > 0 ? attachedFileNames.join(", ") : "None"}.
7. MANDATORY SOURCE ATTRIBUTION: At the end of every answer (before SUGGESTED_QUESTIONS), you MUST include a dedicated source line specifying the exact source materials used to construct the answer (e.g., 📌 **Source**: YouTube Video ("Title") OR 📌 **Source**: External Link ("Title") OR 📌 **Source**: SCORM Module OR 📌 **Source**: PDF Document ("Filename.pdf")).
8. Format your response cleanly using GitHub Markdown (use bolding, bullet points, and code blocks where appropriate).
9. If a student asks a question about a topic that is completely absent from the course documents, inform them clearly that it is not covered in the current course files and explain what IS covered.
10. Provide 2-3 relevant follow-up questions at the very end of your response under a section labeled "SUGGESTED_QUESTIONS:" separated by newlines.

--- COURSE MATERIALS & CURRICULUM TEXT ---
${curriculumSummary}`;

    try {
      let fullText = "";

      // 1. PRIMARY PROVIDER: GROQ CLOUD (gsk_ key)
      if (activeKey && activeKey.startsWith("gsk_")) {
        try {
          const groqMessages = [{ role: "system", content: systemPrompt }];

          (history || []).slice(-6).forEach((msg) => {
            groqMessages.push({
              role: msg.role === "user" ? "user" : "assistant",
              content: msg.text,
            });
          });

          groqMessages.push({ role: "user", content: userQuestion });

          fullText = await callGroqApi(activeKey, "groq/compound", groqMessages);
        } catch (groqErr: any) {
          console.warn("Groq API rate limit or error hit. Falling back to Gemini 3.6 Flash:", groqErr?.message || groqErr);
        }
      }

      // 2. FALLBACK PROVIDER: GOOGLE GEMINI (if Groq unavailable/rate limited)
      const validGeminiKey = fallbackGeminiKey || (geminiApiKey && !geminiApiKey.startsWith("gsk_") ? geminiApiKey : "");
      if (!fullText && validGeminiKey) {
        try {
          const ai = new GoogleGenAI({ apiKey: validGeminiKey });
          const promptParts: any[] = [];

          attachedPdfParts.forEach((pdfPart) => promptParts.push(pdfPart));
          promptParts.push({ text: systemPrompt });

          if (history && history.length > 0) {
            let historyStr = "\n--- RECENT CONVERSATION HISTORY ---\n";
            history.slice(-6).forEach((msg) => {
              historyStr += `${msg.role === "user" ? "Student" : "AI Tutor"}: ${msg.text}\n`;
            });
            promptParts.push({ text: historyStr });
          }

          promptParts.push({ text: `\nStudent Question: ${userQuestion}` });

          const response = await ai.models.generateContent({
            model: "gemini-3.6-flash",
            contents: [{ role: "user", parts: promptParts }],
          });

          fullText = response.text || "";
        } catch (geminiErr: any) {
          console.error("Gemini API Fallback error:", geminiErr);
        }
      }

      if (!fullText) {
        fullText = "I'm sorry, I couldn't process that question right now. Please try asking again!";
      }

      let answerText = fullText;
      let suggestedQuestions: string[] = [
        "Can you summarize the course content?",
        "What are the main takeaways from the uploaded files?",
        "Give me 3 practice quiz questions based on the course.",
      ];

      if (fullText.includes("SUGGESTED_QUESTIONS:")) {
        const parts = fullText.split("SUGGESTED_QUESTIONS:");
        answerText = parts[0].trim();
        const rawQuestions = parts[1].trim().split("\n");
        const parsed = rawQuestions
          .map((q) => q.replace(/^[-*•\d.\s]+/, "").trim())
          .filter((q) => q.length > 5);

        if (parsed.length > 0) {
          suggestedQuestions = parsed.slice(0, 3);
        }
      }

      return {
        answer: answerText,
        suggestedQuestions,
        courseTitle: "Course Assistant",
      };
    } catch (err: any) {
      console.error("Error calling AI provider:", err);
      return {
        answer: `I encountered an issue analyzing course materials: ${err?.message || "API request failed"}. Please try asking again!`,
        suggestedQuestions: [
          "Summarize this course",
          "What are the main takeaways?",
        ],
        courseTitle: "Course Assistant",
      };
    }
  }
}

export const aiCourseService = new AiCourseService();
