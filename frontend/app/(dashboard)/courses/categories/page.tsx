"use client";

import { useEffect, useState } from "react";
import { getCategories, createCategory, Category } from "@/services/api/course.service";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, FolderTree, RefreshCw } from "lucide-react";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);

  const fetchCats = async () => {
    try {
      setLoading(true);
      const res = await getCategories();
      setCategories(res?.data || []);
    } catch (err) {
      console.error("Failed to load categories:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCats();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setSubmitLoading(true);
      await createCategory({
        name,
        description,
      });
      setName("");
      setDescription("");
      setOpen(false);
      fetchCats();
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message || "Failed to create category.");
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Course Categories
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage course categories used to classify resources and curriculums.
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Category
            </Button>
          } />
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Category</DialogTitle>
              <DialogDescription>
                Create a new classification category for your learning modules.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-sm font-medium">
                  Category Name *
                </Label>
                <Input
                  id="name"
                  placeholder="e.g. Frontend Development"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="desc" className="text-sm font-medium">
                  Description
                </Label>
                <Textarea
                  id="desc"
                  placeholder="e.g. Web engineering technologies like React, Next.js, HTML/CSS."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>
              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitLoading}>
                  {submitLoading ? "Saving..." : "Save Category"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Main filters/actions */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon-xs" onClick={fetchCats} className="h-9 w-9">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Grid listing */}
      {loading ? (
        <div className="text-center py-20 text-sm text-muted-foreground">
          Loading categories...
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-20 text-sm text-muted-foreground border border-dashed rounded-xl bg-card">
          No categories found. Click Add Category to create one.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <div key={cat.id} className="rounded-xl border border-border bg-card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-primary/10 border border-primary/20 text-primary rounded-lg">
                    <FolderTree className="h-4 w-4" />
                  </div>
                  <h3 className="font-semibold text-foreground text-sm">{cat.name}</h3>
                </div>
                <Badge
                  variant="outline"
                  className={`text-xs font-semibold ${
                    cat.isActive
                      ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                      : "bg-slate-100 text-slate-500 border-slate-200"
                  }`}
                >
                  {cat.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 min-h-[32px]">
                {cat.description || "No description provided."}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
