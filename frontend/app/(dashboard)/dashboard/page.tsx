"use client";

import { useAuthStore } from "@/store/auth.store";

export default function Dashboard() {
  const user = useAuthStore((state) => state.user);

  return (
    <div className="p-10">
      <h1 className="text-3xl font-bold">
        Welcome
      </h1>

      <pre className="mt-6 rounded-lg bg-slate-100 p-5">
        {JSON.stringify(user, null, 2)}
      </pre>
    </div>
  );
}