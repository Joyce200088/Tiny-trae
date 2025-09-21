'use client';

import React, { useState } from 'react';
import { EnglishLearningContent } from '../lib/geminiService';

interface EnglishLearningCardProps {
  content: EnglishLearningContent;
  stickerImage: string;
  onClose?: () => void;
}

const EnglishLearningCard: React.FC<EnglishLearningCardProps> = ({ 
  content, 
  stickerImage, 
  onClose 
}) => {
  const [showExample, setShowExample] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // 文本转语音功能
  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      setIsPlaying(true);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.8;
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);
      speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 max-w-md mx-auto border border-gray-200">
      {/* 关闭按钮 */}
      {onClose && (
        <button
          onClick={onClose}
          className="float-right text-gray-400 hover:text-gray-600 text-xl font-bold"
        >
          ×
        </button>
      )}

      {/* 物品图片 */}
      <div className="text-center mb-4">
        <img
          src={stickerImage}
          alt={content.english}
          className="w-32 h-32 object-contain mx-auto rounded-lg bg-gray-50 p-2"
        />
      </div>

      {/* 英文单词 */}
      <div className="text-center mb-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <h2 className="text-2xl font-bold text-blue-800">
            {content.english}
          </h2>
          <button
            onClick={() => speakText(content.english)}
            disabled={isPlaying}
            className="p-2 rounded-full bg-blue-100 hover:bg-blue-200 transition-colors disabled:opacity-50"
            title="点击发音"
          >
            {isPlaying ? (
              <svg className="w-5 h-5 text-blue-600 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.816L4.846 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.846l3.537-3.816a1 1 0 011.617.816zM16 8a2 2 0 11-4 0 2 2 0 014 0z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.816L4.846 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.846l3.537-3.816a1 1 0 011.617.816zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.414A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </div>
        
        {/* 中文翻译 */}
        <p className="text-lg text-gray-700 mb-4">
          {content.chinese}
        </p>
      </div>

      {/* 例句按钮 */}
      <div className="text-center mb-4">
        <button
          onClick={() => setShowExample(!showExample)}
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
        >
          {showExample ? '隐藏例句' : '📖 查看例句'}
        </button>
      </div>

      {/* 例句内容 */}
      {showExample && (
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="flex items-start gap-2 mb-2">
            <div className="flex-1">
              <p className="text-green-800 font-medium mb-1">
                {content.example}
              </p>
              <p className="text-green-600 text-sm">
                {content.exampleChinese}
              </p>
            </div>
            <button
              onClick={() => speakText(content.example)}
              disabled={isPlaying}
              className="p-1 rounded bg-green-200 hover:bg-green-300 transition-colors disabled:opacity-50 flex-shrink-0"
              title="朗读例句"
            >
              <svg className="w-4 h-4 text-green-700" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.816L4.846 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.846l3.537-3.816a1 1 0 011.617.816zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.414A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* 学习提示 */}
      <div className="mt-4 text-center">
        <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2">
          💡 点击喇叭图标可以听发音，多练习几遍加深记忆！
        </div>
      </div>
    </div>
  );
};

export default EnglishLearningCard;