"use client";

import React, { useEffect } from "react";
import HarbingerGroupLogo from "./HarbingerGroupLogo";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Sparkles, Bookmark, CheckCircle2, Trash2 } from "lucide-react";

interface HarbingerConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  showCancelButton?: boolean;
  variant?: "primary" | "success" | "danger" | "amber";
  icon?: React.ReactNode;
  loading?: boolean;
  showButtons?: boolean;
  autoCloseMs?: number;
  onConfirm?: () => void;
  onAutoClose?: () => void;
}

export default function HarbingerConfirmModal({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  showCancelButton,
  variant = "primary",
  icon,
  loading = false,
  showButtons = true,
  autoCloseMs,
  onConfirm,
  onAutoClose,
}: HarbingerConfirmModalProps) {
  useEffect(() => {
    if (open && autoCloseMs && autoCloseMs > 0) {
      const timer = setTimeout(() => {
        onOpenChange(false);
        onAutoClose?.();
      }, autoCloseMs);
      return () => clearTimeout(timer);
    }
  }, [open, autoCloseMs, onOpenChange, onAutoClose]);

  const shouldShowCancel =
    showCancelButton !== undefined
      ? showCancelButton
      : variant !== "success" && cancelLabel !== "";

  const getVariantStyles = () => {
    switch (variant) {
      case "danger":
        return {
          iconColor: "text-[#C82333]",
          buttonBg: "bg-[#C82333] hover:bg-[#A0181E] text-white shadow-sm",
          defaultIcon: <Trash2 className="h-5 w-5 text-[#C82333]" />,
        };
      case "success":
        return {
          iconColor: "text-emerald-600",
          buttonBg: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm",
          defaultIcon: <CheckCircle2 className="h-5 w-5 text-emerald-600" />,
        };
      case "amber":
        return {
          iconColor: "text-[#C81E25]",
          buttonBg: "bg-[#C81E25] hover:bg-[#A0181E] text-white shadow-sm",
          defaultIcon: <Bookmark className="h-5 w-5 text-[#C81E25]" />,
        };
      default:
        return {
          iconColor: "text-[#C81E25]",
          buttonBg: "bg-[#C81E25] hover:bg-[#A0181E] text-white shadow-sm",
          defaultIcon: <Sparkles className="h-5 w-5 text-[#C81E25]" />,
        };
    }
  };

  const style = getVariantStyles();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="max-w-md p-0 overflow-hidden rounded-2xl border border-slate-100 shadow-2xl bg-white select-none">
        <DialogTitle className="sr-only">{title}</DialogTitle>

        {/* Modal Header with Harbinger Group Logo */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 bg-white">
          <HarbingerGroupLogo height={30} />
          <button
            type="button"
            onClick={() => {
              onOpenChange(false);
              if (!showButtons) {
                onAutoClose?.();
              }
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Multi-color Brand Line Divider (Red -> Cyan -> Green) */}
        <div className="h-[2.5px] w-full bg-gradient-to-r from-[#C81E25] via-[#00A896] to-emerald-500" />

        {/* Modal Body */}
        <div className="p-6 pt-5 space-y-5 bg-white">
          <div className="flex items-start gap-4">
            <div className="h-11 w-11 rounded-full bg-slate-100/90 border border-slate-200/50 flex items-center justify-center shrink-0 mt-0.5">
              {icon || style.defaultIcon}
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-slate-900 leading-snug">
                {title}
              </h3>
              {description && (
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  {description}
                </p>
              )}
            </div>
          </div>

          {/* Modal Footer Actions (only rendered if showButtons is true) */}
          {showButtons && (
            <div className="flex items-center justify-end gap-3 pt-3">
              {shouldShowCancel && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => onOpenChange(false)}
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#EBF3F5] hover:bg-[#DDE9EC] text-[#2D3748] border-0 cursor-pointer shadow-none"
                >
                  {cancelLabel}
                </Button>
              )}
              <Button
                type="button"
                onClick={() => {
                  if (onConfirm) {
                    onConfirm();
                  } else {
                    onOpenChange(false);
                  }
                }}
                disabled={loading}
                className={`px-6 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${style.buttonBg}`}
              >
                {loading ? "Processing..." : confirmLabel}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
