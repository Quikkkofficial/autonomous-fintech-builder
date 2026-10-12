import { Suspense, lazy } from "react";
import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import { ProtectedRoute } from "@/components/protected-route";
import { Layout } from "@/components/layout";
import { SeoHead } from "@/components/seo";

// Code-split: load pages on-demand for fast initial load
const Home = lazy(() => import("@/pages/home"));
const Dashboard = lazy(() => import("@/pages/dashboard"));
const Kyc = lazy(() => import("@/pages/kyc"));
const Loans = lazy(() => import("@/pages/loans"));
const LoanResults = lazy(() => import("@/pages/loan-results"));
const Lenders = lazy(() => import("@/pages/lenders"));
const Applications = lazy(() => import("@/pages/applications"));
const ApplicationDetail = lazy(() => import("@/pages/application-detail"));
const CreditCards = lazy(() => import("@/pages/credit-cards"));
const EmiCalculator = lazy(() => import("@/pages/emi-calculator"));
const Notifications = lazy(() => import("@/pages/notifications"));
const Profile = lazy(() => import("@/pages/profile"));
const Payments = lazy(() => import("@/pages/payments"));
const About = lazy(() => import("@/pages/about"));
const Terms = lazy(() => import("@/pages/terms"));
const SignIn = lazy(() => import("@/pages/sign-in"));
const SignUp = lazy(() => import("@/pages/sign-up"));
const NotFound = lazy(() => import("@/pages/not-found"));

const AdminOverview = lazy(() => import("@/pages/admin/overview"));
const AdminUsers = lazy(() => import("@/pages/admin/users"));
const AdminApplications = lazy(() => import("@/pages/admin/applications"));
const AdminLenders = lazy(() => import("@/pages/admin/lenders"));
const AdminPayouts = lazy(() => import("@/pages/admin/payouts"));
const AdminCollections = lazy(() => import("@/pages/admin/collections"));
const AdminApiKeys = lazy(() => import("@/pages/admin/api-keys"));
const AdminBankIntegrations = lazy(() => import("@/pages/admin/bank-integrations"));
const AdminDispatchLog = lazy(() => import("@/pages/admin/dispatch-log"));
const AdminLeadUpload = lazy(() => import("@/pages/admin/lead-upload"));
const AdminOmniChannel = lazy(() => import("@/pages/admin/omni-channel"));

const PartnerOverview = lazy(() => import("@/pages/partner/overview"));
const PartnerLeads = lazy(() => import("@/pages/partner/leads"));
const PartnerNewLead = lazy(() => import("@/pages/partner/new-lead"));
const PartnerPayouts = lazy(() => import("@/pages/partner/payouts"));
const PartnerBulkUpload = lazy(() => import("@/pages/partner/bulk-upload"));
const PartnerApiIntegration = lazy(() => import("@/pages/partner/api-integration"));
const PartnerOmniChannel = lazy(() => import("@/pages/partner/omni-channel"));

const CollectionOverview = lazy(() => import("@/pages/collection/overview"));
const CollectionCases = lazy(() => import("@/pages/collection/cases"));
const CollectionCaseDetail = lazy(() => import("@/pages/collection/case-detail"));
const CollectionFollowups = lazy(() => import("@/pages/collection/followups"));
const CollectionOmniChannel = lazy(() => import("@/pages/collection/omni-channel"));
const CollectionApiIntegration = lazy(() => import("@/pages/collection/api-integration"));

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false } },
});

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

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
    <Suspense fallback={<div className="min-h-dvh flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#EB1414]"></div></div>}>
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/terms" component={Terms} />
      <Route path="/sign-in/*?" component={SignIn} />
      <Route path="/sign-up/*?" component={SignUp} />
      <Route path="/login"><Redirect to="/sign-in" /></Route>
      <Route path="/admin/login"><Redirect to="/sign-in" /></Route>
      <Route path="/partner/login"><Redirect to="/sign-in" /></Route>
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
      <Route path="/payments"><P><Payments /></P></Route>

      <Route path="/admin"><AP><AdminOverview /></AP></Route>
      <Route path="/admin/users"><AP><AdminUsers /></AP></Route>
      <Route path="/admin/applications"><AP><AdminApplications /></AP></Route>
      <Route path="/admin/lenders"><AP><AdminLenders /></AP></Route>
      <Route path="/admin/payouts"><AP><AdminPayouts /></AP></Route>
      <Route path="/admin/collections"><AP><AdminCollections /></AP></Route>
      <Route path="/admin/api-keys"><AP><AdminApiKeys /></AP></Route>
      <Route path="/admin/bank-integrations"><AP><AdminBankIntegrations /></AP></Route>
      <Route path="/admin/dispatch-log"><AP><AdminDispatchLog /></AP></Route>
      <Route path="/admin/lead-upload"><AP><AdminLeadUpload /></AP></Route>
      <Route path="/admin/omni-channel"><AP><AdminOmniChannel /></AP></Route>

      <Route path="/partner"><PP><PartnerOverview /></PP></Route>
      <Route path="/partner/leads"><PP><PartnerLeads /></PP></Route>
      <Route path="/partner/leads/new"><PP><PartnerNewLead /></PP></Route>
      <Route path="/partner/bulk-upload"><PP><PartnerBulkUpload /></PP></Route>
      <Route path="/partner/payouts"><PP><PartnerPayouts /></PP></Route>
      <Route path="/partner/api-integration"><PP><PartnerApiIntegration /></PP></Route>
      <Route path="/partner/omni-channel"><PP><PartnerOmniChannel /></PP></Route>

      <Route path="/collection"><CP><CollectionOverview /></CP></Route>
      <Route path="/collection/cases"><CP><CollectionCases /></CP></Route>
      <Route path="/collection/cases/:id"><CP><CollectionCaseDetail /></CP></Route>
      <Route path="/collection/followups"><CP><CollectionFollowups /></CP></Route>
      <Route path="/collection/omni-channel"><CP><CollectionOmniChannel /></CP></Route>
      <Route path="/collection/api-integration"><CP><CollectionApiIntegration /></CP></Route>

      <Route component={NotFound} />
    </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <SeoHead />
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Router />
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </WouterRouter>
  );
}

export default App;
