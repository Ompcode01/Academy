"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  const [loading, setLoading] = useState(false);
  const loginStore = useAuthStore((state) => state.login);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
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
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="space-y-2 text-center lg:text-left">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">
          Sign In
        </h2>
        <p className="text-sm text-muted-foreground">
          Enter your employee credentials to access the LMS portal.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Username */}
        <div className="space-y-1.5">
          <Label htmlFor="username" className="text-sm font-medium">
            Username
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="username"
              placeholder="e.g. priyanka, omprakash"
              className="h-10 pl-10"
              {...register("username")}
              required
            />
          </div>
          {errors.username && (
            <p className="text-xs font-semibold text-destructive mt-1">
              {errors.username.message}
            </p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-sm font-medium">
              Password
            </Label>
            <button
              type="button"
              className="text-xs font-semibold text-primary hover:underline"
              onClick={() => alert("Contact system administrator to reset password.")}
            >
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              className="h-10 pl-10"
              {...register("password")}
              required
            />
          </div>
          {errors.password && (
            <p className="text-xs font-semibold text-destructive mt-1">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Submit */}
        <Button
          type="submit"
          className="w-full h-10 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold rounded-lg shadow-sm"
          disabled={loading}
        >
          {loading ? "Signing In..." : "Sign In"}
        </Button>
      </form>

      {/* Info Notice */}
      <div className="rounded-lg border border-border bg-muted/40 p-3 text-center">
        <p className="text-xs text-muted-foreground">
          Default password for seeded accounts is <code className="font-mono font-bold bg-muted px-1 py-0.5 rounded text-foreground">Admin@123</code>
        </p>
      </div>
    </div>
  );
}