import { useAuth } from "@/hooks/useAuth";

export const useCanDownload = () => {
  const { user } = useAuth();
  return !!user;
};
