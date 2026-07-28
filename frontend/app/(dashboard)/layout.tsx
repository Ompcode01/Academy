import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen max-w-[100vw] overflow-x-hidden">
      <Sidebar />
      <div className="ml-[240px] flex flex-1 flex-col min-w-0 overflow-x-hidden">
        <TopBar />
        <main className="flex-1 bg-muted/30 overflow-x-hidden w-full">{children}</main>
      </div>
    </div>
  );
}
