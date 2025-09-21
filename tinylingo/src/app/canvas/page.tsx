'use client'

import React, { useState } from 'react'
import StickerGenerator from '@/components/StickerGenerator'

export default function CanvasPage() {
  const [generatedStickers, setGeneratedStickers] = useState<any[]>([])

  const handleStickerGenerated = (stickers: any[]) => {
    setGeneratedStickers(stickers)
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <StickerGenerator onStickerGenerated={handleStickerGenerated} />
      </div>
    </div>
  )
}