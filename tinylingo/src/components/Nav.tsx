'use client';

import Link from 'next/link';
import { User } from 'lucide-react';

export default function Nav() {
  const username = "Joyce"; // 临时硬编码，后续从用户状态获取

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
            href="/my-stickers" 
            className="text-gray-700 hover:text-gray-900 font-medium transition-colors"
          >
            My stickers
          </Link>
          <Link 
            href="/my-worlds" 
            className="text-gray-700 hover:text-gray-900 font-medium transition-colors"
          >
            My Worlds
          </Link>
          <Link 
            href="/explore" 
            className="text-gray-700 hover:text-gray-900 font-medium transition-colors"
          >
            Explore
          </Link>
          <Link 
            href="/create-world" 
            className="text-gray-700 hover:text-gray-900 font-medium transition-colors"
          >
            Create World
          </Link>
        </div>

        {/* User Info */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#FFFBF5' }}>
            <User className="w-5 h-5 text-gray-600" />
          </div>
          <span className="text-gray-700 font-medium">Hi, {username}</span>
        </div>
      </div>
    </nav>
  );
}