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
  openPayUrlBase = "https://pay.adey.lol",
  onCreated,
  onApproved,
  onError,
  popupWidth = 900,
  popupHeight = 700,
}: Props) {
  const { startPayment, paymentId, status } = usePayment();
  const [loading, setLoading] = useState(false);

  const popupRef = useRef<Window | null>(null);
  const popupNameRef = useRef<string | null>(null);
  const navigatedRef = useRef<Set<string>>(new Set());
  const handledRef = useRef<Set<string>>(new Set());

  // helper: write a small html page into the blank popup
  function writePopupHtml(html: string) {
    try {
      if (!popupRef.current || popupRef.current.closed) return;
      const doc = popupRef.current.document;
      doc.open();
      doc.write(html);
      doc.close();
    } catch (err) {
      // accessing document might throw once navigated cross-origin; ignore
      // but log for debugging
      console.warn("writePopupHtml failed:", err);
    }
  }

  function creatingHtml() {
    return `
      <!doctype html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Creating payment...</title>
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial; margin:0; display:flex; align-items:center; justify-content:center; height:100vh; background: #f7fafc; color:#111827; }
          .card { text-align:center; padding:24px; border-radius:12px; box-shadow: 0 6px 18px rgba(15,23,42,0.08); background: #fff; width:90%; max-width:420px; }
          .spinner { margin: 20px auto; width:48px; height:48px; border-radius:50%; border:4px solid #e5e7eb; border-top-color:#3b82f6; animation:spin 1s linear infinite; }
          @keyframes spin { to { transform: rotate(360deg); } }
          .muted { color:#6b7280; font-size:14px; margin-top:8px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div style="font-size:18px; font-weight:600">Creating payment…</div>
          <div class="spinner" role="status" aria-hidden="true"></div>
          <div class="muted">Please keep this window open — you'll be redirected automatically.</div>
        </div>
      </body>
      </html>
    `;
  }

  function errorHtml(message: string) {
    const safe = String(message).replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return `
      <!doctype html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Payment error</title>
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial; margin:0; display:flex; align-items:center; justify-content:center; height:100vh; background: #fff7f7; color:#111827; }
          .card { text-align:center; padding:24px; border-radius:12px; box-shadow: 0 6px 18px rgba(15,23,42,0.06); background: #fff; width:90%; max-width:420px; border:1px solid #fee2e2; }
          .title { font-size:18px; font-weight:700; color:#b91c1c; }
          .msg { margin-top:12px; color:#7f1d1d; font-size:14px; }
          .btn { display:inline-block; margin-top:18px; padding:8px 14px; border-radius:8px; text-decoration:none; background:#ef4444; color:white; font-weight:600; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="title">Error creating payment</div>
          <div class="msg">${safe}</div>
          <a class="btn" href="javascript:window.close()">Close</a>
        </div>
      </body>
      </html>
    `;
  }

  // When paymentId becomes available -> navigate popup once per paymentId
  useEffect(() => {
    if (!paymentId) return;
    if (handledRef.current.has(paymentId)) return;
    if (navigatedRef.current.has(paymentId)) return;

    navigatedRef.current.add(paymentId);
    const payUrl = `${openPayUrlBase}/${encodeURIComponent(paymentId)}`;

    try {
      const name = popupNameRef.current ?? `_adeypay_${paymentId}`;
      popupNameRef.current = name;

      if (popupRef.current && !popupRef.current.closed) {
        // navigate popup to the actual pay page
        try {
          popupRef.current.location.href = payUrl;
        } catch (err) {
          // some browsers might throw cross-origin assignment errors; fallback to open
          const win = window.open(payUrl, name, buildFeatures(popupWidth, popupHeight));
          if (win) popupRef.current = win;
        }
      } else {
        // user closed the popup or it never opened; try to open new (may be blocked)
        const win = window.open(payUrl, name, buildFeatures(popupWidth, popupHeight));
        if (win) {
          popupRef.current = win;
        } else {
          // popup blocked — notify host app so it can handle redirect fallback
          const err = new Error("Popup blocked or failed to open on payment creation.");
          if (onError) onError(err);
          console.error(err);
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
      navigatedRef.current.delete(paymentId);

      if (onApproved) onApproved(paymentId);
    }

    if (status === "failed") {
      // show error inside popup instead of abruptly closing it
      try {
        writePopupHtml(errorHtml("Payment failed. Please try again or contact support."));
      } catch {}
      if (onError) onError(new Error("Payment failed"));
    }
  }, [status, paymentId, onApproved, onError]);

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();

    // avoid duplicates
    if (status === "waiting_user_input") return;

    // open a named blank window synchronously to avoid popup blockers
    const name = `_adeypay_${Date.now()}`;
    popupNameRef.current = name;
    popupRef.current = window.open("", name, buildFeatures(popupWidth, popupHeight));

    if (!popupRef.current) {
      // popup blocked — notify and let host app handle fallback
      const err = new Error("Popup blocked or failed to open");
      if (onError) onError(err);
      console.error("PayButton: popup blocked");
      return;
    }

    // show creating UI in the popup
    writePopupHtml(creatingHtml());

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
      // show error inside popup so the user sees it
      try {
        writePopupHtml(errorHtml(err?.message ?? String(err)));
      } catch {
        // if we can't write to popup, close it and bubble error
        try {
          if (popupRef.current && !popupRef.current.closed) popupRef.current.close();
        } catch {}
        popupRef.current = null;
      }
      if (onError) onError(err);
    } finally {
      setLoading(false);
    }
  }

  const disabled = loading || status === "waiting_user_input";

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
        disabled={disabled}
        aria-busy={loading}
        style={{ pointerEvents: disabled ? "none" : undefined }}
      >
        {loading ? (
          <>
            <span className="adeypay-spinner" aria-hidden="true" />
            <span>Creating...</span>
          </>
        ) : (
          // prefer children if provided, otherwise default label "APAY"
          ("Deposit With APAY")
        )}
      </button>
    </>
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
