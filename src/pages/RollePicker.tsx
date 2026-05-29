import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Briefcase, User as UserIcon, Check, Flame } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "branndok_selected_role";

const ENGINEER_BENEFITS = [
  "Full tilgang til alle verktøy",
  "Brannkonsept og fraviksdokumentasjon",
  "ROS-analyser",
  "Tilstandsvurderinger",
  "Tilbud og engasjementer",
];

const CUSTOMER_BENEFITS = [
  "Tilgang til prosjekter delt med deg",
  "Egne prosjekter og ROS-analyser",
  "Gratis å registrere seg",
];

const RollePicker = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (loading) return;

    const run = async () => {
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();
        const role = (data as any)?.role as string | null | undefined;
        if (role === "customer") {
          navigate("/kunde", { replace: true });
          return;
        }
        // Engineer: ingen auto-redirect – vis rollevelgeren som vanlig
        // role === null → vis picker (RoleSelectModal er fallback)
        setChecking(false);
        return;
      }

      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "engineer") {
        navigate("/branningenior", { replace: true });
        return;
      }
      if (stored === "customer") {
        navigate("/kunde-landing", { replace: true });
        return;
      }
      setChecking(false);
    };

    run();
  }, [user, loading, navigate]);

  const handleSelect = (role: "engineer" | "customer") => {
    localStorage.setItem(STORAGE_KEY, role);
    navigate(role === "engineer" ? "/branningenior" : "/kunde-landing");
  };

  if (loading || checking) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <p className="text-muted-foreground">Laster…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle px-4 py-12 flex flex-col">
      <div className="flex items-center justify-center gap-2 mb-12">
        <Flame className="h-7 w-7 text-primary" />
        <span className="text-xl font-semibold">Branndokumentasjon.no</span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center max-w-5xl mx-auto w-full">
        <div className="text-center space-y-3 mb-12">
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight">
            Velkommen til Branndokumentasjon.no
          </h1>
          <p className="text-lg text-muted-foreground">
            Velg hvordan du vil bruke siden
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          <RoleCard
            icon={<Briefcase className="h-7 w-7" />}
            title="Jeg er branningeniør"
            description="Full tilgang til alle verktøy og dokumentasjon."
            benefits={ENGINEER_BENEFITS}
            onClick={() => handleSelect("engineer")}
          />
          <RoleCard
            icon={<UserIcon className="h-7 w-7" />}
            title="Jeg er kunde"
            description="Få oversikt over prosjektene dine."
            benefits={CUSTOMER_BENEFITS}
            onClick={() => handleSelect("customer")}
          />
        </div>

        <p className="text-xs text-muted-foreground text-center mt-10">
          Du kan endre dette senere i Min profil hvis du registrerer deg.
        </p>
      </div>
    </div>
  );
};

const RoleCard = ({
  icon,
  title,
  description,
  benefits,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  benefits: string[];
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "group flex flex-col items-start gap-5 rounded-xl border-2 border-border bg-card p-8 text-left transition-all",
      "hover:border-primary hover:shadow-lg hover:-translate-y-0.5",
    )}
  >
    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
      {icon}
    </div>
    <div className="space-y-1">
      <div className="text-xl font-semibold text-foreground">{title}</div>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
    <ul className="space-y-2 w-full">
      {benefits.map((b) => (
        <li key={b} className="flex items-start gap-2 text-sm">
          <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <span>{b}</span>
        </li>
      ))}
    </ul>
  </button>
);

export default RollePicker;
