import { useAuth } from "@/hooks/useAuth";

const FULL_ACCESS_EMAILS = [
  "stianolimstad@gmail.com",
  "stian.olimstad@xn--olimstadbrannrdgivning-15b.no",
];

export const useIsFullAccess = () => {
  const { user } = useAuth();
  const email = user?.email?.toLowerCase();
  return !!email && FULL_ACCESS_EMAILS.includes(email);
};
