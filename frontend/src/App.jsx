import React, { lazy, Suspense } from "react";
import { Routes, Route, Link } from "react-router-dom";
import { I18nextProvider } from "react-i18next";
// import { ContextWrapper } from "@/AuthContext"; // Removed
import PrivateRoute, {
  AdminRoute,
  ManagerRoute,
} from "@/components/PrivateRoute";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
// import Login from "@/pages/Login"; // Commented out
import SimpleSSOPassthrough from "@/pages/Login/SSO/simple";
import OnboardingFlow from "@/pages/OnboardingFlow";
import { SignedIn, SignedOut, UserButton } from "@clerk/clerk-react";
import i18n from "./i18n";

import LandingPage from "@/pages/LandingPage/LandingPage";
import SignInPage from "@/pages/SignInPage";
import SignUpPage from "@/pages/SignUpPage";
import UserProfilePage from "@/pages/UserProfilePage";
import PricingPage from "@/pages/PricingPage";
import PaymentSuccessPage from "@/pages/PaymentSuccessPage";
import PaymentCancelPage from "@/pages/PaymentCancelPage";
import DashboardPage from "@/pages/DashboardPage"; // Added import
import { PfpProvider } from "./PfpContext";
import { LogoProvider } from "./LogoContext";
import { FullScreenLoader } from "./components/Preloader";
import { ThemeProvider } from "./ThemeContext";
import KeyboardShortcutsHelp from "@/components/KeyboardShortcutsHelp";

const Main = lazy(() => import("@/pages/Main"));
const InvitePage = lazy(() => import("@/pages/Invite"));
const WorkspaceChat = lazy(() => import("@/pages/WorkspaceChat"));
const AdminUsers = lazy(() => import("@/pages/Admin/Users"));
const AdminInvites = lazy(() => import("@/pages/Admin/Invitations"));
const AdminWorkspaces = lazy(() => import("@/pages/Admin/Workspaces"));
const AdminLogs = lazy(() => import("@/pages/Admin/Logging"));
const AdminAgents = lazy(() => import("@/pages/Admin/Agents"));
const GeneralChats = lazy(() => import("@/pages/GeneralSettings/Chats"));
const InterfaceSettings = lazy(
  () => import("@/pages/GeneralSettings/Settings/Interface")
);
const BrandingSettings = lazy(
  () => import("@/pages/GeneralSettings/Settings/Branding")
);

const ChatSettings = lazy(
  () => import("@/pages/GeneralSettings/Settings/Chat")
);

const GeneralApiKeys = lazy(() => import("@/pages/GeneralSettings/ApiKeys"));
const GeneralLLMPreference = lazy(
  () => import("@/pages/GeneralSettings/LLMPreference")
);
const GeneralTranscriptionPreference = lazy(
  () => import("@/pages/GeneralSettings/TranscriptionPreference")
);
const GeneralAudioPreference = lazy(
  () => import("@/pages/GeneralSettings/AudioPreference")
);
const GeneralEmbeddingPreference = lazy(
  () => import("@/pages/GeneralSettings/EmbeddingPreference")
);
const EmbeddingTextSplitterPreference = lazy(
  () => import("@/pages/GeneralSettings/EmbeddingTextSplitterPreference")
);
const GeneralVectorDatabase = lazy(
  () => import("@/pages/GeneralSettings/VectorDatabase")
);
const GeneralSecurity = lazy(() => import("@/pages/GeneralSettings/Security"));
const GeneralBrowserExtension = lazy(
  () => import("@/pages/GeneralSettings/BrowserExtensionApiKey")
);
const WorkspaceSettings = lazy(() => import("@/pages/WorkspaceSettings"));

const ChatEmbedWidgets = lazy(
  () => import("@/pages/GeneralSettings/ChatEmbedWidgets")
);
const PrivacyAndData = lazy(
  () => import("@/pages/GeneralSettings/PrivacyAndData")
);
const ExperimentalFeatures = lazy(
  () => import("@/pages/Admin/ExperimentalFeatures")
);
const LiveDocumentSyncManage = lazy(
  () => import("@/pages/Admin/ExperimentalFeatures/Features/LiveSync/manage")
);
const AgentBuilder = lazy(() => import("@/pages/Admin/AgentBuilder"));
const CommunityHubTrending = lazy(
  () => import("@/pages/GeneralSettings/CommunityHub/Trending")
);
const CommunityHubAuthentication = lazy(
  () => import("@/pages/GeneralSettings/CommunityHub/Authentication")
);
const CommunityHubImportItem = lazy(
  () => import("@/pages/GeneralSettings/CommunityHub/ImportItem")
);
const SystemPromptVariables = lazy(
  () => import("@/pages/Admin/SystemPromptVariables")
);

