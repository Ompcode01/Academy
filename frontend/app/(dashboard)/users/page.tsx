"use client";

import { useEffect, useState } from "react";
import { getEmployees, Employee } from "@/services/api/org.service";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal, RefreshCw, Mail, Phone, Calendar } from "lucide-react";

export default function UsersPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await getEmployees();
      setEmployees(res?.data || []);
    } catch (err) {
      console.error("Failed to load employees:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "INACTIVE":
        return "bg-slate-100 text-slate-500 border-slate-200";
      case "RESIGNED":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-slate-100 text-slate-500 border-slate-200";
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Users &amp; Employees
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage all learners, instructors, and employee directory.
          </p>
        </div>
      </div>

      {/* Main filters/actions */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <input
            type="text"
            placeholder="Search users by name, code or email..."
            className="h-9 w-80 rounded-lg border border-border bg-card pl-3 pr-4 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
        <Button variant="outline" size="sm" className="h-9 gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          Filters
        </Button>
        <Button variant="ghost" size="icon-xs" onClick={fetchEmployees} className="h-9 w-9">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Table listing */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border bg-muted/40 hover:bg-muted/40">
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground pl-5">
                Employee Code
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Employee Info
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Designation
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Department
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Joining Date
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Status
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-sm text-muted-foreground">
                  Loading employees...
                </TableCell>
              </TableRow>
            ) : employees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-sm text-muted-foreground">
                  No employees found.
                </TableCell>
              </TableRow>
            ) : (
              employees.map((emp) => {
                const initials = `${emp.firstName[0] || ""}${emp.lastName[0] || ""}`.toUpperCase();
                return (
                  <TableRow key={emp.id} className="border-border transition-colors hover:bg-muted/20">
                    <TableCell className="pl-5 text-sm font-mono font-semibold text-primary">
                      {emp.employeeCode}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {emp.firstName} {emp.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Mail className="h-3 w-3" />
                            {emp.officialEmail}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      {emp.designation}
                    </TableCell>
                    <TableCell className="text-sm">
                      {emp.department ? (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-150">
                          {emp.department.departmentName}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(emp.joiningDate).toLocaleDateString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs font-semibold ${getStatusColor(emp.employmentStatus)}`}>
                        {emp.employmentStatus}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
