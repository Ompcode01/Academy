import prisma from "../config/prisma";
import guestGrantService from "./guestGrant.service";

export interface UserContext {
  role: string;
  employeeId?: bigint;
  departmentId?: bigint;
}

export interface SearchOptions {
  q: string;
  category?: string; // "all" | "courses" | "modules" | "lessons" | "quizzes" | "assignments" | "events" | "skills" | "categories"
  limit?: number;
}

export type SearchCategory =
  | "courses"
  | "modules"
  | "lessons"
  | "quizzes"
  | "assignments"
  | "events"
  | "skills"
  | "categories";

const ALL_CATEGORIES: SearchCategory[] = [
  "courses",
  "modules",
  "lessons",
  "quizzes",
  "assignments",
  "events",
  "skills",
  "categories",
];

/**
 * Which result buckets a role is allowed to search at all.
 *
 * - SUPER_ADMIN: everything on the platform.
 * - ADMIN: everything, but scoped to the department they administer.
 * - TEACHER / LEARNER: catalogue-level things (courses, skills, categories,
 *   events) plus course-internal things, which are further restricted to the
 *   courses they are enrolled in / teach (see buildContentScopeFilter).
 * - GUEST: courses only. A guest can see what is on offer but cannot enter a
 *   course, so nothing inside a course is searchable for them.
 */
function getAllowedCategories(role?: string): SearchCategory[] {
  switch (role) {
    case "SUPER_ADMIN":
    case "ADMIN":
    case "TEACHER":
    case "LEARNER":
      return ALL_CATEGORIES;
    case "GUEST":
    default:
      return ["courses"];
  }
}

/** Matches nothing - used to hard-block a scope. */
const BLOCK_ALL = { id: BigInt(-1) };

class SearchService {
  /**
   * Build Prisma where-clause additions for Course scope based on role
   */
  private async buildCourseScopeFilter(userContext?: UserContext): Promise<any> {
    if (!userContext) return { status: "PUBLISHED" };

    const { role, employeeId, departmentId } = userContext;

    switch (role) {
      case "SUPER_ADMIN":
        return {};

      case "ADMIN":
        return {
          OR: [
            { departmentId: null },
            ...(departmentId ? [{ departmentId }] : []),
            ...(employeeId ? [{ creatorId: employeeId }] : []),
            ...(employeeId ? [{ teachers: { some: { teacherId: employeeId } } }] : []),
          ],
        };

      case "TEACHER":
        return {
          OR: [
            ...(employeeId ? [{ teachers: { some: { teacherId: employeeId } } }] : []),
            ...(employeeId ? [{ creatorId: employeeId }] : []),
            ...(departmentId ? [{ departmentId }] : []),
            { departmentId: null },
          ],
        };

      case "LEARNER":
        return {
          status: "PUBLISHED",
          OR: [
            { departmentId: null },
            ...(departmentId ? [{ departmentId }] : []),
            ...(employeeId ? [{ enrollments: { some: { userId: employeeId } } }] : []),
          ],
        };

      case "GUEST": {
        const { isGlobal, departmentIds } = await guestGrantService.getGuestPermittedDepartmentIds(employeeId);
        if (isGlobal) {
          return { status: "PUBLISHED" };
        }
        if (departmentIds.length > 0) {
          return {
            status: "PUBLISHED",
            OR: [
              { departmentId: null },
              { departmentId: { in: departmentIds } },
            ],
          };
        }
        return { status: "PUBLISHED", id: BigInt(-1) };
      }

      default:
        return { status: "PUBLISHED" };
    }
  }

  /**
   * Course filter for things that live *inside* a course (sections, lessons,
   * quizzes, assignments).
   *
   * Being able to see a course in the catalogue is not the same as being able
   * to see its contents, so this is deliberately stricter than
   * buildCourseScopeFilter: learners only reach the inside of a course they
   * are enrolled in, teachers only the courses they own or teach (plus any
   * they are enrolled in themselves), and guests never reach it at all.
   */
  private async buildContentScopeFilter(userContext?: UserContext): Promise<any> {
    if (!userContext) return BLOCK_ALL;

    const { role, employeeId } = userContext;

    switch (role) {
      case "SUPER_ADMIN":
      case "ADMIN":
        // Same reach as the catalogue: platform-wide, or department-wide.
        return this.buildCourseScopeFilter(userContext);

      case "TEACHER": {
        if (!employeeId) return BLOCK_ALL;
        return {
          OR: [
            { teachers: { some: { teacherId: employeeId } } },
            { creatorId: employeeId },
            { enrollments: { some: { userId: employeeId } } },
          ],
        };
      }

      case "LEARNER": {
        if (!employeeId) return BLOCK_ALL;
        return {
          status: "PUBLISHED",
          enrollments: { some: { userId: employeeId } },
        };
      }

      case "GUEST":
      default:
        return BLOCK_ALL;
    }
  }

