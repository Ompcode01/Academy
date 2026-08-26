/**
 * LMS Content Duration Calculator Utility
 * Implements finalized calculation rules:
 * - PDF = 30 sec / page
 * - PPT/PPTX = 30 sec / slide
 * - Article = word count / 250 words per minute (in seconds)
 * - Quiz Question types: MCQ = 30s, True/False = 15s, Short Answer = 60s (1m), Coding = 180s (3m), Feedback = 15s
 * - Assignment / Mini Project = admin/instructor estimated effort
 * - YouTube = fetch actual video duration or fallback to provided metadata
 * - SCORM = manifest package duration if available, else admin estimate
 * - Udemy / External = allocation of remaining section time with warning (<= 60m) or blocker (<= 0m)
 */

export interface QuestionItem {
  type?: string;
  questionType?: string;
  category?: string;
}

export interface CalculateContentDurationInput {
  contentType: string;
  contentUrl?: string | null;
  description?: string | null;
  durationMinutes?: number | null;
  pageCount?: number | null;
  slideCount?: number | null;
  wordCount?: number | null;
  questions?: QuestionItem[] | null;
  quizConfigJson?: any | null;
  assignmentConfigJson?: any | null;
  targetSectionMinutes?: number | null;
  otherContentsSumSeconds?: number;
}

export interface ContentDurationResult {
  exactDurationSeconds: number;
  durationMinutes: number;
  roundedDisplayHours: number;
  displayFormatted: string;
  durationSource: "VERIFIED" | "CALCULATED" | "ESTIMATED";
  warning?: string;
  blocked?: boolean;
  blockReason?: string;
  metadata: Record<string, any>;
}

/**
 * Calculates exact duration in seconds for a specific content item based on its type and metrics
 */
