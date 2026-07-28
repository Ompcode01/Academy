"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth.store";
import { getDepartments, createDepartment, Department } from "@/services/api/org.service";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Building2, Plus, SlidersHorizontal, RefreshCw } from "lucide-react";

export default function OrganizationPage() {
  const user = useAuthStore((state) => state.user);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  // Form states
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);

  const fetchDepts = async () => {
    try {
      setLoading(true);
      const res = await getDepartments();
      setDepartments(res?.data || []);
    } catch (err) {
      console.error("Failed to load departments:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepts();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) return;

    try {
      setSubmitLoading(true);
      await createDepartment({
        departmentCode: code.toUpperCase(),
        departmentName: name,
      });
      setCode("");
      setName("");
      setOpen(false);
      fetchDepts();
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message || "Failed to create department. Admin permissions required.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Organization
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage your company departments and organizational structure.
          </p>
        </div>

        {isSuperAdmin && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Department
              </Button>
            } />
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Department</DialogTitle>
                <DialogDescription>
                  Enter the details for the new department. Click save when done.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 py-4">
                <div className="space-y-1.5">
                  <Label htmlFor="code" className="text-sm font-medium">
                    Department Code *
                  </Label>
                  <Input
                    id="code"
                    placeholder="e.g. ENG, HR, MGT"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-sm font-medium">
                    Department Name *
                  </Label>
                  <Input
                    id="name"
                    placeholder="e.g. Engineering"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <DialogFooter className="pt-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitLoading}>
                    {submitLoading ? "Saving..." : "Save Department"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Main filters/actions */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <input
            type="text"
            placeholder="Search departments..."
            className="h-9 w-64 rounded-lg border border-border bg-card pl-3 pr-4 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
        <Button variant="outline" size="sm" className="h-9 gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          Filters
        </Button>
        <Button variant="ghost" size="icon-xs" onClick={fetchDepts} className="h-9 w-9">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Table listing */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border bg-muted/40 hover:bg-muted/40">
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground pl-5 w-16">
                ID
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Code
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Department Name
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Status
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center text-sm text-muted-foreground">
                  Loading departments...
                </TableCell>
              </TableRow>
            ) : departments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center text-sm text-muted-foreground">
                  No departments found.
                </TableCell>
              </TableRow>
            ) : (
              departments.map((dept) => (
                <TableRow key={dept.id} className="border-border transition-colors hover:bg-muted/20">
                  <TableCell className="pl-5 text-sm font-mono text-muted-foreground">
                    #{dept.id}
                  </TableCell>
                  <TableCell className="font-semibold text-primary">
                    {dept.departmentCode}
                  </TableCell>
                  <TableCell className="text-sm font-medium">
                    {dept.departmentName}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`text-xs font-medium ${
                        dept.isActive
                          ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                          : "bg-slate-100 text-slate-500 border-slate-200"
                      }`}
                    >
                      {dept.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
