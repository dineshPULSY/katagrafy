import React from 'react';
import { Link } from 'react-router-dom';

export default function PaymentCancelPage() {
  return (
    <div className="container mx-auto px-4 py-12 text-center">
      <h1 className="text-3xl font-bold text-red-600 mb-4">Payment Cancelled</h1>
      <p className="text-lg mb-8">Your payment process was cancelled. You have not been charged.</p>
      <Link to="/pricing" className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">
        View Pricing Plans
      </Link>
    </div>
  );
}
