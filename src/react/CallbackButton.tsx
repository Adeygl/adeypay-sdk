// src/react/CallbackButton.tsx
import React, { useEffect, useState } from "react";
import { usePayment } from "./usePayment";

type Props = {
  amount: number;
  apiKey: string;
  callbackUrl?: string;
  note?: string;
  children?: React.ReactNode;
  className?: string;
  openPayUrlBase?: string;
  onCreated?: (paymentId: string) => void;
  onApproved?: (paymentId: string) => void;
  onError?: (err: Error) => void;
};

export function CallbackButton({
  amount,
  apiKey,
  callbackUrl,
  note,
  children,
  className,
  openPayUrlBase = "http://pay.localhost:5174",
  onCreated,
  onApproved,
  onError,
}: Props) {
  const { startPayment, paymentId, status } = usePayment();
  const [loading, setLoading] = useState(false);
  const handledRef = React.useRef<Set<string>>(new Set());

  // Handle payment creation and opening payment window
useEffect(() => {
  if (!paymentId) return;
  if (handledRef.current.has(paymentId)) return;
  handledRef.current.add(paymentId);

  const payUrl = `${openPayUrlBase}/${encodeURIComponent(paymentId)}`;

  try {
    // open in the same tab
    window.location.href = payUrl; // or window.open(payUrl, "_self")
  } catch (err) {
    console.error("CallbackButton navigation error:", err);
    onError?.(err instanceof Error ? err : new Error(String(err)));
  }

  onCreated?.(paymentId);
}, [paymentId, openPayUrlBase, onCreated, onError]);

  // Handle payment status changes
  useEffect(() => {
    if (!status || !paymentId) return;

    // Skip if already handled
    if (handledRef.current.has(`status-${paymentId}`)) return;

    if (status === "approved") {
      handledRef.current.add(`status-${paymentId}`);
      onApproved?.(paymentId);
    } else if (status === "failed") {
      handledRef.current.add(`status-${paymentId}`);
      onError?.(new Error("Payment failed"));
    }
  }, [status, paymentId, onApproved, onError]);

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    if (loading) return;

    try {
      setLoading(true);
      
      if (typeof amount !== "number" || isNaN(amount) || amount <= 0) {
        throw new Error("Invalid amount");
      }
      if (!apiKey) {
        throw new Error("API key is required");
      }

      const cbUrl = callbackUrl ?? `${window.location.origin}/callback`;
      await startPayment({ amount, apiKey, callbackUrl: cbUrl, note });
    } catch (err) {
      console.error("CallbackButton error:", err);
      onError?.(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style>{`
        .adeypay-btn {
          background: linear-gradient(90deg, #FFEEAD 0%, #F59E0B 100%);
          color: #0b1220;
          padding: 10px 18px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 16px;
          letter-spacing: 0.2px;
          border: none;
          cursor: pointer;
          box-shadow: 0 8px 20px rgba(245,158,11,0.16);
          transition: transform 120ms ease, box-shadow 160ms ease, filter 120ms ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 44px;
        }

        .adeypay-btn:hover:not(:disabled) {
          transform: translateY(-3px);
          box-shadow: 0 14px 36px rgba(245,158,11,0.22);
          filter: brightness(0.99);
        }

        .adeypay-btn:active:not(:disabled) {
          transform: translateY(0);
        }

        .adeypay-btn:disabled {
          opacity: 0.65;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .adeypay-btn:focus {
          outline: 4px solid rgba(245,158,11,0.20);
          outline-offset: 3px;
        }

        .adeypay-spinner {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 3px solid rgba(0,0,0,0.08);
          border-top-color: #0b1220;
          display: inline-block;
          animation: spin 0.9s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <button
        className={`${className ?? ""} adeypay-btn`.trim()}
        onClick={handleClick}
        aria-busy={loading}
      >
        {loading ? (
          <>
            <span className="adeypay-spinner" aria-hidden="true" />
            <span>Creating...</span>
          </>
        ) : (
          "Pay With APAY"
        )}
      </button>
    </>
  );
}