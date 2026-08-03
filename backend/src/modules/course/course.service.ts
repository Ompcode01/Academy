import courseRepository from "./course.repository";

interface CourseFilters {
  search?: string;
  categoryId?: number;
  status?: string;
  departmentId?: bigint;
  page?: number;
  limit?: number;
}

interface UserContext {
  role: string;
  employeeId?: bigint;
  departmentId?: bigint;
}

class CourseService {
  async getAllCourses(filters: CourseFilters = {}, userContext?: UserContext) {
    // Build role-scoped where clause
    const scopeWhere = this.buildScopeFilter(userContext);
    return courseRepository.findAll(filters, scopeWhere);
  }

  /**
   * Build Prisma where-clause additions based on the user's role:
   * - SUPER_ADMIN: all courses (no extra filter)
   * - ADMIN: courses in their department OR created by SUPER_ADMIN / ADMIN OR global courses OR created by themselves
   * - TEACHER: courses in their department OR created by SUPER_ADMIN / ADMIN OR global courses OR created by themselves
   * - LEARNER: PUBLISHED courses in their department OR created by SUPER_ADMIN / ADMIN OR global published courses
   * - GUEST: only PUBLISHED courses
   */
  private buildScopeFilter(userContext?: UserContext): any {
    if (!userContext) return {};

    const { role, employeeId, departmentId } = userContext;

    const superAdminOrAdminCourseCondition = {
      creator: {
        assignedRoles: {
          some: {
            role: {
              roleCode: { in: ["SUPER_ADMIN", "ADMIN"] },
            },
            isActive: true,
          },
        },
      },
    };

    switch (role) {
      case "SUPER_ADMIN":
        return {}; // No restrictions

      case "ADMIN":
        return {
          OR: [
            { departmentId: null },
            ...(departmentId ? [{ departmentId }] : []),
            ...(employeeId ? [{ creatorId: employeeId }] : []),
            superAdminOrAdminCourseCondition,
          ],
        };

      case "TEACHER":
        return {
          OR: [
            { departmentId: null },
            ...(departmentId ? [{ departmentId }] : []),
            ...(employeeId ? [{ creatorId: employeeId }] : []),
            superAdminOrAdminCourseCondition,
          ],
        };

      case "LEARNER":
        return {
          status: "PUBLISHED",
          OR: [
            { departmentId: null },
            ...(departmentId ? [{ departmentId }] : []),
            superAdminOrAdminCourseCondition,
          ],
        };

      case "GUEST":
        return { status: "PUBLISHED" };

      default:
        return { status: "PUBLISHED" };
    }
  }

  async getCourseById(id: bigint) {
    const course = await courseRepository.findById(id);
    if (!course) {
      throw new Error("Course not found");
    }
    return course;
  }

  async createCourse(data: {
    categoryId: bigint;
    creatorId: bigint;
    departmentId?: bigint | null;
    title: string;
    shortDescription?: string;
    description?: string;
    thumbnail?: string;
    duration?: number;
    level?: string;
    language?: string;
    status?: string;
  }) {
    return courseRepository.create(data);
  }

  async updateCourse(
    id: bigint,
    data: {
      categoryId?: bigint;
      departmentId?: bigint | null;
      title?: string;
      shortDescription?: string;
      description?: string;
      thumbnail?: string;
      duration?: number;
      level?: string;
      language?: string;
      status?: string;
    }
  ) {
    await this.getCourseById(id);
    return courseRepository.update(id, data);
  }

  async deleteCourse(id: bigint) {
    await this.getCourseById(id);
    return courseRepository.softDelete(id);
  }

  // Section operations
  async createSection(data: {
    courseId: bigint;
    title: string;
    description?: string;
    sectionOrder: number;
    isPublished?: boolean;
  }) {
    await this.getCourseById(data.courseId);
    return courseRepository.createSection(data);
  }

  async updateSection(
    sectionId: bigint,
    data: {
      title?: string;
      description?: string;
      sectionOrder?: number;
      isPublished?: boolean;
    }
  ) {
    return courseRepository.updateSection(sectionId, data);
  }

  async deleteSection(sectionId: bigint) {
    return courseRepository.deleteSection(sectionId);
  }

  // Content operations
  async createContent(data: {
    sectionId: bigint;
    title: string;
    contentType: string;
    contentUrl?: string;
    description?: string;
    duration?: number;
    contentOrder: number;
    isMandatory?: boolean;
    isPublished?: boolean;
  }) {
    return courseRepository.createContent(data);
  }

  async updateContent(
    contentId: bigint,
    data: {
      title?: string;
      contentType?: string;
      contentUrl?: string;
      description?: string;
      duration?: number;
      contentOrder?: number;
      isMandatory?: boolean;
      isPublished?: boolean;
    }
  ) {
    return courseRepository.updateContent(contentId, data);
  }

  async deleteContent(contentId: bigint) {
    return courseRepository.deleteContent(contentId);
  }
}

export default new CourseService();