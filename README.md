# FinLens: Intelligent UPI Spend Visualization & Pre-Purchase Co-Pilot

> **Live Web Application:** [https://garage-physical-walking-constraint.trycloudflare.com](https://garage-physical-walking-constraint.trycloudflare.com)  
> **PDF Documentation:** [`FinLens_Product_Documentation.pdf`](./FinLens_Product_Documentation.pdf)  
> **PRD Specification:** [`PROJECT_DOCUMENTATION.md`](./PROJECT_DOCUMENTATION.md)

---

## 🌐 Live Submission Link
If you are evaluating this project from a submission portal or review board, access the live cloud deployment here:  
👉 **[https://garage-physical-walking-constraint.trycloudflare.com](https://garage-physical-walking-constraint.trycloudflare.com)**  
*(Works on any smartphone, tablet, or desktop computer worldwide over 4G/5G or Wi-Fi without requiring logins or installs).*

---

## 🎯 What is FinLens?
Traditional budgeting applications suffer from the **"Post-Mortem Trap"**: they alert users at the end of the month that they overspent, long after the money is gone. In the era of frictionless UPI micro-payments, invisible spending accumulates rapidly.

**FinLens solves this through a dual-engine architecture:**
1. **Retrospective Rhythm & Spatial Analysis:** Visualizes *when* and *where* money leaks happen via a 24-hour &times; 7-day circadian heatmap and street-level Google Maps clustering.
2. **Point-of-Sale Pre-Purchase Intervention:** Intercepts impulse spending *before* you pay with a live Camera & UPI QR scanner that calculates remaining budget headroom in real-time.

---

## 📊 Ground Truth Dataset
FinLens is trained and calibrated against an authentic **81-page Google Pay UPI statement** spanning April 1 to September 30, 2026:
- **720 Verified Transactions** (612 Outflows + 108 Inflows)
- **₹3,42,250.98 Total Outflow** | **₹3,16,415.00 Total Inflow**
- **Geographic distribution:** Pune Living (84%) vs. Delhi NCR Travel (13%)
- **Top Merchants:** Blinkit, Swiggy, Zomato, Starbucks, Decathlon, Flipkart, Zepto, Uber

---

## 🔍 Core Features

### 1. Temporal Spend Heatmap ("Money Weather")
- **24-Hour &times; 7-Day Matrix:** Maps recurring daily and hourly spending patterns.
- **Rhythm Recognition:** Automatically pinpoints costliest recurring windows (e.g. *Friday 8–10 pm is your costliest slot, 3.1&times; typical*).
- **Week Rhythm vs. Calendar Grid:** Switch between aggregate behavioral patterns and chronological daily logs.
- **Category Chips & Filter Drawer:** Instant filtering across *Food Delivery, Groceries, Dining, Shopping, Travel, Bills*.

### 2. Geographic Spend Map (Google Maps API)
- Real Google Maps cartography displaying proportional spend density circles.
- Macro/Micro quick switchers for **All India**, **Pune Metropolitan**, and **Delhi NCR**.
- Interactive area inspector displaying total spend, visit frequency, and top 4 merchants in that locality.

### 3. Pre-Purchase Lens & UPI QR Scanner
- **Live Device Camera Feed:** Auto-scans UPI QR codes via `BarcodeDetector`.
- **Receipt & Bill Uploader:** Upload photos or screenshots of invoices.
- **1-Tap Ledger Presets:** Real test standees (*Third Wave Coffee ₹380, Blinkit ₹849, Decathlon ₹2,199, Uber ₹340, Swiggy ₹620*).
- **Instant Affordability Verdict:** 🟢 Safe to Spend | 🟡 Caution | 🔴 Budget Alert.
- **Dynamic Budget Barometer:** Visualizes current category spend + impact slice.
- **Direct UPI Deep-Link:** 1-click button to trigger Google Pay / PhonePe natively on mobile.

### 4. Grounded AI Money Coach
- **Zero Hallucinations:** Deterministic aggregation queries over 720 authentic transactions.
- **Pre-Configured Scenarios:** Vacation affordability (Manali in March), Swiggy/Zepto reduction impact, weekend leaks.
- **Speech Recognition:** Voice-driven queries with real-time audio animation.

### 5. Enterprise-Grade Privacy & Security
- **Salted PBKDF2 Encryption (10,000 iterations)** for user credentials.
- **Per-User File Isolation:** Private ledger storage per user.
- **Zero AI Model Training Guarantee:** Financial data is never transmitted to external LLM providers.
- **1-Click Permanent Account Deletion.**

---

## ⚡ Running Locally

```bash
# 1. Install dependencies
npm install

# 2. Start the server
node server.js
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 📄 Documentation
Comprehensive Product Requirements Document and Technical Specifications:
- **PDF format:** [`FinLens_Product_Documentation.pdf`](./FinLens_Product_Documentation.pdf)
- **Markdown format:** [`PROJECT_DOCUMENTATION.md`](./PROJECT_DOCUMENTATION.md)
