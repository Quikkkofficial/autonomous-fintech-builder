import { Link, useLocation } from "wouter";
import { useEffect, useRef, useState } from "react";
import { motion, useInView, useMotionValue, useSpring, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/logo";
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
  Phone,
  Mail,
  Gem,
  PiggyBank,
  Shield,
  Banknote,
  BarChart3,
  Headphones,
  Target,
} from "lucide-react";
import { useAuth } from "@/lib/auth";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: i * 0.1, ease: EASE },
  }),
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: (i = 0) => ({
    opacity: 1,
    transition: { duration: 0.5, delay: i * 0.08 },
  }),
};

function useScrollInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: threshold });
  return { ref, inView };
}

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
      <Testimonials />
      <Trust />
      <PartnerPortal />
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
      className={`sticky top-0 z-40 transition-all duration-300 ${
        scrolled ? "bg-card/90 backdrop-blur-lg border-b shadow-sm" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/">
          <Logo size={22} />
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
          <a href="#products" className="hover:text-foreground transition-colors">Products</a>
          <a href="#how" className="hover:text-foreground transition-colors">How it works</a>
          <a href="#trust" className="hover:text-foreground transition-colors">Trust & safety</a>
          <Link href="/about" className="hover:text-foreground transition-colors">About</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/partner/login">
            <Button variant="ghost" className="hidden md:inline-flex text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50">Partner portal</Button>
          </Link>
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
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="absolute -top-32 -left-32 w-[28rem] h-[28rem] rounded-full bg-primary/10 blur-3xl"
        />
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.4, delay: 0.2, ease: "easeOut" }}
          className="absolute top-40 -right-32 w-[32rem] h-[32rem] rounded-full bg-accent/5 blur-3xl"
        />
      </div>

      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-7">
          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0}>
            <Badge variant="outline" className="gap-1.5 px-3 py-1.5 bg-card/60 backdrop-blur-sm border-primary/30">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs">India's smartest credit marketplace</span>
            </Badge>
          </motion.div>
          <motion.h1
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={1}
            className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05]"
          >
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
                <motion.path
                  d="M2 8 Q 50 2 100 6 T 198 4"
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="3"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.9, delay: 0.8, ease: "easeOut" }}
                />
              </svg>
            </span>
            <br />
            in your account.
          </motion.h1>
          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={2}
            className="text-lg md:text-xl text-muted-foreground max-w-xl leading-relaxed"
          >
            Compare loan and credit card offers from <strong className="text-foreground">multiple regulated lenders</strong>{" "}
            in seconds. Get pre-approved offers, lock the best rate, and disburse — all from your phone.
          </motion.p>

          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={3} className="flex flex-col sm:flex-row gap-3 pt-2">
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
          </motion.div>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={4}
            className="flex flex-wrap items-center gap-6 pt-4 text-sm text-muted-foreground"
          >
            <span className="flex items-center gap-2"><Lock className="w-4 h-4 text-red-600" /> 256-bit encrypted</span>
            <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-red-600" /> Soft credit pull</span>
            <span className="flex items-center gap-2"><Zap className="w-4 h-4 text-red-600" /> 60-second match</span>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          <HeroVisual />
        </motion.div>
      </div>
    </section>
  );
}

function HeroVisual() {
  return (
    <div className="relative h-[480px] md:h-[540px]">
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="relative w-[280px] h-[480px] bg-gradient-to-br from-black to-zinc-800 rounded-[44px] p-3 shadow-2xl shadow-red-600/30 rotate-2"
        >
          <div className="w-full h-full bg-card rounded-[34px] overflow-hidden flex flex-col">
            <div className="p-5 border-b">
              <Logo size={20} />
            </div>
            <div className="p-5 space-y-3 flex-1">
              <div className="text-xs text-muted-foreground">Top match for you</div>
              <div className="rounded-2xl p-4 border-2 border-primary/40 bg-red-50 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-bold text-sm">Best offer</div>
                    <div className="text-[10px] text-muted-foreground">Personal loan • 36 mo</div>
                  </div>
                  <Badge className="bg-red-600 text-white border-0 text-[9px] px-1.5">
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
                { label: "Option 2", rate: "11.25%", emi: "₹9,792" },
                { label: "Option 3", rate: "11.99%", emi: "₹9,962" },
                { label: "Option 4", rate: "12.50%", emi: "₹10,079" },
              ].map((l) => (
                <div key={l.label} className="rounded-xl p-3 border bg-card flex justify-between items-center">
                  <div>
                    <div className="font-medium text-xs">{l.label}</div>
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
        </motion.div>
      </div>

      <motion.div
        animate={{ rotate: [-6, -4, -6], y: [0, -4, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        className="absolute top-6 -left-2 md:left-4 bg-card border rounded-2xl p-4 shadow-xl max-w-[200px]"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <div className="text-xs font-semibold">Approved!</div>
            <div className="text-[10px] text-muted-foreground">₹3,00,000 disbursed</div>
          </div>
        </div>
      </motion.div>

      <motion.div
        animate={{ rotate: [6, 4, 6], y: [0, 4, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-12 -right-2 md:right-4 bg-card border rounded-2xl p-4 shadow-xl max-w-[200px]"
      >
        <div className="flex items-center gap-2 mb-1.5">
          <TrendingUp className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold">CIBIL: 782</span>
          <Badge className="bg-red-50 text-red-700 border-0 text-[9px] px-1.5">Excellent</Badge>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div className="h-full w-[88%] bg-gradient-to-r from-amber-400 to-red-600 rounded-full" />
        </div>
        <div className="text-[10px] text-muted-foreground mt-1.5">Free monthly updates</div>
      </motion.div>

      <motion.div
        animate={{ rotate: [3, 5, 3], y: [0, -6, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
        className="absolute top-1/2 -translate-y-1/2 -right-4 md:right-12 bg-gradient-to-br from-black to-red-700 text-white rounded-2xl p-3 shadow-xl"
      >
        <Zap className="w-5 h-5 mb-1" />
        <div className="text-[10px] font-semibold leading-tight">
          60-sec
          <br />
          match
        </div>
      </motion.div>
    </div>
  );
}

function SocialProof() {
  const { ref, inView } = useScrollInView();
  const badges = [
    { icon: ShieldCheck, label: "RBI-Compliant Network" },
    { icon: Lock, label: "ISO 27001 Secured" },
    { icon: Award, label: "Data-Privacy Certified" },
    { icon: Users, label: "4.5L+ Happy Customers" },
    { icon: Zap, label: "60-Second Matching" },
    { icon: CheckCircle2, label: "Soft Credit Pull" },
  ];
  return (
    <section className="py-12 border-y bg-muted/30" ref={ref}>
      <div className="max-w-7xl mx-auto px-6">
        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          className="text-center text-xs uppercase tracking-widest text-muted-foreground mb-6 font-semibold"
        >
          Built on trust • Powered by regulated lending partners
        </motion.p>
        <div className="flex flex-wrap justify-center items-center gap-3">
          {badges.map((b, i) => (
            <motion.div
              key={b.label}
              variants={fadeUp}
              initial="hidden"
              animate={inView ? "visible" : "hidden"}
              custom={i * 0.5}
              className="flex items-center gap-2 px-4 py-2.5 bg-card border rounded-full text-sm hover:border-primary/40 hover:shadow-sm transition-all duration-200"
            >
              <b.icon className="w-4 h-4 text-red-600" />
              <span className="font-medium text-foreground/80">{b.label}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductGrid() {
  const { ref, inView } = useScrollInView();
  const products = [
    { icon: Landmark, name: "Personal Loan", desc: "₹25K – ₹40L", rate: "from 10.49% p.a.", color: "from-white to-red-50", iconBg: "bg-red-600 text-white" },
    { icon: HomeIcon, name: "Home Loan", desc: "₹5L – ₹5Cr", rate: "from 8.40% p.a.", color: "from-white to-zinc-50", iconBg: "bg-black text-white" },
    { icon: Car, name: "Auto Loan", desc: "₹1L – ₹50L", rate: "from 9.25% p.a.", color: "from-white to-red-50", iconBg: "bg-red-600 text-white" },
    { icon: Briefcase, name: "Business Loan", desc: "₹1L – ₹2Cr", rate: "from 14.50% p.a.", color: "from-white to-zinc-50", iconBg: "bg-black text-white" },
    { icon: GraduationCap, name: "Education Loan", desc: "₹50K – ₹1Cr", rate: "from 9.95% p.a.", color: "from-white to-red-50", iconBg: "bg-red-600 text-white" },
    { icon: Gem, name: "Gold Loan", desc: "₹10K – ₹50L", rate: "from 7.00% p.a.", color: "from-white to-yellow-50", iconBg: "bg-yellow-500 text-white" },
    { icon: PiggyBank, name: "FD Loan", desc: "Up to 90% of FD", rate: "~1–2% over FD rate", color: "from-white to-blue-50", iconBg: "bg-blue-600 text-white" },
    { icon: TrendingUp, name: "Mutual Fund Loan", desc: "₹50K – ₹5Cr", rate: "from 9.00% p.a.", color: "from-white to-emerald-50", iconBg: "bg-emerald-600 text-white" },
    { icon: Shield, name: "Insurance Loan", desc: "₹10K – ₹50L", rate: "from 9.00% p.a.", color: "from-white to-purple-50", iconBg: "bg-purple-600 text-white" },
    { icon: CreditCard, name: "Credit Cards", desc: "Premium card range", rate: "Lifetime free options", color: "from-white to-zinc-50", iconBg: "bg-black text-white" },
  ];
  return (
    <section id="products" className="py-24 px-6" ref={ref}>
      <div className="max-w-7xl mx-auto">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          className="text-center max-w-2xl mx-auto mb-14"
        >
          <Badge variant="outline" className="mb-4 bg-primary/5 border-primary/20 text-primary">
            One platform, every need
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Pick your product</h2>
          <p className="text-lg text-muted-foreground">Every category. Multiple regulated lenders. One application.</p>
        </motion.div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {products.map((p, i) => (
            <motion.div
              key={p.name}
              variants={fadeUp}
              initial="hidden"
              animate={inView ? "visible" : "hidden"}
              custom={i * 0.4}
            >
              <Link href="/login">
                <div
                  className={`group cursor-pointer rounded-3xl p-6 border bg-gradient-to-br ${p.color} hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300`}
                >
                  <div className={`w-14 h-14 rounded-2xl ${p.iconBg} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                    <p.icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold mb-1">{p.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{p.desc}</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-foreground">{p.rate}</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 group-hover:text-primary transition-all duration-200" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AnimatedCounter({ to, prefix = "", suffix = "" }: { to: number; prefix?: string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionVal = useMotionValue(0);
  const spring = useSpring(motionVal, { stiffness: 60, damping: 18 });
  const inView = useInView(ref, { once: true, amount: 0.5 });

  useEffect(() => {
    if (inView) motionVal.set(to);
  }, [inView, motionVal, to]);

  useEffect(() => {
    return spring.on("change", (v) => {
      if (ref.current) ref.current.textContent = prefix + Math.round(v).toLocaleString("en-IN") + suffix;
    });
  }, [spring, prefix, suffix]);

  return <span ref={ref}>{prefix}0{suffix}</span>;
}

