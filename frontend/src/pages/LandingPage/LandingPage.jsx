import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6">
      <header className="text-center mb-12">
        <h1 className="text-5xl font-bold text-gray-800 mb-4">Welcome to Your SaaS Solution</h1>
        <p className="text-xl text-gray-600">The best way to manage your prompts and boost your productivity.</p>
      </header>
      <main className="text-center">
        <button
          onClick={() => navigate('/sign-up')}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-lg shadow-lg transform hover:scale-105 transition-transform duration-150"
        >
          Get Started
        </button>
      </main>
      <footer className="mt-16 text-center text-gray-500">
        <p>&copy; 2024 Your Company. All rights reserved.</p>
      </footer>
    </div>
  );
}
