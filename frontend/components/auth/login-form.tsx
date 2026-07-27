"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { loginSchema, LoginFormData } from "@/lib/validations/login.schema";
import { login } from "@/services/api/auth.service";
import { useAuthStore } from "@/store/auth.store";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

      console.log("Submitting:", data);

      const response = await login(data);

      console.log("API Response:", response);

      loginStore(
        response.data.data.token,
        response.data.data.user
      );

      router.push("/dashboard");
    } catch (error: any) {
      console.error(error);

      alert(
        error?.response?.data?.message ||
          "Unable to login."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-xl">
      <CardHeader>
        <CardTitle className="text-center text-3xl">
          LMS Portal
        </CardTitle>
      </CardHeader>

      <CardContent>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-5"
        >
          <div>
            <Label htmlFor="username">Username</Label>

            <Input
              id="username"
              placeholder="Enter Username"
              {...register("username")}
            />

            {errors.username && (
              <p className="mt-1 text-sm text-red-500">
                {errors.username.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="password">Password</Label>

            <Input
              id="password"
              type="password"
              placeholder="Enter Password"
              {...register("password")}
            />

            {errors.password && (
              <p className="mt-1 text-sm text-red-500">
                {errors.password.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? "Signing In..." : "Login"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}