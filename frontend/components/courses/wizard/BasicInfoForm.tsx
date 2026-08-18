"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/auth.store";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Upload,
  CheckCircle2,
  Image as ImageIcon,
  Sparkles,
  Laptop,
  Briefcase,
  Users,
  ShieldCheck,
  Wand2,
  FileText,
  Layers,
  Lock,
} from "lucide-react";

export interface BasicInfoData {
  title: string;
  courseCode: string;
  departmentId: string;
  level: string;
  shortDescription: string;
  language: string;
  duration?: number;
  description: string;
  categoryId: string;
  thumbnailUrl?: string;
}

interface BasicInfoFormProps {
  data: BasicInfoData;
  onChange: (updated: Partial<BasicInfoData>) => void;
  onNext?: () => void;
  onCancel?: () => void;
}

const presetThumbnails = [
  {
    id: "tech",
    categoryName: "Technical",
    tag: "Technical",
    url: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80",
    icon: Laptop,
    badgeClass: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  },
  {
    id: "management",
    categoryName: "Leadership",
    tag: "Leadership",
    url: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=800&q=80",
    icon: Briefcase,
    badgeClass: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  },
  {
    id: "softskills",
    categoryName: "Soft Skill",
    tag: "Soft Skill",
    url: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80",
    icon: Users,
    badgeClass: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  },
  {
    id: "hr",
    categoryName: "Process/Compliances",
    tag: "Compliance",
    url: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80",
    icon: ShieldCheck,
    badgeClass: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  },
];

