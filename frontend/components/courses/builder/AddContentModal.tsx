"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, FileText, Link as LinkIcon, Video, GraduationCap, Archive, RefreshCw } from "lucide-react";
import { ContentTypeKey } from "./ContentTypePickerModal";
import { uploadScormPackage, uploadDocumentFile } from "@/services/api/course.service";

interface AddContentModalProps {
  open: boolean;
  type: ContentTypeKey | null;
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

  if (!type) return null;

  const isLink = ["YOUTUBE", "UDEMY", "EXTERNAL_LINK"].includes(type);
  const isDocument = ["PDF", "PPT", "ARTICLE"].includes(type);
  const isScorm = type === "SCORM";

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
        return "Add Article Document";
      case "EXTERNAL_LINK":
        return "Add External Resource Link";
      default:
        return "Add Content";
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

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

    onSaveContent({
      title: title.trim(),
      contentType: type,
      contentUrl: finalContentUrl,
      description: finalDescription,
      fileSize: finalFileSize,
      duration: isLink ? 15 : isScorm ? 30 : undefined,
    });

    setTitle("");
    setUrl("");
    setDescription("");
    setFileName(null);
    setSelectedFile(null);
    setErrorMessage(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
            {isLink && <LinkIcon className="h-5 w-5 text-primary" />}
            {isDocument && <FileText className="h-5 w-5 text-primary" />}
            {isScorm && <Archive className="h-5 w-5 text-violet-500" />}
            {getTypeTitle()}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-semibold">
              {errorMessage}
            </div>
          )}

          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="contentTitle" className="text-xs font-semibold">
              Title *
            </Label>
            <Input
              id="contentTitle"
              placeholder="Enter title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
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
              />
            </div>
          )}

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="contentDesc" className="text-xs font-semibold">
              Description (Optional)
            </Label>
            <Textarea
              id="contentDesc"
              placeholder="Enter short description about this content"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[70px] resize-none"
            />
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

          {/* Action Footer */}
          <div className="flex items-center justify-end gap-3 pt-3">
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
              className="bg-primary text-primary-foreground font-bold"
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
                "Add Content"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