function Stats() {
  const { ref, inView } = useScrollInView();
  const stats = [
    { value: 2400, prefix: "₹", suffix: "Cr+", label: "Disbursed" },
    { value: 450000, prefix: "", suffix: "+", label: "Happy customers" },
    { value: 12, prefix: "", suffix: "+", label: "Lender partners" },
    { value: 60, prefix: "", suffix: "s", label: "Avg. match time" },
  ];
  return (
    <section className="py-16 px-6" ref={ref}>
      <div className="max-w-6xl mx-auto bg-gradient-to-br from-black via-zinc-900 to-red-700 rounded-3xl p-10 md:p-14 text-white relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-72 h-72 rounded-full bg-red-500/20 blur-3xl" />
        <div className="relative grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              variants={fadeUp}
              initial="hidden"
              animate={inView ? "visible" : "hidden"}
              custom={i * 0.5}
            >
              <div className="text-4xl md:text-5xl font-bold tracking-tight mb-1.5">
                <AnimatedCounter to={s.value} prefix={s.prefix} suffix={s.suffix} />
              </div>
              <div className="text-sm text-white/70 uppercase tracking-wider">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const { ref, inView } = useScrollInView();
  const steps = [
    { num: "01", icon: Smartphone, title: "Sign up in seconds", desc: "Just your phone number and a 6-digit OTP. No paperwork." },
    { num: "02", icon: ShieldCheck, title: "One-time KYC", desc: "Aadhaar + PAN verified instantly. Your data stays encrypted." },
    { num: "03", icon: Sparkles, title: "Get matched", desc: "Our engine ranks regulated lenders by your profile and approval odds." },
    { num: "04", icon: Zap, title: "Apply & disburse", desc: "Pick the best offer and money lands in your account in 24-48 hours." },
  ];
  return (
    <section id="how" className="py-24 px-6 bg-muted/40" ref={ref}>
      <div className="max-w-7xl mx-auto">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <Badge variant="outline" className="mb-4 bg-card border-primary/20 text-primary">How it works</Badge>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">From zero to loan in 4 steps</h2>
          <p className="text-lg text-muted-foreground">No agents. No bank visits. No paperwork chases.</p>
        </motion.div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((s, i) => (
            <motion.div
              key={s.num}
              variants={fadeUp}
              initial="hidden"
              animate={inView ? "visible" : "hidden"}
              custom={i * 0.6}
              className="relative"
            >
              <div className="bg-card rounded-2xl p-6 border h-full hover:border-primary/40 hover:shadow-lg transition-all duration-300 group">
                <div className="text-5xl font-bold text-primary/15 mb-2 group-hover:text-primary/25 transition-colors">{s.num}</div>
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                  <s.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
              {i < steps.length - 1 && (
                <ChevronRight className="hidden lg:block absolute top-1/2 -right-3 w-6 h-6 text-primary/40" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  const { ref, inView } = useScrollInView();
  const reviews = [
    {
      name: "Priya Sharma",
      role: "Software Engineer, Bengaluru",
      rating: 5,
      text: "Got my personal loan disbursed in 36 hours. Quikkk found me a much better rate than I'd been quoted directly — saved over ₹40K in interest.",
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
      text: "I love that I can check my credit score for free and track all my applications in one place. Genuine product, zero spam calls.",
    },
  ];
  return (
    <section className="py-24 px-6 bg-muted/40" ref={ref}>
      <div className="max-w-7xl mx-auto">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          className="text-center max-w-2xl mx-auto mb-14"
        >
          <div className="flex items-center justify-center gap-1 mb-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
            ))}
            <span className="ml-2 font-semibold text-sm">4.7 / 5 from 12,400 reviews</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Customers love Quikkk</h2>
        </motion.div>
        <div className="grid md:grid-cols-3 gap-5">
          {reviews.map((r, i) => (
            <motion.div
              key={r.name}
              variants={fadeUp}
              initial="hidden"
              animate={inView ? "visible" : "hidden"}
              custom={i * 0.5}
              className="bg-card rounded-2xl p-7 border shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300"
            >
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
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Trust() {
  const { ref, inView } = useScrollInView();
  const items = [
    { icon: ShieldCheck, title: "Bank-grade security", desc: "256-bit AES encryption. ISO 27001 certified infrastructure." },
    { icon: Lock, title: "Your data, your control", desc: "We share your details only with lenders you choose. Delete anytime." },
    { icon: Award, title: "RBI-regulated network", desc: "Every lending partner is licensed by RBI. No predatory or unregulated apps." },
    { icon: Percent, title: "No hidden charges", desc: "Quikkk is free to use. We're paid by partner lenders, not you." },
    { icon: Users, title: "4.5L+ Indians trust us", desc: "Disbursed over ₹2,400 Cr in loans across the country." },
    { icon: Clock, title: "24/7 support", desc: "Real humans on chat, WhatsApp, and email. Average reply time: 4 mins." },
  ];
  return (
    <section id="trust" className="py-24 px-6" ref={ref}>
      <div className="max-w-7xl mx-auto">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          className="text-center max-w-2xl mx-auto mb-14"
        >
          <Badge variant="outline" className="mb-4 bg-primary/5 border-primary/20 text-primary">Built on trust</Badge>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Why people pick Quikkk</h2>
          <p className="text-lg text-muted-foreground">
            We're an aggregator, not a lender. Our incentive is to find <em>you</em> the best deal.
          </p>
        </motion.div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((it, i) => (
            <motion.div
              key={it.title}
              variants={fadeUp}
              initial="hidden"
              animate={inView ? "visible" : "hidden"}
              custom={i * 0.4}
              className="bg-card p-7 rounded-2xl border hover:border-primary/30 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                <it.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-bold mb-2">{it.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{it.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PartnerPortal() {
  const { ref, inView } = useScrollInView(0.1);

  const channelFeatures = [
    { icon: Banknote, text: "Commission on every disbursal" },
    { icon: BarChart3, text: "Real-time pipeline & conversion tracking" },
    { icon: Target, text: "CRM & API integration" },
    { icon: TrendingUp, text: "Bulk lead upload (CSV)" },
  ];

  const collectionFeatures = [
    { icon: Shield, text: "DPD-bucketed case management" },
    { icon: Headphones, text: "Omni-channel outreach tools" },
    { icon: CheckCircle2, text: "Promise-to-pay tracking" },
    { icon: Phone, text: "Dialer & CRM integration" },
  ];

  return (
    <section className="py-28 px-6 relative overflow-hidden" ref={ref}>
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-zinc-900 to-slate-900 -z-10" />
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[40rem] h-[40rem] rounded-full bg-indigo-600/10 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-[40rem] h-[40rem] rounded-full bg-amber-500/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60rem] h-[20rem] rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="max-w-6xl mx-auto">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          className="text-center mb-16"
        >
          <Badge className="gap-1.5 px-4 py-2 mb-6 bg-white/10 border-white/20 text-white/90 backdrop-blur-sm hover:bg-white/10">
            <Users className="w-3.5 h-3.5" /> For business partners
          </Badge>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-5">
            Partner with{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Quikkk
            </span>
          </h2>
          <p className="text-white/60 text-lg max-w-2xl mx-auto leading-relaxed">
            Grow your earnings by sourcing loans, or help recover outstanding dues — two specialised portals built for professionals.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
            custom={0.3}
            className="group relative rounded-3xl p-8 overflow-hidden"
            style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(79,70,229,0.08) 100%)" }}
          >
            <div className="absolute inset-0 rounded-3xl border border-indigo-500/30 group-hover:border-indigo-400/60 transition-colors duration-500" />
            <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(79,70,229,0.1) 100%)" }}
            />

            <div className="relative space-y-6">
              <motion.div
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30"
              >
                <TrendingUp className="w-8 h-8 text-white" />
              </motion.div>

              <div>
                <h3 className="text-2xl font-bold text-white mb-2">Channel Partner Portal</h3>
                <p className="text-white/60 text-sm leading-relaxed">
                  Source loan leads, track your pipeline, earn commissions on every disbursal. Manage your entire book from one powerful dashboard.
                </p>
              </div>

              <ul className="space-y-3">
                {channelFeatures.map((f, i) => (
                  <motion.li
                    key={f.text}
                    variants={fadeIn}
                    initial="hidden"
                    animate={inView ? "visible" : "hidden"}
                    custom={0.3 + i * 0.15}
                    className="flex items-center gap-3 text-white/80 text-sm"
                  >
                    <div className="w-7 h-7 rounded-lg bg-indigo-500/20 flex items-center justify-center shrink-0">
                      <f.icon className="w-3.5 h-3.5 text-indigo-400" />
                    </div>
                    {f.text}
                  </motion.li>
                ))}
              </ul>

              <Link href="/partner/login">
                <Button className="w-full bg-indigo-600 hover:bg-indigo-500 gap-2 h-12 text-base font-semibold shadow-lg shadow-indigo-600/30 group/btn mt-2">
                  Channel Partner Login
                  <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </motion.div>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
            custom={0.5}
            className="group relative rounded-3xl p-8 overflow-hidden"
            style={{ background: "linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(234,88,12,0.08) 100%)" }}
          >
            <div className="absolute inset-0 rounded-3xl border border-amber-500/30 group-hover:border-amber-400/60 transition-colors duration-500" />
            <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{ background: "linear-gradient(135deg, rgba(245,158,11,0.2) 0%, rgba(234,88,12,0.1) 100%)" }}
            />

            <div className="relative space-y-6">
              <motion.div
                whileHover={{ scale: 1.05, rotate: -5 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                className="w-16 h-16 rounded-2xl bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/30"
              >
                <Phone className="w-8 h-8 text-white" />
              </motion.div>

              <div>
                <h3 className="text-2xl font-bold text-white mb-2">Collection Partner Portal</h3>
                <p className="text-white/60 text-sm leading-relaxed">
                  Manage delinquent cases, log follow-ups, and track recoveries across all channels. Omni-channel tools including voice, SMS, WhatsApp, and email.
                </p>
              </div>

              <ul className="space-y-3">
                {collectionFeatures.map((f, i) => (
                  <motion.li
                    key={f.text}
                    variants={fadeIn}
                    initial="hidden"
                    animate={inView ? "visible" : "hidden"}
                    custom={0.5 + i * 0.15}
                    className="flex items-center gap-3 text-white/80 text-sm"
                  >
                    <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
                      <f.icon className="w-3.5 h-3.5 text-amber-400" />
                    </div>
                    {f.text}
                  </motion.li>
                ))}
              </ul>

              <Link href="/partner/login">
                <Button className="w-full bg-amber-500 hover:bg-amber-400 gap-2 h-12 text-base font-semibold text-black shadow-lg shadow-amber-500/30 group/btn mt-2">
                  Collection Partner Login
                  <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>

        <motion.p
          variants={fadeIn}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          custom={1}
          className="text-center text-xs text-white/40 mt-8"
        >
          Admin?{" "}
          <Link href="/admin/login" className="text-white/60 underline underline-offset-2 hover:text-white/80 transition-colors">
            Admin login →
          </Link>
        </motion.p>
      </div>
    </section>
  );
}

function CTA() {
  const { ref, inView } = useScrollInView();
  return (
    <section className="py-20 px-6" ref={ref}>
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate={inView ? "visible" : "hidden"}
        className="max-w-5xl mx-auto bg-gradient-to-br from-black via-zinc-900 to-red-700 rounded-[2.5rem] p-12 md:p-16 text-white relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/20 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
        <div className="relative text-center max-w-2xl mx-auto space-y-6">
          <div className="flex justify-center">
            <Logo size={36} variant="light" />
          </div>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight mt-4">
            Ready to lock the best rate?
          </h2>
          <p className="text-lg text-white/80">
            Sign up in 30 seconds. See your personalised offers from our regulated lender network. Apply only if you love
            the rate.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link href="/partner/login">
              <Button
                size="lg"
                variant="outline"
                className="bg-white text-black hover:bg-white/90 gap-2 h-14 px-8 text-base font-semibold w-full sm:w-auto"
              >
                Partner portal <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link href="/partner/login">
              <Button
                size="lg"
                variant="outline"
                className="bg-white text-black hover:bg-white/90 gap-2 h-14 px-8 text-base font-semibold w-full sm:w-auto"
              >
                Collections portal <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button
                size="lg"
                className="bg-white text-black hover:bg-white/90 gap-2 h-14 px-8 text-base font-semibold w-full sm:w-auto"
              >
                Get my offers <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>
          <p className="text-xs text-white/60 pt-3">Free • Soft credit pull • Won't impact your score</p>
        </div>
      </motion.div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t bg-card">
      <div className="max-w-7xl mx-auto px-6 py-14">
        <div className="grid md:grid-cols-4 gap-10 mb-10">
          <div className="space-y-4">
            <Logo size={26} />
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              India's smartest credit marketplace. Compare loans and cards from a regulated lender network.
            </p>
            <div className="space-y-2 text-sm pt-2">
              <a href="mailto:info@quikkk.com" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                <Mail className="w-4 h-4 text-red-600" /> info@quikkk.com
              </a>
              <a href="tel:+918335974309" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                <Phone className="w-4 h-4 text-red-600" /> +91 83359 74309
              </a>
            </div>
          </div>
          <FooterCol
            title="Products"
            links={[
              { label: "Personal loan", href: "/login" },
              { label: "Home loan", href: "/login" },
              { label: "Auto loan", href: "/login" },
              { label: "Business loan", href: "/login" },
              { label: "Credit cards", href: "/login" },
            ]}
          />
          <FooterCol
            title="Company"
            links={[
              { label: "About us", href: "/about" },
              { label: "Contact", href: "/about" },
              { label: "Careers", href: "/about" },
              { label: "Press", href: "/about" },
            ]}
          />
          <FooterCol
            title="Legal"
            links={[
              { label: "Terms & conditions", href: "/terms" },
              { label: "Privacy policy", href: "/terms" },
              { label: "Grievance redressal", href: "/terms" },
              { label: "Trademark notice", href: "/terms" },
            ]}
          />
        </div>
        <div className="border-t pt-6 space-y-2 text-xs text-muted-foreground">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
            <span>© {new Date().getFullYear()} Mekyek Global Services Pvt Ltd. All rights reserved.</span>
            <span>
              "Quikkk" is a registered trademark of Mekyek Global Services Pvt Ltd.
            </span>
          </div>
          <p className="leading-relaxed">
            Quikkk is a digital loan & credit card aggregator. Loans and credit facilities are sanctioned and disbursed
            solely by our regulated lending partners as per their internal credit policies. Mekyek Global Services Pvt
            Ltd does not lend, accept deposits or make any guarantee of loan approval.
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <h4 className="font-semibold text-sm mb-4">{title}</h4>
      <ul className="space-y-2.5">
        {links.map((l) => (
          <li key={l.label}>
            <Link href={l.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
