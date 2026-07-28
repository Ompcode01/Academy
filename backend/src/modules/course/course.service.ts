import courseRepository from "./course.repository";

interface CourseFilters {
  search?: string;
  categoryId?: number;
  isPublished?: boolean;
  page?: number;
  limit?: number;
}

class CourseService {
  async getAllCourses(filters: CourseFilters = {}) {
    return courseRepository.findAll(filters);
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
    title: string;
    shortDescription?: string;
    description?: string;
    thumbnail?: string;
    duration?: number;
    level?: string;
    language?: string;
    isPublished?: boolean;
  }) {
    return courseRepository.create(data);
  }

  async updateCourse(
    id: bigint,
    data: {
      categoryId?: bigint;
      title?: string;
      shortDescription?: string;
      description?: string;
      thumbnail?: string;
      duration?: number;
      level?: string;
      language?: string;
      isPublished?: boolean;
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