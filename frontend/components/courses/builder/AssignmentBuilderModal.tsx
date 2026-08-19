"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  FileCheck,
  Upload,
  Trash2,
  Calendar,
  Clock,
  ShieldCheck,
  FileCode,
} from "lucide-react";
import { uploadDocumentFile } from "@/services/api/course.service";
import HarbingerConfirmModal from "@/components/common/HarbingerConfirmModal";

interface UploadedFileItem {
  name: string;
  size: string;
  url?: string;
  extractedZipFiles?: Array<{ name: string; url: string; sizeMb: string }>;
}

interface AssignmentBuilderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: {
    title?: string;
    description?: string;
    instructions?: string;
    maxMarks?: number;
    deadline?: string;
    maxAttempts?: number;
    allowedFileTypes?: string[];
    questionFiles?: UploadedFileItem[];
    attachments?: UploadedFileItem[];
  } | null;
  onSaveAssignment: (assignmentData: {
    title: string;
    description: string;
    maxMarks: number;
    deadline: string;
    maxAttempts: number;
    lateSubmission: string;
    latePenaltyPercent: number;
    allowedFileTypes: string[];
    maxFileSizeMb: number;
    maxFilesPerSubmission: number;
    instructions: string;
    allowResubmission: boolean;
    plagiarismCheck: boolean;
    questionFiles: UploadedFileItem[];
  }) => void;
}

