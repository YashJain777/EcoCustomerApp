# 📱 EcoSystemCustomer — Customer Mobile Application

Smart Sales, Service & Appliance Lifecycle Customer Mobile Application built with **React Native**, **TypeScript**, **Redux Toolkit**, **React Navigation**, and **NativeWind/Tailwind CSS**.

---

## 🏗️ Folder Architecture

```
EcoSystemCustomer/
├── App.tsx                     # App Root Component
├── index.js                    # React Native Entrypoint
├── package.json                # Project Dependencies & Scripts
├── tsconfig.json               # TypeScript Alias Config (@core, @features, @shared...)
├── babel.config.js             # Babel Module Resolver Config
├── src/
│   ├── app/                    # Initialization & App Providers
│   ├── assets/                 # Fonts, Icons & Images
│   ├── core/                   # Environment Config, Constants & Core Types
│   ├── infrastructure/         # Axios API Client & Storage wrappers
│   ├── navigation/             # Navigation Stacks (Auth, MainTab, Root)
│   ├── shared/                 # Atomic UI Primitives (Button, Input, Header, ScreenWrapper)
│   ├── store/                  # Redux Toolkit Slices & Hooks
│   ├── theme/                  # Color Tokens, Typography & Spacing
│   └── features/               # Modular Business Features:
│       ├── auth/               # OTP Request/Verify & Registration
│       ├── dashboard/          # Home Overview & Quick Action Cards
│       ├── products/           # Appliance List & QR Scanner
│       ├── bookings/           # Service Catalog, Shop Finder & Booking Flow
│       ├── complaints/         # Ticket Raising & Live Tracking
│       ├── amc/                # Maintenance Subscriptions Store
│       ├── profile/            # Profile & Service Address Management
│       ├── notifications/      # Notification Center
│       └── support/            # Help & Support Queries
```

---

## 🚀 Getting Started

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Run Android App:**
   ```bash
   npx react-native run-android
   ```

3. **Run iOS App:**
   ```bash
   npx react-native run-ios
   ```

4. **Type Check:**
   ```bash
   npm run typecheck
   ```

---

## 📖 Backend Integration Guide

Refer to [CUSTOMER_APP_API_DOCUMENTATION.md](../CUSTOMER_APP_API_DOCUMENTATION.md) for full HTTP endpoint specifications, request payloads, response envelopes, and screen mapping.
