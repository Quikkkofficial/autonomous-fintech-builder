import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import { ProtectedRoute } from "@/components/protected-route";
import { Layout } from "@/components/layout";

import Home from "@/pages/home";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Kyc from "@/pages/kyc";
import Loans from "@/pages/loans";
import LoanResults from "@/pages/loan-results";
import Lenders from "@/pages/lenders";
import Applications from "@/pages/applications";
import ApplicationDetail from "@/pages/application-detail";
import CreditCards from "@/pages/credit-cards";
import EmiCalculator from "@/pages/emi-calculator";
import Notifications from "@/pages/notifications";
import Profile from "@/pages/profile";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false } },
});

function P({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute><Layout>{children}</Layout></ProtectedRoute>;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/kyc"><P><Kyc /></P></Route>
      <Route path="/dashboard"><P><Dashboard /></P></Route>
      <Route path="/loans"><P><Loans /></P></Route>
      <Route path="/loans/results"><P><LoanResults /></P></Route>
      <Route path="/lenders"><P><Lenders /></P></Route>
      <Route path="/applications"><P><Applications /></P></Route>
      <Route path="/applications/:id"><P><ApplicationDetail /></P></Route>
      <Route path="/credit-cards"><P><CreditCards /></P></Route>
      <Route path="/tools/emi"><P><EmiCalculator /></P></Route>
      <Route path="/notifications"><P><Notifications /></P></Route>
      <Route path="/profile"><P><Profile /></P></Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
