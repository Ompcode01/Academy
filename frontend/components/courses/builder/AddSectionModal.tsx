"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface AddSectionModalProps {
  open: boolean;
  initialTitle?: string;
  initialDescription?: string;
  isEditing?: boolean;
  onOpenChange: (open: boolean) => void;
  onSaveSection: (title: string, description: string) => void;
}

export default function AddSectionModal({
  open,
  initialTitle = "",
  initialDescription = "",
  isEditing = false,
  onOpenChange,
  onSaveSection,
}: AddSectionModalProps) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);

  useEffect(() => {
    if (open) {
      setTitle(initialTitle);
      setDescription(initialDescription);
    }
  }, [open, initialTitle, initialDescription]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSaveSection(title.trim(), description.trim());
    setTitle("");
    setDescription("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl w-[90vw] max-h-[85vh] bg-card border-border shadow-2xl rounded-2xl flex flex-col overflow-hidden p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b border-border bg-muted/20 shrink-0">
          <DialogTitle className="text-lg font-bold text-foreground">
            {isEditing ? "Edit Section Details" : "Add New Section"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="sectionName" className="text-xs font-semibold">
                Section Title *
              </Label>
              <Input
                id="sectionName"
                placeholder="e.g. Section 1: Introduction & Concepts"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="h-10"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sectionDesc" className="text-xs font-semibold flex items-center justify-between">
                <span>Section Text &amp; Description (Multi-line text content)</span>
                <span className="text-[11px] text-muted-foreground font-normal">Optional</span>
              </Label>
              <Textarea
                id="sectionDesc"
                placeholder="Write section instructions, text content, or overview here..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[180px] text-sm leading-relaxed"
              />
            </div>
          </div>

          <div className="px-6 py-4 border-t border-border bg-muted/20 flex items-center justify-end gap-3 shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="bg-primary text-primary-foreground font-bold px-6">
              {isEditing ? "Save Changes" : "Add Section"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
