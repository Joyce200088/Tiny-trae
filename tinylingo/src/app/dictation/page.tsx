'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Volume2, Send, Eye, EyeOff, Settings, X, Play, Pause, RotateCcw } from 'lucide-react';

// 贴纸数据接口
interface StickerData {
  id: string;
  name: string;
  chinese?: string;
  phonetic?: string;
  category?: string;
  partOfSpeech?: string; // 词性标签，如：noun, verb, adjective等
  tags?: string[];
  thumbnailUrl?: string;
  imageUrl?: string;
  createdAt?: string;
  sorted?: boolean;
  notes?: string;
  mnemonic?: string;
  example?: string;
  exampleChinese?: string;
}

// 世界数据接口
interface WorldData {
  id: string;
  name: string;
  canvasObjects?: any[];
  selectedBackground?: string;
  canvasSize?: { width: number; height: number };
  previewImage?: string;
  createdAt?: string;
  updatedAt?: string;
}

// 单词数据接口
interface WordData {
  id: string;
  chinese: string;
  english: string;
  partOfSpeech?: string;
  pronunciation?: string;
  imageUrl?: string;
}

// 模拟单词数据（作为后备）
const mockWords: WordData[] = [
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

// 模拟世界数据
const mockWorlds = [
  {
    id: '1',
    name: 'Sweet Kitchen',
    description: 'A cozy kitchen filled with delicious treats',
    coverUrl: '/api/placeholder/400/300',
    wordCount: 24,
    likes: 156,
    favorites: 32,
    isPublic: true,
    createdAt: '2024-01-15',
    lastModified: '2024-01-20'
  },
  {
    id: '2',
    name: 'Pet Paradise',
    description: 'A wonderful world full of cute animals',
    coverUrl: '/api/placeholder/400/300',
    wordCount: 18,
    likes: 89,
    favorites: 21,
    isPublic: false,
    createdAt: '2024-01-10',
    lastModified: '2024-01-18'
  },
  {
    id: '3',
    name: 'Garden Life',
    description: 'Beautiful garden with flowers and plants',
    coverUrl: '/api/placeholder/400/300',
    wordCount: 31,
    likes: 203,
    favorites: 45,
    isPublic: true,
    createdAt: '2024-01-05',
    lastModified: '2024-01-16'
  }
];

// 模拟贴纸数据
const mockStickers: StickerData[] = [
  {
    id: '1',
    name: 'Diving Mask',
    chinese: '潜水镜',
    phonetic: '/ˈdaɪvɪŋ mæsk/',
    category: 'Diving Equipment',
    partOfSpeech: 'noun',
    tags: ['Pixel', 'Ai-generated'],
    thumbnailUrl: '/Diving Mask.png',
    createdAt: '2024-01-15',
    sorted: true,
    notes: 'A tight-fitting face mask with a transparent viewport that allows divers to see clearly underwater while keeping their eyes and nose dry.',
    mnemonic: 'Diving（潜水） + Mask（面罩） = 潜水时保护面部的装备'
  },
  {
    id: '2',
    name: 'Calendar',
    chinese: '日历',
    phonetic: '/ˈkælɪndər/',
    category: 'Daily Items',
    partOfSpeech: 'noun',
    tags: ['Cartoon', 'Ai-generated'],
    thumbnailUrl: '/Calendar.png',
    createdAt: '2024-01-15',
    sorted: true,
    notes: 'A system for organizing and measuring time, typically divided into days, weeks, months, and years, often displayed in a tabular or digital format.',
    mnemonic: '来自拉丁语calendarium（账本），古罗马每月第一天叫calends（朔日），是还账的日子'
  },
  {
    id: '3', 
    name: 'Industrial Shelving',
    chinese: '工业货架',
    phonetic: '/ɪnˈdʌstriəl ˈʃɛlvɪŋ/',
    category: 'Furniture',
    partOfSpeech: 'noun',
    tags: ['Cartoon', 'Ai-generated'],
    thumbnailUrl: '/Industrial Shelving.png',
    createdAt: '2024-01-15',
    sorted: true,
    notes: 'Heavy-duty storage shelves made from durable materials like steel, designed for warehouses and industrial environments to store heavy items.',
    mnemonic: 'Industrial（工业的） + Shelving（架子） = 用于工业环境的坚固存储架'
  },
  {
    id: '4',
    name: 'Ceramic Mug',
    chinese: '陶瓷杯',
    phonetic: '/sɪˈræmɪk mʌɡ/',
    category: 'Kitchenware',
    partOfSpeech: 'noun',
    tags: ['Cartoon', 'Ai-generated'],
    thumbnailUrl: '/Ceramic Mug.png',
    createdAt: '2024-01-15',
    sorted: true,
    notes: 'A drinking vessel made from ceramic material, typically used for hot beverages like coffee or tea.',
    mnemonic: 'Ceramic（陶瓷的） + Mug（杯子） = 用陶瓷制作的饮品杯'
  }
];

export default function DictationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // 状态管理
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [progress, setProgress] = useState(0);
  const [hideChinese, setHideChinese] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [pronunciationType, setPronunciationType] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [words, setWords] = useState<WordData[]>([]);
  const [worldName, setWorldName] = useState<string>('');
  const [showNoWordsWarning, setShowNoWordsWarning] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState<string[]>([]);
  const [incorrectAnswers, setIncorrectAnswers] = useState<{word: string, userAnswer: string}[]>([]);

  // 音频相关的refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const nextAudioRef = useRef<HTMLAudioElement | null>(null);

  // 从世界的canvasObjects中提取单词信息 - 严格限定只使用当前世界的单词贴纸
  const extractWordsFromWorld = (world: WorldData): WordData[] => {
    console.log('开始提取世界单词，世界数据:', world);
    
    if (!world.canvasObjects || world.canvasObjects.length === 0) {
      console.log('世界中没有canvasObjects或为空数组');
      return []; // 如果没有canvasObjects，返回空数组而不是默认单词
    }

    console.log('canvasObjects数量:', world.canvasObjects.length);
    console.log('canvasObjects内容:', world.canvasObjects);

    const extractedWords: WordData[] = [];
    
    world.canvasObjects.forEach((obj, index) => {
      console.log(`检查对象 ${index}:`, obj);
      
      // 检查多种可能的数据结构
      let stickerData = null;
      
      // 方式1: 检查是否是贴纸对象（通常包含sticker或imageObj属性）
      if (obj.sticker || obj.imageObj) {
        stickerData = obj.sticker || obj.imageObj;
        console.log(`对象 ${index} 通过sticker/imageObj找到数据:`, stickerData);
      }
      // 方式2: 检查对象本身是否直接包含单词信息
      else if (obj.name && (obj.chinese || obj.phonetic)) {
        stickerData = obj;
        console.log(`对象 ${index} 直接包含单词信息:`, stickerData);
      }
      // 方式3: 检查是否有其他可能的属性结构
      else if (obj.src && obj.name) {
        // 可能是画布上的贴纸对象，尝试从名称推断
        stickerData = { name: obj.name };
        console.log(`对象 ${index} 是画布贴纸对象:`, stickerData);
      }
      
      if (stickerData) {
        console.log(`处理贴纸数据:`, stickerData);
        
        // 从贴纸数据中提取单词信息 - 放宽验证条件
        if (stickerData.name && typeof stickerData.name === 'string' && stickerData.name.trim() !== '') {
          const wordData: WordData = {
            id: stickerData.id || `word-${index}`,
            english: stickerData.name.trim(),
            chinese: stickerData.chinese?.trim() || stickerData.name.trim(), // 如果没有中文，使用英文作为后备
            pronunciation: stickerData.phonetic || stickerData.pronunciation || '',
            partOfSpeech: stickerData.partOfSpeech || stickerData.category || '',
            imageUrl: stickerData.thumbnailUrl || stickerData.imageUrl || stickerData.src || ''
          };
          
          extractedWords.push(wordData);
          console.log(`成功提取单词:`, wordData);
        } else {
          console.log(`对象 ${index} 缺少必要的name字段或name为空`);
        }
      } else {
        console.log(`对象 ${index} 不是有效的贴纸对象`);
      }
    });

    console.log(`最终提取到 ${extractedWords.length} 个单词:`, extractedWords);
    return extractedWords;
  };

  // 根据英文单词获取对应的贴纸图片
  const getStickerImage = (englishWord: string) => {
    // 首先尝试从当前单词的imageUrl获取
    const currentWordData = words.find(word => word.english.toLowerCase() === englishWord.toLowerCase());
    if (currentWordData && currentWordData.imageUrl) {
      return currentWordData.imageUrl;
    }

    // 图片文件名映射（作为后备）
    const imageMap: { [key: string]: string } = {
      'cup': 'Ceramic Mug.png',
      'calendar': 'Calendar.png',
      'mask': 'Diving Mask.png',
      'shelf': 'Industrial Shelving.png'
    };
    
    return imageMap[englishWord.toLowerCase()] || null;
  };

  // 初始化：从URL参数获取worldId并加载对应世界的单词数据
  useEffect(() => {
    const worldId = searchParams.get('worldId');
    
    if (worldId) {
      const loadWorldData = () => {
        try {
          // 从localStorage获取保存的世界数据
          const savedWorlds = localStorage.getItem('savedWorlds');
          if (savedWorlds) {
            const worlds: WorldData[] = JSON.parse(savedWorlds);
            const targetWorld = worlds.find(world => world.id === worldId);
            
            if (targetWorld) {
              setWorldName(targetWorld.name);
              const extractedWords = extractWordsFromWorld(targetWorld);
              setWords(extractedWords);
              console.log(`从世界 "${targetWorld.name}" 中提取到 ${extractedWords.length} 个单词`);
              
              // 如果没有单词，显示警告提示
              if (extractedWords.length === 0) {
                console.warn(`世界 "${targetWorld.name}" 中没有找到任何单词贴纸`);
                setShowNoWordsWarning(true);
              } else {
                setShowNoWordsWarning(false);
              }
            } else {
              console.warn(`未找到ID为 ${worldId} 的世界`);
              setWorldName('未找到的世界');
              setWords([]);
              setShowNoWordsWarning(true);
            }
          } else {
            console.warn('未找到保存的世界数据');
            setWorldName('无数据');
            setWords([]);
            setShowNoWordsWarning(true);
          }
        } catch (error) {
          console.error('加载世界数据时出错:', error);
          setWorldName('加载错误');
          setWords([]);
          setShowNoWordsWarning(true);
        }
      };

      // 初始加载
      loadWorldData();

      // 监听localStorage变化，实现实时更新
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === 'savedWorlds') {
          console.log('检测到世界数据变化，重新加载单词池');
          loadWorldData();
        }
      };

      // 监听自定义事件，用于同一页面内的更新
      const handleWorldUpdate = () => {
        console.log('检测到世界更新事件，重新加载单词池');
        loadWorldData();
      };

      window.addEventListener('storage', handleStorageChange);
      window.addEventListener('worldDataUpdated', handleWorldUpdate);

      return () => {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('worldDataUpdated', handleWorldUpdate);
      };
    } else {
      setWorldName('未指定世界');
      setWords([]);
      setShowNoWordsWarning(true);
    }
  }, [searchParams]);

  const currentWord = words[currentWordIndex];
  const previousWord = currentWordIndex > 0 ? words[currentWordIndex - 1] : null;
  const nextWord = currentWordIndex < words.length - 1 ? words[currentWordIndex + 1] : null;
  const currentStickerImage = currentWord ? getStickerImage(currentWord.english) : '';

  // 生成音频URL - 使用多个音频源作为备选
  const getAudioUrl = (word: string, type: number = 0) => {
    // 优先使用HTTPS协议的有道词典
    if (type === 0) {
      // 美音 - 使用HTTPS协议
      return `https://dict.youdao.com/dictvoice?type=0&audio=${encodeURIComponent(word)}`;
    } else {
      // 英音 - 使用HTTPS协议  
      return `https://dict.youdao.com/dictvoice?type=1&audio=${encodeURIComponent(word)}`;
    }
  };

  // 备用音频源 - 使用多个可靠的音频API
  const getBackupAudioUrl = (word: string, type: number = 0) => {
    // 使用百度翻译的音频API作为备选（更稳定，无CORS限制）
    const lang = type === 0 ? 'en' : 'uk';
    return `https://fanyi.baidu.com/gettts?lan=${lang}&text=${encodeURIComponent(word)}&spd=3&source=web`;
  };

  // 第三备用音频源
  const getThirdBackupAudioUrl = (word: string, type: number = 0) => {
    // 使用必应翻译的音频API
    const lang = type === 0 ? 'en-US' : 'en-GB';
    return `https://www.bing.com/ttranslatev3?isVertical=1&&IG=1234567890AB&IID=translator.5028.1&text=${encodeURIComponent(word)}&from=en&to=${lang}`;
  };

  // 音频播放函数 - 优先使用Web Speech API，避免CORS问题
  const playAudio = async () => {
    if (!currentWord) return;
    
    try {
      setIsLoading(true);
      setIsPlaying(true);
      
      // 优先使用Web Speech API（本地语音合成，无网络依赖）
      if ('speechSynthesis' in window) {
        // 停止之前的语音合成
        speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(currentWord.english);
        utterance.lang = pronunciationType === 0 ? 'en-US' : 'en-GB';
        utterance.rate = 0.8;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        
        // 设置语音合成事件监听
        utterance.onend = () => {
          setIsPlaying(false);
          setIsLoading(false);
        };
        
        utterance.onerror = (event) => {
          console.error('语音合成错误:', event);
          setIsPlaying(false);
          setIsLoading(false);
          // 如果语音合成失败，尝试外部音频源
          tryExternalAudio();
        };
        
        speechSynthesis.speak(utterance);
        console.log('使用Web Speech API播放音频');
        return;
      }
      
      // 如果不支持Web Speech API，尝试外部音频源
      await tryExternalAudio();
      
    } catch (error) {
      console.error('音频播放失败:', error);
      setIsPlaying(false);
      setIsLoading(false);
    }
  };

  // 尝试外部音频源的函数
  const tryExternalAudio = async () => {
    if (!audioRef.current || !currentWord) return;
    
    try {
      // 首先尝试有道词典
      audioRef.current.src = getAudioUrl(currentWord.english, pronunciationType);
      audioRef.current.load();
      await audioRef.current.play();
      console.log('使用有道词典音频播放成功');
    } catch (error) {
      console.error('有道词典音频播放失败:', error);
      
      try {
        // 尝试备用音频源
        audioRef.current.src = getBackupAudioUrl(currentWord.english, pronunciationType);
        audioRef.current.load();
        await audioRef.current.play();
        console.log('使用备用音频源播放成功');
      } catch (backupError) {
        console.error('所有外部音频源都失败:', backupError);
        alert('音频播放失败，请检查网络连接或稍后重试');
        setIsPlaying(false);
        setIsLoading(false);
      }
    }
  };

  // 暂停音频
  const pauseAudio = () => {
    // 停止语音合成
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
    }
    
    // 暂停HTML音频
    if (audioRef.current) {
      audioRef.current.pause();
    }
    
    setIsPlaying(false);
  };

  // 重播音频 - 增强错误处理
  const replayAudio = async () => {
    if (!audioRef.current || !currentWord) return;
    
    try {
      audioRef.current.currentTime = 0;
      setIsLoading(true);
      setIsPlaying(true);
      await audioRef.current.play();
    } catch (error) {
      console.error('音频重播失败:', error);
      // 如果重播失败，重新加载音频源并播放
      try {
        audioRef.current.src = getAudioUrl(currentWord.english, pronunciationType);
        audioRef.current.load();
        await audioRef.current.play();
      } catch (reloadError) {
        console.error('重新加载音频也失败:', reloadError);
        // 尝试备用音频源
        await playAudio();
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 预加载下一个音频 - 使用新的音频URL函数
  const preloadNextAudio = () => {
    if (nextWord && nextAudioRef.current) {
      nextAudioRef.current.src = getAudioUrl(nextWord.english, pronunciationType);
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
    setProgress(((currentWordIndex + 1) / words.length) * 100);
    
    // 只有当有单词时才初始化音频
    if (words.length > 0 && currentWord) {
      // 初始化当前音频
      if (audioRef.current) {
        audioRef.current.src = getAudioUrl(currentWord.english, pronunciationType);
        audioRef.current.load();
        
        // 音频加载完成后自动播放（特别是第一个单词）
        const handleCanPlay = () => {
          playAudio();
        };
        
        // 音频播放结束时的处理
        const handleEnded = () => {
          setIsPlaying(false);
        };
        
        // 音频加载错误处理
        const handleError = (e: Event) => {
          console.error('音频加载错误:', e);
          // 尝试备用音频源
          if (audioRef.current && currentWord) {
            audioRef.current.src = getBackupAudioUrl(currentWord.english, pronunciationType);
            audioRef.current.load();
          }
        };
        
        audioRef.current.addEventListener('canplaythrough', handleCanPlay);
        audioRef.current.addEventListener('ended', handleEnded);
        audioRef.current.addEventListener('error', handleError);
        
        // 清理事件监听器
        return () => {
          if (audioRef.current) {
            audioRef.current.removeEventListener('canplaythrough', handleCanPlay);
            audioRef.current.removeEventListener('ended', handleEnded);
            audioRef.current.removeEventListener('error', handleError);
          }
        };
      }
      
      // 预加载下一个音频
      preloadNextAudio();
    }
  }, [currentWordIndex, pronunciationType, words]);

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
    if (currentWordIndex < words.length - 1) {
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
    
    // 安全检查：确保currentWord存在
    if (!currentWord) {
      console.error('当前单词不存在');
      return;
    }
    
    // 处理提交逻辑
    const userAnswer = userInput.toLowerCase().trim();
    const correctAnswer = currentWord.english.toLowerCase();
    
    if (userAnswer === correctAnswer) {
      // 正确答案
      setCorrectAnswers(prev => [...prev, currentWord.english]);
      
      if (currentWordIndex < words.length - 1) {
        handleNextWord();
      } else {
        // 完成所有单词，显示总结界面
        setShowSummary(true);
      }
    } else {
      // 错误答案
      setIncorrectAnswers(prev => [...prev, {word: currentWord.english, userAnswer: userInput.trim()}]);
      alert('答案不正确，请再试一次');
    }
  };

  const handleReturn = () => {
    router.back();
  };

  const handlePracticeAgain = () => {
    // 重置所有状态，重新开始练习
    setCurrentWordIndex(0);
    setUserInput('');
    setShowAnswer(false);
    setIsPlaying(false);
    setIsLoading(false);
    setShowSummary(false);
    setCorrectAnswers([]);
    setIncorrectAnswers([]);
  };

  // 计算正确率
  const calculateAccuracy = () => {
    const totalAttempts = correctAnswers.length + incorrectAnswers.length;
    if (totalAttempts === 0) return 0;
    return Math.round((correctAnswers.length / totalAttempts) * 100);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#FFFBF5' }}>
      {/* 无单词警告提示 */}
      {showNoWordsWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4 text-center">
            <div className="mb-4">
              <div className="w-16 h-16 mx-auto mb-4 bg-yellow-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">该世界暂无单词</h3>
              <p className="text-gray-600 mb-6">请先在世界中添加单词贴纸，然后再开始学习</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleReturn}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                返回
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 只有当有单词且currentWord存在时才显示主要内容 */}
      {words.length > 0 && currentWord && !showNoWordsWarning && !showSummary && (
        <>
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

            {/* Center: World name and progress */}
            <div className="flex flex-col items-center ml-30">
              <h2 className="text-lg font-semibold text-gray-800 mb-1">
                {worldName} - 听写练习
              </h2>
              <div className="text-sm text-gray-600">
                {currentWordIndex + 1} / {words.length}
              </div>
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
          {currentStickerImage && currentWord && (
            <img 
              src={`/${currentStickerImage}`}
              alt={currentWord.english}
              className="w-45 h-45 object-contain"
            />
          )}
            </div>

            {/* Word information section */}
            <div className="flex flex-col items-center mb-6">
              {/* Chinese word display */}
              <div className="mb-3 h-10 flex items-center">
                {!hideChinese && currentWord && (
                  <h1 className="text-3xl font-bold text-gray-900">
                    {currentWord?.chinese || ''}
                  </h1>
                )}
              </div>
              
              {/* Pronunciation display */}
              <div className="flex items-center justify-center mb-4">
                <div className="text-lg text-gray-600">
                  {currentWord?.pronunciation || ''}
                </div>
              </div>
              
              {/* Part of speech and audio controls */}
              <div className="flex items-center justify-center space-x-3 mb-2">
                {/* Part of speech label */}
                {currentWord?.partOfSpeech && (
                  <div className="px-3 py-2 text-sm rounded-full">
                    <span className="text-green-800 bg-green-100 px-2 py-1 rounded-full">
                      {(() => {
                        const partOfSpeech = currentWord.partOfSpeech.toLowerCase();
                        switch (partOfSpeech) {
                          case 'noun': return '名词';
                          case 'verb': return '动词';
                          case 'adjective': return '形容词';
                          case 'adverb': return '副词';
                          case 'preposition': return '介词';
                          case 'conjunction': return '连词';
                          case 'pronoun': return '代词';
                          case 'interjection': return '感叹词';
                          default: return currentWord.partOfSpeech;
                        }
                      })()}
                    </span>
                  </div>
                )}
                
                {/* Audio control button */}
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
                  onClick={() => setPronunciationType(pronunciationType === 0 ? 1 : 0)}
                  className="px-3 py-2 text-sm text-gray-800 rounded-full hover:opacity-80 transition-colors w-18 text-center"
                  style={{ backgroundColor: '#FAF4ED' }}
                  title={pronunciationType === 0 ? "切换到英音" : "切换到美音"}
                >
                  {pronunciationType === 0 ? "美音" : "英音"}
                </button>
              </div>
            </div>

            {/* Input section */}
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

            {/* Progress section */}
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

              {/* Hint text */}
              <div className="text-sm text-gray-600">
                <p>
                  平板可手写输入，其他设备可利用输入法听写
                </p>
              </div>
            </div>
          </div>
        </>
      )}

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
      
      {/* 总结界面 */}
      {showSummary && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4 w-full">
            <div className="text-center mb-6">
              <div className="w-20 h-20 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">学习完成！</h3>
              <p className="text-gray-600">恭喜你完成了所有单词的听写</p>
            </div>

            {/* 正确率显示 */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-1">{calculateAccuracy()}%</div>
                <div className="text-sm text-gray-600">正确率</div>
                <div className="text-xs text-gray-500 mt-1">
                  正确 {correctAnswers.length} / 总计 {correctAnswers.length + incorrectAnswers.length}
                </div>
              </div>
            </div>

            {/* 错词列表 */}
            {incorrectAnswers.length > 0 && (
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">需要加强的单词</h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {incorrectAnswers.map((item, index) => (
                    <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-red-800">{item.word}</span>
                        <span className="text-sm text-red-600">你的答案: {item.userAnswer}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex space-x-3">
              <button
                onClick={handlePracticeAgain}
                className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
              >
                再练一遍
              </button>
              <button
                onClick={handleReturn}
                className="flex-1 px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
              >
                返回
              </button>
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