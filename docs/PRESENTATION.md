# Final Presentation Outline

**Duration:** ~10 Minutes

## Slide 1: Title Slide
- **Project Title:** Smart Energy Management System
- **Your Name / Roll No.**
- **Project Guide:** [Name]

## Slide 2: Problem Statement
- **The Issue:** Buildings waste massive amounts of energy due to a lack of visibility. Traditional billing is monthly, giving owners no way to course-correct mid-month.
- **The Gap:** Existing solutions are either enterprise-only (expensive) or just dumb hardware meters with no analytics.
- **The Goal:** Build an accessible, software-first platform that provides real-time visibility, anomaly alerts, and actionable intelligence.

## Slide 3: Proposed Solution
- A centralized dashboard for owners to track units.
- Real-time ingestion simulating IoT hardware.
- Statistical forecasting (predicting the bill before it arrives).
- Automated anomaly detection (e.g., equipment left on overnight).

## Slide 4: System Architecture
- **Frontend:** React, Tailwind (SPA).
- **Backend:** Node.js, Express (REST API).
- **Database:** MongoDB (Document / Time-Series structure).
- **Security:** JWT Auth, Zod Validation, Role-Based Access Control (RBAC).

## Slide 5: Key Features (The "Wow" Factor)
- **Role Isolation:** Admins manage infrastructure; Users monitor their limits.
- **Z-Score Anomalies:** The system learns normal patterns per hour/day and flags deviations statistically.
- **Forecasting:** Evaluates the last 30 days to predict the next 7 days' consumption precisely.
- **Responsive Design:** Fully fluid UI that works identically on mobile and desktop.

## Slide 6: Database Schema (Visual)
- Briefly show how \`Users\` -> \`Units\` -> \`EnergyRecords\` are linked.
- Highlight the compound index \`{ unitId: 1, timestamp: -1 }\` used for fast time-range analytics.

## Slide 7: Challenges & Solutions
- **Challenge:** Simulating real-world data realistically.
- **Solution:** Wrote a Mulberry32-based deterministic generator that simulates peak hours, baseline loads, and injects anomalies to test the intelligence engine.
- **Challenge:** Dashboard loading speed with thousands of records.
- **Solution:** Handled computation directly inside MongoDB using the Aggregation Pipeline (\`$match\`, \`$group\`) rather than pulling all data into Node.js.

## Slide 8: Future Enhancements
- Hardware Integration (ESP32 via MQTT).
- ML-based predictions (replacing statistical models with TensorFlow.js).
- Automated appliance control (turning off ACs remotely via webhooks).

## Slide 9: Demo Transition
- "I will now demonstrate the live application, covering both the Administrator's view and a User's daily workflow."
