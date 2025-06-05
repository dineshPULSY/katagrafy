import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { FullScreenLoader } from "../Preloader";
// import validateSessionTokenForUser from "@/utils/session"; // Commented out as Clerk handles session validation
// import paths from "@/utils/paths"; // Commented out, paths might change with Clerk
import paths from "@/utils/paths"; // Re-importing for onboarding, marked for review
// import { AUTH_TIMESTAMP, AUTH_TOKEN, AUTH_USER } from "@/utils/constants"; // Commented out, Clerk handles auth state
// import { userFromStorage } from "@/utils/request"; // Commented out, Clerk provides user info
import System from "@/models/system";
import UserMenu from "../UserMenu";
import { KeyboardShortcutWrapper } from "@/utils/keyboardShortcuts";
import { useAuth, useUser } from '@clerk/clerk-react';

function useIsAuthenticatedWithClerk() {
  const { isSignedIn, isLoaded, userId } = useAuth();
  const [shouldRedirectToOnboarding, setShouldRedirectToOnboarding] = useState(false);
  const [clerkMultiUserMode, setClerkMultiUserMode] = useState(true); // Clerk is inherently multi-user

  // Retain existing onboarding logic for now, needs re-evaluation.
  // This part might need to be removed or significantly changed later.
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!isLoaded) return; // Wait for Clerk to load
      if (isSignedIn) { // Only check onboarding if user is signed in
        const {
          // MultiUserMode, // This might be from your system settings - Clerk handles this
          // RequiresAuth,  // This might be from your system settings - Clerk handles this
          LLMProvider = null,
          VectorDB = null,
        } = await System.keys(); // Assuming System.keys() is still relevant for app-specific setup

        // Example: If user is signed in but hasn't completed app-specific setup
        if (!LLMProvider || !VectorDB) {
           // Check if onboarding was previously completed to avoid redirect loop
           const onboardingCompleted = localStorage.getItem('onboardingCompleted');
           if (!onboardingCompleted) {
             setShouldRedirectToOnboarding(true);
           }
        } else {
           // If setup is complete, mark onboarding as done
           localStorage.setItem('onboardingCompleted', 'true');
           setShouldRedirectToOnboarding(false);
        }
      } else {
        // Not signed in, no onboarding redirect needed from here
        setShouldRedirectToOnboarding(false);
        // Clear onboarding completed flag if user signs out
        localStorage.removeItem('onboardingCompleted');
      }
    };
    checkOnboardingStatus();
  }, [isSignedIn, isLoaded]);

  return {
    isAuthd: isSignedIn, // Main authentication status from Clerk
    isLoading: !isLoaded, // Loading state from Clerk
    userId, // Clerk User ID
    shouldRedirectToOnboarding,
    multiUserMode: clerkMultiUserMode, // Assuming multi-user with Clerk
  };
}

export function AdminRoute({ Component, hideUserMenu = false }) {
  const { isAuthd, isLoading, shouldRedirectToOnboarding } = useIsAuthenticatedWithClerk();
  const { user } = useUser(); // Get Clerk user object

  if (isLoading) return <FullScreenLoader />;

  if (shouldRedirectToOnboarding) { // Keep this, but might need review later
    return <Navigate to={paths.onboarding.home()} />;
  }

  // Check for authentication and admin role
  // Roles are stored in user.publicMetadata.role
  const isAdmin = user?.publicMetadata?.role === 'admin';

  if (!isAuthd) {
    return <Navigate to="/sign-in" />;
  }

  if (!isAdmin) {
    // Not an admin, redirect to home or an "access denied" page
    // For now, redirect to the main page (landing page or user dashboard)
    return <Navigate to="/" />;
  }

  // If authenticated and is an admin
  return hideUserMenu ? (
    <KeyboardShortcutWrapper>
      <Component />
    </KeyboardShortcutWrapper>
  ) : (
    <KeyboardShortcutWrapper>
      <UserMenu> {/* UserMenu is a simple wrapper now */}
        <Component />
      </UserMenu>
    </KeyboardShortcutWrapper>
  );
}

export function ManagerRoute({ Component }) {
  const { isAuthd, isLoading, shouldRedirectToOnboarding } = useIsAuthenticatedWithClerk();
  const { user } = useUser(); // Get Clerk user object

  if (isLoading) return <FullScreenLoader />;

  if (shouldRedirectToOnboarding) { // Keep this, but might need review later
    return <Navigate to={paths.onboarding.home()} />;
  }

  // Check for authentication and manager/admin role
  // Roles are stored in user.publicMetadata.role
  const userRole = user?.publicMetadata?.role;
  const isManagerOrAdmin = userRole === 'manager' || userRole === 'admin';

  if (!isAuthd) {
    return <Navigate to="/sign-in" />;
  }

  if (!isManagerOrAdmin) {
    // Not a manager or admin, redirect to home
    return <Navigate to="/" />;
  }

  // If authenticated and is a manager or admin
  return (
    <KeyboardShortcutWrapper>
      <UserMenu> {/* UserMenu is a simple wrapper */}
        <Component />
      </UserMenu>
    </KeyboardShortcutWrapper>
  );
}

export default function PrivateRoute({ Component }) {
  const { isAuthd, isLoading, shouldRedirectToOnboarding } = useIsAuthenticatedWithClerk();

  if (isLoading) return <FullScreenLoader />; // Use isLoading from Clerk

  if (shouldRedirectToOnboarding) { // Keep this for now
    return <Navigate to="/onboarding" />;
  }

  return isAuthd ? (
    <KeyboardShortcutWrapper>
      <UserMenu> {/* UserMenu will need Clerk updates later */}
        <Component />
      </UserMenu>
    </KeyboardShortcutWrapper>
  ) : (
    <Navigate to="/sign-in" /> // Redirect to Clerk's sign-in page
  );
}
