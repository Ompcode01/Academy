import { Suspense } from "react";
import LoginForm from "@/components/auth/login-form";
import Footer from "@/components/layout/Footer";
import SakshamLogo from "@/components/common/SakshamLogo";
import CapDevLogo from "@/components/common/CapDevLogo";
import LiveBackground from "@/components/common/LiveBackground";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col justify-between bg-gradient-to-br from-[#050B18] via-[#0B1E3D] to-[#002855] text-white relative overflow-hidden">
      {/* Dynamic Live Background with interactive particle constellation and glowing ambient mesh */}
      <LiveBackground />

      {/* Top Left Saksham Logo */}
      <div className="absolute top-4 left-6 lg:top-6 lg:left-8 flex items-center z-20">
        <SakshamLogo height={44} className="hover:scale-105 transition-transform" />
      </div>

      <div className="flex flex-1 w-full flex-col lg:flex-row relative z-10">
        {/* Left side: Clean Branding Panel */}
        <div className="relative hidden w-1/2 flex-col justify-between p-16 text-white lg:flex">
          {/* Spacer */}
          <div className="h-10 pointer-events-none" />

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
          {/* Top Right CapDev Logo */}
          <div className="absolute top-4 right-6 lg:top-6 lg:right-8 flex items-center z-20">
            <CapDevLogo height={26} className="hover:scale-105 transition-transform" />
          </div>

          {/* Mobile Header */}
          <div className="absolute top-6 left-8 flex items-center lg:hidden">
            <SakshamLogo height={36} />
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