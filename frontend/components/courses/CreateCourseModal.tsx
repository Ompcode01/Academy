"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuthStore } from "@/store/auth.store";
import { ROLES } from "@/lib/rbac";
import {
  getCategories,
  createCourse,
  type Category,
} from "@/services/api/course.service";
import toast from "react-hot-toast";
import { getDepartments, type Department } from "@/services/api/org.service";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const courseSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters long"),
  shortDescription: z.string().min(5, "Short description must be at least 5 characters"),
  description: z.string().optional(),
  categoryId: z.string().min(1, "Please select a category"),
  departmentId: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  level: z.string().min(1, "Please select difficulty level"),
  language: z.string().min(1, "Please select language"),
});

type CourseFormData = z.infer<typeof courseSchema>;

interface CreateCourseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function CreateCourseModal({
  open,
  onOpenChange,
  onSuccess,
}: CreateCourseModalProps) {
  const user = useAuthStore((state) => state.user);
  const userRole = user?.role || ROLES.GUEST;
  
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([
    { id: 1, name: "Technical", isActive: true },
    { id: 2, name: "Management", isActive: true },
    { id: 3, name: "Soft Skills", isActive: true },
    { id: 4, name: "HR", isActive: true },
  ]);
  const [departments, setDepartments] = useState<Department[]>([
    { id: 1, departmentCode: "ENG", departmentName: "Engineering", isActive: true, createdAt: "", updatedAt: "" },
    { id: 2, departmentCode: "HR", departmentName: "Human Resources", isActive: true, createdAt: "", updatedAt: "" },
    { id: 3, departmentCode: "MGT", departmentName: "Management", isActive: true, createdAt: "", updatedAt: "" },
  ]);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      status: "DRAFT",
      level: "Beginner",
      language: "English",
      departmentId: userRole === ROLES.TEACHER && user?.departmentId ? String(user.departmentId) : "global",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        status: "DRAFT",
        level: "Beginner",
        language: "English",
        departmentId: userRole === ROLES.TEACHER && user?.departmentId ? String(user.departmentId) : "global",
      });

      // Fetch dynamic options
      async function loadOptions() {
        try {
          const [catRes, deptRes] = await Promise.all([
            getCategories(),
            getDepartments(),
          ]);
          if (catRes?.success && Array.isArray(catRes.data) && catRes.data.length > 0) {
            setCategories(catRes.data);
          }
          if (deptRes) {
            const depts = deptRes.data || deptRes;
            if (Array.isArray(depts) && depts.length > 0) {
              setDepartments(depts);
            }
          }
        } catch (err) {
          console.error("Failed to load options for creation form:", err);
        }
      }
      loadOptions();
    }
  }, [open, reset, user]);

  const onSubmit = async (data: CourseFormData) => {
    try {
      setLoading(true);
      const payload = {
        title: data.title,
        shortDescription: data.shortDescription,
        description: data.description,
        categoryId: Number(data.categoryId),
        level: data.level,
        language: data.language,
        status: data.status,
        departmentId: data.departmentId ? Number(data.departmentId) : null,
      };

      const res = await createCourse(payload);
      if (res?.success) {
        onSuccess();
        onOpenChange(false);
        const newId = res.data?.id;
        if (newId) {
          router.push(`/courses/create?id=${newId}`);
        } else {
          router.push("/courses/create");
        }
      } else {
        toast.error(res?.message || "Failed to create course");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "An error occurred while creating course.");
    } finally {
      setLoading(false);
    }
  };

  const isTeacher = userRole === ROLES.TEACHER;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Course</DialogTitle>
          <DialogDescription>
            Add a new training program to the academy curriculum directory.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          {/* Title */}
          <div className="space-y-1">
            <Label htmlFor="title">Course Title</Label>
            <Input
              id="title"
              placeholder="e.g. Advanced Javascript Techniques"
              {...register("title")}
            />
            {errors.title && (
              <p className="text-xs text-destructive font-semibold">{errors.title.message}</p>
            )}
          </div>

          {/* Short Description */}
          <div className="space-y-1">
            <Label htmlFor="shortDescription">Short Description</Label>
            <Input
              id="shortDescription"
              placeholder="A brief overview displayed on catalog card summary"
              {...register("shortDescription")}
            />
            {errors.shortDescription && (
              <p className="text-xs text-destructive font-semibold">{errors.shortDescription.message}</p>
            )}
          </div>

          {/* Category */}
          <div className="space-y-1">
            <Label htmlFor="category">Category</Label>
            <Select onValueChange={(val: string | null) => setValue("categoryId", val || "")}>
              <SelectTrigger>
                <SelectValue placeholder="Select course category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={String(cat.id)}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.categoryId && (
              <p className="text-xs text-destructive font-semibold">{errors.categoryId.message}</p>
            )}
          </div>

          {/* Business Unit (Restricted/Auto for Teacher, Editable for Admin/Superadmin) */}
          <div className="space-y-1">
            <Label htmlFor="department">Mapped Business Unit</Label>
            <Select
              disabled={isTeacher}
              defaultValue={isTeacher && user?.departmentId ? String(user.departmentId) : "global"}
              onValueChange={(val: string | null) => setValue("departmentId", val === "global" || val === null ? undefined : val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select target department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="global">Global (All Business Units)</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={String(dept.id)}>
                    {dept.departmentName} ({dept.departmentCode})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isTeacher && (
              <p className="text-xs text-muted-foreground">
                Teachers are locked to their own department listings.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Level */}
            <div className="space-y-1">
              <Label>Difficulty Level</Label>
              <Select defaultValue="Beginner" onValueChange={(val: string | null) => setValue("level", val || "Beginner")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Beginner">Beginner</SelectItem>
                  <SelectItem value="Intermediate">Intermediate</SelectItem>
                  <SelectItem value="Advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Language */}
            <div className="space-y-1">
              <Label>Language</Label>
              <Select defaultValue="English" onValueChange={(val: string | null) => setValue("language", val || "English")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="English">English</SelectItem>
                  <SelectItem value="Spanish">Spanish</SelectItem>
                  <SelectItem value="German">German</SelectItem>
                  <SelectItem value="French">French</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <Label>Course Status</Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                <input
                  type="radio"
                  value="DRAFT"
                  {...register("status")}
                  className="accent-primary"
                />
                Draft (Hidden from Catalog)
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                <input
                  type="radio"
                  value="PUBLISHED"
                  {...register("status")}
                  className="accent-primary"
                />
                Published (Live)
              </label>
            </div>
          </div>

          {/* Detailed Description */}
          <div className="space-y-1">
            <Label htmlFor="description">Detailed Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Enter full course objectives, modules details, and prerequisites..."
              rows={3}
              {...register("description")}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Course"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
