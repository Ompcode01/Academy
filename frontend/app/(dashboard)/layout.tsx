import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="ml-[240px] flex flex-1 flex-col">
        <TopBar />
        <main className="flex-1 bg-muted/30">{children}</main>
      </div>
    </div>
  );
}
