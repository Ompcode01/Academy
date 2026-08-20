"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { User, BookOpen, Award, CheckCircle2, Clock, FileText, AlertTriangle } from "lucide-react";
import { getEmployeeDrilldown } from "@/services/api/reporting.service";
import { renderStatusBadge } from "./ReportTable";

interface ReportDrilldownModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "employee" | "course" | "department";
  targetId: number | string | null;
  targetTitle?: string;
}

export const ReportDrilldownModal: React.FC<ReportDrilldownModalProps> = ({
  isOpen,
  onClose,
  type,
  targetId,
  targetTitle,
}) => {
  const [loading, setLoading] = useState(false);
  const [drillData, setDrillData] = useState<any>(null);

  useEffect(() => {
    if (isOpen && targetId && type === "employee") {
      setLoading(true);
      getEmployeeDrilldown(targetId)
        .then((res) => setDrillData(res))
        .catch((err) => console.error("Drilldown fetch error:", err))
        .finally(() => setLoading(false));
    }
  }, [isOpen, targetId, type]);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[94vw] sm:max-w-4xl lg:max-w-5xl xl:max-w-6xl max-h-[88vh] overflow-y-auto p-6 sm:p-7 rounded-2xl">
        <DialogHeader className="space-y-1.5 pr-8">
          <DialogTitle className="flex items-center space-x-2 text-base sm:text-lg font-extrabold text-foreground pr-6">
            <User className="h-5 w-5 text-primary shrink-0" />
            <span>Learner Performance &amp; History Drill-down</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Detailed learning summary, enrolled course progress, quiz &amp; assignment grades, and active certificates.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4 py-4">
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
          </div>
        ) : drillData ? (
          <div className="space-y-6 pt-2">
            {/* Header Profile Summary */}
            <div className="bg-muted/40 p-4 rounded-xl border border-border/60 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-foreground">{drillData.employee.name}</h3>
                <p className="text-xs text-muted-foreground">
                  Code: <span className="font-semibold">{drillData.employee.employeeCode}</span> |{" "}
                  Business Unit: <span className="font-semibold">{drillData.employee.department}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Email: {drillData.employee.email} | Designation: {drillData.employee.designation}
                </p>
              </div>
              <div className="flex space-x-2">
                <Badge variant="outline" className="text-xs py-1 px-3">
                  Joined: {new Date(drillData.employee.joiningDate).toLocaleDateString()}
                </Badge>
              </div>
            </div>

            {/* Drilldown Tabs */}
            <Tabs defaultValue="courses" className="w-full">
              <TabsList className="grid w-full grid-cols-3 text-xs">
                <TabsTrigger value="courses" className="gap-1.5 text-xs">
                  <BookOpen className="h-3.5 w-3.5" /> Course History ({drillData.courseHistory?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="assessments" className="gap-1.5 text-xs">
                  <FileText className="h-3.5 w-3.5" /> Assessment History ({drillData.assessmentHistory?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="certificates" className="gap-1.5 text-xs">
                  <Award className="h-3.5 w-3.5" /> Certificates ({drillData.certificates?.length || 0})
                </TabsTrigger>
              </TabsList>

              {/* Course History Content */}
              <TabsContent value="courses" className="pt-3">
                <div className="border border-border/80 rounded-lg overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-muted/60 text-muted-foreground font-semibold">
                      <tr>
                        <th className="p-2.5">Course Title</th>
                        <th className="p-2.5">Category</th>
                        <th className="p-2.5">Progress</th>
                        <th className="p-2.5">Time Spent</th>
                        <th className="p-2.5">Mandatory</th>
                        <th className="p-2.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {drillData.courseHistory?.map((ch: any, idx: number) => (
                        <tr key={idx} className="hover:bg-muted/30">
                          <td className="p-2.5 font-medium">{ch.title}</td>
                          <td className="p-2.5 text-muted-foreground">{ch.category}</td>
                          <td className="p-2.5 font-semibold text-primary">{ch.progress}%</td>
                          <td className="p-2.5">{ch.timeSpentHours} hrs</td>
                          <td className="p-2.5">
                            {ch.isMandatory ? (
                              <Badge className="bg-amber-500/15 text-amber-600 text-[10px]">Mandatory</Badge>
                            ) : (
                              <span className="text-muted-foreground">Optional</span>
                            )}
                          </td>
                          <td className="p-2.5">{renderStatusBadge(ch.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>

              {/* Assessment History Content */}
              <TabsContent value="assessments" className="pt-3">
                <div className="border border-border/80 rounded-lg overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-muted/60 text-muted-foreground font-semibold">
                      <tr>
                        <th className="p-2.5">Type</th>
                        <th className="p-2.5">Score</th>
                        <th className="p-2.5">Grade</th>
                        <th className="p-2.5">Submitted Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {drillData.assessmentHistory?.map((ah: any, idx: number) => (
                        <tr key={idx} className="hover:bg-muted/30">
                          <td className="p-2.5 font-medium">{ah.submissionType}</td>
                          <td className="p-2.5 font-bold">{ah.score}%</td>
                          <td className="p-2.5">{renderStatusBadge(ah.grade)}</td>
                          <td className="p-2.5 text-muted-foreground">
                            {new Date(ah.submittedAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>

              {/* Certificates Content */}
              <TabsContent value="certificates" className="pt-3">
                <div className="space-y-3">
                  {drillData.certificates?.map((cert: any, idx: number) => (
                    <div key={idx} className="p-3 border border-border/80 rounded-lg bg-card flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                          <Award className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-foreground">{cert.title}</p>
                          <p className="text-[11px] text-muted-foreground">Code: {cert.code}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        {renderStatusBadge(cert.status)}
                        <p className="text-[10px] text-muted-foreground mt-1">
                          Issued: {new Date(cert.issuedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-muted-foreground">No drill-down details available.</div>
        )}
      </DialogContent>
    </Dialog>
  );
};
