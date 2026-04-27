import { Link } from "wouter";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail, Phone, MapPin, ShieldCheck, Target, Eye, Heart } from "lucide-react";

export default function About() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/"><Logo size={22} /></Link>
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2"><ArrowLeft className="w-4 h-4" /> Back</Button>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-16 space-y-16">
        <section className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">About Quikkk</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            India's smartest credit marketplace, built and operated by{" "}
            <strong className="text-foreground">Mekyek Global Services Pvt Ltd</strong>.
          </p>
        </section>

        <section className="prose max-w-none">
          <p className="text-base leading-relaxed text-foreground/80">
            Quikkk is a digital credit aggregator that helps Indian consumers and small businesses discover, compare and
            secure the best loan and credit-card offers from a network of regulated lending partners. Built in India for
            India, we make borrowing transparent, fast, and fair — putting the customer firmly in control.
          </p>
          <p className="text-base leading-relaxed text-foreground/80 mt-4">
            "Quikkk" is a registered trademark of Mekyek Global Services Pvt Ltd. Our platform is purely an aggregator and
            does not lend, accept deposits, or guarantee approval. All credit decisions rest exclusively with our
            regulated lending partners.
          </p>
        </section>

        <section className="grid md:grid-cols-3 gap-6">
          {[
            { icon: Target, title: "Our mission", desc: "Make credit access in India simple, transparent and 100% digital — no agents, no paperwork, no surprises." },
            { icon: Eye, title: "Our vision", desc: "Become the most trusted credit comparison destination for every Indian household and small business." },
            { icon: Heart, title: "Our values", desc: "Customer-first decisions, radical transparency on fees and rates, and zero tolerance for predatory lending." },
          ].map((v) => (
            <div key={v.title} className="bg-card border rounded-2xl p-6">
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <v.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-bold text-lg mb-2">{v.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </section>

        <section className="bg-card border rounded-3xl p-8 md:p-10">
          <div className="flex items-center gap-3 mb-6">
            <ShieldCheck className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold">Corporate information</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6 text-sm">
            <div>
              <div className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Registered name</div>
              <div className="font-semibold">Mekyek Global Services Pvt Ltd</div>
            </div>
            <div>
              <div className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Brand</div>
              <div className="font-semibold">Quikkk™ (registered trademark)</div>
            </div>
            <div>
              <div className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Nature of business</div>
              <div className="font-semibold">Digital loan & credit card aggregator (DLA)</div>
            </div>
            <div>
              <div className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Regulatory framework</div>
              <div className="font-semibold">Operates with RBI-regulated lending partners</div>
            </div>
          </div>
        </section>

        <section className="bg-gradient-to-br from-black via-zinc-900 to-red-700 rounded-3xl p-10 text-white">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">Get in touch</h2>
          <div className="grid md:grid-cols-3 gap-6 text-sm">
            <a href="mailto:info@quikkk.com" className="flex items-start gap-3 hover:opacity-90">
              <Mail className="w-5 h-5 mt-0.5 shrink-0 text-red-400" />
              <div>
                <div className="text-white/60 text-xs uppercase tracking-wider mb-1">Email</div>
                <div className="font-semibold">info@quikkk.com</div>
              </div>
            </a>
            <a href="tel:+918335974309" className="flex items-start gap-3 hover:opacity-90">
              <Phone className="w-5 h-5 mt-0.5 shrink-0 text-red-400" />
              <div>
                <div className="text-white/60 text-xs uppercase tracking-wider mb-1">Phone</div>
                <div className="font-semibold">+91 83359 74309</div>
              </div>
            </a>
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 mt-0.5 shrink-0 text-red-400" />
              <div>
                <div className="text-white/60 text-xs uppercase tracking-wider mb-1">Office</div>
                <div className="font-semibold">India</div>
              </div>
            </div>
          </div>
        </section>

        <section className="text-center">
          <Link href="/login">
            <Button size="lg" className="h-12 px-8">Check your offers now</Button>
          </Link>
        </section>
      </main>

      <footer className="border-t bg-card mt-10">
        <div className="max-w-5xl mx-auto px-6 py-6 text-xs text-muted-foreground text-center">
          © {new Date().getFullYear()} Mekyek Global Services Pvt Ltd. All rights reserved. "Quikkk" is a registered trademark.
        </div>
      </footer>
    </div>
  );
}
