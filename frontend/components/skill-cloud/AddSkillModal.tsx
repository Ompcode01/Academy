"use client";

import { useState, useEffect } from "react";
import { X, Star, Sparkles, CheckCircle2 } from "lucide-react";
import { createUserSkill, updateUserSkill, getCatalogSkills, CatalogSkill, UserSkill } from "@/services/api/skill.service";

interface AddSkillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: UserSkill | null;
}

export default function AddSkillModal({ isOpen, onClose, onSuccess, initialData }: AddSkillModalProps) {
  const [activeTab, setActiveTab] = useState<"basic" | "proficiency" | "details">("basic");
  const [catalog, setCatalog] = useState<CatalogSkill[]>([]);
  
  const [skillName, setSkillName] = useState("");
  const [category, setCategory] = useState("Programming Language");
  const [subCategory, setSubCategory] = useState("Backend");
  const [skillType, setSkillType] = useState("Technical Skill");
  const [description, setDescription] = useState("");
  
  const [proficiencyLevel, setProficiencyLevel] = useState("Intermediate");
  const [rating, setRating] = useState(3);
  const [yearsOfExp, setYearsOfExp] = useState<number>(2);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      loadCatalog();
      if (initialData) {
        setSkillName(initialData.skillName);
        setCategory(initialData.category || "Programming Language");
        setSubCategory(initialData.subCategory || "");
        setSkillType(initialData.skillType || "Technical Skill");
        setDescription(initialData.description || "");
        setProficiencyLevel(initialData.proficiencyLevel || "Intermediate");
        setRating(initialData.rating || 3);
        setYearsOfExp(initialData.yearsOfExp || 2);
      } else {
        setSkillName("");
        setCategory("Programming Language");
        setSubCategory("Backend");
        setSkillType("Technical Skill");
        setDescription("");
        setProficiencyLevel("Intermediate");
        setRating(3);
        setYearsOfExp(2);
      }
      setActiveTab("basic");
      setError("");
    }
  }, [isOpen, initialData]);

  const loadCatalog = async () => {
    try {
      const data = await getCatalogSkills();
      setCatalog(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectFromCatalog = (c: CatalogSkill) => {
    setSkillName(c.name);
    setCategory(c.category);
    if (c.subCategory) setSubCategory(c.subCategory);
    if (c.skillType) setSkillType(c.skillType);
    if (c.description) setDescription(c.description);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!skillName.trim()) {
      setError("Please enter a Skill Name");
      setActiveTab("basic");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const payload = {
        skillName,
        category,
        subCategory,
        skillType,
        proficiencyLevel,
        rating,
        yearsOfExp,
        description,
      };

      if (initialData) {
        // Re-submit or edit
        await updateUserSkill(initialData.id, payload, true);
      } else {
        await createUserSkill(payload);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to submit skill");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {initialData ? (initialData.status === "REJECTED" ? "Edit & Re-submit Skill" : "Edit Skill") : "Add New Skill"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Rejection Notice Banner if editing rejected skill */}
        {initialData && initialData.status === "REJECTED" && (
          <div className="bg-rose-50 dark:bg-rose-950/30 border-b border-rose-200 dark:border-rose-800/40 p-4 px-6 text-xs text-rose-700 dark:text-rose-300">
            <span className="font-semibold">Reviewer Comment: </span>
            {initialData.rejectionReason || "Please update skill details before resubmitting."}
          </div>
        )}

        {/* Wizard Steps Navigation */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 px-6 pt-3 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab("basic")}
            className={`border-b-2 pb-3 pr-6 transition-colors ${
              activeTab === "basic"
                ? "border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400"
            }`}
          >
            1. Basic Information
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("proficiency")}
            className={`border-b-2 pb-3 px-6 transition-colors ${
              activeTab === "proficiency"
                ? "border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400"
            }`}
          >
            2. Proficiency & Experience
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("details")}
            className={`border-b-2 pb-3 pl-6 transition-colors ${
              activeTab === "details"
                ? "border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400"
            }`}
          >
            3. Supporting Context
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="rounded-lg bg-rose-50 p-3 text-xs text-rose-600 dark:bg-rose-900/30 dark:text-rose-400">
              {error}
            </div>
          )}

          {activeTab === "basic" && (
            <div className="space-y-4">
              {/* Quick Pick Suggestion Badges */}
              {catalog.length > 0 && !initialData && (
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">
                    Popular Skill Suggestions:
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {catalog.slice(0, 7).map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleSelectFromCatalog(c)}
                        className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-emerald-100 hover:text-emerald-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-emerald-900/40 dark:hover:text-emerald-300 transition-colors"
                      >
                        + {c.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Skill Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Python, Machine Learning, Java"
                  value={skillName}
                  onChange={(e) => setSkillName(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="Programming Language">Programming Language</option>
                    <option value="Framework">Framework</option>
                    <option value="Database">Database</option>
                    <option value="Cloud Platform">Cloud Platform</option>
                    <option value="Tool">Tool / Technology</option>
                    <option value="Soft Skills">Soft Skills</option>
                    <option value="Domain Knowledge">Domain Knowledge</option>
                    <option value="AI & ML">AI & ML</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Sub Category
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Backend, Web, DevOps"
                    value={subCategory}
                    onChange={(e) => setSubCategory(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Skill Type
                </label>
                <div className="flex flex-wrap gap-4 text-xs">
                  {["Technical Skill", "Soft Skill", "Domain Knowledge", "Tool / Technology"].map((type) => (
                    <label key={type} className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="skillType"
                        checked={skillType === type}
                        onChange={() => setSkillType(type)}
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-slate-700 dark:text-slate-300">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe your experience, usage, and context of this skill..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>
          )}

          {activeTab === "proficiency" && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Proficiency Rating (1 to 5 Stars)
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 transition-transform hover:scale-110"
                    >
                      <Star
                        className={`h-7 w-7 ${
                          star <= rating
                            ? "fill-amber-400 text-amber-400"
                            : "text-slate-300 dark:text-slate-600"
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-3 text-xs font-bold text-slate-700 dark:text-slate-300">
                    {rating} / 5
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Proficiency Level
                </label>
                <select
                  value={proficiencyLevel}
                  onChange={(e) => setProficiencyLevel(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="Beginner">Beginner (Basic understanding)</option>
                  <option value="Intermediate">Intermediate (Hands-on experience)</option>
                  <option value="Advanced">Advanced (Proficient / High competence)</option>
                  <option value="Expert">Expert (Subject Matter Authority)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Years of Experience
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="40"
                  value={yearsOfExp}
                  onChange={(e) => setYearsOfExp(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>
          )}

          {activeTab === "details" && (
            <div className="space-y-4">
              <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 p-4 border border-emerald-200 dark:border-emerald-800/40 text-xs text-emerald-800 dark:text-emerald-300">
                <p className="font-semibold flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" /> Ready for Submission
                </p>
                <p className="mt-1 text-emerald-700 dark:text-emerald-400">
                  Submitting this skill will add it to your profile under <b>PENDING APPROVAL</b> status.
                  An Admin or Super Admin will review your submission and verify your proficiency.
                </p>
              </div>

              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-3">
                <p><b>Skill Summary:</b></p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Skill Name: <span className="font-semibold text-slate-900 dark:text-white">{skillName || "Not set"}</span></li>
                  <li>Category: <span className="font-semibold text-slate-900 dark:text-white">{category}</span> ({skillType})</li>
                  <li>Proficiency: <span className="font-semibold text-slate-900 dark:text-white">{proficiencyLevel}</span> ({rating} Stars, {yearsOfExp} yrs exp)</li>
                </ul>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4 mt-6">
            <div>
              {activeTab !== "basic" && (
                <button
                  type="button"
                  onClick={() => setActiveTab(activeTab === "details" ? "proficiency" : "basic")}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Previous
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>

              {activeTab !== "details" ? (
                <button
                  type="button"
                  onClick={() => setActiveTab(activeTab === "basic" ? "proficiency" : "details")}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600"
                >
                  Next Step
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-lg bg-emerald-600 px-5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 dark:bg-emerald-500 dark:hover:bg-emerald-600"
                >
                  {loading ? "Submitting..." : (initialData ? "Submit Changes" : "Submit Skill for Approval")}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
