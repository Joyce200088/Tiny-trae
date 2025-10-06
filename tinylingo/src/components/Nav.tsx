'use client';

import Link from 'next/link';
import { UserMenu } from './auth/UserMenu';

export default function Nav() {
  return (
    <nav className="border-b border-black px-6 py-4" style={{backgroundColor: '#FFFBF5'}}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center">
          <Link href="/" className="text-2xl font-bold text-gray-900">
            TinyLingo
          </Link>
        </div>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center space-x-8">
          <Link 
            href="/" 
            className="text-gray-700 hover:text-gray-900 font-medium transition-colors"
          >
            Home
          </Link>
          <Link 
            href="/explore" 
            className="text-gray-700 hover:text-gray-900 font-medium transition-colors"
          >
            Explore
          </Link>
        </div>

        {/* User Menu */}
        <UserMenu />
      </div>
    </nav>
  );
}