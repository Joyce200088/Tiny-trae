'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="space-y-4">
            <Link 
              href="/about" 
              className="block text-gray-300 hover:text-white transition-colors"
            >
              ABOUT US
            </Link>
            <Link 
              href="/projects" 
              className="block text-gray-300 hover:text-white transition-colors"
            >
              PROJECTS
            </Link>
            <Link 
              href="/contacts" 
              className="block text-gray-300 hover:text-white transition-colors"
            >
              CONTACTS
            </Link>
          </div>

          {/* Middle Column */}
          <div className="space-y-4">
            <Link 
              href="/privacy" 
              className="block text-gray-300 hover:text-white transition-colors"
            >
              PRIVACY POLICY
            </Link>
            <Link 
              href="/terms" 
              className="block text-gray-300 hover:text-white transition-colors"
            >
              TERMS OF USE
            </Link>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <Link 
              href="https://facebook.com" 
              className="block text-gray-300 hover:text-white transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              FACEBOOK
            </Link>
            <Link 
              href="https://instagram.com" 
              className="block text-gray-300 hover:text-white transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              INSTAGRAM
            </Link>
            <Link 
              href="https://linkedin.com" 
              className="block text-gray-300 hover:text-white transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              LINKEDIN
            </Link>
            <Link 
              href="/" 
              className="block text-gray-300 hover:text-white transition-colors"
            >
              BACK TO HOME
            </Link>
          </div>
        </div>

        {/* Inquire Button */}
        <div className="flex justify-end mt-8">
          <button className="flex items-center space-x-2 bg-white text-gray-900 px-6 py-2 rounded-full hover:bg-gray-100 transition-colors">
            <span className="font-medium">INQUIRE</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-800 mt-12 pt-8">
          <p className="text-center text-gray-400 text-sm">
            © REVOLUTION 2023. ALL RIGHTS RESERVED.
          </p>
        </div>
      </div>
    </footer>
  );
}