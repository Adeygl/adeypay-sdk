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

1️⃣ Plain JavaScript / TypeScript

import { createPayment } from "adeypay-sdk";

createPayment({
  amount: 10,
  currency: "USD",
  orderId: "ORDER_123",
  callbackUrl: "https://yourwebsite.com/callback",
  merchantKey: "YOUR_MERCHANT_KEY"
});


2️⃣ React Example
import { PayButton } from "adeypay-sdk";

export default function App() {
  return (
    <div>
      <h1>Checkout</h1>
      <PayButton
        amount={10}
        currency="USD"
        orderId="ORDER_123"
        callbackUrl="https://yourwebsite.com/callback"
        merchantKey="YOUR_MERCHANT_KEY"
      >
        Pay $10
      </PayButton>
    </div>
  );
}

