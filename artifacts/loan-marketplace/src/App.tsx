import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import { ProtectedRoute } from "@/components/protected-route";
import { Layout } from "@/components/layout";

import Home from "@/pages/home";
import Login from "@/pages/login";
import AdminLogin from "@/pages/admin/login";
import PartnerLogin from "@/pages/partner/login";
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
import About from "@/pages/about";
import Terms from "@/pages/terms";
import NotFound from "@/pages/not-found";

import AdminOverview from "@/pages/admin/overview";
import AdminUsers from "@/pages/admin/users";
import AdminApplications from "@/pages/admin/applications";
import AdminLenders from "@/pages/admin/lenders";
import AdminPayouts from "@/pages/admin/payouts";
import AdminCollections from "@/pages/admin/collections";
import AdminApiKeys from "@/pages/admin/api-keys";
import AdminBankIntegrations from "@/pages/admin/bank-integrations";
import AdminDispatchLog from "@/pages/admin/dispatch-log";

import PartnerOverview from "@/pages/partner/overview";
import PartnerLeads from "@/pages/partner/leads";
import PartnerNewLead from "@/pages/partner/new-lead";
import PartnerPayouts from "@/pages/partner/payouts";
import PartnerBulkUpload from "@/pages/partner/bulk-upload";
import PartnerApiIntegration from "@/pages/partner/api-integration";

import CollectionOverview from "@/pages/collection/overview";
import CollectionCases from "@/pages/collection/cases";
import CollectionCaseDetail from "@/pages/collection/case-detail";
import CollectionFollowups from "@/pages/collection/followups";
import CollectionOmniChannel from "@/pages/collection/omni-channel";
import CollectionApiIntegration from "@/pages/collection/api-integration";

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false } },
});

function P({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute><Layout>{children}</Layout></ProtectedRoute>;
}
function AP({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute allowedRoles={["admin"]}>{children}</ProtectedRoute>;
}
function PP({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute allowedRoles={["sales_partner"]}>{children}</ProtectedRoute>;
}
function CP({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute allowedRoles={["collection_partner"]}>{children}</ProtectedRoute>;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/terms" component={Terms} />
      <Route path="/login" component={Login} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/partner/login" component={PartnerLogin} />
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

      <Route path="/admin"><AP><AdminOverview /></AP></Route>
      <Route path="/admin/users"><AP><AdminUsers /></AP></Route>
      <Route path="/admin/applications"><AP><AdminApplications /></AP></Route>
      <Route path="/admin/lenders"><AP><AdminLenders /></AP></Route>
      <Route path="/admin/payouts"><AP><AdminPayouts /></AP></Route>
      <Route path="/admin/collections"><AP><AdminCollections /></AP></Route>
      <Route path="/admin/api-keys"><AP><AdminApiKeys /></AP></Route>
      <Route path="/admin/bank-integrations"><AP><AdminBankIntegrations /></AP></Route>
      <Route path="/admin/dispatch-log"><AP><AdminDispatchLog /></AP></Route>

      <Route path="/partner"><PP><PartnerOverview /></PP></Route>
      <Route path="/partner/leads"><PP><PartnerLeads /></PP></Route>
      <Route path="/partner/leads/new"><PP><PartnerNewLead /></PP></Route>
      <Route path="/partner/bulk-upload"><PP><PartnerBulkUpload /></PP></Route>
      <Route path="/partner/payouts"><PP><PartnerPayouts /></PP></Route>
      <Route path="/partner/api-integration"><PP><PartnerApiIntegration /></PP></Route>

      <Route path="/collection"><CP><CollectionOverview /></CP></Route>
      <Route path="/collection/cases"><CP><CollectionCases /></CP></Route>
      <Route path="/collection/cases/:id"><CP><CollectionCaseDetail /></CP></Route>
      <Route path="/collection/followups"><CP><CollectionFollowups /></CP></Route>
      <Route path="/collection/omni-channel"><CP><CollectionOmniChannel /></CP></Route>
      <Route path="/collection/api-integration"><CP><CollectionApiIntegration /></CP></Route>

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
