'use client';

import Link from 'next/link';
import { User, Trash2, Settings, LogOut } from 'lucide-react';
import { useState } from 'react';

export default function Nav() {
  const username = "Joyce"; // 临时硬编码，后续从用户状态获取
  const [showUserMenu, setShowUserMenu] = useState(false);

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

        {/* User Info with Dropdown Menu */}
        <div className="relative">
          <div 
            className="flex items-center space-x-3 hover:opacity-80 transition-opacity cursor-pointer"
            onMouseEnter={() => setShowUserMenu(true)}
            onMouseLeave={() => setShowUserMenu(false)}
          >
            <Link href={`/u/${username.toLowerCase()}`} className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-gray-600" />
              </div>
              <span className="text-gray-700 font-medium">Hi, {username}</span>
            </Link>
          </div>

          {/* Dropdown Menu */}
          {showUserMenu && (
            <div 
              className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50"
              onMouseEnter={() => setShowUserMenu(true)}
              onMouseLeave={() => setShowUserMenu(false)}
            >
              <div className="py-2">
                <Link 
                  href={`/u/${username.toLowerCase()}`}
                  className="flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <User className="w-4 h-4" />
                  <span>个人主页</span>
                </Link>
                <Link 
                  href="/trash"
                  className="flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Trash</span>
                </Link>
                <Link 
                  href="/settings"
                  className="flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  <span>设置</span>
                </Link>
                <button 
                  className="flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors w-full text-left"
                  onClick={() => {
                    // TODO: 实现退出登录逻辑
                    console.log('退出登录');
                  }}
                >
                  <LogOut className="w-4 h-4" />
                  <span>退出登录</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}