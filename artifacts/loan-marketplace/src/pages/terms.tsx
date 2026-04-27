import { Link } from "wouter";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail, Phone } from "lucide-react";

export default function Terms() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/"><Logo size={22} /></Link>
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2"><ArrowLeft className="w-4 h-4" /> Back</Button>
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12 space-y-10">
        <header>
          <h1 className="text-4xl font-bold tracking-tight">Terms & Conditions</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Effective from {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}.
          </p>
        </header>

        <Section title="1. About these Terms">
          <p>
            These Terms & Conditions ("Terms") govern your use of the Quikkk website, mobile app and related services
            (collectively, the "Platform") operated by{" "}
            <strong>Mekyek Global Services Pvt Ltd</strong> ("Company", "we", "us", "our"). By accessing or using the
            Platform, you agree to be bound by these Terms. If you do not agree, please do not use the Platform.
          </p>
        </Section>

        <Section title="2. About Quikkk">
          <p>
            "Quikkk" is a registered trademark of Mekyek Global Services Pvt Ltd. The Platform is a digital aggregator
            that allows users to discover, compare and apply for loan and credit-card products offered by our regulated
            lending partners. We are <strong>not</strong> a lender, deposit-taking entity or NBFC, and do not guarantee
            approval, sanction, disbursement, terms, or pricing of any credit product.
          </p>
        </Section>

        <Section title="3. Eligibility">
          <p>
            You must be at least 18 years of age, an Indian resident, and competent to enter into a binding contract
            under the Indian Contract Act, 1872. By using the Platform you represent that you meet these criteria.
          </p>
        </Section>

        <Section title="4. KYC & data sharing">
          <p>
            To match you with relevant offers, you authorise us to collect and process your personal information
            (including identity, contact, demographic, employment, and financial details) and to share it with selected
            lending partners that you choose to apply to. All data is transmitted over secure, encrypted channels.
          </p>
        </Section>

        <Section title="5. Credit information & soft pull">
          <p>
            With your explicit consent, we may obtain your credit information from RBI-licensed credit bureaus to assess
            offer eligibility. Standard checks performed for offer-matching are "soft pulls" and do not impact your
            credit score. A "hard pull" is performed only when you formally apply to a specific lender.
          </p>
        </Section>

        <Section title="6. Lending decisions">
          <p>
            All decisions to sanction, reject, price, structure or disburse any loan or credit card lie solely with the
            respective regulated lending partner. The Company does not influence, override, or warrant any such
            decision.
          </p>
        </Section>

        <Section title="7. Fees & charges">
          <p>
            Use of the Quikkk Platform by consumers is free. We are compensated by partner lenders on successful
            originations. Any fees associated with a loan or credit card (such as processing fees, GST, interest,
            penalties, prepayment charges) are levied by the respective lending partner as per their agreement with
            you.
          </p>
        </Section>

        <Section title="8. Acceptable use">
          <p>
            You agree not to (a) submit false information, (b) misuse the Platform for fraud, money laundering, or any
            unlawful purpose, (c) attempt to reverse-engineer or disrupt the Platform, or (d) infringe the intellectual
            property of the Company or any third party.
          </p>
        </Section>

        <Section title="9. Intellectual property & trademark">
          <p>
            The "Quikkk" name, logo, lightning mark and associated branding are registered trademarks of Mekyek Global
            Services Pvt Ltd. All content, software, graphics, and design on the Platform are the exclusive property of
            the Company or its licensors. Unauthorised use is strictly prohibited.
          </p>
        </Section>

        <Section title="10. Limitation of liability">
          <p>
            To the maximum extent permitted by law, the Company shall not be liable for any indirect, incidental,
            special, consequential or punitive damages arising out of or in connection with your use of the Platform or
            with any product offered by a lending partner. The Platform is provided on an "as-is" and "as-available"
            basis.
          </p>
        </Section>

        <Section title="11. Grievance redressal">
          <p>
            For any complaint or grievance regarding the Platform, please write to{" "}
            <a href="mailto:info@quikkk.com" className="text-primary font-medium hover:underline">info@quikkk.com</a>{" "}
            or call{" "}
            <a href="tel:+918335974309" className="text-primary font-medium hover:underline">+91 83359 74309</a>.
            Complaints regarding a specific loan, credit card or application must be addressed to the concerned lending
            partner directly, in line with their grievance redressal policy.
          </p>
        </Section>

        <Section title="12. Governing law & jurisdiction">
          <p>
            These Terms are governed by the laws of India. All disputes shall be subject to the exclusive jurisdiction
            of the competent courts of India.
          </p>
        </Section>

        <Section title="13. Changes to Terms">
          <p>
            We may update these Terms from time to time. The latest version will always be posted on the Platform with
            the effective date. Continued use of the Platform after such changes constitutes acceptance of the revised
            Terms.
          </p>
        </Section>

        <Section title="14. Contact">
          <div className="bg-card border rounded-2xl p-6 not-prose">
            <div className="font-bold mb-1">Mekyek Global Services Pvt Ltd</div>
            <div className="text-sm text-muted-foreground mb-4">Operator of the Quikkk™ platform</div>
            <div className="space-y-2 text-sm">
              <a href="mailto:info@quikkk.com" className="flex items-center gap-2 hover:text-primary">
                <Mail className="w-4 h-4 text-red-600" /> info@quikkk.com
              </a>
              <a href="tel:+918335974309" className="flex items-center gap-2 hover:text-primary">
                <Phone className="w-4 h-4 text-red-600" /> +91 83359 74309
              </a>
            </div>
          </div>
        </Section>
      </main>

      <footer className="border-t bg-card mt-10">
        <div className="max-w-4xl mx-auto px-6 py-6 text-xs text-muted-foreground text-center">
          © {new Date().getFullYear()} Mekyek Global Services Pvt Ltd. All rights reserved. "Quikkk" is a registered trademark.
        </div>
      </footer>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl md:text-2xl font-bold tracking-tight">{title}</h2>
      <div className="text-base text-foreground/80 leading-relaxed">{children}</div>
    </section>
  );
}