export default function BasicInfoForm({
  data,
  onChange,
  onNext,
  onCancel,
}: BasicInfoFormProps) {
  const { user } = useAuthStore();
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  const isAdmin = user?.role === "ADMIN" || user?.role === "TEACHER";
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  useEffect(() => {
    // If user is Admin/Teacher, fix department to user's assigned department
    if (isAdmin && user?.departmentId) {
      onChange({ departmentId: String(user.departmentId) });
    }
  }, [isAdmin, user?.departmentId]);

  const handleCustomFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setSelectedPreset(null);
      onChange({ thumbnailUrl: imageUrl });
    }
  };

  const handleSelectPreset = (presetUrl: string, presetId: string) => {
    setSelectedPreset(presetId);
    onChange({ thumbnailUrl: presetUrl });
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Step Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border pb-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-extrabold uppercase tracking-wider mb-1">
            Step 1: Course Identity &amp; Metadata
          </div>
          <h2 className="text-xl font-bold text-foreground">Course Overview &amp; Branding</h2>
        </div>
      </div>

      {/* Card 1: 2-Line Clean Layout */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2 border-b border-border pb-3">
          <Layers className="h-4 w-4 text-primary" />
          1. Course Identity &amp; Classification
        </h3>

        <div className="space-y-5">
          {/* Line 1: Course Name (col-span-2) & Course Code (col-span-1) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs font-bold text-foreground">
                Course Name <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="e.g. Advanced System Architecture & Microservices"
                value={data.title}
                onChange={(e) => onChange({ title: e.target.value })}
                className="h-10 text-xs bg-background focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-foreground">
                  Course Code
                </Label>
              </div>
              <Input
                placeholder="e.g. CRS-PY-101"
                value={data.courseCode}
                onChange={(e) => onChange({ courseCode: e.target.value })}
                className="h-10 text-xs font-mono uppercase bg-background"
              />
            </div>
          </div>

          {/* Line 2: Department, Category, Level, Duration (4 Equal Columns) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Business Unit */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-foreground">
                  Business Unit <span className="text-destructive">*</span>
                </Label>
                {isAdmin && (
                  <span className="text-[10px] text-amber-600 font-bold flex items-center gap-1">
                    <Lock className="h-3 w-3" /> Fixed (Your BU)
                  </span>
                )}
              </div>
              <Select
                disabled={isAdmin}
                value={data.departmentId || (isAdmin && user?.departmentId ? String(user.departmentId) : "")}
                onValueChange={(val: string | null) => onChange({ departmentId: val || "" })}
              >
                <SelectTrigger className="h-10 text-xs bg-background w-full">
                  <SelectValue placeholder="Select Business Unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Across BUs</SelectItem>
                  <SelectItem value="2">Tech Services- Core</SelectItem>
                  <SelectItem value="3">Tech Services - DPU</SelectItem>
                  <SelectItem value="4">Content Services</SelectItem>
                  <SelectItem value="5">Business Enablers</SelectItem>
                </SelectContent>
              </Select>
              {isAdmin && (
                <p className="text-[10px] text-muted-foreground">
                  As an Admin, courses created are restricted to your assigned business unit.
                </p>
              )}
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Category</Label>
              <Select
                value={data.categoryId || ""}
                onValueChange={(val: string | null) => onChange({ categoryId: val || "" })}
              >
                <SelectTrigger className="h-10 text-xs bg-background w-full">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Technical</SelectItem>
                  <SelectItem value="2">Soft Skill</SelectItem>
                  <SelectItem value="3">Process/Compliances</SelectItem>
                  <SelectItem value="4">Leadership (Futurefit, MCC, Basecamp)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Difficulty Level */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Difficulty Level</Label>
              <Select
                value={data.level || "Beginner"}
                onValueChange={(val: string | null) => onChange({ level: val || "Beginner" })}
              >
                <SelectTrigger className="h-10 text-xs bg-background w-full">
                  <SelectValue placeholder="Select Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Beginner">Beginner Level</SelectItem>
                  <SelectItem value="Intermediate">Intermediate Level</SelectItem>
                  <SelectItem value="Advanced">Advanced Level</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Estimated Duration */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Estimated Duration</Label>
              <div className="relative">
                <Input
                  type="number"
                  placeholder="e.g. 20"
                  value={data.duration ?? ""}
                  onChange={(e) => onChange({ duration: e.target.value ? Number(e.target.value) : undefined })}
                  className="h-10 text-xs bg-background pr-16"
                />
                <span className="absolute right-3 top-2.5 text-xs text-muted-foreground font-semibold">
                  Hours
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Card 2: Descriptions */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-5">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2 border-b border-border pb-3">
          <FileText className="h-4 w-4 text-primary" />
          2. Course Summary &amp; Learning Objectives
        </h3>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">
              Short Description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              placeholder="Enter a compelling brief summary displayed on catalog cards..."
              value={data.shortDescription}
              onChange={(e) => onChange({ shortDescription: e.target.value })}
              className="min-h-[75px] text-xs resize-none bg-background"
              maxLength={500}
            />
            <p className="text-right text-[10px] text-muted-foreground">
              {data.shortDescription?.length || 0}/500
            </p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">Detailed Description (Optional)</Label>
            <Textarea
              placeholder="Enter full course objectives, modules details, target audience, and prerequisites..."
              value={data.description}
              onChange={(e) => onChange({ description: e.target.value })}
              className="min-h-[110px] text-xs resize-none bg-background"
            />
          </div>
        </div>
      </div>

      {/* Card 3: Visual Cover & Thumbnail Selector */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-primary" />
              3. Visual Identity &amp; Catalog Thumbnail Cover
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Choose a curated category banner or upload a custom image file from your device.
            </p>
          </div>
        </div>

        {/* 4 Category Cover Banners Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {presetThumbnails.map((preset) => {
            const isSelected = selectedPreset === preset.id || data.thumbnailUrl === preset.url;
            const Icon = preset.icon;

            return (
              <div
                key={preset.id}
                onClick={() => handleSelectPreset(preset.url, preset.id)}
                className={`group relative rounded-2xl overflow-hidden border-2 cursor-pointer transition-all duration-300 ${
                  isSelected
                    ? "border-primary ring-4 ring-primary/20 shadow-lg scale-[1.02]"
                    : "border-border hover:border-primary/40 hover:shadow-md"
                }`}
              >
                {/* 16:9 Image */}
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
                  <img
                    src={preset.url}
                    alt={preset.categoryName}
                    className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  
                  {/* Category Tag Badge */}
                  <span className={`absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase border backdrop-blur-md ${preset.badgeClass}`}>
                    {preset.tag}
                  </span>

                  {/* Selection Indicator */}
                  {isSelected && (
                    <div className="absolute top-2.5 right-2.5 p-1 rounded-full bg-primary text-primary-foreground shadow-md">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                  )}
                </div>

                {/* Card Title */}
                <div className="p-3 bg-card flex items-center gap-2">
                  <Icon className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-xs font-bold text-foreground truncate">
                    {preset.categoryName}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Device Custom Upload Area */}
        <div className="relative flex flex-col items-center justify-center p-6 border-2 border-dashed border-border hover:border-primary/50 rounded-2xl bg-muted/20 hover:bg-primary/5 transition-all cursor-pointer group text-center">
          <input
            type="file"
            accept="image/*"
            onChange={handleCustomFileUpload}
            className="absolute inset-0 opacity-0 cursor-pointer z-10"
          />
          <div className="p-3 rounded-full bg-primary/10 text-primary mb-2 group-hover:scale-110 transition-transform">
            <Upload className="h-6 w-6" />
          </div>
          <h4 className="text-xs font-bold text-foreground">
            Or Upload Custom Cover Image from Device
          </h4>
          <p className="text-[11px] text-muted-foreground mt-1">
            Drag &amp; drop or click to browse local files • Recommended ratio 16:9 (JPG, PNG, WEBP)
          </p>
        </div>

        {/* Selected Thumbnail Live Hero Showcase */}
        {data.thumbnailUrl && (
          <div className="p-4 rounded-2xl border border-border bg-muted/20 space-y-2">
            <span className="text-xs font-bold text-foreground flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Active Course Cover Preview
            </span>
            <div className="relative aspect-[21/9] max-h-48 w-full overflow-hidden rounded-xl border border-border bg-black shadow-inner">
              <img
                src={data.thumbnailUrl}
                alt="Active Cover"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-4">
                <p className="text-sm font-bold text-white tracking-wide truncate">
                  {data.title || "Course Catalog Cover Preview"}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stepper Footer */}
      <div className="flex items-center justify-between border-t border-border pt-6">
        <Button variant="outline" onClick={onCancel} className="px-6">
          Cancel
        </Button>
        <Button onClick={onNext} className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 shadow-sm">
          Save &amp; Next &rarr;
        </Button>
      </div>
    </div>
  );
}
