import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Privacy Policy page
 * This is a student-project placeholder. Review all flagged clauses with a legal professional
 * before using this in a real commercial deployment.
 *
 * GUESSES (flagged for legal review):
 * 1. Data retention period — assumed 12 months; adjust to business reality.
 * 2. Third-party processors — only MongoDB Atlas mentioned; add any CDN/email providers.
 * 3. Jurisdiction — assumed India; update if deployed elsewhere.
 * 4. Data transfers — assumed data stays in India; update if cloud region differs.
 */
export function Privacy() {
  return (
    <div className="min-h-screen bg-background py-16 px-6">
      <div className="max-w-2xl mx-auto prose prose-sm">
        <Link to="/" className="text-accent text-sm hover:underline">← Back to Home</Link>

        <h1 className="text-2xl font-semibold text-primary mt-6 mb-2">Privacy Policy</h1>
        <p className="text-xs text-muted mb-8">Last updated: October 2026 · This is a student-project demonstration.</p>

        <section className="space-y-4 text-sm text-primary leading-relaxed">
          <div>
            <h2 className="font-semibold text-base mb-1">1. What we collect</h2>
            <p>We collect your name, email address, and energy consumption readings submitted by the IoT devices registered to your account. We do not collect payment information.</p>
          </div>

          <div>
            <h2 className="font-semibold text-base mb-1">2. How we use it</h2>
            <p>Your data is used solely to display your energy dashboard, generate analytics, and send automated alerts (e.g. when usage exceeds your monthly limit). We do not sell or share your data with third parties for marketing.</p>
          </div>

          <div>
            <h2 className="font-semibold text-base mb-1">3. Storage & security</h2>
            <p>Data is stored in a MongoDB database. Passwords are hashed with bcrypt (cost factor 12) and are never stored in plain text. API access requires a signed JSON Web Token that expires after one hour.</p>
            <p className="text-muted text-xs mt-1">⚠️ LEGAL REVIEW NEEDED: Confirm cloud region and processor agreements (Data Processing Agreements) if deploying commercially.</p>
          </div>

          <div>
            <h2 className="font-semibold text-base mb-1">4. Data retention</h2>
            <p>Energy readings are retained for 12 months from the date of recording. Account data is retained for as long as your account is active. You may request deletion at any time by contacting us.</p>
            <p className="text-muted text-xs mt-1">⚠️ LEGAL REVIEW NEEDED: Adjust retention period to match your operational and regulatory requirements.</p>
          </div>

          <div>
            <h2 className="font-semibold text-base mb-1">5. Your rights</h2>
            <p>Under applicable Indian data protection law, you have the right to access, correct, or delete your personal data. To exercise these rights, email us at the address below.</p>
            <p className="text-muted text-xs mt-1">⚠️ LEGAL REVIEW NEEDED: Verify applicability of DPDP Act 2023 and any sector-specific rules for your deployment.</p>
          </div>

          <div>
            <h2 className="font-semibold text-base mb-1">6. Cookies</h2>
            <p>This application does not use third-party analytics cookies. A session token is stored in <code>localStorage</code> solely to keep you logged in. It contains no advertising identifiers.</p>
          </div>

          <div>
            <h2 className="font-semibold text-base mb-1">7. Contact</h2>
            <p>For privacy questions or data requests: <a href="mailto:support@sems.demo" className="text-accent hover:underline">support@sems.demo</a></p>
          </div>
        </section>
      </div>
    </div>
  );
}
