// src/react/usePayment.tsx
import { useEffect, useRef, useState } from "react";
import { createPayment, getPaymentStatus } from "../api";

export function usePayment() {
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const pollingRef = useRef<number | null>(null);

  async function startPayment(opts: { amount: number; apiKey: string; note?: string; callbackUrl?: string }) {
    try {
      const data = await createPayment(opts);
      setPaymentId(data.paymentId);
      setStatus("waiting_user_input");
      startPolling(data.paymentId);
      return data.paymentId;
    } catch (err) {
      console.error("usePayment.startPayment error", err);
      // rethrow so caller (CallbackButton) can show user-friendly error
      throw err;
    }
  }

  function startPolling(id: string) {
    if (pollingRef.current) window.clearInterval(pollingRef.current);
    pollingRef.current = window.setInterval(async () => {
      try {
        const j = await getPaymentStatus(id);
        setStatus(j.status);
        if (j.status === "approved" || j.status === "failed") {
          if (pollingRef.current) {
            window.clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
        }
      } catch (err) {
        console.error("poll error", err);
      }
    }, 3000);
  }

  useEffect(() => {
    return () => {
      if (pollingRef.current) window.clearInterval(pollingRef.current);
    };
  }, []);

  return { paymentId, status, startPayment, setPaymentId, startPolling };
}
