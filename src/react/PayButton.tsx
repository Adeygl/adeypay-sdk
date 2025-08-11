// src/react/PayButton.tsx
import React, { useEffect, useRef, useState } from "react";
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
  popupWidth?: number;
  popupHeight?: number;
};

export function PayButton({
  amount,
  apiKey,
  callbackUrl,
  note,
  children,
  className,
  openPayUrlBase = "https://adey.pages.dev/pay",
  onCreated,
  onApproved,
  onError,
  popupWidth = 900,
  popupHeight = 700,
}: Props) {
  const { startPayment, paymentId, status } = usePayment();
  const [loading, setLoading] = useState(false);

  // popup window ref and name
  const popupRef = useRef<Window | null>(null);
  const popupNameRef = useRef<string | null>(null);

  // track paymentIds we already navigated to (prevents repeated loads)
  const navigatedRef = useRef<Set<string>>(new Set());
  // track paymentIds that are fully handled/approved (don't reopen)
  const handledRef = useRef<Set<string>>(new Set());

  // When paymentId becomes available -> navigate popup once per paymentId
  useEffect(() => {
    if (!paymentId) return;
    if (handledRef.current.has(paymentId)) {
      // already approved/handled before — ignore
      return;
    }
    if (navigatedRef.current.has(paymentId)) {
      // we've already navigated for this paymentId — skip
      return;
    }

    navigatedRef.current.add(paymentId);

    const payUrl = `${openPayUrlBase}/${encodeURIComponent(paymentId)}`;

    // If we have an opened popup reuse it, else open with a name based on paymentId
    try {
      const name = `_adeypay_${paymentId}`;
      popupNameRef.current = name;

      if (popupRef.current && !popupRef.current.closed) {
        // reuse window: assign location
        try {
          popupRef.current.location.href = payUrl;
        } catch (err) {
          // cross-origin assignment may throw in some browsers
          const win = window.open(payUrl, name, buildFeatures(popupWidth, popupHeight));
          if (win) popupRef.current = win;
        }
      } else {
        // open new named window synchronously (less likely to be blocked)
        const win = window.open("", name, buildFeatures(popupWidth, popupHeight));
        if (win) {
          popupRef.current = win;
          // navigate it
          try {
            popupRef.current.location.href = payUrl;
          } catch {
            // fallback: open directly
            popupRef.current = window.open(payUrl, name, buildFeatures(popupWidth, popupHeight));
          }
        } else {
          // popup blocked; notify via onError so the app can redirect instead
          if (onError) onError(new Error("Popup blocked or failed to open"));
          console.error("PayButton: popup blocked");
        }
      }
    } catch (err: any) {
      console.error("PayButton navigation error:", err);
      if (onError) onError(err);
    }

    if (onCreated) onCreated(paymentId);
  }, [paymentId, openPayUrlBase, onCreated, onError, popupHeight, popupWidth]);

  // Close popup and mark handled when approved
  useEffect(() => {
    if (!status) return;

    if (status === "approved" && paymentId && !handledRef.current.has(paymentId)) {
      try {
        if (popupRef.current && !popupRef.current.closed) popupRef.current.close();
      } catch {}
      popupRef.current = null;
      popupNameRef.current = null;

      handledRef.current.add(paymentId);
      navigatedRef.current.delete(paymentId); // free memory if you like

      if (onApproved) onApproved(paymentId);
    }

    if (status === "failed") {
      // ensure we don't keep a hanging popup
      try {
        if (popupRef.current && !popupRef.current.closed) popupRef.current.close();
      } catch {}
      popupRef.current = null;
      popupNameRef.current = null;
      if (onError) onError(new Error("Payment failed"));
    }
  }, [status, paymentId, onApproved, onError]);

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();

    // do nothing if a payment is currently in "waiting_user_input" to avoid duplicates
    if (status === "waiting_user_input") return;

    // open a named blank window synchronously to avoid popup blockers
    const name = `_adeypay_${Date.now()}`;
    popupNameRef.current = name;
    popupRef.current = window.open("", name, buildFeatures(popupWidth, popupHeight));

    try {
      setLoading(true);

      if (typeof amount !== "number" || isNaN(amount) || amount <= 0) {
        throw new Error("Invalid `amount`");
      }
      if (!apiKey || typeof apiKey !== "string") {
        throw new Error("apiKey is required");
      }

      const cbUrl = callbackUrl ?? `${window.location.origin}/callback`;

      // startPayment should set paymentId which triggers the effect above to navigate the popup
      await startPayment({
        amount,
        apiKey,
        callbackUrl: cbUrl,
        note,
      });
    } catch (err: any) {
      console.error("PayButton error:", err);
      try {
        if (popupRef.current && !popupRef.current.closed) popupRef.current.close();
      } catch {}
      popupRef.current = null;
      if (onError) onError(err);
      else alert("Error creating payment: " + (err?.message ?? String(err)));
    } finally {
      setLoading(false);
    }
  }

  const disabled = loading || status === "waiting_user_input";

  return (
    <button
      className={className}
      onClick={handleClick}
      disabled={disabled}
      aria-busy={loading}
      style={{ pointerEvents: disabled ? "none" : undefined }}
    >
      {loading ? "Creating..." : children ?? `Pay $${amount}`}
    </button>
  );
}

/** helpers */
function buildFeatures(width: number, height: number) {
  const screenX = typeof window.screenX !== "undefined" ? window.screenX : 0;
  const screenY = typeof window.screenY !== "undefined" ? window.screenY : 0;
  const outerWidth = window.outerWidth ?? window.screen.width;
  const outerHeight = window.outerHeight ?? window.screen.height;

  const left = Math.max(0, Math.floor(screenX + (outerWidth - width) / 2));
  const top = Math.max(0, Math.floor(screenY + (outerHeight - height) / 2));

  return [
    `width=${width}`,
    `height=${height}`,
    `left=${left}`,
    `top=${top}`,
    "resizable=yes",
    "scrollbars=yes",
    "toolbar=no",
    "location=no",
    "status=no",
    "menubar=no",
  ].join(",");
}
