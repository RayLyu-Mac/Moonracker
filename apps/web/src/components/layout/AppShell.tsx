import { ActivitySquare, BrainCircuit, Database, LayoutDashboard, Settings2, Stethoscope } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { cn } from "../../lib/utils";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/sites", label: "Sites", icon: Stethoscope },
  { to: "/studies", label: "Studies", icon: ActivitySquare },
  { to: "/upload", label: "Data Upload", icon: Database },
  { to: "/configuration", label: "Configuration", icon: Settings2 },
  { to: "/ai-assistant", label: "AI Assistant", icon: BrainCircuit },
];

export function AppShell() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50/45">
      <div className="mx-auto grid max-w-[1560px] grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:px-8">
        <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_14px_34px_-26px_rgba(15,23,42,0.45)]">
          <div className="mb-5 rounded-xl bg-sky-700 px-3 py-4 text-white">
            <p className="text-xs uppercase tracking-[0.16em] text-sky-100">Moonracker</p>
            <h1 className="mt-1 text-base font-semibold leading-tight">Site Enrollment Intelligence</h1>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }: { isActive: boolean }) =>
                    cn(
                      "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors",
                      isActive ? "bg-sky-50 text-sky-700" : "hover:bg-slate-100",
                    )
                  }
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </aside>

        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
