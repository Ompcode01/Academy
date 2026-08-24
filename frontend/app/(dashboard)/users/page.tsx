"use client";

import { useEffect, useState } from "react";
import { getEmployees, getRoles, assignRole, removeUserRole, deleteEmployee, Employee, Role } from "@/services/api/org.service";
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
import { SlidersHorizontal, RefreshCw, Mail, Calendar, ShieldCheck, Shield, Trash2, UserCog, AlertTriangle } from "lucide-react";
import RoleGate from "@/components/auth/RoleGate";
import { useAuthStore } from "@/store/auth.store";
import { ROLES } from "@/lib/rbac";
import toast from "react-hot-toast";
import HarbingerConfirmModal from "@/components/common/HarbingerConfirmModal";

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: "bg-red-100 text-red-700 border-red-200",
  ADMIN: "bg-purple-100 text-purple-700 border-purple-200",
  TEACHER: "bg-blue-100 text-blue-700 border-blue-200",
  LEARNER: "bg-emerald-100 text-emerald-700 border-emerald-200",
  GUEST: "bg-slate-100 text-slate-500 border-slate-200",
};

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  TEACHER: "Teacher",
  LEARNER: "Learner",
  GUEST: "Guest",
};

import DataFilterToolbar, { SortOption, applyDataFilters } from "@/components/common/DataFilterToolbar";

