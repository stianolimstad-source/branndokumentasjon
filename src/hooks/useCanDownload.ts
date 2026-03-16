import { useAuth } from "@/hooks/useAuth";

const ALLOWED_EMAIL = "stianolimstad@gmail.com";

export const useCanDownload = () => {
  const { user } = useAuth();
  return user?.email === ALLOWED_EMAIL;
};
