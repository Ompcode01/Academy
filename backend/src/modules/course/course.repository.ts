import prisma from "../../config/prisma";

interface CourseFilters {
  categoryId?: number;
  status?: string;
  departmentId?: bigint;
  search?: string;
  page?: number;
  limit?: number;
}

interface CreateCourseData {
  categoryId: bigint;
  creatorId: bigint;
  departmentId?: bigint | null;
  title: string;
  shortName?: string | null;
  courseCode?: string | null;
  shortDescription?: string;
  description?: string;
  thumbnail?: string;
  duration?: number;
  targetDurationMinutes?: number | null;
  exactDurationSeconds?: number;
  level?: string;
  language?: string;
  status?: string;
  /** Wizard step an unfinished draft was left on, so it can be resumed. */
  draftStep?: number | null;
  enrollmentType?: string;
}

interface UpdateCourseData extends Partial<CreateCourseData> {}

interface CreateSectionData {
  courseId: bigint;
  title: string;
  description?: string;
  sectionOrder: number;
  targetDurationMinutes?: number | null;
  exactDurationSeconds?: number;
  isPublished?: boolean;
}

interface CreateContentData {
  sectionId: bigint;
  title: string;
  contentType: string;
  contentUrl?: string;
  description?: string;
  duration?: number;
  exactDurationSeconds?: number;
  durationSource?: string;
  durationMetadata?: string;
  contentOrder: number;
  isMandatory?: boolean;
  isPublished?: boolean;
}

