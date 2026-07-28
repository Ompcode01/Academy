"use client";

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
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  Image,
  Upload,
} from "lucide-react";

interface BasicInfoFormProps {
  onNext?: () => void;
  onCancel?: () => void;
}

export default function BasicInfoForm({ onNext, onCancel }: BasicInfoFormProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          Basic Information
        </h2>
        <p className="text-sm text-muted-foreground">
          Enter the basic details of your course.
        </p>
      </div>

      {/* Row 1: Course Name, Code, Department, Level */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">
            Course Name <span className="text-destructive">*</span>
          </Label>
          <Input placeholder="Java Fundamentals" className="h-9" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">
            Course Code <span className="text-destructive">*</span>
          </Label>
          <Input
            placeholder="DPU-JAVA-001"
            defaultValue="DPU-JAVA-001"
            className="h-9 bg-muted/40"
            readOnly
          />
          <p className="text-[11px] text-muted-foreground">Auto-generated</p>
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">
            Department <span className="text-destructive">*</span>
          </Label>
          <Select defaultValue="dpu">
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dpu">DPU</SelectItem>
              <SelectItem value="management">Management</SelectItem>
              <SelectItem value="hr">HR</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Course Level</Label>
          <Select defaultValue="beginner">
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Row 2: Short Description */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">
          Short Description <span className="text-destructive">*</span>
        </Label>
        <Textarea
          placeholder="Learn Java programming from basics to advanced concepts."
          className="min-h-[80px] resize-none"
          maxLength={500}
        />
        <p className="text-right text-[11px] text-muted-foreground">0/1000</p>
      </div>

      {/* Row 3: Language, Duration, Instructor */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Language</Label>
          <Select defaultValue="english">
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="english">English</SelectItem>
              <SelectItem value="hindi">Hindi</SelectItem>
              <SelectItem value="marathi">Marathi</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Estimated Duration</Label>
          <div className="flex gap-2">
            <Input type="number" placeholder="30" className="h-9 flex-1" />
            <Select defaultValue="hours">
              <SelectTrigger className="h-9 w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="minutes">Minutes</SelectItem>
                <SelectItem value="hours">Hours</SelectItem>
                <SelectItem value="days">Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1.5 xl:col-span-2">
          <Label className="text-sm font-medium">Instructor</Label>
          <Select defaultValue="priyanka">
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="priyanka">Priyanka Sharma</SelectItem>
              <SelectItem value="rahul">Rahul Varma</SelectItem>
              <SelectItem value="anita">Anita Patil</SelectItem>
              <SelectItem value="john">John D&apos;Souza</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Row 4: Detailed Description + Thumbnail */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-1.5 xl:col-span-2">
          <Label className="text-sm font-medium">Detailed Description</Label>
          {/* Toolbar */}
          <div className="flex items-center gap-0.5 rounded-t-lg border border-b-0 border-border bg-muted/30 px-2 py-1.5">
            {[Bold, Italic, Underline].map((Icon, i) => (
              <button
                key={i}
                className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
            <div className="mx-1.5 h-4 w-px bg-border" />
            {[List, ListOrdered].map((Icon, i) => (
              <button
                key={i}
                className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
            <div className="mx-1.5 h-4 w-px bg-border" />
            {[AlignLeft, AlignCenter, AlignRight].map((Icon, i) => (
              <button
                key={i}
                className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
            <div className="mx-1.5 h-4 w-px bg-border" />
            {[LinkIcon, Image].map((Icon, i) => (
              <button
                key={i}
                className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>
          <Textarea
            placeholder="This course covers core Java concepts including OOP, exception handling, collections framework, file handling, JDBC and a mini project to build real-world understanding."
            className="min-h-[140px] rounded-t-none border-t-0 resize-none"
          />
        </div>

        {/* Thumbnail */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Course Thumbnail *</Label>
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/20 p-6 transition-colors hover:border-primary/40 hover:bg-muted/30">
            <div className="mb-3 rounded-full bg-primary/10 p-3">
              <Upload className="h-5 w-5 text-primary" />
            </div>
            <p className="text-sm font-medium text-foreground">
              Upload thumbnail
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              java-fundamentals.jpg
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Recommended size: 16:9
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 border-t border-border pt-5">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={onNext}>Save &amp; Next</Button>
      </div>
    </div>
  );
}
