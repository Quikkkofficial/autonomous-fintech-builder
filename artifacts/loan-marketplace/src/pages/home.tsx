import { Link, useLocation } from "wouter";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Logo, LogoMark } from "@/components/logo";
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  Percent,
  Star,
  CheckCircle2,
  Smartphone,
  TrendingUp,
  Lock,
  Award,
  Users,
  Clock,
  CreditCard,
  Home as HomeIcon,
  Car,
  Briefcase,
  GraduationCap,
  Landmark,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/lib/auth";

export default function Home() {
  const [, setLocation] = useLocation();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && user) setLocation("/dashboard");
  }, [user, isLoading, setLocation]);

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <Nav />
      <Hero />
      <SocialProof />
      <ProductGrid />
      <Stats />
      <HowItWorks />
      <RateComparison />
      <Testimonials />
      <Trust />
      <CTA />
      <Footer />
    </div>
  );
}

function Nav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <header
      className={`sticky top-0 z-40 transition-all ${
        scrolled ? "bg-card/90 backdrop-blur-lg border-b shadow-sm" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Logo size={34} />
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
          <a href="#products" className="hover:text-foreground transition-colors">Products</a>
          <a href="#how" className="hover:text-foreground transition-colors">How it works</a>
          <a href="#rates" className="hover:text-foreground transition-colors">Rates</a>
          <a href="#trust" className="hover:text-foreground transition-colors">Trust & safety</a>
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/login">
            <Button variant="ghost" className="hidden sm:inline-flex">Sign in</Button>
          </Link>
          <Link href="/login">
            <Button className="gap-1.5">Get started <ArrowRight className="w-4 h-4" /></Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative pt-16 pb-24 px-6">
      {/* Decorative blobs */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-[28rem] h-[28rem] rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute top-40 -right-32 w-[32rem] h-[32rem] rounded-full bg-accent/10 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-7">
          <Badge variant="outline" className="gap-1.5 px-3 py-1.5 bg-card/60 backdrop-blur-sm border-primary/20">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span className="text-xs">India's fastest credit marketplace</span>
          </Badge>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05]">
            Money,{" "}
            <span className="relative inline-block">
              <span className="relative z-10 bg-gradient-to-br from-red-600 to-black bg-clip-text text-transparent">
                quikkk-ly
              </span>
              <svg
                className="absolute -bottom-2 left-0 w-full"
                height="12"
                viewBox="0 0 200 12"
                preserveAspectRatio="none"
              >
                <path
                  d="M2 8 Q 50 2 100 6 T 198 4"
                  fill="none"
                  stroke="hsl(var(--accent))"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <br />
            in your account.
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-xl leading-relaxed">
            Compare loans and credit cards from <strong className="text-foreground">12+ banks & NBFCs</strong> in
            seconds. Get pre-approved offers, lock the best rate, and disburse — all from your phone.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link href="/login">
              <Button size="lg" className="gap-2 text-base h-14 px-7 w-full sm:w-auto shadow-lg shadow-primary/20">
                Check your offers <ArrowRight className="w-4.5 h-4.5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button
                size="lg"
                variant="outline"
                className="gap-2 text-base h-14 px-7 w-full sm:w-auto bg-card/60 backdrop-blur-sm"
              >
                <Smartphone className="w-4.5 h-4.5" /> Sign in with OTP
              </Button>
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-6 pt-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-2"><Lock className="w-4 h-4 text-red-600" /> 256-bit encrypted</span>
            <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-red-600" /> Soft credit pull</span>
            <span className="flex items-center gap-2"><Zap className="w-4 h-4 text-red-600" /> 60-second match</span>
          </div>
        </div>

        <HeroVisual />
      </div>
    </section>
  );
}

function HeroVisual() {
  return (
    <div className="relative h-[480px] md:h-[540px]">
      {/* Phone */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-[280px] h-[480px] bg-gradient-to-br from-slate-900 to-slate-800 rounded-[44px] p-3 shadow-2xl shadow-primary/30 rotate-2">
          <div className="w-full h-full bg-card rounded-[34px] overflow-hidden flex flex-col">
            <div className="p-5 border-b">
              <Logo size={26} />
            </div>
            <div className="p-5 space-y-3 flex-1">
              <div className="text-xs text-muted-foreground">Top match for you</div>
              <div className="rounded-2xl p-4 border-2 border-primary/30 bg-primary/5 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-bold text-sm">HDFC Bank</div>
                    <div className="text-[10px] text-muted-foreground">Personal loan</div>
                  </div>
                  <Badge className="bg-red-50 text-red-700 border-red-200 text-[9px] px-1.5">
                    Pre-approved
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div>
                    <div className="text-[10px] text-muted-foreground">Rate</div>
                    <div className="font-bold text-primary">10.49%</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground">EMI</div>
                    <div className="font-bold">₹9,633</div>
                  </div>
                </div>
              </div>

              {[
                { name: "ICICI", rate: "11.25%", emi: "₹9,792" },
                { name: "Axis", rate: "11.99%", emi: "₹9,962" },
                { name: "Bajaj", rate: "12.50%", emi: "₹10,079" },
              ].map((l) => (
                <div key={l.name} className="rounded-xl p-3 border bg-card flex justify-between items-center">
                  <div>
                    <div className="font-medium text-xs">{l.name}</div>
                    <div className="text-[10px] text-muted-foreground">{l.rate} p.a.</div>
                  </div>
                  <div className="text-xs font-semibold">{l.emi}</div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t">
              <div className="bg-primary text-primary-foreground rounded-xl text-center py-3 text-xs font-semibold">
                Apply now
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating cards */}
      <div className="absolute top-6 -left-2 md:left-4 bg-card border rounded-2xl p-4 shadow-xl flex items-center gap-3 -rotate-6 max-w-[200px]">
        <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-5 h-5 text-red-600" />
        </div>
        <div>
          <div className="text-xs font-semibold">Approved!</div>
          <div className="text-[10px] text-muted-foreground">₹3,00,000 disbursed</div>
        </div>
      </div>

      <div className="absolute bottom-12 -right-2 md:right-4 bg-card border rounded-2xl p-4 shadow-xl rotate-6 max-w-[200px]">
        <div className="flex items-center gap-2 mb-1.5">
          <TrendingUp className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold">CIBIL: 782</span>
          <Badge className="bg-red-50 text-red-700 border-0 text-[9px] px-1.5">Excellent</Badge>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div className="h-full w-[88%] bg-gradient-to-r from-amber-400 to-red-500 rounded-full" />
        </div>
        <div className="text-[10px] text-muted-foreground mt-1.5">Free monthly updates</div>
      </div>

      <div className="absolute top-1/2 -translate-y-1/2 -right-4 md:right-12 bg-gradient-to-br from-black to-red-600 text-white rounded-2xl p-3 shadow-xl rotate-3">
        <Zap className="w-5 h-5 mb-1" />
        <div className="text-[10px] font-semibold leading-tight">
          60-sec
          <br />
          match
        </div>
      </div>
    </div>
  );
}

function SocialProof() {
  const partners = ["HDFC Bank", "ICICI", "Axis Bank", "SBI", "Kotak", "Bajaj Finserv", "Tata Capital", "IndusInd"];
  return (
    <section className="py-12 border-y bg-muted/30">
      <div className="max-w-7xl mx-auto px-6">
        <p className="text-center text-xs uppercase tracking-widest text-muted-foreground mb-6 font-semibold">
          Trusted by 4.5L+ Indians • RBI-regulated partners
        </p>
        <div className="flex flex-wrap justify-center items-center gap-x-10 gap-y-4">
          {partners.map((p) => (
            <span key={p} className="text-lg md:text-xl font-bold text-muted-foreground/50 hover:text-foreground transition-colors">
              {p}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductGrid() {
  const products = [
    { icon: Landmark, name: "Personal Loan", desc: "₹25K – ₹40L", rate: "from 10.49% p.a.", color: "from-white to-red-50", iconBg: "bg-red-600 text-white" },
    { icon: HomeIcon, name: "Home Loan", desc: "₹5L – ₹5Cr", rate: "from 8.40% p.a.", color: "from-white to-zinc-50", iconBg: "bg-black text-white" },
    { icon: Car, name: "Auto Loan", desc: "₹1L – ₹50L", rate: "from 9.25% p.a.", color: "from-white to-red-50", iconBg: "bg-red-600 text-white" },
    { icon: Briefcase, name: "Business Loan", desc: "₹1L – ₹2Cr", rate: "from 14.50% p.a.", color: "from-white to-zinc-50", iconBg: "bg-black text-white" },
    { icon: GraduationCap, name: "Education Loan", desc: "₹50K – ₹1Cr", rate: "from 9.95% p.a.", color: "from-white to-red-50", iconBg: "bg-red-600 text-white" },
    { icon: CreditCard, name: "Credit Cards", desc: "8+ premium cards", rate: "Lifetime free options", color: "from-white to-zinc-50", iconBg: "bg-black text-white" },
  ];
  return (
    <section id="products" className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <Badge variant="outline" className="mb-4 bg-primary/5 border-primary/20 text-primary">
            One platform, every need
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Pick your product</h2>
          <p className="text-lg text-muted-foreground">
            Every category. Every leading lender. One application.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {products.map((p) => (
            <Link key={p.name} href="/login">
              <div
                className={`group cursor-pointer rounded-3xl p-6 border bg-gradient-to-br ${p.color} hover:shadow-xl hover:-translate-y-1 transition-all duration-300`}
              >
                <div className={`w-14 h-14 rounded-2xl ${p.iconBg} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                  <p.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold mb-1">{p.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{p.desc}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-foreground">{p.rate}</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 group-hover:text-primary transition-all" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function Stats() {
  const stats = [
    { value: "₹2,400Cr+", label: "Disbursed" },
    { value: "4.5L+", label: "Happy customers" },
    { value: "12+", label: "Partner lenders" },
    { value: "60s", label: "Avg. match time" },
  ];
  return (
    <section className="py-16 px-6">
      <div className="max-w-6xl mx-auto bg-gradient-to-br from-black via-zinc-900 to-red-700 rounded-3xl p-10 md:p-14 text-white relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-72 h-72 rounded-full bg-accent/10 blur-3xl" />
        <div className="relative grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <div className="text-4xl md:text-5xl font-bold tracking-tight mb-1.5">{s.value}</div>
              <div className="text-sm text-white/70 uppercase tracking-wider">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { num: "01", icon: Smartphone, title: "Sign up in seconds", desc: "Just your phone number and a 6-digit OTP. No paperwork." },
    { num: "02", icon: ShieldCheck, title: "One-time KYC", desc: "Aadhaar + PAN verified instantly. Your data stays encrypted." },
    { num: "03", icon: Sparkles, title: "Get matched", desc: "Our engine ranks 12+ lenders by your profile and approval odds." },
    { num: "04", icon: Zap, title: "Apply & disburse", desc: "Pick the best offer and money lands in your account in 24-48 hours." },
  ];
  return (
    <section id="how" className="py-24 px-6 bg-muted/40">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <Badge variant="outline" className="mb-4 bg-card border-primary/20 text-primary">
            How it works
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">From zero to loan in 4 steps</h2>
          <p className="text-lg text-muted-foreground">No agents. No bank visits. No paperwork chases.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((s, i) => (
            <div key={s.num} className="relative">
              <div className="bg-card rounded-2xl p-6 border h-full hover:border-primary/40 transition-colors">
                <div className="text-5xl font-bold text-primary/15 mb-2">{s.num}</div>
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <s.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
              {i < steps.length - 1 && (
                <ChevronRight className="hidden lg:block absolute top-1/2 -right-3 w-6 h-6 text-primary/40" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function RateComparison() {
  const rates = [
    { name: "HDFC Bank", logo: "H", rate: "10.49%", emi: "9,633", color: "bg-rose-500" },
    { name: "ICICI Bank", logo: "I", rate: "11.25%", emi: "9,792", color: "bg-orange-500" },
    { name: "Axis Bank", logo: "A", rate: "11.99%", emi: "9,962", color: "bg-purple-500" },
    { name: "SBI", logo: "S", rate: "10.85%", emi: "9,712", color: "bg-blue-600" },
    { name: "Kotak Mahindra", logo: "K", rate: "11.50%", emi: "9,847", color: "bg-rose-600" },
    { name: "Bajaj Finserv", logo: "B", rate: "12.50%", emi: "10,079", color: "bg-blue-700" },
  ];
  return (
    <section id="rates" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <Badge variant="outline" className="mb-4 bg-accent/10 border-accent/20 text-accent">
            Live rates
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Compare rates side-by-side
          </h2>
          <p className="text-lg text-muted-foreground">Indicative offers for ₹3 Lakh personal loan over 36 months.</p>
        </div>
        <div className="bg-card rounded-3xl border shadow-sm overflow-hidden">
          <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-muted/50 border-b text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <div className="col-span-5">Lender</div>
            <div className="col-span-3">Interest rate</div>
            <div className="col-span-2">EMI</div>
            <div className="col-span-2 text-right">Action</div>
          </div>
          {rates.map((r, i) => (
            <div
              key={r.name}
              className={`grid grid-cols-12 gap-4 px-6 py-5 items-center hover:bg-muted/30 transition-colors ${
                i < rates.length - 1 ? "border-b" : ""
              }`}
            >
              <div className="col-span-5 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${r.color} text-white font-bold flex items-center justify-center text-lg`}>
                  {r.logo}
                </div>
                <div>
                  <div className="font-semibold">{r.name}</div>
                  {i === 0 && <Badge className="mt-0.5 bg-red-50 text-red-700 border-red-200 text-[10px]">Best rate</Badge>}
                </div>
              </div>
              <div className="col-span-3">
                <div className="text-xl font-bold text-primary">{r.rate}</div>
                <div className="text-xs text-muted-foreground">per annum</div>
              </div>
              <div className="col-span-2">
                <div className="font-semibold">₹{r.emi}</div>
                <div className="text-xs text-muted-foreground">monthly</div>
              </div>
              <div className="col-span-2 text-right">
                <Link href="/login">
                  <Button size="sm" variant="outline">Apply</Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  const reviews = [
    {
      name: "Priya Sharma",
      role: "Software Engineer, Bengaluru",
      rating: 5,
      text: "Got ₹5L personal loan in 36 hours. Quikkk found me a 10.5% rate when my bank was offering 13%. Saved over ₹40K in interest.",
    },
    {
      name: "Arjun Mehta",
      role: "Small business owner, Mumbai",
      rating: 5,
      text: "The lender comparison is a game-changer. I could see all my options on one screen with EMIs and processing fees clearly listed.",
    },
    {
      name: "Sneha Reddy",
      role: "Doctor, Hyderabad",
      rating: 5,
      text: "I love that I can check my CIBIL score for free and track all my applications in one place. Genuine product.",
    },
  ];
  return (
    <section className="py-24 px-6 bg-muted/40">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="flex items-center justify-center gap-1 mb-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
            ))}
            <span className="ml-2 font-semibold text-sm">4.7 / 5 from 12,400 reviews</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Customers love Quikkk</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {reviews.map((r) => (
            <div key={r.name} className="bg-card rounded-2xl p-7 border shadow-sm">
              <div className="flex gap-1 mb-4">
                {Array.from({ length: r.rating }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-foreground/90 leading-relaxed mb-6">&ldquo;{r.text}&rdquo;</p>
              <div className="flex items-center gap-3 pt-4 border-t">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-600 to-black text-white font-bold flex items-center justify-center">
                  {r.name[0]}
                </div>
                <div>
                  <div className="font-semibold text-sm">{r.name}</div>
                  <div className="text-xs text-muted-foreground">{r.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Trust() {
  const items = [
    { icon: ShieldCheck, title: "Bank-grade security", desc: "256-bit AES encryption. ISO 27001 certified infrastructure." },
    { icon: Lock, title: "Your data, your control", desc: "We share your details only with lenders you choose. Delete anytime." },
    { icon: Award, title: "RBI-regulated partners", desc: "Every lender is licensed by RBI. No predatory or unregulated apps." },
    { icon: Percent, title: "No hidden charges", desc: "Quikkk is free to use. We're paid by partner lenders, not you." },
    { icon: Users, title: "4.5L+ Indians trust us", desc: "Disbursed over ₹2,400 Cr in loans across the country." },
    { icon: Clock, title: "24/7 support", desc: "Real humans on chat, WhatsApp, and email. Average reply time: 4 mins." },
  ];
  return (
    <section id="trust" className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <Badge variant="outline" className="mb-4 bg-primary/5 border-primary/20 text-primary">
            Built on trust
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Why people pick Quikkk</h2>
          <p className="text-lg text-muted-foreground">
            We're an aggregator, not a lender. Our incentive is to find <em>you</em> the best deal.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((it) => (
            <div key={it.title} className="bg-card p-7 rounded-2xl border hover:border-primary/30 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
                <it.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-bold mb-2">{it.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{it.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="py-20 px-6">
      <div className="max-w-5xl mx-auto bg-gradient-to-br from-black via-zinc-900 to-red-700 rounded-[2.5rem] p-12 md:p-16 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent/20 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
        <div className="relative text-center max-w-2xl mx-auto space-y-6">
          <LogoMark size={56} />
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight mt-4">
            Ready to lock the best rate?
          </h2>
          <p className="text-lg text-white/80">
            Sign up in 30 seconds. See your personalised offers from 12+ lenders. Apply only if you love the rate.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link href="/login">
              <Button size="lg" className="bg-white text-primary hover:bg-white/90 gap-2 h-14 px-8 text-base font-semibold w-full sm:w-auto">
                Get my offers <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>
          <p className="text-xs text-white/60 pt-3">
            Free • Soft credit pull • Won't impact your score
          </p>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t bg-card">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-4 gap-8 mb-10">
          <div className="space-y-3">
            <Logo size={32} />
            <p className="text-sm text-muted-foreground max-w-xs">
              India's fastest credit marketplace. Compare loans and cards from 12+ regulated lenders.
            </p>
          </div>
          <FooterCol title="Products" links={["Personal loan", "Home loan", "Auto loan", "Business loan", "Credit cards"]} />
          <FooterCol title="Company" links={["About", "Careers", "Press", "Blog", "Contact"]} />
          <FooterCol title="Legal" links={["Privacy", "Terms", "Grievance redressal", "RBI guidelines"]} />
        </div>
        <div className="border-t pt-6 flex flex-col md:flex-row justify-between items-center gap-3 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} Quikkk Technologies Pvt Ltd. All rights reserved.</span>
          <span>Quikkk is a loan aggregator. Loans are sanctioned and disbursed by partner banks/NBFCs.</span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: string[] }) {
  return (
    <div>
      <h4 className="font-semibold text-sm mb-4">{title}</h4>
      <ul className="space-y-2.5">
        {links.map((l) => (
          <li key={l}>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{l}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}
