import { useAuth } from "@/hooks/useAuth";

const FULL_ACCESS_EMAILS = ["stianolimstad@gmail.com"];

export const useIsFullAccess = () => {
  const { user } = useAuth();
  const email = user?.email?.toLowerCase();
  return !!email && FULL_ACCESS_EMAILS.includes(email);
};
