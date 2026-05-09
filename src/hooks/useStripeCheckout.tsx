import { useState, useCallback } from "react";
import { StripeEmbeddedCheckoutForm } from "@/components/StripeEmbeddedCheckout";
import { useAuth } from "@/hooks/useAuth";

interface CheckoutOptions {
  priceId: string;
  returnUrl?: string;
}

export function useStripeCheckout() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<(CheckoutOptions & { resolved: true }) | null>(null);

  const openCheckout = useCallback(
    (opts: CheckoutOptions | string) => {
      const o: CheckoutOptions = typeof opts === "string" ? { priceId: opts } : opts;
      if (!user) {
        window.location.href = "/auth";
        return;
      }
      setOptions({
        ...o,
        returnUrl:
          o.returnUrl ||
          `${window.location.origin}/abonnement?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
        resolved: true,
      });
      setIsOpen(true);
    },
    [user],
  );

  const closeCheckout = useCallback(() => {
    setIsOpen(false);
    setOptions(null);
  }, []);

  const checkoutElement =
    isOpen && options && user ? (
      <StripeEmbeddedCheckoutForm
        priceId={options.priceId}
        customerEmail={user.email || undefined}
        userId={user.id}
        returnUrl={options.returnUrl!}
      />
    ) : null;

  return { openCheckout, closeCheckout, isOpen, checkoutElement, loading: false };
}