export default function AssignmentBuilderModal({
  open,
  onOpenChange,
  initialData,
  onSaveAssignment,
}: AssignmentBuilderModalProps) {
  const [activeTab, setActiveTab] = useState<"DETAILS" | "SUBMISSION">("DETAILS");
  const [validationModal, setValidationModal] = useState<{ open: boolean; title: string; description: string } | null>(null);
  const [title, setTitle] = useState("");
  const [maxMarks, setMaxMarks] = useState(100);
  const [deadlineDate, setDeadlineDate] = useState("");
  const [deadlineTime, setDeadlineTime] = useState("23:59");
  const [description, setDescription] = useState("");
  const [maxAttempts, setMaxAttempts] = useState<number>(3);
  const [lateSubmission, setLateSubmission] = useState("ALLOWED");
  const [latePenaltyPercent, setLatePenaltyPercent] = useState(0);
  const [uploadingFile, setUploadingFile] = useState(false);

  // Question / Scenario files
  const [questionFiles, setQuestionFiles] = useState<UploadedFileItem[]>([]);

  // Allowed file types
  const [allowedTypes, setAllowedTypes] = useState<string[]>([
    "PDF",
    "DOC",
    "DOCX",
    "ZIP",
  ]);

  // Submission rules
  const [maxFileSizeMb, setMaxFileSizeMb] = useState(50);
  const [maxFilesPerSubmission, setMaxFilesPerSubmission] = useState(5);
  const [instructions, setInstructions] = useState("");
  const [allowResubmission, setAllowResubmission] = useState(true);
  const [plagiarismCheck, setPlagiarismCheck] = useState(true);

  // Today's YYYY-MM-DD for min date attribute
  const todayStr = (() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  })();

  React.useEffect(() => {
    if (open) {
      if (initialData) {
        setTitle(initialData.title || "");
        setDescription(initialData.description || "");
        setInstructions(initialData.instructions || initialData.description || "");
        setMaxMarks(initialData.maxMarks || 100);
        setMaxAttempts(initialData.maxAttempts !== undefined && initialData.maxAttempts !== null ? Number(initialData.maxAttempts) : 3);
        if (initialData.allowedFileTypes) setAllowedTypes(initialData.allowedFileTypes);
        if ((initialData as any).latePenaltyPercent !== undefined && (initialData as any).latePenaltyPercent !== null) {
          setLatePenaltyPercent(Number((initialData as any).latePenaltyPercent));
        } else {
          setLatePenaltyPercent(0);
        }
        setLateSubmission((initialData as any).lateSubmission || "ALLOWED");
        if (initialData.deadline) {
          const parts = initialData.deadline.split(" ");
          if (parts[0]) setDeadlineDate(parts[0]);
          if (parts[1]) setDeadlineTime(parts[1]);
        }
        const existingFiles = initialData.questionFiles || initialData.attachments || (initialData as any).files || [];
        setQuestionFiles(Array.isArray(existingFiles) ? existingFiles : []);
      } else {
        setTitle("");
        setDescription("");
        setInstructions("");
        setMaxMarks(100);
        setMaxAttempts(3);
        setLateSubmission("ALLOWED");
        setLatePenaltyPercent(0);
        setDeadlineDate("");
        setDeadlineTime("23:59");
        setQuestionFiles([]);
      }
    }
  }, [open, initialData]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      try {
        setUploadingFile(true);
        const uploadRes = await uploadDocumentFile(file);
        if (uploadRes?.success && uploadRes.data?.fileUrl) {
          setQuestionFiles((prev) => [
            ...prev,
            {
              name: file.name,
              size: `${sizeMb} MB`,
              url: uploadRes.data.fileUrl,
              extractedZipFiles: uploadRes.data.extractedZipFiles,
            },
          ]);
        } else {
          setQuestionFiles((prev) => [
            ...prev,
            { name: file.name, size: `${sizeMb} MB`, url: `/storage/uploads/${file.name}` },
          ]);
        }
      } catch (err) {
        console.error("Upload scenario file error:", err);
        setQuestionFiles((prev) => [
          ...prev,
          { name: file.name, size: `${sizeMb} MB`, url: `/storage/uploads/${file.name}` },
        ]);
      } finally {
        setUploadingFile(false);
      }
    }
  };

  const handleRemoveFile = (idx: number) => {
    setQuestionFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const toggleFileType = (typeStr: string) => {
    if (allowedTypes.includes(typeStr)) {
      setAllowedTypes((prev) => prev.filter((t) => t !== typeStr));
    } else {
      setAllowedTypes((prev) => [...prev, typeStr]);
    }
  };

  const handleSwitchTab = (targetTab: "DETAILS" | "SUBMISSION") => {
    if (targetTab === "SUBMISSION" && !title.trim()) {
      setValidationModal({
        open: true,
        title: "Required Step Incomplete",
        description: "Please fill out the mandatory Assignment Title in Step 1 before proceeding to Submission Rules.",
      });
      return;
    }
    setActiveTab(targetTab);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setActiveTab("DETAILS");
      setValidationModal({
        open: true,
        title: "Required Step Incomplete",
        description: "Please fill out the mandatory Assignment Title in Step 1 before saving the assignment.",
      });
      return;
    }

    if (deadlineDate) {
      const deadlineDateTimeStr = `${deadlineDate}T${deadlineTime || "23:59"}`;
      const selectedDate = new Date(deadlineDateTimeStr);
      const now = new Date();
      if (!isNaN(selectedDate.getTime()) && selectedDate < now) {
        setActiveTab("DETAILS");
        setValidationModal({
          open: true,
          title: "Invalid Submission Deadline",
          description: "The submission deadline date and time cannot be in the past. Please select a date and time ahead of the current time.",
        });
        return;
      }
    }

    onSaveAssignment({
      title: title.trim(),
      description,
      maxMarks: Number(maxMarks),
      deadline: deadlineDate ? `${deadlineDate} ${deadlineTime}` : "",
      maxAttempts: Number(maxAttempts),
      lateSubmission,
      latePenaltyPercent: Number(latePenaltyPercent),
      allowedFileTypes: allowedTypes,
      maxFileSizeMb: Number(maxFileSizeMb),
      maxFilesPerSubmission: Number(maxFilesPerSubmission),
      instructions,
      allowResubmission,
      plagiarismCheck,
      questionFiles,
    });

    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-3xl max-h-[92vh] overflow-y-auto bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2">
              <FileCheck className="h-6 w-6 text-blue-500" />
              Create Assignment
            </DialogTitle>
          </DialogHeader>

          {/* Tab Header */}
          <div className="flex items-center gap-4 border-b border-border pb-2">
            <button
              onClick={() => handleSwitchTab("DETAILS")}
              className={`text-sm font-semibold pb-1 border-b-2 transition-all ${activeTab === "DETAILS"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
            >
              1. Details &amp; Scenario Files
            </button>
            <button
              onClick={() => handleSwitchTab("SUBMISSION")}
              className={`text-sm font-semibold pb-1 border-b-2 transition-all ${activeTab === "SUBMISSION"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
            >
              2. Submission Rules &amp; Limits
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 pt-2">
            {activeTab === "DETAILS" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2 space-y-1.5">
                    <Label className="text-xs font-semibold">Assignment Title *</Label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Capstone Practical Project"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Max Marks</Label>
                    <Input
                      type="number"
                      value={maxMarks || ""}
                      placeholder="Optional (e.g. 100)"
                      onChange={(e) => setMaxMarks(e.target.value ? Number(e.target.value) : 0)}
                    />
                  </div>
                </div>

                {/* Deadline & Attempts */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Submission Deadline Date</Label>
                    <Input
                      type="date"
                      min={todayStr}
                      value={deadlineDate}
                      onChange={(e) => setDeadlineDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Time</Label>
                    <Input
                      type="time"
                      value={deadlineTime}
                      onChange={(e) => setDeadlineTime(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Maximum Attempts</Label>
                    <Input
                      type="number"
                      min={0}
                      value={maxAttempts !== undefined && maxAttempts !== null ? maxAttempts : 3}
                      placeholder="Enter attempts (e.g. 1, 3, 5, or 0 for Unlimited)"
                      onChange={(e) => setMaxAttempts(e.target.value !== "" ? Number(e.target.value) : 3)}
                    />
                    <span className="text-[10px] text-muted-foreground block">
                      {maxAttempts === 0 ? "0 = Unlimited attempts allowed for learners" : `Learners get ${maxAttempts} attempt(s)`}
                    </span>
                  </div>
                </div>

                {/* Late Submission */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Late Submission</Label>
                    <select
                      value={lateSubmission}
                      onChange={(e) => setLateSubmission(e.target.value)}
                      className="w-full h-10 px-3 rounded-md bg-background border border-input text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="ALLOWED">Allowed</option>
                      <option value="NOT_ALLOWED">Not Allowed</option>
                    </select>
                  </div>
                  {lateSubmission === "ALLOWED" && (
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Late Penalty (%)</Label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={latePenaltyPercent}
                        onChange={(e) => setLatePenaltyPercent(Math.max(0, Number(e.target.value)))}
                      />
                    </div>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Description / Instructions *</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter assignment requirements, scope, and objectives..."
                    className="min-h-[90px] resize-none"
                    required
                  />
                </div>

                {/* Question Files Upload */}
                <div className="space-y-2 pt-2 border-t border-border">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Upload Question / Scenario Files
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Drop zone */}
                    <div className="relative border-2 border-dashed border-border rounded-xl p-5 flex flex-col items-center justify-center bg-muted/20 hover:bg-muted/40 transition-colors">
                      <Upload className="h-6 w-6 text-muted-foreground mb-2" />
                      <p className="text-xs font-medium text-foreground text-center">
                        Drag &amp; drop files here or <span className="text-primary font-bold">Browse</span>
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        Supported: PDF, DOC, ZIP (Max 50MB)
                      </p>
                      <input
                        type="file"
                        onChange={handleFileUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </div>

                    {/* Uploaded Files List */}
                    <div className="space-y-2 max-h-[140px] overflow-y-auto">
                      {questionFiles.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-4">No files uploaded yet.</p>
                      ) : (
                        questionFiles.map((file, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-card text-xs"
                          >
                            <div className="flex items-center gap-2 truncate">
                              <FileCode className="h-4 w-4 text-primary shrink-0" />
                              <span className="truncate font-medium text-foreground">
                                {file.name}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                {file.size}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveFile(idx)}
                              className="text-red-500 hover:text-red-600 p-1"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setActiveTab("SUBMISSION")}
                    className="bg-primary text-primary-foreground"
                  >
                    Save &amp; Continue &rarr;
                  </Button>
                </div>
              </div>
            )}

            {activeTab === "SUBMISSION" && (
              <div className="space-y-4">
                {/* Allowed Submission File Types */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Allowed Submission File Types</Label>
                  <div className="flex flex-wrap gap-3">
                    {[
                      "PDF",
                      "DOC",
                      "DOCX",
                      "PPT",
                      "PPTX",
                      "ZIP",
                      "Images (JPG, PNG)",
                      "Others",
                    ].map((tStr) => (
                      <label
                        key={tStr}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-muted/20 text-xs font-medium cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={allowedTypes.includes(tStr)}
                          onChange={() => toggleFileType(tStr)}
                          className="h-3.5 w-3.5 rounded text-primary focus:ring-primary"
                        />
                        {tStr}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Limits */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Max File Size (MB)</Label>
                    <Input
                      type="number"
                      value={maxFileSizeMb}
                      onChange={(e) => setMaxFileSizeMb(Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Max Files Per Submission</Label>
                    <Input
                      type="number"
                      value={maxFilesPerSubmission}
                      onChange={(e) => setMaxFilesPerSubmission(Number(e.target.value))}
                    />
                  </div>
                </div>

                {/* Instructions */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Submission Guidelines for Learners</Label>
                  <Textarea
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    placeholder="1. Read all instructions carefully...\n2. Prepare your solution file.\n3. Upload solution before deadline."
                    className="min-h-[80px] resize-none"
                  />
                </div>

                {/* Toggles */}
                <div className="space-y-3 pt-2 border-t border-border">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Additional Settings
                  </Label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 text-xs font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        checked={allowResubmission}
                        onChange={(e) => setAllowResubmission(e.target.checked)}
                        className="h-4 w-4 rounded text-primary focus:ring-primary"
                      />
                      Allow resubmission before deadline
                    </label>
                    <label className="flex items-center gap-3 text-xs font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        checked={plagiarismCheck}
                        onChange={(e) => setPlagiarismCheck(e.target.checked)}
                        className="h-4 w-4 rounded text-primary focus:ring-primary"
                      />
                      Enable Plagiarism &amp; AI Check
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveTab("DETAILS")}
                  >
                    &larr; Back to Details
                  </Button>
                  <Button type="submit" className="bg-primary text-primary-foreground">
                    Save &amp; Attach Assignment
                  </Button>
                </div>
              </div>
            )}
          </form>
        </DialogContent>
      </Dialog>

      {/* Validation Error Popup Modal (No Cancel Button, Red Warning Icon) */}
      {validationModal && (
        <HarbingerConfirmModal
          open={validationModal.open}
          onOpenChange={(open) => {
            if (!open) setValidationModal(null);
          }}
          title={validationModal.title}
          description={validationModal.description}
          confirmLabel="OK"
          showCancelButton={false}
          variant="danger"
        />
      )}
    </>
  );
}