  async globalSearch(options: SearchOptions, userContext?: UserContext) {
    const { q, category = "all", limit = 20 } = options;
    const queryTerm = q.trim();

    if (!queryTerm) {
      return {
        allowedCategories: getAllowedCategories(userContext?.role),
        courses: [],
        modules: [],
        lessons: [],
        quizzes: [],
        assignments: [],
        events: [],
        skills: [],
        categories: [],
        totalResults: 0,
      };
    }

    const allowedCategories = getAllowedCategories(userContext?.role);
    const canSearch = (c: SearchCategory) =>
      allowedCategories.includes(c) && (category === "all" || category === c);

    const [courseScopeWhere, contentScopeWhere] = await Promise.all([
      this.buildCourseScopeFilter(userContext),
      this.buildContentScopeFilter(userContext),
    ]);
    const isStudentOrGuest = userContext?.role === "LEARNER" || userContext?.role === "GUEST";

    const [
      courses,
      sections,
      learningContents,
      quizzes,
      assignments,
      events,
      skills,
      categories,
    ] = await Promise.all([
      // 1. Courses
      canSearch("courses")
        ? prisma.course.findMany({
            where: {
              ...courseScopeWhere,
              isActive: true,
              OR: [
                { title: { contains: queryTerm } },
                { description: { contains: queryTerm } },
                { shortDescription: { contains: queryTerm } },
                { category: { name: { contains: queryTerm } } },
              ],
            },
            include: {
              category: { select: { id: true, name: true } },
              department: { select: { id: true, departmentName: true } },
            },
            take: limit,
          })
        : Promise.resolve([]),

      // 2. Modules / Sections
      canSearch("modules")
        ? prisma.courseSection.findMany({
            where: {
              isActive: true,
              ...(isStudentOrGuest ? { isPublished: true } : {}),
              OR: [
                { title: { contains: queryTerm } },
                { description: { contains: queryTerm } },
              ],
              course: {
                ...contentScopeWhere,
                isActive: true,
              },
            },
            include: {
              course: {
                select: {
                  id: true,
                  title: true,
                  status: true,
                },
              },
            },
            take: limit,
          })
        : Promise.resolve([]),

      // 3. Lessons / General Learning Content (non-quiz, non-assignment)
      canSearch("lessons")
        ? prisma.learningContent.findMany({
            where: {
              isActive: true,
              contentType: { notIn: ["QUIZ", "ASSIGNMENT"] },
              ...(isStudentOrGuest ? { isPublished: true } : {}),
              OR: [
                { title: { contains: queryTerm } },
                { description: { contains: queryTerm } },
                { contentType: { contains: queryTerm } },
              ],
              section: {
                isActive: true,
                ...(isStudentOrGuest ? { isPublished: true } : {}),
                course: {
                  ...contentScopeWhere,
                  isActive: true,
                },
              },
            },
            include: {
              section: {
                select: {
                  id: true,
                  title: true,
                  course: {
                    select: {
                      id: true,
                      title: true,
                    },
                  },
                },
              },
            },
            take: limit,
          })
        : Promise.resolve([]),

      // 4. Quizzes
      canSearch("quizzes")
        ? prisma.learningContent.findMany({
            where: {
              isActive: true,
              OR: [
                { contentType: "QUIZ" },
                { quizConfigJson: { not: null } },
              ],
              AND: [
                {
                  OR: [
                    { title: { contains: queryTerm } },
                    { description: { contains: queryTerm } },
                    { quizConfigJson: { contains: queryTerm } },
                  ],
                },
              ],
              ...(isStudentOrGuest ? { isPublished: true } : {}),
              section: {
                isActive: true,
                ...(isStudentOrGuest ? { isPublished: true } : {}),
                course: {
                  ...contentScopeWhere,
                  isActive: true,
                },
              },
            },
            include: {
              section: {
                select: {
                  id: true,
                  title: true,
                  course: {
                    select: {
                      id: true,
                      title: true,
                    },
                  },
                },
              },
            },
            take: limit,
          })
        : Promise.resolve([]),

      // 5. Assignments
      canSearch("assignments")
        ? prisma.learningContent.findMany({
            where: {
              isActive: true,
              OR: [
                { contentType: "ASSIGNMENT" },
                { assignmentConfigJson: { not: null } },
              ],
              AND: [
                {
                  OR: [
                    { title: { contains: queryTerm } },
                    { description: { contains: queryTerm } },
                    { assignmentConfigJson: { contains: queryTerm } },
                  ],
                },
              ],
              ...(isStudentOrGuest ? { isPublished: true } : {}),
              section: {
                isActive: true,
                ...(isStudentOrGuest ? { isPublished: true } : {}),
                course: {
                  ...contentScopeWhere,
                  isActive: true,
                },
              },
            },
            include: {
              section: {
                select: {
                  id: true,
                  title: true,
                  course: {
                    select: {
                      id: true,
                      title: true,
                    },
                  },
                },
              },
            },
            take: limit,
          })
        : Promise.resolve([]),

      // 6. Events
      canSearch("events")
        ? prisma.event.findMany({
            where: {
              AND: [
                {
                  OR: [
                    { title: { contains: queryTerm } },
                    { description: { contains: queryTerm } },
                    { eventType: { contains: queryTerm } },
                  ],
                },
                ...(userContext?.role !== "SUPER_ADMIN" && userContext?.departmentId
                  ? [
                      {
                        OR: [
                          { departmentId: null },
                          { departmentId: userContext.departmentId },
                        ],
                      },
                    ]
                  : []),
              ],
            },
            include: {
              department: { select: { id: true, departmentName: true } },
            },
            take: limit,
          })
        : Promise.resolve([]),

      // 7. Skills
      canSearch("skills")
        ? prisma.skill.findMany({
            where: {
              isActive: true,
              OR: [
                { name: { contains: queryTerm } },
                { category: { contains: queryTerm } },
                { description: { contains: queryTerm } },
              ],
            },
            take: limit,
          })
        : Promise.resolve([]),

      // 8. Categories
      canSearch("categories")
        ? prisma.category.findMany({
            where: {
              isActive: true,
              OR: [
                { name: { contains: queryTerm } },
                { description: { contains: queryTerm } },
              ],
            },
            include: {
              _count: { select: { courses: true } },
            },
            take: limit,
          })
        : Promise.resolve([]),
    ]);

    // Format & map results
    const formattedCourses = courses.map((c: any) => ({
      id: Number(c.id),
      type: "course",
      title: c.title,
      description: c.shortDescription || c.description,
      category: c.category?.name || "General",
      level: c.level || "Beginner",
      status: c.status,
      thumbnail: c.thumbnail,
      url: `/courses/${c.id}/preview`,
    }));

    const formattedModules = sections.map((s: any) => ({
      id: Number(s.id),
      type: "module",
      title: s.title,
      description: s.description,
      courseId: Number(s.course.id),
      courseTitle: s.course.title,
      url: `/courses/${s.course.id}/preview?sectionId=${s.id}`,
    }));

    const formattedLessons = learningContents.map((l: any) => ({
      id: Number(l.id),
      type: "lesson",
      title: l.title,
      contentType: l.contentType,
      description: l.description,
      courseId: Number(l.section.course.id),
      courseTitle: l.section.course.title,
      sectionId: Number(l.section.id),
      sectionTitle: l.section.title,
      url: `/courses/${l.section.course.id}/preview?contentId=${l.id}`,
    }));

    const formattedQuizzes = quizzes.map((q: any) => {
      let questionCount = 0;
      if (q.quizConfigJson) {
        try {
          const parsed = JSON.parse(q.quizConfigJson);
          questionCount = Array.isArray(parsed?.questions) ? parsed.questions.length : parsed?.questionsCount || 0;
        } catch (_) {}
      }
      return {
        id: Number(q.id),
        type: "quiz",
        title: q.title,
        description: q.description,
        questionCount,
        courseId: Number(q.section.course.id),
        courseTitle: q.section.course.title,
        sectionId: Number(q.section.id),
        sectionTitle: q.section.title,
        url: `/courses/${q.section.course.id}/preview?contentId=${q.id}&tab=quiz`,
      };
    });

    const formattedAssignments = assignments.map((a: any) => ({
      id: Number(a.id),
      type: "assignment",
      title: a.title,
      description: a.description,
      courseId: Number(a.section.course.id),
      courseTitle: a.section.course.title,
      sectionId: Number(a.section.id),
      sectionTitle: a.section.title,
      url: `/courses/${a.section.course.id}/preview?contentId=${a.id}&tab=assignment`,
    }));

    const formattedEvents = events.map((e: any) => ({
      id: Number(e.id),
      type: "event",
      title: e.title,
      description: e.description,
      eventType: e.eventType,
      startDate: e.eventDate,
      location: e.url || "dLMS Calendar Portal",
      departmentName: e.department?.departmentName,
      url: "/events",
    }));

    const formattedSkills = skills.map((sk: any) => ({
      id: Number(sk.id),
      type: "skill",
      name: sk.name,
      category: sk.category,
      skillType: sk.skillType,
      description: sk.description,
      url: "/skill-cloud",
    }));

    const formattedCategories = categories.map((cat: any) => ({
      id: Number(cat.id),
      type: "category",
      name: cat.name,
      description: cat.description,
      courseCount: cat._count?.courses || 0,
      url: `/courses?category=${cat.id}`,
    }));

    const totalResults =
      formattedCourses.length +
      formattedModules.length +
      formattedLessons.length +
      formattedQuizzes.length +
      formattedAssignments.length +
      formattedEvents.length +
      formattedSkills.length +
      formattedCategories.length;

    return {
      allowedCategories,
      courses: formattedCourses,
      modules: formattedModules,
      lessons: formattedLessons,
      quizzes: formattedQuizzes,
      assignments: formattedAssignments,
      events: formattedEvents,
      skills: formattedSkills,
      categories: formattedCategories,
      totalResults,
    };
  }
}

export default new SearchService();
