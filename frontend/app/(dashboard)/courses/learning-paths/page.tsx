"use client";

import { useState } from "react";
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
import { Plus, Route, BookOpen, Clock, ArrowRight } from "lucide-react";

interface Path {
  id: number;
  title: string;
  description: string;
  coursesCount: number;
  duration: string;
  level: string;
}

export default function LearningPathsPage() {
  const [paths, setPaths] = useState<Path[]>([
    {
      id: 1,
      title: "Java Developer Track",
      description: "From beginner Java programming to enterprise application design using Hibernate and Spring Framework.",
      coursesCount: 4,
      duration: "45 Hours",
      level: "Intermediate",
    },
    {
      id: 2,
      title: "Leadership Boot Camp",
      description: "Essential skills for managerial efficiency, including communications, problem solving, and delegation.",
      coursesCount: 3,
      duration: "18 Hours",
      level: "Advanced",
    },
  ]);

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [level, setLevel] = useState("beginner");
  const [duration, setDuration] = useState("");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newPath: Path = {
      id: Date.now(),
      title,
      description,
      coursesCount: 0,
      duration: duration ? `${duration} Hours` : "TBD",
      level: level.charAt(0).toUpperCase() + level.slice(1),
    };

    setPaths([...paths, newPath]);
    setTitle("");
    setDescription("");
    setDuration("");
    setLevel("beginner");
    setOpen(false);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Learning Paths
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Structured study tracks combining multiple modules for guided learning.
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Path
            </Button>
          } />
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create Learning Path</DialogTitle>
              <DialogDescription>
                Define a learning milestone path. Map courses to it later.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label htmlFor="title" className="text-sm font-medium">
                  Path Title *
                </Label>
                <Input
                  id="title"
                  placeholder="e.g. Backend Engineer Foundations"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="desc" className="text-sm font-medium">
                  Description
                </Label>
                <Textarea
                  id="desc"
                  placeholder="Description of target audience or outcomes..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="duration" className="text-sm font-medium">
                    Duration (Hours)
                  </Label>
                  <Input
                    id="duration"
                    type="number"
                    placeholder="30"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="level" className="text-sm font-medium">
                    Level
                  </Label>
                  <select
                    id="level"
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-card px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>
              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Path</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Grid listing */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {paths.map((path) => (
          <div key={path.id} className="rounded-xl border border-border bg-card p-6 flex flex-col space-y-4 hover:shadow-md transition-shadow">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-primary font-medium text-xs">
                <Route className="h-4 w-4" />
                LEARNING PATH
              </div>
              <h3 className="text-lg font-bold text-foreground">{path.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {path.description}
              </p>
            </div>

            {/* Path metadata tags */}
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground border-t border-border pt-4">
              <span className="flex items-center gap-1">
                <BookOpen className="h-3.5 w-3.5" />
                {path.coursesCount} Courses
              </span>
              <span className="h-3 w-px bg-border" />
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {path.duration}
              </span>
              <span className="h-3 w-px bg-border" />
              <Badge variant="secondary" className="text-[10px]">
                {path.level}
              </Badge>

              <button className="ml-auto flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
                View Track
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
