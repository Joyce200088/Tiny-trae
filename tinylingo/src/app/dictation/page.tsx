'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Volume2, Send, Eye, EyeOff, Settings, X, Play, Pause, RotateCcw } from 'lucide-react';



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
  // 添加发音类型状态 (0: 美音, 1: 英音)
  const [pronunciationType, setPronunciationType] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 音频相关的refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const nextAudioRef = useRef<HTMLAudioElement | null>(null);

  const currentWord = mockWords[currentWordIndex];
  const previousWord = currentWordIndex > 0 ? mockWords[currentWordIndex - 1] : null;
  const nextWord = currentWordIndex < mockWords.length - 1 ? mockWords[currentWordIndex + 1] : null;
  const currentStickerImage = getStickerImage(currentWord.english);

  // 生成有道词典音频URL
  const getYoudaoAudioUrl = (word: string, type: number = 0) => {
    return `http://dict.youdao.com/dictvoice?type=${type}&audio=${encodeURIComponent(word)}`;
  };

  // 音频播放函数
  const playAudio = async () => {
    if (!audioRef.current) return;
    
    try {
      setIsLoading(true);
      setIsPlaying(true);
      await audioRef.current.play();
    } catch (error) {
      console.error('音频播放失败:', error);
      setIsPlaying(false);
    } finally {
      setIsLoading(false);
    }
  };

  // 暂停音频
  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  // 重播音频
  const replayAudio = async () => {
    if (!audioRef.current) return;
    
    try {
      audioRef.current.currentTime = 0;
      setIsLoading(true);
      setIsPlaying(true);
      await audioRef.current.play();
    } catch (error) {
      console.error('音频重播失败:', error);
      setIsPlaying(false);
    } finally {
      setIsLoading(false);
    }
  };

  // 预加载下一个音频
  const preloadNextAudio = () => {
    if (nextWord && nextAudioRef.current) {
      nextAudioRef.current.src = getYoudaoAudioUrl(nextWord.english, pronunciationType);
      nextAudioRef.current.load();
      // 预加载前几秒
      nextAudioRef.current.addEventListener('canplaythrough', () => {
        if (nextAudioRef.current) {
          nextAudioRef.current.currentTime = 0;
        }
      }, { once: true });
    }
  };





  useEffect(() => {
    setProgress(((currentWordIndex + 1) / mockWords.length) * 100);
    
    // 初始化当前音频
    if (audioRef.current) {
      audioRef.current.src = getYoudaoAudioUrl(currentWord.english, pronunciationType);
      audioRef.current.load();
      
      // 音频加载完成后自动播放
      const handleCanPlay = () => {
        playAudio();
      };
      
      // 音频播放结束时的处理
      const handleEnded = () => {
        setIsPlaying(false);
      };
      
      audioRef.current.addEventListener('canplaythrough', handleCanPlay);
      audioRef.current.addEventListener('ended', handleEnded);
      
      // 清理事件监听器
      return () => {
        if (audioRef.current) {
          audioRef.current.removeEventListener('canplaythrough', handleCanPlay);
          audioRef.current.removeEventListener('ended', handleEnded);
        }
      };
    }
    
    // 预加载下一个音频
    preloadNextAudio();
  }, [currentWordIndex, pronunciationType]);

  const handlePreviousWord = () => {
    if (currentWordIndex > 0) {
      // 停止当前音频
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
      
      setCurrentWordIndex(currentWordIndex - 1);
      setUserInput('');
      // 音频会在useEffect中自动播放
    }
  };

  const handleNextWord = () => {
    if (currentWordIndex < mockWords.length - 1) {
      // 停止当前音频
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
      
      setCurrentWordIndex(currentWordIndex + 1);
      setUserInput('');
      // 音频会在useEffect中自动播放
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
        <div className="flex items-center">
          {previousWord && (
            <div 
              onClick={handlePreviousWord}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
              style={{ backgroundColor: '#FFFBF5' }}
            >
              <ArrowLeft className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-800">
                {previousWord.english} {previousWord.chinese}
              </span>
            </div>
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
      <div className="flex-1 flex flex-col items-center justify-start px-4 pt-0 pb-4">
        {/* Fixed height image area */}
        <div className="w-45 h-45 mb-3 flex items-center justify-center">
          {currentStickerImage && (
            <img 
              src={`/${currentStickerImage}`}
              alt={currentWord.english}
              className="w-45 h-45 object-contain"
            />
          )}
        </div>
        
        {/* Content area with fixed positioning */}
        <div className="flex flex-col items-center mb-6">
          {/* Chinese word */}
          <div className="mb-3 h-10 flex items-center">
            {!hideChinese && (
              <h1 className="text-3xl font-bold text-gray-900">
                {currentWord.chinese}
              </h1>
            )}
          </div>
          
          {/* Pronunciation and part of speech */}
          <div className="flex items-center space-x-3 mb-4">
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
          
          {/* Audio controls */}
          <div className="flex items-center justify-center space-x-3 mb-2">
            <button
              onClick={isPlaying ? pauseAudio : playAudio}
              disabled={isLoading}
              className="p-3 text-gray-800 rounded-full hover:opacity-80 transition-colors flex items-center justify-center disabled:opacity-50"
              style={{ backgroundColor: '#FAF4ED' }}
              title={isPlaying ? "暂停播放" : "播放音频"}
            >
              {isLoading ? (
                <Volume2 className="w-5 h-5 animate-pulse" />
              ) : isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5" />
              )}
            </button>
            <button
              onClick={replayAudio}
              disabled={isLoading}
              className="p-3 text-gray-800 rounded-full hover:opacity-80 transition-colors flex items-center justify-center disabled:opacity-50"
              style={{ backgroundColor: '#FAF4ED' }}
              title="重播音频"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
            {/* 发音类型切换按钮 */}
            <button
              onClick={() => setPronunciationType(pronunciationType === 0 ? 1 : 0)}
              className="px-3 py-2 text-sm text-gray-800 rounded-full hover:opacity-80 transition-colors"
              style={{ backgroundColor: '#FAF4ED' }}
              title={pronunciationType === 0 ? "切换到英音" : "切换到美音"}
            >
              {pronunciationType === 0 ? "美音" : "英音"}
            </button>
          </div>
        </div>

        {/* Input form */}
        <div className="w-full max-w-md mb-6 flex justify-center">
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
          <div className="mb-3">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-40">
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
      
      {/* Audio elements */}
      <audio ref={audioRef} preload="auto" />
      <audio ref={nextAudioRef} preload="auto" />
    </div>
  );
}