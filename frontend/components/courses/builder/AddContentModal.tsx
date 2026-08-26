"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, FileText, Link as LinkIcon, Video, GraduationCap, Archive, RefreshCw, Sparkles } from "lucide-react";
import { ContentTypeKey } from "./ContentTypePickerModal";
import { uploadScormPackage, uploadDocumentFile } from "@/services/api/course.service";
import HarbingerConfirmModal from "@/components/common/HarbingerConfirmModal";

interface AddContentModalProps {
  open: boolean;
  type: ContentTypeKey | null;
  initialData?: any;
  onOpenChange: (open: boolean) => void;
  onSaveContent: (data: {
    title: string;
    contentType: string;
    contentUrl?: string;
    description?: string;
    fileSize?: string;
    duration?: number;
  }) => void;
}

export default function AddContentModal({
  open,
  type,
  initialData,
  onOpenChange,
  onSaveContent,
}: AddContentModalProps) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<string>("1.2 MB");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [validationModal, setValidationModal] = useState<{ open: boolean; title: string; description: string } | null>(null);

  const [detectedPageCount, setDetectedPageCount] = useState<number>(1);
  const [detectedSlideCount, setDetectedSlideCount] = useState<number>(1);
  const [estimatedDurationMins, setEstimatedDurationMins] = useState<number>(15);
  const [customDurationMins, setCustomDurationMins] = useState<string>("");

  useEffect(() => {
    if (open) {
      if (initialData) {
        setTitle(initialData.title || "");
        setUrl(initialData.contentUrl || "");
        setDescription(initialData.description || "");
        setFileName(initialData.contentUrl ? initialData.contentUrl.split("/").pop() || null : null);
        setFileSize(initialData.fileSize || "1.2 MB");
        setCustomDurationMins(initialData.duration ? String(initialData.duration) : "");
      } else {
        setTitle("");
        setUrl("");
        setDescription("");
        setFileName(null);
        setFileSize("1.2 MB");
        setSelectedFile(null);
        setCustomDurationMins("");
      }
    }
  }, [open, initialData]);

  if (!type) return null;

  const isLink = ["YOUTUBE", "UDEMY", "EXTERNAL_LINK"].includes(type);
  const isDocument = ["PDF", "PPT"].includes(type);
  const isArticle = type === "ARTICLE";
  const isScorm = type === "SCORM";

  // Auto-calculated article word count from written article text body
  const currentWordCount = isArticle
    ? Math.max(1, description.trim().split(/\s+/).filter(Boolean).length)
    : 0;

  const getTypeTitle = () => {
    switch (type) {
      case "SCORM":
        return "Upload SCORM Package (.zip)";
      case "YOUTUBE":
        return "Add YouTube Link";
      case "UDEMY":
        return "Add Udemy Link";
      case "PDF":
        return "Upload PDF Document";
      case "PPT":
        return "Upload Presentation";
      case "ARTICLE":
        return "Write Text Article";
      case "EXTERNAL_LINK":
        return "Add External Resource Link";
      default:
        return "Add Content";
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    const file = e.target.files?.[0];
    if (file) {
      // 100MB size limit validation for SCORM, 50MB for documents
      const maxBytes = isScorm ? 100 * 1024 * 1024 : 50 * 1024 * 1024;
      if (file.size > maxBytes) {
        setErrorMessage(
          isScorm
            ? "File size exceeds the 100MB limit. Please upload a smaller SCORM ZIP package."
            : "File size exceeds 50MB limit."
        );
        setSelectedFile(null);
        setFileName(null);
        return;
      }

      setSelectedFile(file);
      setFileName(file.name);
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      setFileSize(`${sizeMb} MB`);
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ""));
      }

      // Auto-detect page count or slide count on file selection if document
      if (isDocument) {
        try {
          const uploadRes = await uploadDocumentFile(file);
          if (uploadRes?.success && uploadRes.data) {
            if (uploadRes.data.pageCount) {
              setDetectedPageCount(uploadRes.data.pageCount);
            }
            if (uploadRes.data.slideCount) {
              setDetectedSlideCount(uploadRes.data.slideCount);
            }
          }
        } catch (_) {
          // Fallback estimations
          if (type === "PDF") setDetectedPageCount(Math.max(1, Math.round(file.size / 50000)));
          if (type === "PPT") setDetectedSlideCount(Math.max(1, Math.round(file.size / 150000)));
        }
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setValidationModal({
        open: true,
        title: "Required Fields Missing",
        description: `Please enter a Title for this ${type || "content"} before saving.`,
      });
      return;
    }

    let finalContentUrl = url.trim() || undefined;
    let finalFileSize = isDocument || isScorm ? fileSize : undefined;
    let finalDescription = description.trim() || undefined;

    if (isScorm) {
      if (!selectedFile) {
        setErrorMessage("Please select a SCORM package ZIP file to upload.");
        return;
      }

      try {
        setUploading(true);
        setErrorMessage(null);
        const uploadRes = await uploadScormPackage(selectedFile);
        if (uploadRes?.success && uploadRes.data?.entryUrl) {
          finalContentUrl = uploadRes.data.entryUrl;
          finalFileSize = uploadRes.data.fileSize || fileSize;
        } else {
          setErrorMessage(uploadRes?.message || "Failed to upload SCORM package.");
          setUploading(false);
          return;
        }
      } catch (err: any) {
        console.error("SCORM upload error:", err);
        setErrorMessage(
          err?.response?.data?.message || err?.message || "Failed to upload and extract SCORM package."
        );
        setUploading(false);
        return;
      } finally {
        setUploading(false);
      }
    } else if (isDocument) {
      if (selectedFile) {
        try {
          setUploading(true);
          setErrorMessage(null);
          const uploadRes = await uploadDocumentFile(selectedFile);
          if (uploadRes?.success && uploadRes.data?.fileUrl) {
            finalContentUrl = uploadRes.data.fileUrl;
            finalFileSize = uploadRes.data.fileSize || fileSize;
            if (uploadRes.data.pageCount) setDetectedPageCount(uploadRes.data.pageCount);
            if (uploadRes.data.slideCount) setDetectedSlideCount(uploadRes.data.slideCount);
            if (type === "PPT" && uploadRes.data.slidesConfigJson) {
              finalDescription = uploadRes.data.slidesConfigJson;
            }
          }
        } catch (err: any) {
          console.error("Document upload error:", err);
        } finally {
          setUploading(false);
        }
      }

      if (!finalContentUrl) {
        finalContentUrl = type === "PPT"
          ? "/storage/sample_presentation.pptx"
          : "/storage/sample_course_manual.pdf";
      }
    }

    const calcPageCount = type === "PDF" ? detectedPageCount : undefined;
    const calcSlideCount = type === "PPT" ? detectedSlideCount : undefined;
    const calcWordCount = isArticle ? currentWordCount : undefined;

    let finalDuration = estimatedDurationMins;
    if (customDurationMins && parseInt(customDurationMins, 10) > 0) {
      finalDuration = parseInt(customDurationMins, 10);
    } else {
      if (type === "PDF") finalDuration = Math.ceil((detectedPageCount * 30) / 60);
      if (type === "PPT") finalDuration = Math.ceil((detectedSlideCount * 30) / 60);
      if (isArticle) finalDuration = Math.ceil(((currentWordCount / 250) * 60) / 60);
    }

    onSaveContent({
      title: title.trim(),
      contentType: type,
      contentUrl: finalContentUrl,
      description: finalDescription,
      fileSize: finalFileSize,
      duration: finalDuration,
      pageCount: calcPageCount,
      slideCount: calcSlideCount,
      wordCount: calcWordCount,
    } as any);

    setTitle("");
    setUrl("");
    setDescription("");
    setFileName(null);
    setSelectedFile(null);
    setErrorMessage(null);
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl w-[92vw] max-h-[90vh] bg-card border-border shadow-2xl rounded-2xl flex flex-col overflow-hidden p-0 gap-0">
        {/* Modal Header */}
        <DialogHeader className="px-6 py-4 border-b border-border bg-muted/20 shrink-0">
          <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
            {isLink && <LinkIcon className="h-5 w-5 text-primary" />}
            {(isDocument || isArticle) && <FileText className="h-5 w-5 text-primary" />}
            {isScorm && <Archive className="h-5 w-5 text-violet-500" />}
            {getTypeTitle()}
          </DialogTitle>
        </DialogHeader>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* Error Banner */}
            {errorMessage && (
              <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-semibold">
                {errorMessage}
              </div>
            )}

            {/* Title */}
            <div className="space-y-1.5">
              <Label htmlFor="contentTitle" className="text-xs font-semibold">
                {isArticle ? "Article Title *" : "Title *"}
              </Label>
              <Input
                id="contentTitle"
                placeholder={isArticle ? "e.g. Key Architectural Guidelines & Best Practices" : "Enter title"}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="h-10"
              />
            </div>

            {/* Link URL */}
            {isLink && (
              <div className="space-y-1.5">
                <Label htmlFor="contentUrl" className="text-xs font-semibold">
                  {type === "YOUTUBE" ? "YouTube URL *" : type === "UDEMY" ? "Udemy URL *" : "URL *"}
                </Label>
                <Input
                  id="contentUrl"
                  placeholder={
                    type === "YOUTUBE"
                      ? "https://www.youtube.com/watch?v=..."
                      : "https://example.com/..."
                  }
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                  className="h-10"
                />
              </div>
            )}

            {/* Description / Article Body */}
            <div className="space-y-1.5">
              <Label htmlFor="contentDesc" className="text-xs font-semibold flex items-center justify-between">
                <span>{isArticle ? "Article Body Text Content *" : "Description (Optional)"}</span>
                {isArticle && (
                  <span className="text-[11px] text-muted-foreground font-normal">
                    Supports multi-line formatting &amp; full article body text
                  </span>
                )}
              </Label>
              <Textarea
                id="contentDesc"
                placeholder={
                  isArticle
                    ? "Write full article text, instructions, and training documentation here..."
                    : "Enter short description about this content"
                }
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required={isArticle}
                className={isArticle ? "min-h-[260px] text-sm leading-relaxed" : "min-h-[90px] resize-none text-xs"}
              />
            </div>

            {/* Duration / Completion Time Input */}
            <div className="space-y-1.5">
              <Label htmlFor="customDurationMins" className="text-xs font-semibold flex items-center justify-between">
                <span>Duration / Completion Time (Minutes)</span>
                {customDurationMins ? (
                  <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">Custom Duration</span>
                ) : (
                  <span className="text-[11px] text-muted-foreground">Auto-calculated if left blank</span>
                )}
              </Label>
              <div className="relative">
                <Input
                  id="customDurationMins"
                  type="number"
                  min="1"
                  max="10080"
                  placeholder="Enter duration in minutes"
                  value={customDurationMins}
                  onChange={(e) => setCustomDurationMins(e.target.value)}
                  className="h-10 text-xs font-medium pr-14"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
                  Mins
                </span>
              </div>
            </div>

            {/* Document Upload Drop Area */}
            {(isDocument || isScorm) && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  {isScorm ? "Upload SCORM Package (.zip)" : "Upload File"}
                </Label>
                <div className="relative border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center justify-center bg-muted/20 hover:bg-muted/40 transition-colors">
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-xs font-medium text-foreground text-center">
                    {fileName ? (
                      <span className="text-primary font-semibold">{fileName}</span>
                    ) : (
                      `Drag & drop your ${isScorm ? "ZIP package" : "file"} here or browse`
                    )}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {isScorm
                      ? "Supported format: .ZIP (Max size limit: 100MB)"
                      : "Supported formats: PDF, PPT, DOC, TXT (Max size: 50MB)"}
                  </p>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    accept={
                      isScorm
                        ? ".zip"
                        : type === "PDF"
                        ? ".pdf"
                        : type === "PPT"
                        ? ".ppt,.pptx"
                        : ".pdf,.doc,.docx,.txt"
                    }
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action Pinned Bottom Footer */}
          <div className="px-6 py-4 border-t border-border bg-muted/20 flex items-center justify-end gap-3 shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={uploading}
              className="bg-primary text-primary-foreground font-bold px-6"
            >
              {uploading ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" /> Uploading &amp; Extracting...
                </span>
              ) : isScorm ? (
                "Upload SCORM & Add"
              ) : isDocument ? (
                "Upload & Add"
              ) : (
                "Save & Add Content"
              )}
            </Button>
          </div>
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
