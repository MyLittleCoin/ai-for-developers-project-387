import { Link, NavLink, Outlet } from "react-router-dom";
import { cn } from "@/lib/utils";

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center gap-6 px-4 py-3">
          <span className="font-semibold">Администрирование</span>
          <nav className="flex gap-1">
            <NavLink
              to="/admin/event-types"
              className={({ isActive }) =>
                cn(
                  "rounded-md px-3 py-1.5 text-sm transition-colors",
                  isActive
                    ? "bg-muted font-medium"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                )
              }
            >
              Типы событий
            </NavLink>
            <NavLink
              to="/admin/bookings"
              className={({ isActive }) =>
                cn(
                  "rounded-md px-3 py-1.5 text-sm transition-colors",
                  isActive
                    ? "bg-muted font-medium"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                )
              }
            >
              Встречи
            </NavLink>
          </nav>
          <Link
            to="/"
            className="ml-auto rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted/60"
          >
            К гостевому виду
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
