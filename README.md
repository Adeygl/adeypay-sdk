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
``` javascript

// Plain JavaScript / TypeScript

import { CallbackButton } from "adeypay-sdk";

export default function App() {
  return (
    <div>
      <h1>Buy Coffee</h1>
      <CallbackButton
        amount={5}
        apiKey="YOUR_MERCHANT_API_KEY"
        callbackUrl="https://yourapp.com/callback"
        onCreated={(id) => console.log("Payment created:", id)}
        onApproved={(id) => console.log("Payment approved:", id)}
        onError={(err) => console.error("Payment error:", err)}
      >
      </CallbackButton>
    </div>
  );
}
``` 
``` javascript

import { CallbackButton } from "adeypay-sdk";
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
      <CallbackButton
        amount={amount}
        apiKey="YOUR_MERCHANT_API_KEY"
        callbackUrl={window.location.href}
        onCreated={handleCreated}
        onApproved={handleApproved}
        onError={handleError}
      >
      </CallbackButton>
      <p>Balance: ${balance.toFixed(2)}</p>
    </div>
  );
}

```

## Setup

1. **Get your API key**  
   Sign up and create a merchant account at [AdeyPay Dashboard](https://dev.adey.lol).  
   Once registered, go to to get your merchant key.

2. **Read the full documentation**  
   Visit our docs here → [AdeyPay Documentation](https://dev.adey.lol/docs)


## 📦 guide

| Prop          | Type                   | Required | Description                     |
| ------------- | ---------------------- | -------- | ------------------------------- |
| `amount`      | `number`               | ✅        | Payment amount (must be > 0)    |
| `apiKey`      | `string`               | ✅        | Your merchant API key           |
| `callbackUrl` | `string`               | ✅        | URL to redirect after payment   |
| `note`        | `string`               | ❌        | Optional payment note           |
| `children`    | `ReactNode`            | ❌        | Custom button content           |
| `className`   | `string`               | ❌        | Tailwind/other CSS classes      |
| `onCreated`   | `(id: string) => void` | ❌        | Called when payment is created  |
| `onApproved`  | `(id: string) => void` | ❌        | Called when payment is approved |
| `onError`     | `(err: Error) => void` | ❌        | Called when an error occurs     |
| `popupWidth`  | `number`               | ❌        | Default `900`                   |
| `popupHeight` | `number`               | ❌        | Default `700`                   |
