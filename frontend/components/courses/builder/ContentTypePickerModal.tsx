"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Video,
  GraduationCap,
  FileText,
  Presentation,
  FileCode,
  FileCheck,
  HelpCircle,
  Link as LinkIcon,
  MessageSquare,
} from "lucide-react";

export type ContentTypeKey =
  | "YOUTUBE"
  | "UDEMY"
  | "PDF"
  | "PPT"
  | "ARTICLE"
  | "ASSIGNMENT"
  | "QUIZ"
  | "EXTERNAL_LINK"
  | "FEEDBACK";

interface ContentTypePickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectType: (type: ContentTypeKey) => void;
}

const contentTypes: {
  key: ContentTypeKey;
  label: string;
  icon: any;
  color: string;
  bgColor: string;
  borderColor: string;
}[] = [
  {
    key: "YOUTUBE",
    label: "YouTube Link",
    icon: Video,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/20",
  },
  {
    key: "UDEMY",
    label: "Udemy Link",
    icon: GraduationCap,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/20",
  },
  {
    key: "PDF",
    label: "PDF",
    icon: FileText,
    color: "text-rose-500",
    bgColor: "bg-rose-500/10",
    borderColor: "border-rose-500/20",
  },
  {
    key: "PPT",
    label: "PPT",
    icon: Presentation,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/20",
  },
  {
    key: "ARTICLE",
    label: "Article",
    icon: FileCode,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
  },
  {
    key: "ASSIGNMENT",
    label: "Assignment",
    icon: FileCheck,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
  },
  {
    key: "QUIZ",
    label: "Quiz",
    icon: HelpCircle,
    color: "text-indigo-500",
    bgColor: "bg-indigo-500/10",
    borderColor: "border-indigo-500/20",
  },
  {
    key: "EXTERNAL_LINK",
    label: "External URL",
    icon: LinkIcon,
    color: "text-cyan-500",
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-500/20",
  },
  {
    key: "FEEDBACK",
    label: "Feedback",
    icon: MessageSquare,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/20",
  },
];

export default function ContentTypePickerModal({
  open,
  onOpenChange,
  onSelectType,
}: ContentTypePickerModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-foreground">
            Select Content Type
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-3 py-4">
          {contentTypes.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                onClick={() => {
                  onSelectType(item.key);
                  onOpenChange(false);
                }}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border ${item.borderColor} ${item.bgColor} hover:scale-105 transition-all cursor-pointer group`}
              >
                <div className={`p-2.5 rounded-lg ${item.bgColor} mb-2`}>
                  <Icon className={`h-6 w-6 ${item.color}`} />
                </div>
                <span className="text-xs font-semibold text-foreground text-center">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
