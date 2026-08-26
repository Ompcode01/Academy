import { Suspense } from "react";
import LoginForm from "@/components/auth/login-form";
import Footer from "@/components/layout/Footer";
import SakshamLogo from "@/components/common/SakshamLogo";
import LiveBackground from "@/components/common/LiveBackground";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col justify-between bg-gradient-to-br from-[#050B18] via-[#0B1E3D] to-[#002855] text-white relative overflow-hidden">
      {/* Dynamic Live Background with interactive particle constellation and glowing ambient mesh */}
      <LiveBackground />

      <div className="flex flex-1 w-full flex-col lg:flex-row relative z-10">
        {/* Left side: Clean Branding Panel */}
        <div className="relative hidden w-1/2 flex-col justify-between p-16 text-white lg:flex">
          {/* Logo - Top Left Corner */}
          <div className="flex items-center">
            <SakshamLogo variant="horizontal" height={44} />
          </div>

          {/* Headline Text - Centered */}
          <div className="flex flex-col items-center justify-center text-center max-w-lg w-full mx-auto my-auto space-y-6">
            <h1 className="text-4xl font-extrabold tracking-tight leading-tight text-white text-center w-full">
              Empowering Minds, <br />
              Elevating Enterprise.
            </h1>
          </div>

          {/* Spacer */}
          <div className="h-10 pointer-events-none" />
        </div>

        {/* Right side: Login Form Container */}
        <div className="flex w-full min-h-[85vh] lg:min-h-0 flex-col justify-center items-center p-8 lg:w-1/2 relative">
          {/* Mobile Header */}
          <div className="absolute top-8 left-8 flex items-center lg:hidden">
            <SakshamLogo variant="horizontal" height={32} />
          </div>

          <div className="w-full max-w-md space-y-6 flex flex-col items-center justify-center">
            <Suspense fallback={<div className="text-slate-400 text-sm">Loading login form...</div>}>
              <LoginForm />
            </Suspense>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer variant="dark" />
    </main>
  );
}