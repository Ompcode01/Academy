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
  Folder,
  Presentation,
  ExternalLink,
  Eye,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import toast from "react-hot-toast";
import { uploadDocumentFile, getStorageUrl } from "@/services/api/course.service";
import InteractivePptViewer from "./InteractivePptViewer";

function getSameOriginPath(url?: string): string {
  if (!url) return "";
  const trimmed = url.trim();
  if (trimmed.startsWith("/storage/")) return trimmed;
  try {
    const parsed = new URL(trimmed);
    if (parsed.pathname.startsWith("/storage/")) return parsed.pathname;
  } catch {}
  return `/storage/${trimmed.replace(/^\/+/, "")}`;
}

interface InlineAssignmentPlayerProps {
  assignmentTitle: string;
  contentUrl?: string;
  description?: string;
  configJson?: string;
  isPreview?: boolean;
  existingSubmission?: any;
  onComplete?: (submissionText: string, fileUrl?: string) => void;
  onNextLesson?: () => void;
}

export default function InlineAssignmentPlayer({
  assignmentTitle,
  contentUrl,
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
  const [activeRefDoc, setActiveRefDoc] = useState<any | null>(null);

  const triggerDirectDownload = (fileUrl: string, fileName: string) => {
    const a = document.createElement("a");
    a.href = getStorageUrl(fileUrl);
    a.download = fileName.replace(/\s+/g, "_");
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const effectiveMaxMarks = parsedConfig.maxMarks || 50;
  const effectiveInstructions =
    parsedConfig.instructions || parsedConfig.description || description || "No specific assignment instructions provided by Admin yet.";
  const rawDeadline = parsedConfig.deadline || parsedConfig.dueDate || parsedConfig.deadlineDate || parsedConfig.endDate;
  const deadlineText = rawDeadline
    ? new Date(rawDeadline).toString() !== "Invalid Date"
      ? new Date(rawDeadline).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
      : String(rawDeadline)
    : "No strict deadline";

  const rawMaxAttempts = parsedConfig.maxAttempts ?? parsedConfig.attemptsAllowed ?? parsedConfig.attempts;
  const maxAttempts = rawMaxAttempts !== undefined && rawMaxAttempts !== null && rawMaxAttempts !== "" ? Number(rawMaxAttempts) : 1;
  const isUnlimitedAttempts = maxAttempts === 0 || maxAttempts >= 999;
  const allowedFileTypes: string[] = parsedConfig.allowedFileTypes || ["PDF", "DOC", "DOCX", "ZIP"];
  const maxFileSizeMb = parsedConfig.maxFileSizeMb || 50;

  const acceptAttribute = React.useMemo(() => {
    const mappings: Record<string, string> = {
      PDF: ".pdf,application/pdf",
      DOC: ".doc,application/msword",
      DOCX: ".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      PPT: ".ppt,application/vnd.ms-powerpoint",
      PPTX: ".pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation",
      ZIP: ".zip,application/zip,application/x-zip-compressed",
      "Images (JPG, PNG)": "image/jpeg,image/png,.jpg,.jpeg,.png",
    };
    
    if (allowedFileTypes.includes("Others")) {
      return undefined;
    }
    
    return allowedFileTypes
      .map((t) => mappings[t])
      .filter(Boolean)
      .join(",");
  }, [allowedFileTypes]);

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

  const maxFiles = parsedConfig.maxFiles || 5;
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      // Validate file extensions based on allowedFileTypes
      const invalidFiles = files.filter((file) => {
        const ext = file.name.split(".").pop()?.toUpperCase() || "";
        if (allowedFileTypes.includes(ext)) return false;
        
        // Handle images
        if (allowedFileTypes.includes("Images (JPG, PNG)") && ["JPG", "JPEG", "PNG"].includes(ext)) {
          return false;
        }

        // Handle generic fallback/Others
        if (allowedFileTypes.includes("Others")) {
          return false;
        }
        
        return true;
      });

      if (invalidFiles.length > 0) {
        toast.error(
          `Only files with the following formats are allowed: ${allowedFileTypes.join(", ")}.\nInvalid files: ${invalidFiles
            .map((f) => f.name)
            .join(", ")}`
        );
        return;
      }

      setSelectedFiles((prev) => {
        const combined = [...prev, ...files];
        if (combined.length > maxFiles) {
          toast.error(`Maximum allowed files limit is ${maxFiles}. Attached first ${maxFiles} files.`);
          return combined.slice(0, maxFiles);
        }
        return combined;
      });
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!responseText.trim() && selectedFiles.length === 0) return;

    let uploadedFileUrls: string[] = [];
    if (selectedFiles.length > 0) {
      try {
        setUploading(true);
        const uploadPromises = selectedFiles.map(async (file) => {
          try {
            const res = await uploadDocumentFile(file);
            return res?.data?.fileUrl || file.name;
          } catch {
            return file.name;
          }
        });
        uploadedFileUrls = await Promise.all(uploadPromises);
      } catch (err) {
        console.error("Failed to upload assignment files:", err);
      } finally {
        setUploading(false);
      }
    }

    const finalFileUrl =
      uploadedFileUrls.length === 1
        ? uploadedFileUrls[0]
        : uploadedFileUrls.length > 1
        ? JSON.stringify(uploadedFileUrls)
        : undefined;

    setIsSubmitted(true);
    if (onComplete) {
      onComplete(responseText.trim(), finalFileUrl);
    }
  };

  const isGraded = existingSubmission?.status === "GRADED";

  // Primary attachment URL from lesson contentUrl or parsedConfig
  const mainAttachmentUrl = contentUrl || parsedConfig.fileUrl || parsedConfig.documentUrl || parsedConfig.attachmentUrl;
  const mainAttachmentLower = (mainAttachmentUrl || "").toLowerCase();

  const mainAttachmentIsPdf = mainAttachmentLower.includes(".pdf");
  const mainAttachmentIsPpt = Boolean(mainAttachmentLower.match(/\.(pptx?)$/i));
  const mainAttachmentIsDoc = Boolean(mainAttachmentLower.match(/\.(docx?)$/i));
  const mainAttachmentIsZip = mainAttachmentLower.includes(".zip");

  const zipFilesList: any[] =
    parsedConfig.extractedZipFiles || parsedConfig.zipFiles || [];

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
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-left text-xs space-y-2 max-w-lg mx-auto">
              <span className="text-slate-400 font-bold block">
                {responseText.trim().startsWith("{") && responseText.includes('"responses"')
                  ? "Submitted Feedback Survey Responses:"
                  : "Your Written Solution:"}
              </span>
              {responseText.trim().startsWith("{") && responseText.includes('"responses"') ? (
                (() => {
                  try {
                    const fbData = JSON.parse(responseText);
                    if (fbData?.responses) {
                      return (
                        <div className="space-y-2 pt-1">
                          {Object.entries(fbData.responses).map(([qKey, ansVal], rIdx) => {
                            const getPrompt = (kStr: string, idx: number) => {
                              if (fbData?.questions && Array.isArray(fbData.questions)) {
                                const f = fbData.questions.find((q: any) => String(q.id) === String(kStr));
                                if (f?.questionText) return f.questionText;
                                if (fbData.questions[idx]?.questionText) return fbData.questions[idx].questionText;
                              }
                              const defaults: Record<string, string> = {
                                "1": "How satisfied are you with the course content and instructor explanations?",
                                "2": "How well did the practical exercises help reinforce your learning?",
                                "3": "What suggestions do you have for improving this course module?",
                                "4": "Overall Course & Instructor Support Rating",
                                "5": "Additional Instructor & Material Review Notes",
                               };
                              return defaults[kStr] || `Evaluation Prompt #${idx + 1}`;
                            };
                            return (
                              <div key={rIdx} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex flex-col gap-1">
                                <span className="text-amber-400 font-bold text-[11px]">
                                  Q#{rIdx + 1}: {getPrompt(qKey, rIdx)}
                                </span>
                                <span className="text-slate-200 font-semibold">{String(ansVal)}</span>
                              </div>
                            );
                          })}
                        </div>
                      );
                    }
                  } catch {}
                  return <p className="text-slate-200 leading-relaxed whitespace-pre-line">{responseText}</p>;
                })()
              ) : (
                <p className="text-slate-200 leading-relaxed whitespace-pre-line">{responseText}</p>
              )}
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

          {/* Primary Assignment Attachment & Reference Documents (PDF, PPT, DOC, DOCX, ZIP) */}
          {(mainAttachmentUrl || referenceFiles.length > 0 || zipFilesList.length > 0) && (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <h4 className="font-bold text-white text-xs flex items-center gap-2">
                  <Paperclip className="h-4 w-4 text-purple-400" /> MiniProject Reference Materials &amp; Problem Documents:
                </h4>
                <span className="text-[10px] text-purple-300 font-semibold bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                  {zipFilesList.length > 0 ? "ZIP Package & Extracted Folder" : "Project Documents"}
                </span>
              </div>

              {/* Inline PDF Preview Frame */}
              {mainAttachmentIsPdf && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <span className="font-semibold flex items-center gap-1.5 text-red-400">
                      <FileText className="h-4 w-4" /> PDF Document Preview:
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => window.open(getStorageUrl(mainAttachmentUrl), "_blank")}
                      className="h-7 px-2.5 text-xs text-purple-300 hover:text-white font-bold gap-1"
                    >
                      <ExternalLink className="h-3.5 w-3.5" /> Open in New Tab
                    </Button>
                  </div>
                  <div className="w-full h-[420px] bg-slate-900 rounded-xl overflow-hidden border border-slate-800">
                    <iframe
                      src={`${getSameOriginPath(mainAttachmentUrl)}#page=1`}
                      className="w-full h-full border-0 bg-white"
                      title={assignmentTitle}
                    />
                  </div>
                </div>
              )}

              {/* Word Document (.doc / .docx) Card */}
              {mainAttachmentIsDoc && (
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div>
                      <span className="font-bold text-white text-sm block">Word Document (.docx)</span>
                      <span className="text-[11px] text-slate-400">Instructional Word Document reference file for this project.</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        const a = document.createElement("a");
                        a.href = getStorageUrl(mainAttachmentUrl);
                        a.download = `${assignmentTitle.replace(/\s+/g, "_")}.docx`;
                        a.target = "_blank";
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                      }}
                      className="h-8 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs gap-1.5 cursor-pointer shadow"
                    >
                      <Download className="h-3.5 w-3.5" /> Download .docx Document
                    </Button>
                  </div>
                </div>
              )}

              {/* Presentation Document (.ppt / .pptx) Card */}
              {mainAttachmentIsPpt && (
                <div className="space-y-2">
                  <InteractivePptViewer
                    title={assignmentTitle}
                    contentUrl={mainAttachmentUrl}
                    description={description}
                  />
                </div>
              )}

              {/* Extracted Project ZIP Folder Explorer */}
              {zipFilesList.length > 0 && (
                <div className="space-y-2.5 pt-1">
                  <div className="flex items-center justify-between text-xs text-amber-400 font-bold">
                    <span className="flex items-center gap-1.5">
                      <Folder className="h-4 w-4 text-amber-400" /> Extracted Project Files Folder ({zipFilesList.length} Files):
                    </span>
                    {mainAttachmentIsZip && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const a = document.createElement("a");
                          a.href = getStorageUrl(mainAttachmentUrl);
                          a.download = `${assignmentTitle.replace(/\s+/g, "_")}.zip`;
                          a.target = "_blank";
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                        }}
                        className="h-7 px-2.5 text-[11px] border-slate-700 text-amber-400 hover:bg-slate-800 font-bold gap-1 cursor-pointer"
                      >
                        <Download className="h-3 w-3" /> Download Full ZIP Package
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto scrollbar-thin p-1">
                    {zipFilesList.map((zFile: any, zIdx: number) => {
                      const fileName = zFile.name || zFile.fileName || `File_${zIdx + 1}`;
                      const ext = fileName.split(".").pop()?.toLowerCase() || "";
                      const isPdfExt = ext === "pdf";
                      const isPptExt = ["ppt", "pptx"].includes(ext);
                      const isDocExt = ["doc", "docx"].includes(ext);
                      const isCodeExt = ["js", "ts", "html", "css", "json", "py", "java", "sql", "txt"].includes(ext);
                      const rawFileUrl = zFile.url || zFile.fileUrl || `/storage/uploads/${fileName}`;
                      const targetFileUrl = getStorageUrl(rawFileUrl);

                      return (
                        <div
                          key={zIdx}
                          className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-amber-500/40 text-xs transition-all group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 pr-2">
                            {isPdfExt ? (
                              <FileText className="h-4 w-4 text-red-400 shrink-0" />
                            ) : isPptExt ? (
                              <Presentation className="h-4 w-4 text-amber-400 shrink-0" />
                            ) : isDocExt ? (
                              <FileText className="h-4 w-4 text-blue-400 shrink-0" />
                            ) : isCodeExt ? (
                              <FileCode className="h-4 w-4 text-emerald-400 shrink-0" />
                            ) : (
                              <FileText className="h-4 w-4 text-purple-400 shrink-0" />
                            )}
                            <div className="truncate">
                              <p className="font-semibold text-slate-200 truncate group-hover:text-amber-400 transition-colors">
                                {fileName}
                              </p>
                              {zFile.sizeMb && <p className="text-[10px] text-slate-500">{zFile.sizeMb} MB</p>}
                            </div>
                          </div>

                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => window.open(targetFileUrl, "_blank", "noopener,noreferrer")}
                            className="h-7 px-2 text-[11px] text-amber-400 hover:text-amber-300 hover:bg-slate-800 font-bold gap-1 shrink-0"
                            title="View / Download File"
                          >
                            <Download className="h-3 w-3" /> View
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Reference Files List */}
              {referenceFiles.length > 0 && (
                <div className="space-y-3 pt-2 border-t border-slate-800/80">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300">
                      Instructor Reference Documents ({referenceFiles.length}):
                    </span>
                    <span className="text-[10px] text-purple-400 font-semibold">
                      Click any document to view or download
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2.5">
                    {referenceFiles.map((fileItem: any, fIdx: number) => {
                      const fileName = fileItem.name || fileItem.fileName || fileItem.title || `Attachment_${fIdx + 1}`;
                      const isSelected = activeRefDoc?.name === fileName || activeRefDoc?.url === fileItem.url;

                      return (
                        <button
                          key={fIdx}
                          type="button"
                          onClick={() => setActiveRefDoc(isSelected ? null : fileItem)}
                          className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                            isSelected
                              ? "bg-purple-500/20 border-purple-500 text-purple-200 ring-2 ring-purple-500/40 shadow-lg scale-105"
                              : "bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:border-purple-500/50"
                          }`}
                        >
                          <FileText className={`h-4 w-4 ${isSelected ? "text-purple-300" : "text-purple-400"}`} />
                          <span className="truncate max-w-[220px]">{fileName}</span>
                          {fileItem.size && <span className="text-[10px] text-slate-500">({fileItem.size})</span>}
                        </button>
                      );
                    })}
                  </div>

                  {/* Selected Reference Document Action Card */}
                  {activeRefDoc && (
                    <div className="p-4 rounded-xl bg-slate-900 border border-purple-500/40 shadow-xl space-y-3 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400">
                            <FileText className="h-5 w-5" />
                          </div>
                          <div>
                            <span className="font-bold text-white text-sm block">
                              {activeRefDoc.name || activeRefDoc.fileName || "Selected Document"}
                            </span>
                            <span className="text-[10px] text-purple-300 font-semibold">
                              {activeRefDoc.size || "Document File"} • Select an action below
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveRefDoc(null)}
                          className="text-slate-400 hover:text-white p-1 cursor-pointer"
                          title="Close action box"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="flex items-center gap-3 pt-1">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => {
                            const docName = activeRefDoc.name || activeRefDoc.fileName || "Document";
                            const docUrl = activeRefDoc.url || activeRefDoc.fileUrl || `/storage/uploads/${docName}`;
                            triggerDirectDownload(docUrl, docName);
                          }}
                          className="h-9 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs gap-2 px-6 cursor-pointer shadow-md"
                        >
                          <Download className="h-4 w-4" /> Download Document
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
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
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <label className="font-bold text-slate-300 block">
                Attach Work Artifacts (Optional — Up to {maxFiles} files):
              </label>
              {selectedFiles.length > 0 && (
                <span className="text-[11px] font-semibold text-purple-400">
                  {selectedFiles.length} of {maxFiles} files attached
                </span>
              )}
            </div>

            {/* List of attached files */}
            {selectedFiles.length > 0 && (
              <div className="space-y-2">
                {selectedFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Paperclip className="h-4 w-4 text-purple-400 shrink-0" />
                      <span className="font-bold text-slate-200 truncate">{file.name}</span>
                      <span className="text-[10px] text-slate-500 shrink-0">
                        ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(idx)}
                      className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-red-400 transition-colors"
                      title="Remove file"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {selectedFiles.length < maxFiles && (
              <div className="p-5 border-2 border-dashed border-slate-800 hover:border-purple-500/50 rounded-xl bg-slate-950 text-center space-y-2 transition-colors">
                <input
                  type="file"
                  id="assignment-file-input"
                  multiple
                  accept={acceptAttribute}
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="assignment-file-input"
                  className="cursor-pointer flex flex-col items-center gap-2 text-xs text-slate-400 hover:text-white"
                >
                  <Upload className="h-7 w-7 text-purple-400" />
                  <span>
                    Click to attach file(s) ({allowedFileTypes.join(", ")}) — Max {maxFileSizeMb}MB each (Up to {maxFiles} files)
                  </span>
                </label>
              </div>
            )}
          </div>

          {/* Submit Action */}
          <div className="flex justify-end pt-2 border-t border-slate-800">
            <Button
              type="submit"
              disabled={uploading || (!responseText.trim() && selectedFiles.length === 0)}
              className="bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs gap-2 px-6 h-10 shadow cursor-pointer"
            >
              {uploading ? (
                <span>Uploading Files...</span>
              ) : (
                <>
                  <Send className="h-4 w-4" /> Submit Assignment Response
                </>
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
