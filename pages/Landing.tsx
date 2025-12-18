import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui';
import { LayoutDashboard, Shield, Users } from 'lucide-react';

export const Landing: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold">
              F
            </div>
            <span className="text-xl font-bold text-gray-900">FaithConnect</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/auth">
              <Button variant="ghost">Log In</Button>
            </Link>
            <Link to="/auth?mode=signup">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl lg:text-6xl font-bold tracking-tight text-gray-900 mb-6">
            Modern Management for the <span className="text-primary">Global Church</span>
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            A secure, multi-tenant platform designed to connect branches, districts, and national leadership.
            Stream services, manage members, and handle governance with ease.
          </p>
          <div className="flex justify-center gap-4">
            <Link to="/auth?mode=signup">
              <Button size="lg">Start Free Trial</Button>
            </Link>
            <Button variant="secondary" size="lg">Watch Demo</Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-primary mb-6">
                <Users />
              </div>
              <h3 className="text-xl font-bold mb-3">Member Management</h3>
              <p className="text-gray-600">Track attendance, handle transfers, and manage departments across all branches.</p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600 mb-6">
                <Shield />
              </div>
              <h3 className="text-xl font-bold mb-3">Secure Governance</h3>
              <p className="text-gray-600">Role-based access control with strict data scoping for Branch, District, and National admins.</p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 mb-6">
                <LayoutDashboard />
              </div>
              <h3 className="text-xl font-bold mb-3">Unified Dashboard</h3>
              <p className="text-gray-600">Real-time insights into finance, events, and growth metrics from a single portal.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t">
        <div className="container mx-auto px-4 text-center text-gray-500">
          <p>&copy; 2024 FaithConnect. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};