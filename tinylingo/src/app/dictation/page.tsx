'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Volume2, Send, Eye, EyeOff, Settings, X } from 'lucide-react';



// 模拟单词数据
const mockWords = [
  {
    id: '1',
    chinese: '杯子',
    english: 'cup',
    partOfSpeech: '名词',
    pronunciation: '/kʌp/'
  },
  {
    id: '2',
    chinese: '桌子',
    english: 'table',
    partOfSpeech: '名词',
    pronunciation: '/ˈteɪbl/'
  },
  {
    id: '3',
    chinese: '美丽的',
    english: 'beautiful',
    partOfSpeech: '形容词',
    pronunciation: '/ˈbjuːtɪfl/'
  },
  {
    id: '4',
    chinese: '跑步',
    english: 'run',
    partOfSpeech: '动词',
    pronunciation: '/rʌn/'
  },
  {
    id: '5',
    chinese: '快乐地',
    english: 'happily',
    partOfSpeech: '副词',
    pronunciation: '/ˈhæpɪli/'
  }
];

export default function DictationPage() {
  // 根据英文单词获取对应的贴纸图片
  const getStickerImage = (englishWord: string) => {
    // 图片文件名映射（根据public目录中的实际文件名）
    const imageMap: { [key: string]: string } = {
      'cup': 'Ceramic Mug.png',
      'calendar': 'Calendar.png',
      'mask': 'Diving Mask.png',
      'shelf': 'Industrial Shelving.png'
    };
    
    return imageMap[englishWord.toLowerCase()] || null;
  };
   
   const router = useRouter();
   const searchParams = useSearchParams();

  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [progress, setProgress] = useState(0);
  const [hideChinese, setHideChinese] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const currentWord = mockWords[currentWordIndex];
  const previousWord = currentWordIndex > 0 ? mockWords[currentWordIndex - 1] : null;
  const currentStickerImage = getStickerImage(currentWord.english);





  useEffect(() => {
    setProgress(((currentWordIndex + 1) / mockWords.length) * 100);
  }, [currentWordIndex]);

  const handlePreviousWord = () => {
    if (currentWordIndex > 0) {
      setCurrentWordIndex(currentWordIndex - 1);
      setUserInput('');
    }
  };

  const handleNextWord = () => {
    if (currentWordIndex < mockWords.length - 1) {
      setCurrentWordIndex(currentWordIndex + 1);
      setUserInput('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 处理提交逻辑
    if (userInput.toLowerCase().trim() === currentWord.english.toLowerCase()) {
      // 正确答案
      if (currentWordIndex < mockWords.length - 1) {
        handleNextWord();
      } else {
        // 完成所有单词
        alert('恭喜完成所有单词听写！');
      }
    } else {
      // 错误答案
      alert('答案不正确，请再试一次');
    }
  };

  const handleReturn = () => {
    router.back();
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#FFFBF5' }}>
      {/* Top navigation bar */}
      <div className="flex items-center justify-between p-4" style={{ backgroundColor: '#FFFBF5' }}>
        {/* Left: Previous word navigation */}
        <div className="flex items-center space-x-3">
          {previousWord && (
            <>
              <button
                onClick={handlePreviousWord}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="text-sm">
                <div className="text-gray-600">{previousWord.chinese}</div>
                <div className="text-gray-400">{previousWord.english}</div>
              </div>
            </>
          )}
        </div>

        {/* Right: Settings and return */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setHideChinese(!hideChinese)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            title={hideChinese ? "显示中文意思" : "隐藏中文意思"}
          >
            {hideChinese ? (
              <EyeOff className="w-5 h-5 text-gray-600" />
            ) : (
              <Eye className="w-5 h-5 text-gray-600" />
            )}
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <Settings className="w-5 h-5 text-gray-600" />
          </button>
          <button
            onClick={handleReturn}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8" style={{ transform: 'translateY(-108px)' }}>
        {/* Sticker image and Chinese word */}
        <div className="flex flex-col items-center mb-8">
          {/* Sticker image */}
          {currentStickerImage && (
            <div className="mb-2">
              <img 
                src={`/${currentStickerImage}`}
                alt={currentWord.english}
                className="w-45 h-45 object-contain"
              />
            </div>
          )}
          
          {/* Chinese word */}
          <div className="mb-2 h-12 flex items-center">
            {!hideChinese && (
              <h1 className="text-3xl font-bold text-gray-900">
                {currentWord.chinese}
              </h1>
            )}
          </div>
          
          {/* Pronunciation and part of speech */}
          <div className="flex items-center space-x-3">
            <div className="text-lg text-gray-600">
              {currentWord.pronunciation}
            </div>
            <span 
              className="px-3 py-1 text-sm rounded-full text-gray-700"
              style={{ backgroundColor: '#FAF4ED' }}
            >
              {currentWord.partOfSpeech}
            </span>
          </div>
        </div>

        {/* Input form */}
        <div className="w-full max-w-md mb-8 flex justify-center">
          <form onSubmit={handleSubmit} className="flex items-center space-x-3">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="请输入英文单词..."
              className="px-2 py-3 text-lg border-0 border-b border-gray-400 bg-transparent focus:outline-none focus:border-gray-400 text-center w-130"
              autoFocus
            />
            <button
              type="submit"
              className="p-3 text-gray-800 rounded-full hover:opacity-80 transition-colors flex items-center justify-center"
              style={{ backgroundColor: '#FAF4ED' }}
              title="提交答案"
            >
              <Send size={20} />
            </button>
          </form>
        </div>

        {/* Progress and instructions */}
        <div className="w-full max-w-md text-center">
          {/* Progress bar */}
          <div className="mb-4">
            <div className="w-4/5 mx-auto">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>进度</span>
                <span>{currentWordIndex + 1} / {mockWords.length}</span>
              </div>
              <div className="w-full rounded-full h-2" style={{ backgroundColor: '#FAF4ED' }}>
                <div 
                  className="h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%`, backgroundColor: '#ece4da' }}
                ></div>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="text-sm text-gray-600">
            <p>
              平板可手写输入，其他设备可利用输入法听写
            </p>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm border-0" style={{ borderBottom: 'none' }}>
            <div className="flex justify-between items-center mb-4 border-b-0" style={{ borderBottom: 'none' }}>
              <h3 className="text-lg font-semibold">设置</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  显示发音
                </label>
                <input type="checkbox" className="rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  自动播放发音
                </label>
                <input type="checkbox" className="rounded" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}