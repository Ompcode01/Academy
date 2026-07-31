import LoginForm from "@/components/auth/login-form";
import { GraduationCap, ArrowRight, ShieldCheck, Zap, BookOpen } from "lucide-react";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen bg-[#0D1117] text-white">
      {/* Left side: Premium Branding & Features Panel */}
      <div className="relative hidden w-1/2 flex-col justify-between bg-[#0B132B] p-16 text-white lg:flex overflow-hidden border-r border-slate-800/80">
        {/* Glow Effects */}
        <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-[#C82333]/15 blur-[120px]" />
        <div className="absolute -right-20 -bottom-20 h-96 w-96 rounded-full bg-blue-500/10 blur-[120px]" />
        
        {/* Brand Header */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#C82333]">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <div>
            <span className="text-base font-extrabold tracking-wider text-white">
              HARBINGER
            </span>
            <span className="block text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-400 leading-none mt-0.5">
              Academy LMS
            </span>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="relative z-10 space-y-8 my-auto">
          <div className="space-y-3">
            <h1 className="text-4xl font-extrabold tracking-tight leading-tight text-white">
              Empowering Minds, <br />
              Elevating Enterprise.
            </h1>
            <p className="text-slate-400 text-sm max-w-md">
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
                  <div className="rounded-lg bg-[#C82333]/10 border border-[#C82333]/20 p-2 shrink-0">
                    <Icon className="h-4 w-4 text-[#C82333]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">{feature.title}</h3>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{feature.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-xs text-slate-500">
          © {new Date().getFullYear()} Harbinger Group. All rights reserved.
        </div>
      </div>

      {/* Right side: Login Form Container */}
      <div className="flex w-full flex-col justify-center items-center p-8 lg:w-1/2 bg-[#0D1117] relative">
        {/* Glow light centering on right side */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(200,35,51,0.08),transparent_70%)] pointer-events-none" />
        
        {/* Mobile Header */}
        <div className="absolute top-8 left-8 flex items-center gap-2 lg:hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#C82333]">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <span className="text-sm font-bold tracking-wider text-white">
            HARBINGER
          </span>
        </div>

        <div className="w-full max-w-md space-y-6 relative z-10 flex flex-col items-center justify-center">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}