export default function App() {
  return (
    <ThemeProvider>
      <Suspense fallback={<FullScreenLoader />}>
        {/* <ContextWrapper> was here */}
        <LogoProvider>
          <PfpProvider>
            <I18nextProvider i18n={i18n}>
                <header style={{ padding: '1rem', backgroundColor: '#f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <Link to="/">Home</Link>
                  </div>
                  <div>
                    <SignedOut>
                      <Link to="/sign-in" style={{ marginRight: '1rem' }}>Sign In</Link>
                      <Link to="/sign-up">Sign Up</Link>
                    </SignedOut>
                    <SignedIn>
                      <Link to="/user" style={{ marginRight: '1rem' }}>User Profile (Clerk)</Link>
                      <UserButton afterSignOutUrl="/" />
                    </SignedIn>
                  </div>
                </header>
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  {/* <Route path="/login" element={<Login />} /> */}
                  <Route path="/sign-in/*" element={<SignInPage />} />
                  <Route path="/sign-up/*" element={<SignUpPage />} />
                  <Route path="/user" element={<UserProfilePage />} />
                  <Route path="/pricing" element={<PricingPage />} />
                  <Route path="/payment/success" element={<PaymentSuccessPage />} />
                  <Route path="/payment/cancel" element={<PaymentCancelPage />} />
                  <Route path="/dashboard" element={<PrivateRoute Component={DashboardPage} />} /> {/* Updated route */}
                  <Route
                    path="/sso/simple"
                    element={<SimpleSSOPassthrough />}
                  />

                  <Route
                    path="/workspace/:slug/settings/:tab"
                    element={<ManagerRoute Component={WorkspaceSettings} />}
                  />
                  <Route
                    path="/workspace/:slug"
                    element={<PrivateRoute Component={WorkspaceChat} />}
                  />
                  <Route
                    path="/workspace/:slug/t/:threadSlug"
                    element={<PrivateRoute Component={WorkspaceChat} />}
                  />
                  <Route path="/accept-invite/:code" element={<InvitePage />} />

                  {/* Admin */}
                  <Route
                    path="/settings/llm-preference"
                    element={<AdminRoute Component={GeneralLLMPreference} />}
                  />
                  <Route
                    path="/settings/transcription-preference"
                    element={
                      <AdminRoute Component={GeneralTranscriptionPreference} />
                    }
                  />
                  <Route
                    path="/settings/audio-preference"
                    element={<AdminRoute Component={GeneralAudioPreference} />}
                  />
                  <Route
                    path="/settings/embedding-preference"
                    element={
                      <AdminRoute Component={GeneralEmbeddingPreference} />
                    }
                  />
                  <Route
                    path="/settings/text-splitter-preference"
                    element={
                      <AdminRoute Component={EmbeddingTextSplitterPreference} />
                    }
                  />
                  <Route
                    path="/settings/vector-database"
                    element={<AdminRoute Component={GeneralVectorDatabase} />}
                  />
                  <Route
                    path="/settings/agents"
                    element={<AdminRoute Component={AdminAgents} />}
                  />
                  <Route
                    path="/settings/agents/builder"
                    element={
                      <AdminRoute
                        Component={AgentBuilder}
                        hideUserMenu={true}
                      />
                    }
                  />
                  <Route
                    path="/settings/agents/builder/:flowId"
                    element={
                      <AdminRoute
                        Component={AgentBuilder}
                        hideUserMenu={true}
                      />
                    }
                  />
                  <Route
                    path="/settings/event-logs"
                    element={<AdminRoute Component={AdminLogs} />}
                  />
                  <Route
                    path="/settings/embed-chat-widgets"
                    element={<AdminRoute Component={ChatEmbedWidgets} />}
                  />
                  {/* Manager */}
                  <Route
                    path="/settings/security"
                    element={<ManagerRoute Component={GeneralSecurity} />}
                  />
                  <Route
                    path="/settings/privacy"
                    element={<AdminRoute Component={PrivacyAndData} />}
                  />
                  <Route
                    path="/settings/interface"
                    element={<ManagerRoute Component={InterfaceSettings} />}
                  />
                  <Route
                    path="/settings/branding"
                    element={<ManagerRoute Component={BrandingSettings} />}
                  />
                  <Route
                    path="/settings/chat"
                    element={<ManagerRoute Component={ChatSettings} />}
                  />
                  <Route
                    path="/settings/beta-features"
                    element={<AdminRoute Component={ExperimentalFeatures} />}
                  />
                  <Route
                    path="/settings/api-keys"
                    element={<AdminRoute Component={GeneralApiKeys} />}
                  />
                  <Route
                    path="/settings/system-prompt-variables"
                    element={<AdminRoute Component={SystemPromptVariables} />}
                  />
                  <Route
                    path="/settings/browser-extension"
                    element={
                      <ManagerRoute Component={GeneralBrowserExtension} />
                    }
                  />
                  <Route
                    path="/settings/workspace-chats"
                    element={<ManagerRoute Component={GeneralChats} />}
                  />
                  <Route
                    path="/settings/invites"
                    element={<ManagerRoute Component={AdminInvites} />}
                  />
                  <Route
                    path="/settings/users"
                    element={<ManagerRoute Component={AdminUsers} />}
                  />
                  <Route
                    path="/settings/workspaces"
                    element={<ManagerRoute Component={AdminWorkspaces} />}
                  />
                  {/* Onboarding Flow */}
                  <Route path="/onboarding" element={<OnboardingFlow />} />
                  <Route
                    path="/onboarding/:step"
                    element={<OnboardingFlow />}
                  />

                  {/* Experimental feature pages  */}
                  {/* Live Document Sync feature */}
                  <Route
                    path="/settings/beta-features/live-document-sync/manage"
                    element={<AdminRoute Component={LiveDocumentSyncManage} />}
                  />

                  <Route
                    path="/settings/community-hub/trending"
                    element={<AdminRoute Component={CommunityHubTrending} />}
                  />
                  <Route
                    path="/settings/community-hub/authentication"
                    element={
                      <AdminRoute Component={CommunityHubAuthentication} />
                    }
                  />
                  <Route
                    path="/settings/community-hub/import-item"
                    element={<AdminRoute Component={CommunityHubImportItem} />}
                  />
                </Routes>
                <ToastContainer />
                <KeyboardShortcutsHelp />
              </I18nextProvider>
            </PfpProvider>
          </LogoProvider>
        {/* </ContextWrapper> was here */}
      </Suspense>
    </ThemeProvider>
  );
}
