'use client';

import Link from 'next/link';
import { Heart, Star } from 'lucide-react';

// 临时模拟数据
const mockWorlds = [
  {
    id: '1',
    name: 'Sweet World',
    coverUrl: '/api/placeholder/300/200',
    wordCount: 15,
    likes: 234,
    favorites: 45,
    ownerId: 'user1'
  },
  {
    id: '2',
    name: 'Pet Paradise',
    coverUrl: '/api/placeholder/300/200',
    wordCount: 28,
    likes: 189,
    favorites: 67,
    ownerId: 'user2'
  },
  {
    id: '3',
    name: 'Kitchen Corner',
    coverUrl: '/api/placeholder/300/200',
    wordCount: 42,
    likes: 156,
    favorites: 23,
    ownerId: 'user3'
  },
  {
    id: '4',
    name: 'Garden Life',
    coverUrl: '/api/placeholder/300/200',
    wordCount: 31,
    likes: 298,
    favorites: 89,
    ownerId: 'user4'
  }
];

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h1 className="text-6xl font-bold text-gray-900 mb-4">
            BUILD IT, LEARN IT
          </h1>
          <p className="text-xl text-gray-600 mb-12">
            Where little words shape great worlds
          </p>
          
          {/* Main CTA Button */}
          <Link 
            href="/create-world"
            className="inline-block bg-black text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-gray-800 transition-colors"
          >
            Create World Now!
          </Link>
        </div>
      </section>

      {/* Worlds Grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {mockWorlds.map((world) => (
              <div key={world.id} className="rounded-lg overflow-hidden hover:shadow-lg transition-shadow border border-black" style={{backgroundColor: '#FFFBF5'}}>
                {/* World Cover */}
                <div className="aspect-video flex items-center justify-center border-b border-black" style={{backgroundColor: '#FFFBF5'}}>
                  <div className="text-gray-500 text-sm">World Preview</div>
                </div>
                
                {/* World Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">{world.name}</h3>
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                    <span>{world.wordCount} Words</span>
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-1">
                        <Heart className="w-4 h-4" />
                        <span>{world.likes}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4" />
                        <span>{world.favorites}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    <button className="flex-1 bg-gray-100 text-gray-700 py-2 px-3 rounded text-sm hover:bg-gray-200 transition-colors">
                      View
                    </button>
                    <button className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                      <Heart className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-yellow-500 transition-colors">
                      <Star className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
