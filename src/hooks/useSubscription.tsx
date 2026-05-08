import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getPaddleEnvironment } from "@/lib/paddle";

const FULL_ACCESS_EMAILS = ["stianolimstad@gmail.com"];

export interface SubscriptionState {
  loading: boolean;
  isActive: boolean;
  status: string | null;
  priceId: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  refresh: () => Promise<void>;
}

export function useSubscription(): SubscriptionState {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [row, setRow] = useState<any>(null);

  const isOwner = !!user?.email && FULL_ACCESS_EMAILS.includes(user.email.toLowerCase());

  const fetchSub = async () => {
    if (!user) {
      setRow(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .eq("environment", getPaddleEnvironment())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setRow(data);
    setLoading(false);
  };

  useEffect(() => {
    if (authLoading) return;
    fetchSub();
    if (!user) return;
    const channel = supabase
      .channel("subscriptions-" + user.id)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "subscriptions", filter: `user_id=eq.${user.id}` },
        () => fetchSub()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, authLoading]);

  let isActive = false;
  if (isOwner) {
    isActive = true;
  } else if (row) {
    const end = row.current_period_end ? new Date(row.current_period_end as string) : null;
    const now = new Date();
    if (["active", "trialing", "past_due"].includes(row.status as string)) {
      isActive = !end || end > now;
    } else if (row.status === "canceled" && end && end > now) {
      isActive = true;
    }
  }

  return {
    loading,
    isActive,
    status: row?.status ?? (isOwner ? "owner" : null),
    priceId: row?.price_id ?? null,
    currentPeriodEnd: row?.current_period_end ?? null,
    cancelAtPeriodEnd: !!row?.cancel_at_period_end,
    refresh: fetchSub,
  };
}
