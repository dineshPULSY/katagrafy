import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';

// Initialize Stripe.js with your publishable key
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const plans = [
  {
    name: 'Starter',
    prompts: '100 prompts per month',
    monthlyPrice: '$3.99',
    yearlyPrice: '$40.70',
    monthlyPriceId: 'price_1PTDOEBW9IshQPOYIY96dpIY', // From issue
    yearlyPriceId: 'price_1PuUW9BW9IshQPOYxjEGWGdx',  // From issue
    features: ['Feature A', 'Feature B'],
  },
  {
    name: 'Basic',
    prompts: '500 prompts per month',
    monthlyPrice: '$9.99',
    yearlyPrice: '$101.90',
    monthlyPriceId: 'price_1PRPTDBW9IshQPOY344HAEeB', // From issue
    yearlyPriceId: 'price_1PuUXgBW9IshQPOYqPLPbsvn',  // From issue
    features: ['Feature A', 'Feature B', 'Feature C'],
  },
  {
    name: 'Pro',
    prompts: '1000 prompts per month',
    monthlyPrice: '$19.99',
    yearlyPrice: '$203.88',
    monthlyPriceId: 'price_1PRPUnBW9IshQPOY8lWSpbpb', // From issue
    yearlyPriceId: 'price_1PXbcfBW9IshQPOYIVhgP6lD',  // From issue
    features: ['Feature A', 'Feature B', 'Feature C', 'Feature D'],
  },
];

export default function PricingPage() {
  const { user, isSignedIn, isLoaded } = useUser();
  const navigate = useNavigate();

  const handleChoosePlan = async (priceId) => {
    if (!isLoaded) return; // Wait for Clerk to load

    if (!isSignedIn) {
      navigate('/sign-in?redirect_url=/pricing'); // Redirect to sign-in, then back to pricing
      return;
    }

    try {
      // Get the Stripe.js instance
      const stripe = await stripePromise;
      if (!stripe) {
        console.error("Stripe.js hasn't loaded yet.");
        return;
      }

      // 1. Call your backend to create the Checkout session
      // This endpoint doesn't exist yet, this is a placeholder for the request
      const response = await fetch('/api/stripe/create-checkout-session', { // IMPORTANT: This API endpoint will be created in a later step
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // We'll need to send the Clerk token for backend auth
          // Authorization: `Bearer ${await user.getIdToken()}` // Or however you manage Clerk session token
        },
        body: JSON.stringify({
          priceId: priceId,
          userId: user.id // Send Clerk User ID
          // email: user.primaryEmailAddress.emailAddress // Optionally send email
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error creating checkout session:', errorData);
        // TODO: Show error message to user
        return;
      }

      const session = await response.json();

      // 2. When the customer clicks on the button, redirect them to Checkout.
      const { error } = await stripe.redirectToCheckout({
        sessionId: session.id, // session.id is the Checkout Session ID from the backend
      });

      if (error) {
        // If `redirectToCheckout` fails due to a browser issue or non-retryable error.
        console.warn('Error redirecting to checkout:', error);
        // TODO: Show error message to user
      }
    } catch (error) {
      console.error('Checkout error:', error);
      // TODO: Show error message to user
    }
  };

  return (
     <div className="container mx-auto px-4 py-12">
       <h1 className="text-4xl font-bold text-center mb-12">Choose Your Plan</h1>
       { !isLoaded && <p>Loading user status...</p> }
       <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         {plans.map((plan) => (
           <div key={plan.name} className="border rounded-lg p-6 shadow-lg flex flex-col">
             <h2 className="text-2xl font-semibold mb-2">{plan.name}</h2>
             <p className="text-gray-600 mb-1">{plan.prompts}</p>
             <div className="mb-4">
                <p className="text-3xl font-bold">{plan.monthlyPrice}<span className="text-sm font-normal">/month</span></p>
                <p className="text-sm text-gray-500">or {plan.yearlyPrice} billed yearly</p>
             </div>
             <ul className="mb-6 space-y-2 text-gray-700 flex-grow">
               {plan.features.map((feature, index) => (
                 <li key={index} className="flex items-center">
                   <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                     <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                   </svg>
                   {feature}
                 </li>
               ))}
             </ul>
             <button
               onClick={() => handleChoosePlan(plan.monthlyPriceId)}
               disabled={!isLoaded}
               className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-4 w-full disabled:opacity-50"
             >
               Choose Monthly
             </button>
             <button
               onClick={() => handleChoosePlan(plan.yearlyPriceId)}
               disabled={!isLoaded}
               className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mt-2 w-full disabled:opacity-50"
             >
               Choose Yearly
             </button>
           </div>
         ))}
       </div>
     </div>
   );
}
