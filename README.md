# AdeyPay SDK

![npm version](https://img.shields.io/npm/v/adeypay-sdk?color=green&style=flat-square)
![License](https://img.shields.io/npm/l/adeypay-sdk?color=blue&style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue?style=flat-square)

A simple and secure JavaScript/TypeScript SDK to integrate AdeyPay payments into your web or React projects.  
This SDK is designed for **merchants** to easily embed a payment button and process transactions safely.

---

## 🚀 Features
- 🔒 **Secure** payment processing via AdeyPay API
- ⚡ **Quick setup** — ready in minutes
- 🛠 **React components** + plain JavaScript support
- 📡 Web popup for payment approval
- 💳 Supports multiple currencies

---

## 📦 Installation
```bash
npm install adeypay-sdk

# Using yarn
yarn add adeypay-sdk
```

## usage
``` react

Plain JavaScript / TypeScript

import { PayButton } from "adeypay-sdk";

export default function App() {
  return (
    <div>
      <h1>Buy Coffee</h1>
      <PayButton
        amount={5}
        apiKey="YOUR_MERCHANT_API_KEY"
        callbackUrl="https://yourapp.com/callback"
        onCreated={(id) => console.log("Payment created:", id)}
        onApproved={(id) => console.log("Payment approved:", id)}
        onError={(err) => console.error("Payment error:", err)}
      >
        Pay $5
      </PayButton>
    </div>
  );
}

FULL EXAMPLE

import { PayButton } from "adeypay-sdk";
import { useState, useMemo } from "react";

export default function DepositPage() {
  const [balance, setBalance] = useState(0);
  const [amountInput, setAmountInput] = useState("10.00");

  const amount = useMemo(() => parseFloat(amountInput) || 0, [amountInput]);

  function handleCreated(id: string) {
    console.log("Payment created:", id);
  }

  function handleApproved(id: string) {
    console.log("Payment approved:", id);
    setBalance((b) => b + amount);
  }

  function handleError(err: Error) {
    console.error("Payment error:", err);
  }

  return (
    <div>
      <h1>Deposit Funds</h1>
      <input
        value={amountInput}
        onChange={(e) => setAmountInput(e.target.value)}
      />
      <PayButton
        amount={amount}
        apiKey="YOUR_MERCHANT_API_KEY"
        callbackUrl={window.location.href}
        onCreated={handleCreated}
        onApproved={handleApproved}
        onError={handleError}
      >
        Deposit ${amount.toFixed(2)}
      </PayButton>
      <p>Balance: ${balance.toFixed(2)}</p>
    </div>
  );
}

```
