// src/react/usePayment.tsx
import { useEffect, useRef, useState } from "react";
import { createPayment, getPaymentStatus } from "../api";

export function usePayment() {
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const pollingRef = useRef<number | null>(null);

  async function startPayment(opts: { amount: number; apiKey: string; note?: string; callbackUrl?: string }) {
    console.log("usePayment.startPayment called", opts);
    try {
      const data = await createPayment(opts);
      console.log("createPayment response", data);
      setPaymentId(data.paymentId);
      setStatus("waiting_user_input");
      startPolling(data.paymentId);
      return data.paymentId;
    } catch (err) {
      console.error("usePayment.startPayment error", err);
      // rethrow so caller (PayButton) can show user-friendly error
      throw err;
    }
  }

  function startPolling(id: string) {
    console.log("startPolling for", id);
    if (pollingRef.current) window.clearInterval(pollingRef.current);
    pollingRef.current = window.setInterval(async () => {
      try {
        const j = await getPaymentStatus(id);
        console.log("polled status", j);
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
