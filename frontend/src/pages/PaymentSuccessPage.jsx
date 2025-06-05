import React from 'react';
import { Link } from 'react-router-dom';

export default function PaymentSuccessPage() {
  return (
    <div className="container mx-auto px-4 py-12 text-center">
      <h1 className="text-3xl font-bold text-green-600 mb-4">Payment Successful!</h1>
      <p className="text-lg mb-8">Your subscription has been activated. Thank you for your purchase.</p>
      <Link to="/dashboard" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
        Go to Dashboard
      </Link>
    </div>
  );
}
