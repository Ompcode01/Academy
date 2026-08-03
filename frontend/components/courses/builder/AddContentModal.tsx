"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, FileText, Link as LinkIcon, Video, GraduationCap } from "lucide-react";
import { ContentTypeKey } from "./ContentTypePickerModal";

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

  if (!type) return null;

  const isLink = ["YOUTUBE", "UDEMY", "EXTERNAL_LINK"].includes(type);
  const isDocument = ["PDF", "PPT", "ARTICLE"].includes(type);

  const getTypeTitle = () => {
    switch (type) {
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
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      setFileSize(`${sizeMb} MB`);
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSaveContent({
      title: title.trim(),
      contentType: type,
      contentUrl: url.trim() || undefined,
      description: description.trim() || undefined,
      fileSize: isDocument ? fileSize : undefined,
      duration: isLink ? 15 : undefined,
    });

    setTitle("");
    setUrl("");
    setDescription("");
    setFileName(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
            {isLink && <LinkIcon className="h-5 w-5 text-primary" />}
            {isDocument && <FileText className="h-5 w-5 text-primary" />}
            {getTypeTitle()}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
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
          {isDocument && (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Upload File</Label>
              <div className="relative border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center justify-center bg-muted/20 hover:bg-muted/40 transition-colors">
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-xs font-medium text-foreground text-center">
                  {fileName ? (
                    <span className="text-primary font-semibold">{fileName}</span>
                  ) : (
                    "Drag & drop your file here or browse"
                  )}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Supported formats: PDF, PPT, DOC, TXT (Max size: 50MB)
                </p>
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  accept={
                    type === "PDF"
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
            >
              Cancel
            </Button>
            <Button type="submit" className="bg-primary text-primary-foreground">
              {isDocument ? "Upload & Add" : "Add Content"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