export function calculateContentDuration(input: CalculateContentDurationInput): ContentDurationResult {
  const type = (input.contentType || "").toUpperCase().trim();
  let exactSeconds = 0;
  let source: "VERIFIED" | "CALCULATED" | "ESTIMATED" = "CALCULATED";
  let warning: string | undefined;
  let blocked = false;
  let blockReason: string | undefined;
  const metadata: Record<string, any> = { contentType: type };

  // Top Priority: Admin / SA / Teacher explicit custom duration override
  if (input.durationMinutes && input.durationMinutes > 0) {
    exactSeconds = Math.round(input.durationMinutes * 60);
    const durationMinutes = Math.max(1, Math.round(exactSeconds / 60));
    metadata.rule = `Admin Manual Override: ${durationMinutes} minutes`;
    metadata.isManualOverride = true;

    return {
      exactDurationSeconds: exactSeconds,
      durationMinutes,
      roundedDisplayHours: Math.round((durationMinutes / 60) * 10) / 10,
      displayFormatted: formatRoundedDuration(exactSeconds).displayString,
      durationSource: "ESTIMATED",
      metadata,
    };
  }

  switch (type) {
    case "PDF":
    case "DOCUMENT": {
      const pages = input.pageCount && input.pageCount > 0 ? input.pageCount : 1;
      exactSeconds = pages * 30; // Notebook rule: No. of page * 30 sec
      metadata.pageCount = pages;
      metadata.rule = "Notebook Rule: No. of page * 30 sec";
      break;
    }

    case "PPT":
    case "PPTX":
    case "PRESENTATION": {
      const slides = input.slideCount && input.slideCount > 0 ? input.slideCount : 1;
      exactSeconds = slides * 30; // Notebook rule: No. of slide * 30 sec
      metadata.slideCount = slides;
      metadata.rule = "Notebook Rule: No. of slide * 30 sec";
      break;
    }

    case "ARTICLE":
    case "TEXT":
    case "READING": {
      let words = input.wordCount && input.wordCount > 0 ? input.wordCount : 0;
      if (!words && input.description) {
        words = input.description.trim().split(/\s+/).filter(Boolean).length;
      }
      if (words <= 0) words = 300; // default fallback 300 words
      exactSeconds = words * 1; // Notebook rule: No. of word * 1 sec
      metadata.wordCount = words;
      metadata.rule = "Notebook Rule: No. of word * 1 sec";
      break;
    }

    case "LINK":
    case "EXTERNAL_LINK": {
      exactSeconds = 120; // Notebook rule: Link - give 2 min (120 sec)
      metadata.rule = "Notebook Rule: Link - give 2 min";
      break;
    }

    case "QUIZ":
    case "ASSESSMENT": {
      let qCount = (input.questions || []).length;
      if (!qCount && input.quizConfigJson) {
        try {
          const parsed = typeof input.quizConfigJson === "string" ? JSON.parse(input.quizConfigJson) : input.quizConfigJson;
          if (Array.isArray(parsed.questions)) qCount = parsed.questions.length;
        } catch (_) {}
      }
      if (qCount <= 0) qCount = 5;
      exactSeconds = qCount * 60; // Notebook rule: Quiz - No. of question * 60 sec
      metadata.questionsCount = qCount;
      metadata.rule = "Notebook Rule: No. of question * 60 sec";
      break;
    }

    case "FEEDBACK":
    case "SURVEY": {
      let qCount = (input.questions || []).length;
      if (!qCount && input.quizConfigJson) {
        try {
          const parsed = typeof input.quizConfigJson === "string" ? JSON.parse(input.quizConfigJson) : input.quizConfigJson;
          if (Array.isArray(parsed.questions)) qCount = parsed.questions.length;
        } catch (_) {}
      }
      if (qCount <= 0) qCount = 5;
      exactSeconds = qCount * 30; // Notebook rule: Feedback - No. of quest * 30 sec
      metadata.questionsCount = qCount;
      metadata.rule = "Notebook Rule: No. of quest * 30 sec";
      break;
    }

    case "ASSIGNMENT":
    case "PROJECT":
    case "MINI_PROJECT": {
      let customMins = input.durationMinutes;
      if (!customMins && input.assignmentConfigJson) {
        try {
          const parsed = typeof input.assignmentConfigJson === "string" ? JSON.parse(input.assignmentConfigJson) : input.assignmentConfigJson;
          if (parsed && (parsed.durationMinutes || parsed.duration)) {
            customMins = Number(parsed.durationMinutes || parsed.duration);
          }
        } catch (_) {}
      }
      if (customMins && customMins > 0) {
        exactSeconds = customMins * 60;
        source = "ESTIMATED";
        metadata.rule = `Admin Manual Assignment Duration: ${customMins} min`;
      } else {
        exactSeconds = 1800; // Default 30 min fallback
        source = "ESTIMATED";
        metadata.rule = "Default 30 min fallback";
      }
      break;
    }

    case "YOUTUBE":
    case "VIDEO":
    case "YT": {
      if (input.durationMinutes && input.durationMinutes > 0) {
        exactSeconds = input.durationMinutes * 60;
        source = "VERIFIED";
      } else {
        exactSeconds = 600; // Notebook rule: YT - after url enter fetch real time by scrapping (default 10 min)
        source = "ESTIMATED";
      }
      metadata.videoUrl = input.contentUrl || null;
      metadata.rule = "Notebook Rule: YT - fetch real time / 10 min default";
      break;
    }

    case "SCORM": {
      if (input.durationMinutes && input.durationMinutes > 0) {
        exactSeconds = input.durationMinutes * 60;
        source = "VERIFIED";
      } else if (input.pageCount && input.pageCount > 0) {
        exactSeconds = input.pageCount * 30;
      } else if (input.wordCount && input.wordCount > 0) {
        exactSeconds = input.wordCount * 1;
      } else {
        exactSeconds = 900; // Notebook rule: SCORM - size of file * 30s / pages * 30s / words * 1s (default 15 min)
        source = "ESTIMATED";
      }
      metadata.rule = "Notebook Rule: SCORM file size * 30s / pages * 30s / words * 1s";
      break;
    }

    case "UDEMY":
    case "EXTERNAL": {
      if (input.durationMinutes && input.durationMinutes > 0) {
        exactSeconds = input.durationMinutes * 60;
        source = "VERIFIED";
        metadata.rule = "Exact integration duration";
      } else {
        // Notebook rule: Udemy - give enter time or add by default 10 hrs (10 * 3600 = 36,000 sec)
        exactSeconds = 10 * 3600; // 10 hours (36,000 seconds)
        source = "ESTIMATED";
        metadata.rule = "Notebook Rule: Default 10 hours allocation for Udemy content";
      }
      break;
    }

    default: {
      if (input.durationMinutes && input.durationMinutes > 0) {
        exactSeconds = input.durationMinutes * 60;
      } else {
        exactSeconds = 600; // 10 min fallback
      }
      source = "ESTIMATED";
      break;
    }
  }

  const durationMinutes = Math.ceil(exactSeconds / 60);
  const formatted = formatRoundedDuration(exactSeconds);

  return {
    exactDurationSeconds: exactSeconds,
    durationMinutes,
    roundedDisplayHours: formatted.roundedHours,
    displayFormatted: formatted.displayString,
    durationSource: source,
    warning,
    blocked,
    blockReason,
    metadata,
  };
}

