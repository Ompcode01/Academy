/**
 * Turns the course wizard's in-memory state into the payload the courses API
 * expects.
 *
 * This is shared by two callers that must not drift apart: the final
 * "Review & Publish" step, and the draft autosave that fires when a creator
 * cancels or navigates away mid-build. Both write the same shape, so a draft
 * resumed later reconstructs exactly what the author had on screen.
 */

export interface CourseWizardState {
  basicInfo: {
    title: string;
    shortName?: string;
    courseCode?: string;
    departmentId: string;
    level: string;
    shortDescription: string;
    language: string;
    duration?: number;
    description: string;
    categoryId: string;
    thumbnailUrl?: string;
    thumbnail?: string;
  };
  sections: any[];
  enrollment: {
    selfEnrollment: boolean;
    adminEnrollment: boolean;
    enrollmentType?: string;
    departmentAccess: string;
    enrolledUsersList?: any[];
    teacherIds?: string[];
  };
  feedback?: {
    enableFeedback?: boolean;
    feedbackTitle?: string;
    description?: string;
    questions?: any[];
    requireFeedbackForCertificate?: boolean;
  };
  certificate?: {
    enableCertificate: boolean;
    certificateTitle: string;
    passingThreshold: number;
  };
}

/**
 * Folds the Step 5 feedback survey into the curriculum, since feedback is
 * stored as a FEEDBACK content item rather than as its own course column. An
 * existing feedback item is updated in place; otherwise a section is appended.
 */
function applyFeedbackToSections(sections: any[], fbData: CourseWizardState["feedback"]) {
  const processedSections = JSON.parse(JSON.stringify(sections || []));
  if (!fbData || fbData.enableFeedback !== true) return processedSections;

  const feedbackConfigJson = JSON.stringify({
    title: fbData.feedbackTitle || "End-of-Course Feedback & Evaluation Survey",
    description: fbData.description || "",
    questions: fbData.questions || [],
  });

  let foundFb = false;
  for (const sec of processedSections) {
    if (sec.contents && Array.isArray(sec.contents)) {
      for (const cnt of sec.contents) {
        if (cnt.contentType?.toUpperCase() === "FEEDBACK") {
          cnt.title = fbData.feedbackTitle || cnt.title;
          cnt.description = fbData.description || cnt.description;

          let effectiveQuestions: any[] = fbData.questions || [];
          if (cnt.quizConfigJson) {
            try {
              const parsedCntConfig =
                typeof cnt.quizConfigJson === "string"
                  ? JSON.parse(cnt.quizConfigJson)
                  : cnt.quizConfigJson;
              if (Array.isArray(parsedCntConfig.questions) && parsedCntConfig.questions.length > 0) {
                if (effectiveQuestions.length === 0) {
                  effectiveQuestions = parsedCntConfig.questions;
                }
              }
            } catch (e) {}
          }

          cnt.quizConfigJson = JSON.stringify({
            title: fbData.feedbackTitle || cnt.title || "End-of-Course Feedback & Evaluation Survey",
            description: fbData.description || cnt.description || "",
            questions: effectiveQuestions,
          });
          foundFb = true;
        }
      }
    }
  }

  if (!foundFb) {
    processedSections.push({
      title: "Course Feedback & Evaluation",
      description: "End-of-course survey evaluation.",
      contents: [
        {
          title: fbData.feedbackTitle || "End-of-Course Feedback Survey",
          contentType: "FEEDBACK",
          description:
            fbData.description ||
            "Please share your review regarding course structure, content clarity, and instructor support.",
          quizConfigJson: feedbackConfigJson,
          isMandatory: Boolean(fbData.requireFeedbackForCertificate),
        },
      ],
    });
  }

  return processedSections;
}

export function buildCoursePayload(
  wizardData: CourseWizardState,
  options: { status: "DRAFT" | "PUBLISHED"; draftStep?: number }
): Record<string, any> {
  const { basicInfo, sections, enrollment } = wizardData;
  const { status, draftStep } = options;
  const isDraft = status === "DRAFT";

  const selectedType = enrollment?.enrollmentType || "SELF";
  const enrolledUserIdsPayload =
    selectedType === "SELF"
      ? []
      : (enrollment?.enrolledUsersList || []).map((u: any) => String(u.userId));

  const processedSections = applyFeedbackToSections(sections, wizardData.feedback);

  return {
    // A draft is saved exactly as far as the author got, so its fields stay
    // empty when unanswered. A publish keeps the long-standing defaults.
    title: basicInfo.title || (isDraft ? "" : "Java Programming"),
    shortName: basicInfo.shortName || undefined,
    courseCode: basicInfo.courseCode || undefined,
    shortDescription:
      basicInfo.shortDescription ||
      (isDraft ? "" : "Core Java fundamentals and secure development practices."),
    description: basicInfo.description,
    categoryId: basicInfo.categoryId ? Number(basicInfo.categoryId) : isDraft ? undefined : 1,
    departmentId:
      basicInfo.departmentId && basicInfo.departmentId !== "global"
        ? Number(basicInfo.departmentId)
        : null,
    thumbnail: basicInfo.thumbnailUrl || basicInfo.thumbnail || undefined,
    level: basicInfo.level || "Beginner",
    language: basicInfo.language || "English",
    duration: basicInfo.duration || (isDraft ? undefined : 20),
    status,
    draftStep: isDraft ? draftStep : null,
    enrollmentType: selectedType,
    enrolledUserIds: enrolledUserIdsPayload,
    teacherIds: enrollment?.teacherIds || ["4"],
    sections: processedSections,
  };
}

/**
 * Whether an abandoned wizard holds enough for a draft to be worth keeping.
 * Without this, simply opening the builder and backing out would litter the
 * catalogue with empty "Untitled Course" rows.
 */
export function hasDraftWorthSaving(wizardData: CourseWizardState): boolean {
  const { basicInfo, sections } = wizardData;
  return Boolean(
    basicInfo.title?.trim() ||
      basicInfo.shortDescription?.trim() ||
      basicInfo.description?.trim() ||
      (sections && sections.length > 0)
  );
}
