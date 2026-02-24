import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Flame, LogIn, LogOut, FolderOpen, Users, Bell, X, Menu, User, ClipboardCheck } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";

const AppHeader = () => {
  const { user, loading, signOut } = useAuth();
  const { notifications, unreadCount, markAllRead, deleteNotification } = useNotifications();
  const navigate = useNavigate();

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary">
              <Flame className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold">Branndokumentasjon.no</h1>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {loading ? null : user ? (
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative">
                      <Bell className="h-4 w-4" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">
                          {unreadCount}
                        </span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-80 p-0 z-50 bg-popover">
                    <div className="flex items-center justify-between p-3 border-b">
                      <p className="font-semibold text-sm">Varsler</p>
                      {unreadCount > 0 && (
                        <Button variant="ghost" size="sm" className="text-xs h-7" onClick={markAllRead}>
                          Merk alle som lest
                        </Button>
                      )}
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="text-sm text-muted-foreground p-4 text-center">Ingen varsler</p>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            className={`p-3 border-b last:border-b-0 text-sm flex items-start justify-between gap-2 ${!n.read ? "bg-accent/50" : ""}`}
                          >
                            <div>
                              <p className="font-medium">{n.title}</p>
                              {n.message && <p className="text-muted-foreground text-xs mt-0.5">{n.message}</p>}
                            </div>
                            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => deleteNotification(n.id)}>
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </PopoverContent>
                </Popover>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Menu className="h-4 w-4 mr-2" />
                      Meny
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 z-50 bg-popover">
                    <DropdownMenuItem onClick={() => navigate("/mine-prosjekter")}>
                      <FolderOpen className="h-4 w-4 mr-2" />
                      Mine prosjekter
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/mine-oppgaver")}>
                      <ClipboardCheck className="h-4 w-4 mr-2" />
                      Mine oppgaver
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/mine-kontakter")}>
                      <Users className="h-4 w-4 mr-2" />
                      Mine kontakter og grupper
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/min-profil")}>
                      <User className="h-4 w-4 mr-2" />
                      Min profil
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={signOut}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Logg ut
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <Link to="/auth">
                <Button size="sm">
                  <LogIn className="h-4 w-4 mr-2" />
                  Logg inn
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
