import LoginForm from "@/components/auth/login-form";
import { GraduationCap, ArrowRight, ShieldCheck, Zap, BookOpen } from "lucide-react";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen bg-card">
      {/* Left side: Premium Branding & Features Panel */}
      <div className="relative hidden w-1/2 flex-col justify-between bg-sidebar p-16 text-white lg:flex overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -right-20 -bottom-20 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />
        
        {/* Brand Header */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <div>
            <span className="text-base font-extrabold tracking-wider text-white">
              HARBINGER
            </span>
            <span className="block text-[11px] font-semibold uppercase tracking-[0.25em] text-sidebar-foreground/60 leading-none mt-0.5">
              Academy LMS
            </span>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="relative z-10 space-y-8 my-auto">
          <div className="space-y-3">
            <h1 className="text-4xl font-extrabold tracking-tight leading-tight">
              Empowering Minds, <br />
              Elevating Enterprise.
            </h1>
            <p className="text-sidebar-foreground/70 text-sm max-w-md">
              Access your personalized learning tracks, department analytics, and sync directly with enterprise modules.
            </p>
          </div>

          <div className="space-y-4 max-w-sm">
            {[
              {
                icon: BookOpen,
                title: "Curated Tracks",
                desc: "Follow structured course curriculums customized for your role.",
              },
              {
                icon: Zap,
                title: "Interactive App",
                desc: "Take quizzes, build structures, and preview modules instantly.",
              },
              {
                icon: ShieldCheck,
                title: "Enterprise Mapped",
                desc: "Integrated with corporate directories and active ERP logs.",
              },
            ].map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div key={idx} className="flex gap-4 items-start">
                  <div className="rounded-lg bg-white/5 border border-white/10 p-2 shrink-0">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">{feature.title}</h3>
                    <p className="text-xs text-sidebar-foreground/65 mt-0.5 leading-relaxed">{feature.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-xs text-sidebar-foreground/50">
          © {new Date().getFullYear()} Harbinger Group. All rights reserved.
        </div>
      </div>

      {/* Right side: Login Form Container */}
      <div className="flex w-full flex-col justify-center items-center p-8 lg:w-1/2 bg-background relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(var(--primary),0.05),transparent)] pointer-events-none" />
        
        {/* Mobile Header */}
        <div className="absolute top-8 left-8 flex items-center gap-2 lg:hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <span className="text-sm font-bold tracking-wider">
            HARBINGER
          </span>
        </div>

        <div className="w-full max-w-md space-y-6 relative z-10">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}