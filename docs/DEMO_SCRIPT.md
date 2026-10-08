# Live Demo Script

**Estimated Time:** 5-7 Minutes
**Prerequisites before starting:**
1. Ensure MongoDB is running.
2. Run \`npm run seed:admin\` and \`npm run seed:data\` to ensure fresh data.
3. Keep both \`npm run dev\` instances (backend and frontend) running.
4. Open Chrome in Incognito mode.

---

## 1. Landing Page (0:00 - 1:00)
*Action:* Open \`http://localhost:5173\`
*Talk Track:* "Welcome to the Smart Energy Management System. This is our public landing page designed for conversion and information. It highlights our core pillars: Analytics, Predictions, and Anomalies. Let's log in as an administrator first to see how the system is managed."

## 2. Admin Flow (1:00 - 2:30)
*Action:* Click **Log in**. Enter \`admin@demo.com\` / \`demo123\`.
*Talk Track:* "As an admin, I bypass the standard dashboard and see system-wide metrics. I can see the total number of units, active users, and the aggregated system load."
*Action:* Navigate to **Users** in the sidebar.
*Talk Track:* "Here I can manage the tenant lifecycle. I can instantly deactivate a user's access." (Show the toggle button briefly but don't deactivate the demo user).
*Action:* Navigate to **Units**.
*Talk Track:* "I also have complete oversight over the physical infrastructure and can decommission units. Now, let's see what a standard user experiences."
*Action:* Click **Logout**.

## 3. User Dashboard (2:30 - 4:00)
*Action:* Log in as \`user@demo.com\` / \`demo123\`.
*Talk Track:* "This is the core tenant dashboard. Notice the UI is completely different. The user immediately sees their consumption for today and the month, alongside an estimated bill based on the tariff."
*Action:* Point to the **Monthly Limit Gauge**.
*Talk Track:* "We enforce accountability. This gauge tracks their usage against their predefined monthly limit. The system automatically issues warnings at 80% and 100%."
*Action:* Scroll down to the **7-Day Forecast** and **Insight Card**.
*Talk Track:* "Instead of just showing historical data, the system is proactive. The forecast chart uses statistical averaging to predict next week's usage, and the Insight card flags actionable recommendations."

## 4. History & Anomalies (4:00 - 5:00)
*Action:* Navigate to **History** in the sidebar.
*Talk Track:* "For granular audits, users can view their raw hourly readings. What's unique here is the Anomaly Detection."
*Action:* Check the **Anomalies Only** checkbox.
*Talk Track:* "By checking this, we filter out normal usage. These records were mathematically flagged by our Z-Score algorithm because they deviated significantly from standard hourly averages—perhaps equipment was left running."

## 5. Security Proof (5:00 - 5:30)
*Action:* Try to manually change the URL to \`/admin/dashboard\`.
*Talk Track:* "Security is baked into the routing. If a standard user attempts to access an admin-only route, the frontend router and backend JWT verification block the request, automatically redirecting them safely back to their allowed scope."

## 6. Conclusion (5:30 - 6:00)
*Action:* Click Logout.
*Talk Track:* "That concludes the demo. The system successfully moves energy monitoring from reactive billing to proactive, intelligent management."
