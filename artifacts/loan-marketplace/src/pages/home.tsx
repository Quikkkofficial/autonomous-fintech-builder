import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Landmark, ArrowRight, ShieldCheck, Zap, Percent } from "lucide-react";
import { useAuth } from "@/lib/auth";

export default function Home() {
  const [, setLocation] = useLocation();
  const { user, isLoading } = useAuth();

  if (!isLoading && user) {
    setLocation("/dashboard");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl text-primary">
            <Landmark className="h-6 w-6" />
            CreditBridge
          </div>
          <Link href="/login">
            <Button>Login</Button>
          </Link>
        </div>
      </header>

      <main>
        <section className="py-24 px-6 text-center max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold tracking-tight text-foreground mb-6">
            Your bridge to better credit.
          </h1>
          <p className="text-xl text-muted-foreground mb-10">
            Compare personal loans, home loans, and credit cards from India's top banks. One application, multiple offers.
          </p>
          <Link href="/login">
            <Button size="lg" className="gap-2 text-lg px-8 h-14">
              Check Your Offers <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </section>

        <section className="bg-muted py-24">
          <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-12">
            <div className="bg-card p-8 rounded-2xl shadow-sm border">
              <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                <ShieldCheck className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Bank-Grade Trust</h3>
              <p className="text-muted-foreground">We partner directly with regulated banks and NBFCs. Your data is encrypted and secure.</p>
            </div>
            <div className="bg-card p-8 rounded-2xl shadow-sm border">
              <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Instant AI Match</h3>
              <p className="text-muted-foreground">Our matching engine finds the highest approval odds based on your profile instantly.</p>
            </div>
            <div className="bg-card p-8 rounded-2xl shadow-sm border">
              <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                <Percent className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Transparent Terms</h3>
              <p className="text-muted-foreground">No hidden fees. See exact interest rates, processing charges, and EMIs upfront.</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
