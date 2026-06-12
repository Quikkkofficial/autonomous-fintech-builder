import { useEffect, useRef } from "react";
import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import { ProtectedRoute } from "@/components/protected-route";
import { Layout } from "@/components/layout";
import { ArrowLeft } from "lucide-react";

import Home from "@/pages/home";
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
import AdminLeadUpload from "@/pages/admin/lead-upload";
import AdminOmniChannel from "@/pages/admin/omni-channel";

import PartnerOverview from "@/pages/partner/overview";
import PartnerLeads from "@/pages/partner/leads";
import PartnerNewLead from "@/pages/partner/new-lead";
import PartnerPayouts from "@/pages/partner/payouts";
import PartnerBulkUpload from "@/pages/partner/bulk-upload";
import PartnerApiIntegration from "@/pages/partner/api-integration";
import PartnerOmniChannel from "@/pages/partner/omni-channel";

import CollectionOverview from "@/pages/collection/overview";
import CollectionCases from "@/pages/collection/cases";
import CollectionCaseDetail from "@/pages/collection/case-detail";
import CollectionFollowups from "@/pages/collection/followups";
import CollectionOmniChannel from "@/pages/collection/omni-channel";
import CollectionApiIntegration from "@/pages/collection/api-integration";

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false } },
});

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/quikkk-mark.png`,
    socialButtonsPlacement: "bottom" as const,
  },
  variables: {
    colorPrimary: "#EB1414",
    colorForeground: "#141414",
    colorMutedForeground: "#6B7280",
    colorDanger: "#DC2626",
    colorBackground: "#ffffff",
    colorInput: "#F9FAFB",
    colorInputForeground: "#141414",
    colorNeutral: "#E5E7EB",
    fontFamily: "Inter, system-ui, sans-serif",
    borderRadius: "0.625rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-white rounded-2xl w-[440px] max-w-full overflow-hidden shadow-lg border border-gray-100",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-[#141414] font-bold",
    headerSubtitle: "text-[#6B7280]",
    socialButtonsBlockButtonText: "text-[#141414] font-medium",
    formFieldLabel: "text-[#141414] font-medium text-sm",
    footerActionLink: "text-[#EB1414] font-medium hover:text-[#c91010]",
    footerActionText: "text-[#6B7280]",
    dividerText: "text-[#6B7280]",
    identityPreviewEditButton: "text-[#EB1414]",
    formFieldSuccessText: "text-green-600",
    alertText: "text-[#141414]",
    logoBox: "flex justify-center pt-2",
    logoImage: "h-10 w-auto",
    socialButtonsBlockButton: "border border-gray-200 hover:bg-gray-50",
    formButtonPrimary: "bg-[#EB1414] hover:bg-[#c91010] text-white font-semibold",
    formFieldInput: "border-gray-200 bg-[#F9FAFB] text-[#141414] focus:ring-[#EB1414] focus:border-[#EB1414]",
    footerAction: "bg-gray-50/80",
    dividerLine: "bg-gray-200",
    alert: "border border-red-100 bg-red-50/50",
    otpCodeFieldInput: "border-gray-200 bg-[#F9FAFB] text-[#141414]",
    formFieldRow: "gap-4",
    main: "gap-5",
  },
};

function SignInPage() {
  const [, setLocation] = useLocation();
  return (
    <div className="min-h-dvh bg-muted/30 flex flex-col">
      <div className="p-4">
        <button
          type="button"
          onClick={() => setLocation("/")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </div>
      <div className="flex-1 flex items-center justify-center px-4 pb-8">
        <SignIn
          routing="path"
          path={`${basePath}/sign-in`}
          signUpUrl={`${basePath}/sign-up`}
        />
      </div>
    </div>
  );
}

function SignUpPage() {
  const [, setLocation] = useLocation();
  return (
    <div className="min-h-dvh bg-muted/30 flex flex-col">
      <div className="p-4">
        <button
          type="button"
          onClick={() => setLocation("/")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </div>
      <div className="flex-1 flex items-center justify-center px-4 pb-8">
        <SignUp
          routing="path"
          path={`${basePath}/sign-up`}
          signInUrl={`${basePath}/sign-in`}
        />
      </div>
    </div>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);

  return null;
}

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
      <Route path="/sign-in/*?" component={SignInPage} />
      <Route path="/sign-up/*?" component={SignUpPage} />
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
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: {
            title: "Welcome back",
            subtitle: "Sign in to access your account",
          },
        },
        signUp: {
          start: {
            title: "Create your account",
            subtitle: "Compare loans and credit cards in seconds",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <AuthProvider>
          <TooltipProvider>
            <Router />
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
