"use client";

import React, { useState } from "react";
import {
  FileCheck2,
  Upload,
  CheckCircle2,
  FileText,
  Sparkles,
  Send,
  Paperclip,
  Download,
  Calendar,
  Clock,
  HardDrive,
  FileCode,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

interface InlineAssignmentPlayerProps {
  assignmentTitle: string;
  description?: string;
  configJson?: string;
  isPreview?: boolean;
  existingSubmission?: any;
  onComplete?: (submissionText: string, fileUrl?: string) => void;
  onNextLesson?: () => void;
}

export default function InlineAssignmentPlayer({
  assignmentTitle,
  description,
  configJson,
  isPreview = false,
  existingSubmission,
  onComplete,
  onNextLesson,
}: InlineAssignmentPlayerProps) {
  // Parse assignment configuration object
  let parsedConfig: any = {};
  if (configJson) {
    try {
      parsedConfig = typeof configJson === "string" ? JSON.parse(configJson) : configJson;
    } catch (err) {
      console.error("Error parsing assignment configJson:", err);
    }
  }

  const [responseText, setResponseText] = useState(existingSubmission?.submissionText || "");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(Boolean(existingSubmission));

  const effectiveMaxMarks = parsedConfig.maxMarks || 50;
  const effectiveInstructions =
    parsedConfig.instructions || parsedConfig.description || description || "No specific assignment instructions provided by Admin yet.";
  const rawDeadline = parsedConfig.deadline || parsedConfig.dueDate || parsedConfig.deadlineDate || parsedConfig.endDate;
  const deadlineText = rawDeadline
    ? new Date(rawDeadline).toString() !== "Invalid Date"
      ? new Date(rawDeadline).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
      : String(rawDeadline)
    : "No strict deadline";

  const maxAttempts = parsedConfig.maxAttempts || 2;
  const allowedFileTypes: string[] = parsedConfig.allowedFileTypes || ["PDF", "DOC", "DOCX", "ZIP"];
  const maxFileSizeMb = parsedConfig.maxFileSizeMb || 50;

  // Formatting dates for submission & evaluation timeline
  const submittedDateText = existingSubmission?.submittedAt
    ? new Date(existingSubmission.submittedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
    : null;

  const gradedDateText = existingSubmission?.gradedAt
    ? new Date(existingSubmission.gradedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
    : null;

  // Instructor uploaded reference files / question artifacts
  const referenceFiles: any[] =
    parsedConfig.questionFiles || parsedConfig.attachments || parsedConfig.files || [];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!responseText.trim() && !selectedFile) return;
    setIsSubmitted(true);
    if (onComplete) {
      onComplete(responseText.trim(), selectedFile ? selectedFile.name : undefined);
    }
  };

  const isGraded = existingSubmission?.status === "GRADED";

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6 select-none">
      {/* Assignment Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <FileCheck2 className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Badge className="bg-purple-500/20 text-purple-400 border border-purple-500/30 text-[10px] font-bold uppercase">
                Practical Assignment
              </Badge>
              {isPreview && (
                <Badge variant="outline" className="text-[10px] border-slate-700 text-slate-400">
                  Preview Workspace
                </Badge>
              )}
            </div>
            <h2 className="text-lg font-bold text-white mt-0.5">{assignmentTitle}</h2>
          </div>
        </div>

        <Badge variant="outline" className="border-purple-500/30 text-purple-300 font-extrabold text-xs">
          Max Score: {effectiveMaxMarks} Marks
        </Badge>
      </div>

      {/* Assignment Schedule Timeline & Status Bar */}
      <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 space-y-3.5 text-xs">
        <div className="flex items-center justify-between font-bold text-slate-200 border-b border-slate-800/80 pb-2">
          <span className="flex items-center gap-2 text-purple-400">
            <Clock className="h-4 w-4" /> Assignment Lifecycle &amp; Submission Timeline
          </span>
          <span className="text-[10px] text-purple-300 font-bold bg-purple-500/10 px-2.5 py-0.5 rounded-full border border-purple-500/20">
            Due: {deadlineText}
          </span>
        </div>

        <div className="relative pl-6 space-y-3 border-l-2 border-purple-500/30 ml-2">
          {/* Milestone 1: Assignment Assigned */}
          <div className="relative">
            <span className="absolute -left-[31px] top-0.5 h-4 w-4 rounded-full bg-purple-500/20 border-2 border-purple-500 flex items-center justify-center text-[9px] text-purple-400 font-bold">1</span>
            <div className="space-y-0.5">
              <div className="font-semibold text-white">Assignment Released</div>
              <div className="text-[11px] text-slate-400">Course curriculum task assigned to enrolled learners.</div>
            </div>
          </div>

          {/* Milestone 2: Learner Submission */}
          <div className="relative">
            <span className={`absolute -left-[31px] top-0.5 h-4 w-4 rounded-full border-2 flex items-center justify-center text-[9px] font-bold ${isSubmitted ? "bg-emerald-500/20 border-emerald-500 text-emerald-400" : "bg-slate-800 border-slate-600 text-slate-400"}`}>2</span>
            <div className="space-y-0.5">
              <div className="font-semibold text-white flex items-center gap-2">
                Learner Submission
                {isSubmitted && <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[9px] px-1.5">Submitted</Badge>}
              </div>
              <div className="text-[11px] text-slate-400">
                {submittedDateText ? `Submitted on ${submittedDateText}` : `Pending submission (Deadline: ${deadlineText})`}
              </div>
            </div>
          </div>

          {/* Milestone 3: Faculty Evaluation */}
          <div className="relative">
            <span className={`absolute -left-[31px] top-0.5 h-4 w-4 rounded-full border-2 flex items-center justify-center text-[9px] font-bold ${isGraded ? "bg-emerald-500/20 border-emerald-500 text-emerald-400" : "bg-slate-800 border-slate-600 text-slate-400"}`}>3</span>
            <div className="space-y-0.5">
              <div className="font-semibold text-white flex items-center gap-2">
                Faculty Review &amp; Grading
                {isGraded && <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-[9px] px-1.5">Graded</Badge>}
              </div>
              <div className="text-[11px] text-slate-400">
                {gradedDateText ? `Evaluated by ${existingSubmission?.gradedBy || "Faculty"} on ${gradedDateText}` : "Awaiting instructor review and grading"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Submitted State */}
      {isSubmitted ? (
        <div className="p-8 bg-slate-950/90 border border-slate-800 rounded-xl text-center space-y-4 animate-in fade-in">
          <div className="h-14 w-14 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-lg">
            <CheckCircle2 className="h-7 w-7" />
          </div>

          <div className="space-y-1">
            <h3 className="text-lg font-extrabold text-white">
              {isGraded ? "Assignment Graded by Faculty!" : "Assignment Workspace Submitted!"}
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              {isGraded
                ? `Evaluated by ${existingSubmission.gradedBy || "Instructor"}`
                : "Your response has been submitted to course faculty for review and evaluation."}
            </p>
          </div>

          {isGraded && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-2 max-w-lg mx-auto">
              <div className="flex items-center justify-between">
                <span className="text-emerald-300 font-bold">Grade Awarded:</span>
                <Badge className="bg-emerald-600 text-white font-extrabold text-xs">
                  Grade {existingSubmission.grade || "A"}
                </Badge>
              </div>
              <div className="text-slate-200">
                Score: <strong className="text-emerald-400 font-bold">{existingSubmission.score} / {existingSubmission.maxScore || effectiveMaxMarks} ({existingSubmission.percentage}%)</strong>
              </div>
              {existingSubmission.feedback && (
                <div className="text-amber-300 text-left pt-2 border-t border-emerald-500/20 italic">
                  Feedback: "{existingSubmission.feedback}"
                </div>
              )}
            </div>
          )}

          {responseText && (
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-left text-xs space-y-1 max-w-lg mx-auto">
              <span className="text-slate-400 font-bold block">Your Written Solution:</span>
              <p className="text-slate-200 leading-relaxed whitespace-pre-line">{responseText}</p>
            </div>
          )}

          {(selectedFile || existingSubmission?.fileUrl) && (
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-left text-xs max-w-lg mx-auto flex items-center gap-2 text-purple-300 font-medium">
              <Paperclip className="h-4 w-4 shrink-0" />
              <span className="truncate">Attached File: {selectedFile ? selectedFile.name : existingSubmission.fileUrl}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
            <Button
              onClick={() => setIsSubmitted(false)}
              variant="outline"
              className="border-slate-700 text-slate-300 hover:bg-slate-800 text-xs gap-1.5 cursor-pointer"
            >
              Edit Submission
            </Button>

            {onNextLesson && (
              <Button
                onClick={onNextLesson}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-extrabold text-xs gap-2 px-6 h-10 shadow cursor-pointer"
              >
                Next Lesson / Section &rarr;
              </Button>
            )}
          </div>
        </div>
      ) : (
        /* Workspace Form */
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Instructions Box */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-400" /> Assignment Instructions &amp; Requirements
            </h3>
            <p className="text-slate-300 leading-relaxed whitespace-pre-line">
              {effectiveInstructions}
            </p>
          </div>

          {/* Instructor Uploaded Attachments / Reference Files */}
          {referenceFiles.length > 0 && (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2.5">
              <h4 className="font-bold text-white flex items-center gap-2">
                <Paperclip className="h-4 w-4 text-purple-400" /> Instructor Reference Files &amp; Problem Documents:
              </h4>
              <div className="flex flex-wrap gap-2.5">
                {referenceFiles.map((fileItem: any, fIdx: number) => {
                  const fileName = fileItem.name || fileItem.fileName || fileItem.title || `Attachment_${fIdx + 1}`;
                  const fileUrl = fileItem.url || fileItem.fileUrl || fileItem.path || "#";
                  return (
                    <a
                      key={fIdx}
                      href={fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-purple-300 hover:text-white hover:border-purple-500/50 text-xs font-semibold transition-all group"
                    >
                      <FileText className="h-4 w-4 text-purple-400 group-hover:scale-110 transition-transform" />
                      <span className="truncate max-w-[200px]">{fileName}</span>
                      {fileItem.size && <span className="text-[10px] text-slate-500">({fileItem.size})</span>}
                      <Download className="h-3.5 w-3.5 text-slate-400 group-hover:text-purple-300 shrink-0" />
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          {/* Written Answer Box */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 block">
              Written Response / Solution Summary:
            </label>
            <Textarea
              rows={5}
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              placeholder="Type your detailed assignment response, architecture notes, or code explanation..."
              className="bg-slate-950 border-slate-800 text-white text-xs placeholder:text-slate-500 rounded-xl focus:border-purple-500"
            />
          </div>

          {/* File Upload Dropzone */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 block">
              Attach Work Artifacts (Optional):
            </label>
            <div className="p-6 border-2 border-dashed border-slate-800 hover:border-purple-500/50 rounded-xl bg-slate-950 text-center space-y-2 transition-colors">
              <input
                type="file"
                id="assignment-file-input"
                onChange={handleFileChange}
                className="hidden"
              />
              <label
                htmlFor="assignment-file-input"
                className="cursor-pointer flex flex-col items-center gap-2 text-xs text-slate-400 hover:text-white"
              >
                <Upload className="h-8 w-8 text-purple-400" />
                <span>
                  {selectedFile ? (
                    <strong className="text-purple-300">{selectedFile.name}</strong>
                  ) : (
                    `Click to upload assignment file (${allowedFileTypes.join(", ")}) — Max ${maxFileSizeMb}MB`
                  )}
                </span>
              </label>
            </div>
          </div>

          {/* Submit Action */}
          <div className="flex justify-end pt-2 border-t border-slate-800">
            <Button
              type="submit"
              disabled={!responseText.trim() && !selectedFile}
              className="bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs gap-2 px-6 h-10 shadow cursor-pointer"
            >
              <Send className="h-4 w-4" /> Submit Assignment Response
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
