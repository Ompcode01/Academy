"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Download, Eye, CheckCircle2, Award } from "lucide-react";

export interface SubmissionItem {
  id: number;
  learnerName: string;
  attemptNumber: number;
  submittedOn: string;
  filesCount: number;
  status: "SUBMITTED" | "GRADED" | "NOT_SUBMITTED";
  marks?: number;
}

interface AdminSubmissionsReviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignmentTitle: string;
  maxMarks: number;
}

const mockSubmissions: SubmissionItem[] = [
  {
    id: 1,
    learnerName: "Rahul Sharma",
    attemptNumber: 1,
    submittedOn: "28/06/2026, 10:30 AM",
    filesCount: 3,
    status: "SUBMITTED",
  },
  {
    id: 2,
    learnerName: "Priya Singh",
    attemptNumber: 1,
    submittedOn: "28/06/2026, 11:15 AM",
    filesCount: 4,
    status: "SUBMITTED",
  },
  {
    id: 3,
    learnerName: "Amit Verma",
    attemptNumber: 1,
    submittedOn: "28/06/2026, 01:20 PM",
    filesCount: 2,
    status: "GRADED",
    marks: 42,
  },
  {
    id: 4,
    learnerName: "Sneha Patil",
    attemptNumber: 2,
    submittedOn: "29/06/2026, 02:10 PM",
    filesCount: 3,
    status: "SUBMITTED",
  },
  {
    id: 5,
    learnerName: "Rohit Gupta",
    attemptNumber: 1,
    submittedOn: "-",
    filesCount: 0,
    status: "NOT_SUBMITTED",
  },
];

export default function AdminSubmissionsReview({
  open,
  onOpenChange,
  assignmentTitle,
  maxMarks,
}: AdminSubmissionsReviewProps) {
  const [submissions, setSubmissions] = useState<SubmissionItem[]>(mockSubmissions);
  const [search, setSearch] = useState("");
  const [gradingItem, setGradingItem] = useState<SubmissionItem | null>(null);
  const [givenMarks, setGivenMarks] = useState<number>(45);

  const filteredSubmissions = submissions.filter((s) =>
    s.learnerName.toLowerCase().includes(search.toLowerCase())
  );

  const handleGradeSubmit = () => {
    if (!gradingItem) return;
    setSubmissions((prev) =>
      prev.map((item) =>
        item.id === gradingItem.id
          ? { ...item, status: "GRADED", marks: givenMarks }
          : item
      )
    );
    setGradingItem(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-foreground flex items-center justify-between">
            <span>Submissions ({assignmentTitle})</span>
            <span className="text-xs font-medium text-muted-foreground">
              Max Marks: {maxMarks}
            </span>
          </DialogTitle>
        </DialogHeader>

        {/* Filter bar */}
        <div className="flex items-center justify-between gap-4 py-2 border-b border-border">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by learner name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <Button variant="outline" size="sm" className="gap-2 text-xs">
            <Download className="h-3.5 w-3.5" /> Export All
          </Button>
        </div>

        {/* Submissions Table */}
        <div className="overflow-x-auto border border-border rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/40 text-muted-foreground uppercase font-semibold border-b border-border">
              <tr>
                <th className="p-3">Learner</th>
                <th className="p-3">Attempt</th>
                <th className="p-3">Submitted On</th>
                <th className="p-3">Files</th>
                <th className="p-3">Status</th>
                <th className="p-3">Marks</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-foreground">
              {filteredSubmissions.map((item) => (
                <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                  <td className="p-3 font-semibold text-foreground">
                    {item.learnerName}
                  </td>
                  <td className="p-3">{item.attemptNumber}</td>
                  <td className="p-3 text-muted-foreground">{item.submittedOn}</td>
                  <td className="p-3">{item.filesCount ? `${item.filesCount} Files` : "-"}</td>
                  <td className="p-3">
                    {item.status === "SUBMITTED" && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        Submitted
                      </span>
                    )}
                    {item.status === "GRADED" && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20">
                        Graded
                      </span>
                    )}
                    {item.status === "NOT_SUBMITTED" && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20">
                        Not Submitted
                      </span>
                    )}
                  </td>
                  <td className="p-3 font-bold">
                    {item.marks !== undefined ? `${item.marks}/${maxMarks}` : "-"}
                  </td>
                  <td className="p-3 text-right">
                    {item.status !== "NOT_SUBMITTED" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setGradingItem(item);
                          setGivenMarks(item.marks || 40);
                        }}
                        className="h-7 gap-1 text-xs text-primary"
                      >
                        <Award className="h-3.5 w-3.5" /> Grade
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Grading Dialog */}
        {gradingItem && (
          <Dialog open={!!gradingItem} onOpenChange={() => setGradingItem(null)}>
            <DialogContent className="sm:max-w-md bg-card border-border">
              <DialogHeader>
                <DialogTitle className="text-base font-bold text-foreground">
                  Grade Submission: {gradingItem.learnerName}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold">
                    Score (Out of {maxMarks}) *
                  </label>
                  <Input
                    type="number"
                    value={givenMarks}
                    onChange={(e) => setGivenMarks(Number(e.target.value))}
                    max={maxMarks}
                    min={0}
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                  <Button variant="outline" onClick={() => setGradingItem(null)}>
                    Cancel
                  </Button>
                  <Button onClick={handleGradeSubmit} className="bg-primary text-primary-foreground">
                    Save Grade
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
}
