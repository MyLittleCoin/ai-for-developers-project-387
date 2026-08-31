import { Link, NavLink, Outlet } from "react-router-dom";
import { cn } from "@/lib/utils";

export default function GuestLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b">
        <div className="mx-auto flex max-w-3xl items-center gap-6 px-4 py-3">
          <span className="font-semibold">Сервис бронирования</span>
          <nav className="flex gap-1">
            <NavLink
              to="/"
              className={({ isActive }) =>
                cn(
                  "rounded-md px-3 py-1.5 text-sm transition-colors",
                  isActive
                    ? "bg-muted font-medium"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                )
              }
            >
              Главная
            </NavLink>
            <NavLink
              to="/schedule"
              className={({ isActive }) =>
                cn(
                  "rounded-md px-3 py-1.5 text-sm transition-colors",
                  isActive
                    ? "bg-muted font-medium"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                )
              }
            >
              Расписание
            </NavLink>
          </nav>
          <Link
            to="/admin"
            className="ml-auto rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Владельцу
          </Link>
        </div>
      </header>
      <Outlet />
    </div>
  );
}
