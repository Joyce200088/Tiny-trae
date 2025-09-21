import { NextRequest, NextResponse } from 'next/server';

// Mock AI recognition service - in production, this would connect to a real AI service
const mockRecognitionResults = [
  { confidence: 0.95, label: 'apple', category: 'food' },
  { confidence: 0.88, label: 'car', category: 'vehicle' },
  { confidence: 0.92, label: 'cat', category: 'animal' },
  { confidence: 0.85, label: 'tree', category: 'nature' },
  { confidence: 0.90, label: 'house', category: 'building' },
  { confidence: 0.87, label: 'flower', category: 'nature' },
  { confidence: 0.93, label: 'dog', category: 'animal' },
  { confidence: 0.89, label: 'book', category: 'object' },
];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      );
    }

    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Mock AI recognition - randomly select a result
    const randomResult = mockRecognitionResults[
      Math.floor(Math.random() * mockRecognitionResults.length)
    ];

    // Generate variations for more realistic results
    const variations = [
      randomResult,
      {
        confidence: Math.max(0.6, randomResult.confidence - 0.1),
        label: randomResult.label + ' (variant)',
        category: randomResult.category
      },
      {
        confidence: Math.max(0.5, randomResult.confidence - 0.2),
        label: 'unknown object',
        category: 'misc'
      }
    ].sort((a, b) => b.confidence - a.confidence);

    const response = {
      success: true,
      filename: file.name,
      size: file.size,
      results: variations,
      bestMatch: variations[0],
      processingTime: 1500,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Recognition API error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Recognition processing failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint for recognition capabilities info
export async function GET() {
  return NextResponse.json({
    service: 'AI Object Recognition',
    version: '1.0.0',
    capabilities: [
      'Object detection and classification',
      'Multi-category recognition',
      'Confidence scoring',
      'Batch processing support'
    ],
    supportedFormats: ['image/jpeg', 'image/png', 'image/webp'],
    maxFileSize: '10MB',
    categories: [
      'food', 'vehicle', 'animal', 'nature', 
      'building', 'object', 'person', 'misc'
    ]
  });
}