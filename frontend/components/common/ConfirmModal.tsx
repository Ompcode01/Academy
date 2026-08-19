"use client";

import React from "react";
import HarbingerGroupLogo from "./HarbingerGroupLogo";
import { AlertTriangle, HelpCircle, X, Trash2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "success" | "info";
  isLoading?: boolean;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Harbinger Academy",
  message,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  isLoading = false,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const getVariantIcon = () => {
    switch (variant) {
      case "danger":
        return <Trash2 className="h-5 w-5 text-[#C82333]" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-emerald-600" />;
      default:
        return <HelpCircle className="h-5 w-5 text-blue-600" />;
    }
  };

  const getConfirmBtnStyle = () => {
    switch (variant) {
      case "danger":
        return "bg-[#C82333] hover:bg-[#C82333]/90 text-white";
      case "warning":
        return "bg-amber-600 hover:bg-amber-700 text-white";
      case "success":
        return "bg-emerald-600 hover:bg-emerald-700 text-white";
      default:
        return "bg-blue-600 hover:bg-blue-700 text-white";
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl border border-slate-100 space-y-4 text-[#212529] relative animate-in zoom-in-95 duration-150">
        {/* Header with Harbinger Group Logo */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <HarbingerGroupLogo height={28} />
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Decorative Brand Accent Line */}
        <div className="h-0.5 w-full bg-gradient-to-r from-[#C82333] via-blue-500 to-emerald-500 rounded-full" />

        {/* Modal Body */}
        <div className="flex items-start gap-3.5 py-1">
          <div className="p-2.5 rounded-full bg-slate-100 shrink-0 mt-0.5">
            {getVariantIcon()}
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-900 leading-snug">
              {message}
            </h4>
            {description && (
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="text-xs font-bold border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer"
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`text-xs font-bold shadow-sm cursor-pointer ${getConfirmBtnStyle()}`}
          >
            {isLoading ? "Processing..." : confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