export default function UsersPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const [deptFilter, setDeptFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortValue, setSortValue] = useState<SortOption>("a_z");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [changingRole, setChangingRole] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [successModal, setSuccessModal] = useState<{ open: boolean; title: string; description: string } | null>(null);

  const currentUser = useAuthStore((state) => state.user);
  const isSuperAdmin = currentUser?.role === ROLES.SUPER_ADMIN;

  const fetchData = async () => {
    try {
      setLoading(true);
      const [empRes, roleRes] = await Promise.all([getEmployees(), getRoles()]);
      setEmployees(empRes?.data || []);
      setRoles(roleRes?.data || []);
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
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

  const getPrimaryRole = (emp: Employee): string => {
    if (!emp.assignedRoles || emp.assignedRoles.length === 0) return "LEARNER";
    return emp.assignedRoles[0].role.roleCode;
  };

  const handleRoleChange = async (employeeId: number, newRoleId: number) => {
    const emp = employees.find((e) => e.id === employeeId);
    if (emp && getPrimaryRole(emp) === "SUPER_ADMIN") {
      toast.error("The Super Admin role cannot be removed or changed.");
      return;
    }
    try {
      setChangingRole(employeeId);
      if (emp?.assignedRoles && emp.assignedRoles.length > 0) {
        await removeUserRole(emp.assignedRoles[0].id);
      }
      await assignRole({ employeeId, roleId: newRoleId });
      setChangingRole(null);
      const selectedRole = roles.find((r) => r.id === newRoleId);
      setSuccessModal({
        open: true,
        title: "Role Updated Successfully",
        description: `User role has been updated to ${selectedRole?.roleName || "new role"}.`,
      });
      await fetchData();
    } catch (err: any) {
      console.error("Failed to change role:", err);
      toast.error(err?.response?.data?.message || "Failed to change role. You may not have permission.");
      setChangingRole(null);
    }
  };

  const handleDelete = async (id: number) => {
    const emp = employees.find((e) => e.id === id);
    if (emp && getPrimaryRole(emp) === "SUPER_ADMIN") {
      toast.error("The Super Admin account cannot be deleted.");
      return;
    }
    try {
      await deleteEmployee(id);
      setConfirmDelete(null);
      setSuccessModal({
        open: true,
        title: "User Account Deleted",
        description: "The user record has been permanently removed from the system directory.",
      });
      await fetchData();
    } catch (err: any) {
      console.error("Failed to delete employee:", err);
      toast.error(err?.response?.data?.message || "Failed to delete employee. You may not have permission.");
      setConfirmDelete(null);
    }
  };

  // Advanced Filtering, Sorting & Date Picker Logic
  const filteredEmployees = applyDataFilters(
    employees.map((emp) => ({
      ...emp,
      fullName: `${emp.firstName} ${emp.lastName}`,
      roleCode: getPrimaryRole(emp),
      departmentName: emp.department?.departmentName || "Engineering",
      dateJoined: emp.joiningDate || "",
    })),
    {
      searchQuery,
      searchFields: ["firstName", "lastName", "employeeCode", "officialEmail", "designation", "departmentName"],
      sortValue,
      titleField: "fullName",
      dateField: "dateJoined",
      startDate,
      endDate,
      columnFilters: {
        roleCode: roleFilter,
        departmentName: deptFilter,
        employmentStatus: statusFilter,
      },
    }
  );

  // Which roles can the current user assign?
  const assignableRoles = roles.filter((r) => {
    if (isSuperAdmin) return true; // Super Admin can assign any role
    // Admin can only assign TEACHER, LEARNER, GUEST
    return ["TEACHER", "LEARNER", "GUEST"].includes(r.roleCode);
  });

  return (
    <RoleGate
      allowed={["SUPER_ADMIN", "ADMIN"]}
      fallback={
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4 text-center">
          <div className="rounded-full bg-red-100 p-4">
            <ShieldCheck className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Access Restricted</h2>
          <p className="text-sm text-muted-foreground max-w-md">
            You don't have permission to view this page. User management is available to Admins and Super Admins only.
          </p>
        </div>
      }
    >
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Users &amp; Employees
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Manage all learners, instructors, and employee directory.
              {!isSuperAdmin && (
                <span className="ml-2 text-amber-600 font-medium">
                  (Admin view — limited actions)
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1.5 px-3 py-1.5 bg-primary/5 text-primary border-primary/20">
              {isSuperAdmin ? <ShieldCheck className="h-3.5 w-3.5" /> : <Shield className="h-3.5 w-3.5" />}
              {isSuperAdmin ? "Super Admin" : "Admin"} Access
            </Badge>
          </div>
        </div>

        {/* Role Filter Chips */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mr-1">Filter by role:</span>
          <button
            onClick={() => setRoleFilter(null)}
            className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
              !roleFilter
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border hover:border-primary/40"
            }`}
          >
            All ({employees.length})
          </button>
          {["SUPER_ADMIN", "ADMIN", "TEACHER", "LEARNER", "GUEST"].map((rc) => {
            const count = employees.filter((e) => getPrimaryRole(e) === rc).length;
            if (count === 0) return null;
            return (
              <button
                key={rc}
                onClick={() => setRoleFilter(roleFilter === rc ? null : rc)}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                  roleFilter === rc
                    ? "bg-primary text-primary-foreground border-primary"
                    : `${ROLE_COLORS[rc]} hover:opacity-80`
                }`}
              >
                {ROLE_LABELS[rc]} ({count})
              </button>
            );
          })}
        </div>

        {/* Universal Filter & Sorting Toolbar */}
        <DataFilterToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search users by name, email, employee code, designation..."
          sortValue={sortValue}
          onSortChange={setSortValue}
          sortOptions={[
            { label: "Name (A-Z)", value: "a_z" },
            { label: "Name (Z-A)", value: "z_a" },
            { label: "Joined Date (Newest)", value: "newest" },
            { label: "Joined Date (Oldest)", value: "oldest" },
          ]}
          startDate={startDate}
          endDate={endDate}
          onDateChange={(start, end) => {
            setStartDate(start || "");
            setEndDate(end || "");
          }}
          columnFilters={[
            {
              key: "departmentName",
              label: "Business Unit",
              value: deptFilter || "all",
              options: Array.from(
                new Set(
                  employees
                    .map((e) => e.department?.departmentName || "Engineering")
                    .filter(Boolean)
                )
              ).map((d) => ({ label: d, value: d })),
            },
            {
              key: "employmentStatus",
              label: "Status",
              value: statusFilter || "all",
              options: [
                { label: "Active", value: "ACTIVE" },
                { label: "Inactive", value: "INACTIVE" },
                { label: "Resigned", value: "RESIGNED" },
              ],
            },
          ]}
          onColumnFilterChange={(key, val) => {
            if (key === "departmentName") setDeptFilter(val);
            if (key === "employmentStatus") setStatusFilter(val);
          }}
          onResetAll={() => {
            setSearchQuery("");
            setSortValue("a_z");
            setRoleFilter(null);
            setDeptFilter(null);
            setStatusFilter(null);
            setStartDate("");
            setEndDate("");
          }}
        />

        {/* Results Counter & Refresh Action */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
          <div>
            Showing <strong className="text-foreground font-bold">{filteredEmployees.length}</strong> of <strong className="text-foreground">{employees.length}</strong> users
          </div>
          <Button variant="outline" size="sm" onClick={fetchData} className="h-8 text-xs gap-1.5 font-semibold">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh List
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
                  Business Unit
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Role
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Joining Date
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Status
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right pr-5">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-sm text-muted-foreground">
                    Loading employees...
                  </TableCell>
                </TableRow>
              ) : filteredEmployees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-sm text-muted-foreground">
                    No employees found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredEmployees.map((emp) => {
                  const initials = `${emp.firstName[0] || ""}${emp.lastName[0] || ""}`.toUpperCase();
                  const primaryRole = getPrimaryRole(emp);
                  const isRoleChanging = changingRole === emp.id;
                  const isDeleting = confirmDelete === emp.id;

                  // Can the current user change this employee's role? (Super Admin role is protected)
                  const canChangeRole =
                    primaryRole !== "SUPER_ADMIN" &&
                    (isSuperAdmin || (!["SUPER_ADMIN", "ADMIN"].includes(primaryRole)));

                  // Can the current user delete this employee? (Super Admin account is protected)
                  const canDelete =
                    primaryRole !== "SUPER_ADMIN" &&
                    (isSuperAdmin || (!["SUPER_ADMIN", "ADMIN"].includes(primaryRole)));

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
                      <TableCell>
                        {isRoleChanging ? (
                          <select
                            autoFocus
                            className="h-8 rounded border border-primary/40 bg-card px-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20"
                            defaultValue=""
                            onChange={(e) => {
                              if (e.target.value) {
                                handleRoleChange(emp.id, Number(e.target.value));
                              }
                            }}
                            onBlur={() => setChangingRole(null)}
                          >
                            <option value="" disabled>Select role...</option>
                            {assignableRoles.map((r) => (
                              <option key={r.id} value={r.id} disabled={r.roleCode === primaryRole}>
                                {ROLE_LABELS[r.roleCode] || r.roleName}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <Badge
                            variant="outline"
                            className={`text-xs font-semibold ${ROLE_COLORS[primaryRole] || ROLE_COLORS.GUEST}`}
                          >
                            {primaryRole === "SUPER_ADMIN" && <ShieldCheck className="h-3 w-3 mr-1" />}
                            {primaryRole === "ADMIN" && <Shield className="h-3 w-3 mr-1" />}
                            {ROLE_LABELS[primaryRole] || primaryRole}
                          </Badge>
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
                      <TableCell className="text-right pr-5">
                        <div className="flex items-center justify-end gap-1">
                          {canChangeRole && (
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              className="h-7 w-7 text-muted-foreground hover:text-primary"
                              title="Change Role"
                              onClick={() => setChangingRole(emp.id)}
                            >
                              <UserCog className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {canDelete && (
                            <>
                              {isDeleting ? (
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    className="h-7 text-xs px-2"
                                    onClick={() => handleDelete(emp.id)}
                                  >
                                    Confirm
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs px-2"
                                    onClick={() => setConfirmDelete(null)}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="icon-xs"
                                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                  title="Delete User"
                                  onClick={() => setConfirmDelete(emp.id)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </>
                          )}
                          {!canChangeRole && !canDelete && (
                            <span className="text-[10px] text-muted-foreground italic">Protected</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Harbinger Branded Success Popup Modal (No Cancel Button) */}
      {successModal && (
        <HarbingerConfirmModal
          open={successModal.open}
          onOpenChange={(open) => {
            if (!open) setSuccessModal(null);
          }}
          title={successModal.title}
          description={successModal.description}
          confirmLabel="OK"
          showCancelButton={false}
          variant="success"
          autoCloseMs={4000}
        />
      )}
    </RoleGate>
  );
}
