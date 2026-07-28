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
  shortDescription?: string;
  description?: string;
  thumbnail?: string;
  duration?: number;
  level?: string;
  language?: string;
  status?: string;
}

interface UpdateCourseData extends Partial<CreateCourseData> {}

interface CreateSectionData {
  courseId: bigint;
  title: string;
  description?: string;
  sectionOrder: number;
  isPublished?: boolean;
}

interface CreateContentData {
  sectionId: bigint;
  title: string;
  contentType: string;
  contentUrl?: string;
  description?: string;
  duration?: number;
  contentOrder: number;
  isMandatory?: boolean;
  isPublished?: boolean;
}

class CourseRepository {
  async findAll(filters: CourseFilters = {}, scopeWhere: any = {}) {
    const { search, categoryId, status, departmentId, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;

    const where: any = { isActive: true, ...scopeWhere };

    if (search) {
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { title: { contains: search } },
            { shortDescription: { contains: search } },
          ],
        },
      ];
    }
    if (categoryId) {
      where.categoryId = BigInt(categoryId);
    }
    if (status) {
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
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              employeeCode: true,
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
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
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
    });
  }

  async create(data: CreateCourseData) {
    return prisma.course.create({
      data: {
        categoryId: data.categoryId,
        creatorId: data.creatorId,
        departmentId: data.departmentId ?? null,
        title: data.title,
        shortDescription: data.shortDescription,
        description: data.description,
        thumbnail: data.thumbnail,
        duration: data.duration,
        level: data.level,
        language: data.language,
        status: (data.status as any) ?? "DRAFT",
      },
      include: {
        category: true,
        department: true,
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

  async update(id: bigint, data: UpdateCourseData) {
    return prisma.course.update({
      where: { id },
      data,
      include: {
        category: true,
        department: true,
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
      data: { isActive: false },
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
  async createContent(data: CreateContentData) {
    return prisma.learningContent.create({
      data: {
        sectionId: data.sectionId,
        title: data.title,
        contentType: data.contentType,
        contentUrl: data.contentUrl,
        description: data.description,
        duration: data.duration,
        contentOrder: data.contentOrder,
        isMandatory: data.isMandatory ?? false,
        isPublished: data.isPublished ?? false,
      },
    });
  }

  async updateContent(
    contentId: bigint,
    data: Partial<Omit<CreateContentData, "sectionId">>
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