import React, { useState, useEffect } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react'; // useAuth for getToken
import { Link } from 'react-router-dom';

export default function DashboardPage() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const { getToken, isLoaded: isAuthLoaded } = useAuth(); // For getting Clerk token
  const [subscription, setSubscription] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isUserLoaded && isAuthLoaded && user) {
      // Simulate fetching subscription data
      // In a real app, this would be an API call:
      // const token = await getToken();
      // fetch('/api/user/subscription-status', { headers: { 'Authorization': `Bearer ${token}` } })
      //   .then(res => res.json())
      //   .then(data => {
      //     setSubscription(data);
      //     setIsLoading(false);
      //   })
      //   .catch(err => {
      //     console.error("Error fetching subscription", err);
      //     setIsLoading(false);
      //   });

      // Mock data for now:
      setTimeout(() => {
        setSubscription({
          planName: 'Basic',
          promptsUsed: 42,
          promptsQuota: 500,
          nextBillingDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toLocaleDateString(), // Approx 25 days from now
          status: 'active'
        });
        setIsLoading(false);
      }, 1000);
    }
  }, [isUserLoaded, isAuthLoaded, user, getToken]);

  const handleManageSubscription = async () => {
    if (!user) return;

    try {
      const token = await getToken(); // Get Clerk JWT
      const response = await fetch('/api/stripe/create-portal-session', { // IMPORTANT: This API endpoint will be created later
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        // The backend will get the Stripe Customer ID from the Clerk user ID (via metadata or our DB)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error creating portal session:', errorData);
        // TODO: Show error to user
        return;
      }

      const { url } = await response.json();
      window.location.href = url; // Redirect to Stripe Customer Portal
    } catch (error) {
      console.error('Error managing subscription:', error);
      // TODO: Show error to user
    }
  };

  if (isLoading || !isUserLoaded || !isAuthLoaded) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p>No active subscription found.</p>
        <Link to="/pricing" className="text-blue-500 hover:underline">View Pricing Plans</Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">User Dashboard</h1>

      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Welcome, {user?.firstName || user?.emailAddresses[0]?.emailAddress}!</h2>
        <p><strong>Current Plan:</strong> {subscription.planName}</p>
        <p><strong>Subscription Status:</strong> <span className={`capitalize font-semibold ${subscription.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>{subscription.status}</span></p>
        <p><strong>Prompts Used:</strong> {subscription.promptsUsed} / {subscription.promptsQuota}</p>
        <p><strong>Next Billing Date:</strong> {subscription.nextBillingDate}</p>
      </div>

      <button
        onClick={handleManageSubscription}
        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
      >
        Manage Subscription
      </button>
    </div>
  );
}
