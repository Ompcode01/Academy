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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

interface InlineAssignmentPlayerProps {
  assignmentTitle: string;
  description?: string;
  configJson?: string;
  isPreview?: boolean;
  onComplete?: () => void;
}

export default function InlineAssignmentPlayer({
  assignmentTitle,
  description,
  configJson,
  isPreview = false,
  onComplete,
}: InlineAssignmentPlayerProps) {
  const [responseText, setResponseText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

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
      onComplete();
    }
  };

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
          Max Score: 100 Marks
        </Badge>
      </div>

      {/* Submitted State */}
      {isSubmitted ? (
        <div className="p-8 bg-slate-950/90 border border-slate-800 rounded-xl text-center space-y-4 animate-in fade-in">
          <div className="h-14 w-14 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-lg">
            <CheckCircle2 className="h-7 w-7" />
          </div>

          <div className="space-y-1">
            <h3 className="text-lg font-extrabold text-white">Assignment Workspace Submitted!</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Your response has been submitted to course faculty for review and grading.
            </p>
          </div>

          {responseText && (
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-left text-xs space-y-1 max-w-lg mx-auto">
              <span className="text-slate-400 font-bold block">Your Written Answer:</span>
              <p className="text-slate-200 leading-relaxed whitespace-pre-line">{responseText}</p>
            </div>
          )}

          {selectedFile && (
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-left text-xs max-w-lg mx-auto flex items-center gap-2 text-purple-300 font-medium">
              <Paperclip className="h-4 w-4 shrink-0" />
              <span className="truncate">Attached File: {selectedFile.name}</span>
            </div>
          )}

          <Button
            onClick={() => setIsSubmitted(false)}
            variant="outline"
            className="border-slate-700 text-slate-300 hover:bg-slate-800 text-xs gap-1.5"
          >
            Edit Submission
          </Button>
        </div>
      ) : (
        /* Workspace Form */
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Instructions Box */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-400" /> Assignment Instructions &amp; Requirements
            </h3>
            <p className="text-slate-300 leading-relaxed">
              {description || "No assignment instructions provided by Admin yet."}
            </p>
          </div>

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
                    "Click to upload assignment file (.pdf, .docx, .zip)"
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
