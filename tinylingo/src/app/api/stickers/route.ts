import { NextRequest, NextResponse } from 'next/server';

// Mock sticker data - in production, this would come from a database
const mockStickers = [
  {
      id: '1',
      name: 'Soccer Ball',
      chinese: '足球',
      phonetic: '/ˈsɑːkər bɔːl/',
      category: 'Sports Equipment',
      tags: ['Cartoon'],
      thumbnailUrl: '/Soccer Ball.png',
      createdAt: '2024-01-15',
      sorted: true,
      notes: 'A spherical ball used in the sport of soccer (football), typically made of leather or synthetic materials with a distinctive black and white pattern.',
      mnemonic: 'Soccer来自Association Football的缩写，Ball指球形物体',
      isCollected: false,
      rarity: 'common'
    },
    {
      id: '2',
      name: 'Basketball',
      chinese: '篮球',
      phonetic: '/ˈbæskɪtbɔːl/',
      category: 'Sports Equipment',
      tags: ['Realistic'],
      thumbnailUrl: '/Basketball.png',
      createdAt: '2024-01-15',
      sorted: true,
      notes: 'An orange ball with distinctive lines used in basketball, designed to bounce consistently and provide good grip for players.',
      mnemonic: 'Basket（篮子） + Ball（球） = 投入篮子的球类运动',
      isCollected: true,
      rarity: 'common'
    },
    {
      id: '3',
      name: 'Tennis Racket',
      chinese: '网球拍',
      phonetic: '/ˈtenɪs ˈrækɪt/',
      category: 'Sports Equipment',
      tags: ['Pixel'],
      thumbnailUrl: '/Tennis Racket.png',
      createdAt: '2024-01-15',
      sorted: true,
      notes: 'A racket used to hit a tennis ball, consisting of a handle and a circular frame with strings stretched across it.',
      mnemonic: 'Tennis（网球） + Racket（球拍） = 网球运动使用的击球工具',
      isCollected: false,
      rarity: 'rare'
    },
    {
      id: '4',
      name: 'Baseball Glove',
      chinese: '棒球手套',
      phonetic: '/ˈbeɪsbɔːl ɡlʌv/',
      category: 'Sports Equipment',
      tags: ['Ai-generated'],
      thumbnailUrl: '/Baseball Glove.png',
      createdAt: '2024-01-15',
      sorted: true,
      notes: 'A large leather glove worn by baseball players to catch and field balls, with a deep pocket and webbing between fingers.',
      mnemonic: 'Baseball（棒球） + Glove（手套） = 棒球运动中接球用的专用手套',
      isCollected: true,
      rarity: 'uncommon'
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
      chinese: '',
      phonetic: '',
      category,
      tags: tags || [],
      thumbnailUrl: imageUrl,
      imageUrl,
      createdAt: new Date().toISOString(),
      sorted: false,
      notes: '',
      mnemonic: '',
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