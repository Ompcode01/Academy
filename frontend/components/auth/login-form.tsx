"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, LoginFormData } from "@/lib/validations/login.schema";
import { login } from "@/services/api/auth.service";
import { useAuthStore } from "@/store/auth.store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, User } from "lucide-react";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const loginStore = useAuthStore((state) => state.login);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = useCallback(async (data: LoginFormData) => {
    try {
      setLoading(true);
      console.log("Submitting login form:", data);
      const response = await login(data);
      console.log("API Response:", response);

      const { token, employee, roles } = response.data;
      const primaryRole = roles?.[0]?.role?.roleCode || "LEARNER";

      const user = {
        id: Number(employee.id),
        username: `${employee.firstName} ${employee.lastName}`,
        role: primaryRole,
        employeeId: Number(employee.id),
        departmentId: Number(employee.departmentId),
      };

      loginStore(token, user);
      router.push("/dashboard");
    } catch (error: any) {
      console.error(error);
      alert(
        error?.response?.data?.message ||
          "Unable to login. Please verify your credentials."
      );
    } finally {
      setLoading(false);
    }
  }, [loginStore, router]);

  useEffect(() => {
    const paramUser = searchParams.get("username");
    const paramPass = searchParams.get("password");

    if (paramUser) {
      setValue("username", paramUser);
    }
    if (paramPass) {
      setValue("password", paramPass);
    }

    if (paramUser && paramPass) {
      onSubmit({ username: paramUser, password: paramPass });
    }
  }, [searchParams, setValue, onSubmit]);

  return (
    <div className="space-y-6 w-full max-w-sm bg-slate-900/40 p-8 rounded-xl border border-slate-800 backdrop-blur-sm shadow-xl">
      {/* Title */}
      <div className="space-y-1 text-center lg:text-left">
        <h2 className="text-2xl font-extrabold tracking-tight text-white">
          Sign In
        </h2>
        <p className="text-xs text-slate-400 font-medium">
          Enter your employee credentials to access the LMS portal.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Username */}
        <div className="space-y-1.5">
          <Label htmlFor="username" className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
            Username
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              id="username"
              placeholder="e.g. priyanka, omprakash"
              className="h-10 pl-10 bg-slate-950/65 border-slate-800 text-white placeholder:text-slate-500 focus:border-[#C82333] focus:ring-1 focus:ring-[#C82333]/20 focus-visible:ring-0 focus-visible:border-[#C82333] outline-none transition-all"
              {...register("username")}
              required
            />
          </div>
          {errors.username && (
            <p className="text-xs font-semibold text-[#C82333] mt-1">
              {errors.username.message}
            </p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
              Password
            </Label>
            <button
              type="button"
              className="text-[10px] font-bold text-[#C82333] hover:underline"
              onClick={() => alert("Contact system administrator to reset password.")}
            >
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              className="h-10 pl-10 bg-slate-950/65 border-slate-800 text-white placeholder:text-slate-500 focus:border-[#C82333] focus:ring-1 focus:ring-[#C82333]/20 focus-visible:ring-0 focus-visible:border-[#C82333] outline-none transition-all"
              {...register("password")}
              required
            />
          </div>
          {errors.password && (
            <p className="text-xs font-semibold text-[#C82333] mt-1">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Submit */}
        <Button
          type="submit"
          className="w-full h-10 bg-[#C82333] hover:bg-[#C82333]/90 text-white font-bold rounded-lg shadow transition-colors cursor-pointer"
          disabled={loading}
        >
          {loading ? "Signing In..." : "Sign In"}
        </Button>
      </form>
    </div>
  );
}