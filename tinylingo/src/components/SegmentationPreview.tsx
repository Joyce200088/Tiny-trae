'use client';

import { useState, useEffect } from 'react';
import { Check, Eye, Download, Sliders } from 'lucide-react';
import { SegmentationResult, getSegmentationStats } from '@/lib/segmentation';

interface SegmentationPreviewProps {
  segments: SegmentationResult[];
  onSelectionChange: (selectedIds: string[]) => void;
  onProcessSelected: () => void;
  isProcessing?: boolean;
}

export default function SegmentationPreview({
  segments,
  onSelectionChange,
  onProcessSelected,
  isProcessing = false
}: SegmentationPreviewProps) {
  const [selectedSegments, setSelectedSegments] = useState<string[]>([]);
  const [minAreaFilter, setMinAreaFilter] = useState(100);
  const [showStats, setShowStats] = useState(false);

  // Filter segments by minimum area
  const filteredSegments = segments.filter(segment => segment.area >= minAreaFilter);
  const stats = getSegmentationStats(filteredSegments);

  // Update parent when selection changes
  useEffect(() => {
    onSelectionChange(selectedSegments);
  }, [selectedSegments, onSelectionChange]);

  const handleSegmentSelect = (segmentId: string) => {
    setSelectedSegments(prev => 
      prev.includes(segmentId) 
        ? prev.filter(id => id !== segmentId)
        : [...prev, segmentId]
    );
  };

  const handleSelectAll = () => {
    if (selectedSegments.length === filteredSegments.length) {
      setSelectedSegments([]);
    } else {
      setSelectedSegments(filteredSegments.map(s => s.id));
    }
  };

  const handleSelectByArea = (minArea: number) => {
    const largeSegments = filteredSegments
      .filter(s => s.area >= minArea)
      .map(s => s.id);
    setSelectedSegments(largeSegments);
  };

  if (segments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="text-sm">No segments detected</div>
        <div className="text-xs mt-1">Try uploading an image with clear objects</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="bg-gray-50 rounded-lg p-3 space-y-3">
        {/* Area Filter */}
        <div>
          <label className="text-xs font-medium text-gray-700 mb-1 block">
            Minimum Area: {minAreaFilter}px
          </label>
          <input
            type="range"
            min="50"
            max="2000"
            step="50"
            value={minAreaFilter}
            onChange={(e) => setMinAreaFilter(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Quick Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSelectAll}
              className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
            >
              {selectedSegments.length === filteredSegments.length ? 'Deselect All' : 'Select All'}
            </button>
            <button
              onClick={() => handleSelectByArea(500)}
              className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
            >
              Large Objects
            </button>
          </div>
          
          <button
            onClick={() => setShowStats(!showStats)}
            className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 flex items-center space-x-1"
          >
            <Sliders className="w-3 h-3" />
            <span>Stats</span>
          </button>
        </div>

        {/* Statistics */}
        {showStats && (
          <div className="bg-white rounded p-2 text-xs space-y-1">
            <div className="flex justify-between">
              <span>Total Segments:</span>
              <span className="font-medium">{stats.totalSegments}</span>
            </div>
            <div className="flex justify-between">
              <span>Filtered:</span>
              <span className="font-medium">{filteredSegments.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Average Area:</span>
              <span className="font-medium">{stats.averageArea}px</span>
            </div>
            <div className="flex justify-between">
              <span>Largest:</span>
              <span className="font-medium">{stats.largestArea}px</span>
            </div>
          </div>
        )}
      </div>

      {/* Segments Grid */}
      <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto">
        {filteredSegments.map((segment) => (
          <div
            key={segment.id}
            className={`relative border-2 rounded-lg overflow-hidden cursor-pointer transition-all ${
              selectedSegments.includes(segment.id)
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => handleSegmentSelect(segment.id)}
          >
            {/* Selection Indicator */}
            <div className="absolute top-1 left-1 z-10">
              <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                selectedSegments.includes(segment.id)
                  ? 'bg-blue-500 border-blue-500'
                  : 'bg-white border-gray-300'
              }`}>
                {selectedSegments.includes(segment.id) && (
                  <Check className="w-2.5 h-2.5 text-white" />
                )}
              </div>
            </div>

            {/* Preview Image */}
            <div className="aspect-square bg-gray-100 flex items-center justify-center p-2">
              <img
                src={segment.preview}
                alt={`Segment ${segment.id}`}
                className="max-w-full max-h-full object-contain"
              />
            </div>

            {/* Segment Info */}
            <div className="p-2 bg-white">
              <div className="text-xs text-gray-600 space-y-0.5">
                <div className="flex justify-between">
                  <span>Area:</span>
                  <span className="font-medium">{segment.area}px</span>
                </div>
                <div className="flex justify-between">
                  <span>Size:</span>
                  <span className="font-medium">
                    {segment.bbox.width}×{segment.bbox.height}
                  </span>
                </div>
              </div>
            </div>

            {/* Hover Actions */}
            <div className="absolute top-1 right-1 opacity-0 hover:opacity-100 transition-opacity">
              <div className="flex space-x-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // Preview functionality
                  }}
                  className="p-1 bg-white bg-opacity-80 rounded hover:bg-opacity-100"
                >
                  <Eye className="w-3 h-3 text-gray-600" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // Download functionality
                    const link = document.createElement('a');
                    link.download = `segment_${segment.id}.png`;
                    link.href = segment.preview;
                    link.click();
                  }}
                  className="p-1 bg-white bg-opacity-80 rounded hover:bg-opacity-100"
                >
                  <Download className="w-3 h-3 text-gray-600" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Process Button */}
      {selectedSegments.length > 0 && (
        <button
          onClick={onProcessSelected}
          disabled={isProcessing}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {isProcessing ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Processing {selectedSegments.length} objects...</span>
            </div>
          ) : (
            `Recognize & Save Selected (${selectedSegments.length})`
          )}
        </button>
      )}

      {/* Summary */}
      <div className="text-xs text-gray-500 text-center">
        {filteredSegments.length} objects detected • {selectedSegments.length} selected
      </div>
    </div>
  );
}