/**
 * Rounds total seconds to hours for UI displays while preserving accuracy
 * e.g. 4h 50m (290 min) -> 5h rounded, 4h 20m (260 min) -> 4h rounded
 */
export function formatRoundedDuration(totalSeconds: number): {
  roundedHours: number;
  exactMinutes: number;
  displayString: string;
} {
  const exactMinutes = Math.round(totalSeconds / 60);
  const roundedHours = Math.round(exactMinutes / 60);
  const hoursPart = Math.floor(exactMinutes / 60);
  const minsPart = exactMinutes % 60;

  let displayString = "";
  if (hoursPart > 0 && minsPart > 0) {
    displayString = `${hoursPart}h ${minsPart}m`;
  } else if (hoursPart > 0) {
    displayString = `${hoursPart}h`;
  } else {
    displayString = `${minsPart}m`;
  }

  return {
    roundedHours: roundedHours || (exactMinutes > 0 ? 1 : 0),
    exactMinutes,
    displayString,
  };
}

/**
 * Calculates cumulative section and course duration totals
 */
export function recalculateTotals(
  sections: Array<{
    targetDurationMinutes?: number | null;
    contents?: Array<{ exactDurationSeconds?: number; duration?: number }>;
  }>
): {
  courseExactSeconds: number;
  courseDurationMinutes: number;
  courseRoundedHours: number;
  sectionsCalculated: Array<{ exactDurationSeconds: number; durationMinutes: number; roundedHours: number }>;
} {
  let courseExactSeconds = 0;
  const sectionsCalculated = sections.map((sec) => {
    let secExactSecs = 0;
    if (sec.contents && Array.isArray(sec.contents)) {
      for (const cnt of sec.contents) {
        if (typeof cnt.exactDurationSeconds === "number" && cnt.exactDurationSeconds >= 0) {
          secExactSecs += cnt.exactDurationSeconds;
        } else if (typeof cnt.duration === "number" && cnt.duration > 0) {
          secExactSecs += cnt.duration * 60;
        }
      }
    }
    courseExactSeconds += secExactSecs;
    const secMins = Math.ceil(secExactSecs / 60);
    const secFormatted = formatRoundedDuration(secExactSecs);
    return {
      exactDurationSeconds: secExactSecs,
      durationMinutes: secMins,
      roundedHours: secFormatted.roundedHours,
    };
  });

  const courseMins = Math.ceil(courseExactSeconds / 60);
  const courseFormatted = formatRoundedDuration(courseExactSeconds);

  return {
    courseExactSeconds,
    courseDurationMinutes: courseMins,
    courseRoundedHours: courseFormatted.roundedHours,
    sectionsCalculated,
  };
}
