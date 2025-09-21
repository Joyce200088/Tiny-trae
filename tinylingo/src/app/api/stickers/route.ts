import { NextRequest, NextResponse } from 'next/server';

// Mock sticker data - in production, this would come from a database
const mockStickers = [
  {
    id: '1',
    name: 'Happy Cat',
    category: 'animals',
    tags: ['cat', 'happy', 'cute'],
    imageUrl: '/api/placeholder/100/100',
    createdAt: '2024-01-15T10:30:00Z',
    isCollected: true,
    rarity: 'common'
  },
  {
    id: '2',
    name: 'Red Apple',
    category: 'food',
    tags: ['apple', 'fruit', 'red'],
    imageUrl: '/api/placeholder/100/100',
    createdAt: '2024-01-16T14:20:00Z',
    isCollected: true,
    rarity: 'common'
  },
  {
    id: '3',
    name: 'Blue Car',
    category: 'vehicles',
    tags: ['car', 'blue', 'transport'],
    imageUrl: '/api/placeholder/100/100',
    createdAt: '2024-01-17T09:15:00Z',
    isCollected: false,
    rarity: 'rare'
  },
  {
    id: '4',
    name: 'Sunflower',
    category: 'nature',
    tags: ['flower', 'yellow', 'nature'],
    imageUrl: '/api/placeholder/100/100',
    createdAt: '2024-01-18T16:45:00Z',
    isCollected: true,
    rarity: 'uncommon'
  },
  {
    id: '5',
    name: 'Magic Wand',
    category: 'objects',
    tags: ['magic', 'wand', 'fantasy'],
    imageUrl: '/api/placeholder/100/100',
    createdAt: '2024-01-19T11:30:00Z',
    isCollected: false,
    rarity: 'legendary'
  }
];

// GET - Fetch stickers with optional filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const collected = searchParams.get('collected');
    const rarity = searchParams.get('rarity');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    let filteredStickers = [...mockStickers];

    // Apply filters
    if (category && category !== 'all') {
      filteredStickers = filteredStickers.filter(s => s.category === category);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filteredStickers = filteredStickers.filter(s => 
        s.name.toLowerCase().includes(searchLower) ||
        s.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    if (collected !== null) {
      const isCollected = collected === 'true';
      filteredStickers = filteredStickers.filter(s => s.isCollected === isCollected);
    }

    if (rarity) {
      filteredStickers = filteredStickers.filter(s => s.rarity === rarity);
    }

    // Apply pagination
    const total = filteredStickers.length;
    const paginatedStickers = filteredStickers.slice(offset, offset + limit);

    return NextResponse.json({
      stickers: paginatedStickers,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      },
      categories: ['all', 'animals', 'food', 'vehicles', 'nature', 'objects'],
      rarities: ['common', 'uncommon', 'rare', 'legendary']
    });

  } catch (error) {
    console.error('Stickers GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stickers' },
      { status: 500 }
    );
  }
}

// POST - Add new sticker
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, category, tags, imageUrl, rarity = 'common' } = body;

    if (!name || !category || !imageUrl) {
      return NextResponse.json(
        { error: 'Missing required fields: name, category, imageUrl' },
        { status: 400 }
      );
    }

    const newSticker = {
      id: (mockStickers.length + 1).toString(),
      name,
      category,
      tags: tags || [],
      imageUrl,
      createdAt: new Date().toISOString(),
      isCollected: true,
      rarity
    };

    mockStickers.push(newSticker);

    return NextResponse.json({
      success: true,
      sticker: newSticker
    }, { status: 201 });

  } catch (error) {
    console.error('Stickers POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create sticker' },
      { status: 500 }
    );
  }
}

// PUT - Update sticker collection status
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, isCollected } = body;

    if (!id || typeof isCollected !== 'boolean') {
      return NextResponse.json(
        { error: 'Missing required fields: id, isCollected' },
        { status: 400 }
      );
    }

    const stickerIndex = mockStickers.findIndex(s => s.id === id);
    if (stickerIndex === -1) {
      return NextResponse.json(
        { error: 'Sticker not found' },
        { status: 404 }
      );
    }

    mockStickers[stickerIndex].isCollected = isCollected;

    return NextResponse.json({
      success: true,
      sticker: mockStickers[stickerIndex]
    });

  } catch (error) {
    console.error('Stickers PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to update sticker' },
      { status: 500 }
    );
  }
}