class CourseRepository {
  async findAll(filters: CourseFilters = {}, scopeWhere: any = {}) {
    const { search, categoryId, status, departmentId, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;

    const where: any = { ...scopeWhere };

    if (status === "ARCHIVED" || status === "INACTIVE") {
      where.status = "ARCHIVED";
    } else if (status === "PUBLISHED" || status === "DRAFT") {
      where.status = status;
      where.isActive = true;
    } else if (status === "ALL" || status === "ANY" || !status) {
      // "All Courses" view: include PUBLISHED, DRAFT, and ARCHIVED courses
    }

    if (search) {
      const q = search.trim();
      if (q) {
        where.AND = [
          ...(where.AND || []),
          {
            OR: [
              { title: { contains: q } },
              { shortDescription: { contains: q } },
              { description: { contains: q } },
              { courseCode: { contains: q } },
              { shortName: { contains: q } },
              { category: { name: { contains: q } } },
              { department: { departmentName: { contains: q } } },
              { department: { departmentCode: { contains: q } } },
            ],
          },
        ];
      }
    }
    if (categoryId) {
      where.categoryId = BigInt(categoryId);
    }
    if (status && status !== "ALL" && status !== "ANY") {
      where.status = status;
    }
    if (departmentId) {
      where.departmentId = departmentId;
    }

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        include: {
          category: true,
          department: true,
          teachers: {
            include: {
              teacher: {
                select: { id: true, firstName: true, lastName: true, employeeCode: true, officialEmail: true },
              },
            },
          },
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              employeeCode: true,
              officialEmail: true,
              department: {
                select: {
                  id: true,
                  departmentCode: true,
                  departmentName: true,
                },
              },
              assignedRoles: {
                where: { isActive: true },
                include: { role: true },
              },
            },
          },
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
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.course.count({ where }),
    ]);

    return { courses, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: bigint) {
    return prisma.course.findFirst({
      where: { id, isActive: true },
      include: {
        category: true,
        department: true,
        teachers: {
          include: {
            teacher: {
              select: { id: true, firstName: true, lastName: true, employeeCode: true, officialEmail: true },
            },
          },
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
            officialEmail: true,
            department: {
              select: {
                id: true,
                departmentCode: true,
                departmentName: true,
              },
            },
            assignedRoles: {
              where: { isActive: true },
              include: { role: true },
            },
          },
        },
        certificateTemplate: true,
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
  }

  async create(data: CreateCourseData) {
    return prisma.course.create({
      data: {
        categoryId: data.categoryId,
        creatorId: data.creatorId,
        departmentId: data.departmentId ?? null,
        title: data.title,
        shortName: data.shortName ?? null,
        courseCode: data.courseCode ?? null,
        shortDescription: data.shortDescription,
        description: data.description,
        thumbnail: data.thumbnail,
        duration: data.duration,
        level: data.level,
        language: data.language,
        status: (data.status as any) ?? "DRAFT",
        draftStep: data.draftStep ?? null,
        enrollmentType: data.enrollmentType ?? "SELF",
      },
      include: {
        category: true,
        department: true,
        teachers: {
          include: {
            teacher: {
              select: { id: true, firstName: true, lastName: true, employeeCode: true, officialEmail: true },
            },
          },
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
          },
        },
      },
    });
  }

  async update(id: bigint, data: any) {
    const updateData: any = { ...data };

    // Strip nested relation objects and read-only timestamps if present in update payload
    delete updateData.category;
    delete updateData.department;
    delete updateData.creator;
    delete updateData.teachers;
    delete updateData.sections;
    delete updateData.enrollments;
    delete updateData.certificateTemplate;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    if ("categoryId" in updateData) {
      if (updateData.categoryId) {
        updateData.category = { connect: { id: BigInt(updateData.categoryId) } };
      }
      delete updateData.categoryId;
    }

    if ("departmentId" in updateData) {
      if (updateData.departmentId) {
        updateData.department = { connect: { id: BigInt(updateData.departmentId) } };
        delete updateData.departmentId;
      } else if (updateData.departmentId === null) {
        updateData.department = { disconnect: true };
        delete updateData.departmentId;
      } else {
        delete updateData.departmentId;
      }
    }

    if ("creatorId" in updateData) {
      if (updateData.creatorId) {
        updateData.creator = { connect: { id: BigInt(updateData.creatorId) } };
      }
      delete updateData.creatorId;
    }

    return prisma.course.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        department: true,
        teachers: {
          include: {
            teacher: {
              select: { id: true, firstName: true, lastName: true, employeeCode: true, officialEmail: true },
            },
          },
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
          },
        },
      },
    });
  }

  async softDelete(id: bigint) {
    return prisma.course.update({
      where: { id },
      data: { status: "ARCHIVED", isActive: true },
    });
  }

  // Section operations
  async createSection(data: CreateSectionData) {
    return prisma.courseSection.create({
      data: {
        courseId: data.courseId,
        title: data.title,
        description: data.description,
        sectionOrder: data.sectionOrder,
        targetDurationMinutes: data.targetDurationMinutes,
        exactDurationSeconds: data.exactDurationSeconds ?? 0,
        isPublished: data.isPublished ?? false,
      },
    });
  }

  async updateSection(
    sectionId: bigint,
    data: Partial<Omit<CreateSectionData, "courseId">>
  ) {
    return prisma.courseSection.update({
      where: { id: sectionId },
      data,
    });
  }

  async deleteSection(sectionId: bigint) {
    return prisma.courseSection.update({
      where: { id: sectionId },
      data: { isActive: false },
    });
  }

  // Content operations
  async createContent(data: CreateContentData & { quizConfigJson?: string; assignmentConfigJson?: string }) {
    return prisma.learningContent.create({
      data: {
        sectionId: data.sectionId,
        title: data.title,
        contentType: data.contentType,
        contentUrl: data.contentUrl,
        description: data.description,
        duration: data.duration,
        exactDurationSeconds: data.exactDurationSeconds ?? 0,
        durationSource: data.durationSource || "CALCULATED",
        durationMetadata: data.durationMetadata || null,
        contentOrder: data.contentOrder,
        isMandatory: data.isMandatory ?? false,
        isPublished: data.isPublished ?? false,
        quizConfigJson: data.quizConfigJson || null,
        assignmentConfigJson: data.assignmentConfigJson || null,
      },
    });
  }

  async updateContent(
    contentId: bigint,
    data: Partial<Omit<CreateContentData, "sectionId">> & { quizConfigJson?: string; assignmentConfigJson?: string }
  ) {
    return prisma.learningContent.update({
      where: { id: contentId },
      data,
    });
  }

  async deleteContent(contentId: bigint) {
    return prisma.learningContent.update({
      where: { id: contentId },
      data: { isActive: false },
    });
  }
}

export default new CourseRepository();