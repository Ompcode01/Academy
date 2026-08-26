/**
 * Frontend LMS Content Duration Calculator Helper
 * Mirror of backend duration rules for real-time live preview in UI modals and curriculum editor
 */

export interface QuestionItem {
  type?: string;
  questionType?: string;
  category?: string;
}

export interface CalculateContentDurationParams {
  contentType: string;
  contentUrl?: string;
  description?: string;
  durationMinutes?: number;
  pageCount?: number;
  slideCount?: number;
  wordCount?: number;
  questions?: QuestionItem[];
  quizConfigJson?: any;
  targetSectionMinutes?: number;
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
  ruleDescription: string;
}

export function calculateFrontendDuration(params: CalculateContentDurationParams): ContentDurationResult {
  const type = (params.contentType || "").toUpperCase().trim();
  let exactSeconds = 0;
  let source: "VERIFIED" | "CALCULATED" | "ESTIMATED" = "CALCULATED";
  let warning: string | undefined;
  let blocked = false;
  let blockReason: string | undefined;
  let ruleDescription = "";

  // Top Priority: Admin / SA / Teacher explicit custom duration override
  if (params.durationMinutes && params.durationMinutes > 0) {
    const exactSeconds = Math.round(params.durationMinutes * 60);
    const durationMinutes = Math.max(1, Math.round(exactSeconds / 60));
    return {
      exactDurationSeconds: exactSeconds,
      durationMinutes,
      roundedDisplayHours: Math.round((durationMinutes / 60) * 10) / 10,
      displayFormatted: formatFrontendDuration(exactSeconds).displayString,
      durationSource: "ESTIMATED",
      ruleDescription: `Admin Manual Override: ${durationMinutes} min`,
    };
  }

  switch (type) {
    case "PDF":
    case "DOCUMENT": {
      const pages = params.pageCount && params.pageCount > 0 ? params.pageCount : 1;
      exactSeconds = pages * 30; // Notebook rule: No. of page * 30 sec
      ruleDescription = `Notebook Rule: 30 sec/page (${pages} page${pages > 1 ? "s" : ""})`;
      break;
    }

    case "PPT":
    case "PPTX":
    case "PRESENTATION": {
      const slides = params.slideCount && params.slideCount > 0 ? params.slideCount : 1;
      exactSeconds = slides * 30; // Notebook rule: No. of slide * 30 sec
      ruleDescription = `Notebook Rule: 30 sec/slide (${slides} slide${slides > 1 ? "s" : ""})`;
      break;
    }

    case "ARTICLE":
    case "TEXT":
    case "READING": {
      let words = params.wordCount && params.wordCount > 0 ? params.wordCount : 0;
      if (!words && params.description) {
        words = params.description.trim().split(/\s+/).filter(Boolean).length;
      }
      if (words <= 0) words = 300;
      exactSeconds = words * 1; // Notebook rule: No. of word * 1 sec
      ruleDescription = `Notebook Rule: 1 sec/word (${words} words)`;
      break;
    }

    case "LINK":
    case "EXTERNAL_LINK": {
      exactSeconds = 120; // Notebook rule: Link - give 2 min (120 sec)
      ruleDescription = "Notebook Rule: Link - 2 min";
      break;
    }

    case "QUIZ":
    case "ASSESSMENT": {
      let qCount = (params.questions || []).length;
      if (!qCount && params.quizConfigJson) {
        try {
          const parsed = typeof params.quizConfigJson === "string" ? JSON.parse(params.quizConfigJson) : params.quizConfigJson;
          if (Array.isArray(parsed.questions)) qCount = parsed.questions.length;
        } catch (_) {}
      }
      if (qCount <= 0) qCount = 5;
      exactSeconds = qCount * 60; // Notebook rule: Quiz - No. of question * 60 sec
      ruleDescription = `Notebook Rule: 60 sec/question (${qCount} questions)`;
      break;
    }

    case "FEEDBACK":
    case "SURVEY": {
      const qCount = (params.questions || []).length || 5;
      exactSeconds = qCount * 30; // Notebook rule: Feedback - No. of quest * 30 sec
      ruleDescription = `Notebook Rule: 30 sec/question (${qCount} questions)`;
      break;
    }

    case "ASSIGNMENT":
    case "PROJECT":
    case "MINI_PROJECT": {
      if (params.durationMinutes && params.durationMinutes > 0) {
        exactSeconds = params.durationMinutes * 60;
        ruleDescription = `Admin Manual Assignment Duration: ${params.durationMinutes} min`;
      } else {
        exactSeconds = 1800; // Default 30 min fallback
        ruleDescription = "Default Assignment duration (30 min)";
      }
      break;
    }

    case "YOUTUBE":
    case "VIDEO":
    case "YT": {
      exactSeconds = (params.durationMinutes && params.durationMinutes > 0 ? params.durationMinutes : 10) * 60;
      source = params.durationMinutes ? "VERIFIED" : "ESTIMATED";
      ruleDescription = "Notebook Rule: YT - fetch real time / 10 min default";
      break;
    }

    case "SCORM": {
      if (params.durationMinutes && params.durationMinutes > 0) {
        exactSeconds = params.durationMinutes * 60;
        source = "VERIFIED";
      } else if (params.pageCount && params.pageCount > 0) {
        exactSeconds = params.pageCount * 30;
      } else if (params.wordCount && params.wordCount > 0) {
        exactSeconds = params.wordCount * 1;
      } else {
        exactSeconds = 900;
        source = "ESTIMATED";
      }
      ruleDescription = "Notebook Rule: SCORM file size * 30s / pages * 30s / words * 1s";
      break;
    }

    case "UDEMY":
    case "EXTERNAL": {
      if (params.durationMinutes && params.durationMinutes > 0) {
        exactSeconds = params.durationMinutes * 60;
        source = "VERIFIED";
        ruleDescription = "Approved integration duration";
      } else {
        // Notebook rule: Udemy - give enter time or add by default 10 hrs (10 * 3600 = 36,000 sec)
        exactSeconds = 10 * 3600; // 10 hours (36,000 seconds)
        source = "ESTIMATED";
        ruleDescription = "Notebook Rule: Default 10 hours allocation for Udemy content";
      }
      break;
    }

    default: {
      exactSeconds = (params.durationMinutes && params.durationMinutes > 0 ? params.durationMinutes : 10) * 60;
      source = "ESTIMATED";
      ruleDescription = "Default estimate";
      break;
    }
  }

  const durationMinutes = Math.ceil(exactSeconds / 60);
  const formatted = formatFrontendDuration(exactSeconds);

  return {
    exactDurationSeconds: exactSeconds,
    durationMinutes,
    roundedDisplayHours: formatted.roundedHours,
    displayFormatted: formatted.displayString,
    durationSource: source,
    warning,
    blocked,
    blockReason,
    ruleDescription,
  };
}

export function formatFrontendDuration(totalSeconds: number): {
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
