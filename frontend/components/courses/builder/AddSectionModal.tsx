"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface AddSectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddSection: (title: string, description: string) => void;
}

export default function AddSectionModal({
  open,
  onOpenChange,
  onAddSection,
}: AddSectionModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAddSection(title.trim(), description.trim());
    setTitle("");
    setDescription("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-foreground">
            Add New Section
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="sectionName" className="text-xs font-semibold">
              Section Name *
            </Label>
            <Input
              id="sectionName"
              placeholder="Enter section name"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sectionDesc" className="text-xs font-semibold">
              Short Description
            </Label>
            <Textarea
              id="sectionDesc"
              placeholder="Enter short description about this section"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[80px] resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="bg-primary text-primary-foreground">
              Add Section
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
