import { NextRequest, NextResponse } from 'next/server';

// Mock world data - in production, this would come from a database
const mockWorlds = [
  {
    id: '1',
    title: 'My First World',
    description: 'A simple world with basic objects',
    thumbnail: '/api/placeholder/300/200',
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
    isPublic: false,
    stickerCount: 5,
    viewCount: 12,
    likeCount: 3,
    tags: ['Cartoon'],
    author: 'user123',
    scenes: [
      {
        id: 'scene1',
        name: 'Main Scene',
        background: '/api/placeholder/800/600',
        objects: [
          { id: 'obj1', type: 'sticker', x: 100, y: 150, stickerId: '1' },
          { id: 'obj2', type: 'sticker', x: 300, y: 200, stickerId: '2' }
        ]
      }
    ]
  },
  {
    id: '2',
    title: 'Animal Kingdom',
    description: 'A world full of cute animals',
    thumbnail: '/api/placeholder/300/200',
    createdAt: '2024-01-16T14:20:00Z',
    updatedAt: '2024-01-17T09:15:00Z',
    isPublic: true,
    stickerCount: 8,
    viewCount: 45,
    likeCount: 12,
    tags: ['Realistic'],
    author: 'user123',
    scenes: [
      {
        id: 'scene1',
        name: 'Forest',
        background: '/api/placeholder/800/600',
        objects: [
          { id: 'obj1', type: 'sticker', x: 150, y: 100, stickerId: '1' },
          { id: 'obj2', type: 'sticker', x: 400, y: 250, stickerId: '3' }
        ]
      }
    ]
  }
];

// GET - Fetch worlds with optional filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const isPublic = searchParams.get('public');
    const author = searchParams.get('author');
    const sortBy = searchParams.get('sortBy') || 'updatedAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    let filteredWorlds = [...mockWorlds];

    // Apply filters
    if (search) {
      const searchLower = search.toLowerCase();
      filteredWorlds = filteredWorlds.filter(w => 
        w.title.toLowerCase().includes(searchLower) ||
        w.description?.toLowerCase().includes(searchLower) ||
        w.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    if (isPublic !== null) {
      const publicFilter = isPublic === 'true';
      filteredWorlds = filteredWorlds.filter(w => w.isPublic === publicFilter);
    }

    if (author) {
      filteredWorlds = filteredWorlds.filter(w => w.author === author);
    }

    // Apply sorting
    filteredWorlds.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'updatedAt':
          aValue = new Date(a.updatedAt).getTime();
          bValue = new Date(b.updatedAt).getTime();
          break;
        case 'viewCount':
          aValue = a.viewCount;
          bValue = b.viewCount;
          break;
        case 'likeCount':
          aValue = a.likeCount;
          bValue = b.likeCount;
          break;
        default:
          aValue = new Date(a.updatedAt).getTime();
          bValue = new Date(b.updatedAt).getTime();
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    // Apply pagination
    const total = filteredWorlds.length;
    const paginatedWorlds = filteredWorlds.slice(offset, offset + limit);

    return NextResponse.json({
      worlds: paginatedWorlds,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      },
      stats: {
        totalWorlds: mockWorlds.length,
        publicWorlds: mockWorlds.filter(w => w.isPublic).length,
        privateWorlds: mockWorlds.filter(w => !w.isPublic).length
      }
    });

  } catch (error) {
    console.error('Worlds GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch worlds' },
      { status: 500 }
    );
  }
}

// POST - Create new world
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      title, 
      description = '', 
      isPublic = false, 
      tags = [],
      author = 'user123',
      scenes = []
    } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    const newWorld = {
      id: (mockWorlds.length + 1).toString(),
      title,
      description,
      thumbnail: '/api/placeholder/300/200',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPublic,
      stickerCount: 0,
      viewCount: 0,
      likeCount: 0,
      tags,
      author,
      scenes: scenes.length > 0 ? scenes : [
        {
          id: 'scene1',
          name: 'Main Scene',
          background: '/api/placeholder/800/600',
          objects: []
        }
      ]
    };

    mockWorlds.push(newWorld);

    return NextResponse.json({
      success: true,
      world: newWorld
    }, { status: 201 });

  } catch (error) {
    console.error('Worlds POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create world' },
      { status: 500 }
    );
  }
}

// PUT - Update world
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'World ID is required' },
        { status: 400 }
      );
    }

    const worldIndex = mockWorlds.findIndex(w => w.id === id);
    if (worldIndex === -1) {
      return NextResponse.json(
        { error: 'World not found' },
        { status: 404 }
      );
    }

    // Update world with new data
    mockWorlds[worldIndex] = {
      ...mockWorlds[worldIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      world: mockWorlds[worldIndex]
    });

  } catch (error) {
    console.error('Worlds PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to update world' },
      { status: 500 }
    );
  }
}

// DELETE - Delete world
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'World ID is required' },
        { status: 400 }
      );
    }

    const worldIndex = mockWorlds.findIndex(w => w.id === id);
    if (worldIndex === -1) {
      return NextResponse.json(
        { error: 'World not found' },
        { status: 404 }
      );
    }

    mockWorlds.splice(worldIndex, 1);

    return NextResponse.json({
      success: true,
      message: 'World deleted successfully'
    });

  } catch (error) {
    console.error('Worlds DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete world' },
      { status: 500 }
    );
  }
}