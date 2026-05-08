import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";

export const useCanDownload = () => {
  const { user } = useAuth();
  const { isActive } = useSubscription();
  return !!user && isActive;
};
