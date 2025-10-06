'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Volume2, Send, Eye, EyeOff, Settings, X, Play, Pause, RotateCcw } from 'lucide-react';
import { WorldData } from '@/types/world';
import { WorldDataUtils } from '@/utils/worldDataUtils';

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

// 世界数据接口 - 使用全局类型定义
// interface WorldData 已从 @/types/world 导入

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
    stickerCount: 2, // 添加贴纸数量
    likes: 156,
    favorites: 32,
    isPublic: true,
    tags: ['Kitchen', 'Food'], // 添加标签
    createdAt: '2024-01-15',
    lastModified: '2024-01-20',
    updatedAt: '2024-01-20', // 添加更新时间
    canvasData: { // 添加画布数据结构
      objects: [],
      background: null
    },
    canvasObjects: [
      {
        id: 'sticker-1',
        type: 'sticker' as const,
        x: 100,
        y: 100,
        width: 80,
        height: 80,
        rotation: 0, // 添加旋转角度
        scaleX: 1, // 添加X轴缩放
        scaleY: 1, // 添加Y轴缩放
        opacity: 1, // 添加透明度
        visible: true, // 添加可见性
        locked: false, // 添加锁定状态
        zIndex: 1, // 添加层级
        src: '/Ceramic Mug.png',
        name: 'Ceramic Mug',
        stickerData: {
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
      },
      {
        id: 'sticker-2',
        type: 'sticker' as const,
        x: 200,
        y: 150,
        width: 80,
        height: 80,
        rotation: 0, // 添加旋转角度
        scaleX: 1, // 添加X轴缩放
        scaleY: 1, // 添加Y轴缩放
        opacity: 1, // 添加透明度
        visible: true, // 添加可见性
        locked: false, // 添加锁定状态
        zIndex: 2, // 添加层级
        src: '/Calendar.png',
        name: 'Calendar',
        stickerData: {
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
        }
      }
    ]
  },
  {
    id: '2',
    name: 'Pet Paradise',
    description: 'A wonderful world full of cute animals',
    coverUrl: '/api/placeholder/400/300',
    wordCount: 18,
    stickerCount: 1, // 添加贴纸数量
    likes: 89,
    favorites: 21,
    isPublic: false,
    tags: ['Pet', 'Animals'], // 添加标签
    createdAt: '2024-01-10',
    lastModified: '2024-01-18',
    updatedAt: '2024-01-18', // 添加更新时间
    canvasData: { // 添加画布数据结构
      objects: [],
      background: null
    },
    canvasObjects: [
      {
        id: 'sticker-3',
        type: 'sticker' as const,
        x: 150,
        y: 120,
        width: 80,
        height: 80,
        rotation: 0, // 添加旋转角度
        scaleX: 1, // 添加X轴缩放
        scaleY: 1, // 添加Y轴缩放
        opacity: 1, // 添加透明度
        visible: true, // 添加可见性
        locked: false, // 添加锁定状态
        zIndex: 1, // 添加层级
        src: '/Diving Mask.png',
        name: 'Diving Mask',
        stickerData: {
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
        }
      }
    ]
  },
  {
    id: '3',
    name: 'Garden Life',
    description: 'Beautiful garden with flowers and plants',
    coverUrl: '/api/placeholder/400/300',
    wordCount: 31,
    stickerCount: 0, // 添加贴纸数量
    likes: 203,
    favorites: 45,
    isPublic: true,
    tags: ['Garden', 'Plants'], // 添加标签
    createdAt: '2024-01-05',
    lastModified: '2024-01-16',
    updatedAt: '2024-01-16', // 添加更新时间
    canvasData: { // 添加画布数据结构
      objects: [],
      background: null
    },
    canvasObjects: [
      {
        id: 'sticker-4',
        type: 'sticker' as const,
        x: 180,
        y: 100,
        width: 80,
        height: 80,
        rotation: 0, // 添加旋转角度
        scaleX: 1, // 添加X轴缩放
        scaleY: 1, // 添加Y轴缩放
        opacity: 1, // 添加透明度
        visible: true, // 添加可见性
        locked: false, // 添加锁定状态
        zIndex: 1, // 添加层级
        src: '/Industrial Shelving.png',
        name: 'Industrial Shelving',
        stickerData: {
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
        }
      }
    ]
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

// 听写页面内容组件
function DictationPageContent() {
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
  const [answeredWords, setAnsweredWords] = useState<Set<string>>(new Set()); // 已作答单词集合
  const [availableWords, setAvailableWords] = useState<WordData[]>([]); // 可用单词列表
  const [wrongWords, setWrongWords] = useState<Set<string>>(new Set()); // 错词集合
  const [isShaking, setIsShaking] = useState(false); // 输入框抖动状态

  // 音频相关的refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const nextAudioRef = useRef<HTMLAudioElement | null>(null);

  // 从世界的canvasObjects中提取单词信息 - 严格限定只使用当前世界的单词贴纸
  const extractWordsFromWorld = (world: WorldData): WordData[] => {
    console.log('开始提取世界单词，世界数据:', world);
    
    // 优先使用新的canvasData结构，兼容旧的canvasObjects
    const canvasObjects = world.canvasData?.objects || world.canvasObjects || [];
    
    if (canvasObjects.length === 0) {
      console.log('世界中没有canvasObjects或为空数组');
      return []; // 如果没有canvasObjects，返回空数组而不是默认单词
    }

    console.log('canvasObjects数量:', canvasObjects.length);
    console.log('canvasObjects内容:', canvasObjects);

    const extractedWords: WordData[] = [];
    
    canvasObjects.forEach((obj, index) => {
      console.log(`检查对象 ${index}:`, obj);
      
      // 检查多种可能的数据结构
      let stickerData = null;
      
      // 方式1: 检查是否有完整的贴纸数据（新的数据结构）
      if (obj.stickerData) {
        stickerData = obj.stickerData;
        console.log(`对象 ${index} 通过stickerData找到完整数据:`, stickerData);
      }
      // 方式2: 检查是否是贴纸对象（通常包含sticker或imageObj属性）
      else if (obj.sticker || obj.imageObj) {
        stickerData = obj.sticker || obj.imageObj;
        console.log(`对象 ${index} 通过sticker/imageObj找到数据:`, stickerData);
      }
      // 方式3: 检查对象本身是否直接包含单词信息
      else if (obj.name && (obj.chinese || obj.phonetic)) {
        stickerData = obj;
        console.log(`对象 ${index} 直接包含单词信息:`, stickerData);
      }
      // 方式4: 检查是否有其他可能的属性结构
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
      'table': 'Calendar.png', // 临时映射，因为没有table的图片
      'beautiful': 'Diving Mask.png', // 临时映射
      'run': 'Industrial Shelving.png', // 临时映射
      'happily': 'Ceramic Mug.png', // 临时映射
      'calendar': 'Calendar.png',
      'mask': 'Diving Mask.png',
      'shelf': 'Industrial Shelving.png'
    };
    
    const imageName = imageMap[englishWord.toLowerCase()];
    console.log(`获取图片 - 单词: ${englishWord}, 映射结果: ${imageName}`);
    return imageName || null;
  };

  // 初始化：从URL参数获取worldId并加载对应世界的单词数据
  useEffect(() => {
    const worldId = searchParams.get('worldId');
    
    if (worldId) {
      const loadWorldData = async () => {
        try {
          let targetWorld = null;
          
          // 首先尝试从WorldDataUtils获取保存的世界数据
          try {
            const worlds = await WorldDataUtils.getAllWorlds();
            targetWorld = worlds.find(world => world.id === worldId);
          } catch (error) {
            console.warn('从WorldDataUtils加载世界数据失败:', error);
          }
          
          // 如果在保存的世界中没找到，尝试从模拟世界数据中查找
          if (!targetWorld) {
            targetWorld = mockWorlds.find(world => world.id === worldId);
          }
          
          if (targetWorld) {
            setWorldName(targetWorld.name);
            const extractedWords = extractWordsFromWorld(targetWorld);
            
            // 过滤掉已作答的单词，确保不重复
            const filteredWords = extractedWords.filter(word => 
              !answeredWords.has(word.english.toLowerCase())
            );
            
            setWords(filteredWords);
            setAvailableWords(filteredWords);
            console.log(`从世界 "${targetWorld.name}" 中提取到 ${extractedWords.length} 个单词，过滤后剩余 ${filteredWords.length} 个`);
            
            // 如果没有单词，显示警告提示
            if (filteredWords.length === 0) {
              if (extractedWords.length > 0) {
                console.warn(`世界 "${targetWorld.name}" 中的所有单词都已作答完毕`);
              } else {
                console.warn(`世界 "${targetWorld.name}" 中没有找到任何单词贴纸`);
              }
              setShowNoWordsWarning(true);
            } else {
              setShowNoWordsWarning(false);
            }
          } else {
            console.warn(`未找到ID为 ${worldId} 的世界`);
            setWorldName('未找到的世界');
            setWords([]);
            setAvailableWords([]);
            setShowNoWordsWarning(true);
          }
        } catch (error) {
          console.error('加载世界数据时出错:', error);
          setWorldName('加载错误');
          setWords([]);
          setAvailableWords([]);
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
      setAvailableWords([]);
      setShowNoWordsWarning(true);
    }
  }, [searchParams]); // 移除answeredWords依赖，避免答错后重新过滤导致索引不匹配

  const currentWord = availableWords[currentWordIndex];
  const previousWord = currentWordIndex > 0 ? availableWords[currentWordIndex - 1] : null;
  const nextWord = currentWordIndex < availableWords.length - 1 ? availableWords[currentWordIndex + 1] : null;
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

  // 第三备用音频源 - 使用Web Speech API作为最后备选
  const getThirdBackupAudioUrl = (word: string, type: number = 0) => {
    // 使用本地TTS作为最后的备选方案
    return `data:audio/wav;base64,`; // 占位符，实际会使用Web Speech API
  };

  // 使用Web Speech API播放音频（最可靠的方案）
  const playWithSpeechAPI = (word: string, type: number = 0) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = type === 0 ? 'en-US' : 'en-GB';
      utterance.rate = 0.8;
      utterance.pitch = 1;
      utterance.volume = 1;
      
      utterance.onstart = () => {
        setIsPlaying(true);
        setIsLoading(false);
      };
      
      utterance.onend = () => {
        setIsPlaying(false);
      };
      
      utterance.onerror = (e) => {
        console.error('Speech API 错误:', e);
        setIsPlaying(false);
      };
      
      speechSynthesis.speak(utterance);
      return true;
    }
    return false;
  };

  // 音频播放函数 - 优先使用Web Speech API，避免CORS问题
  const playAudio = async () => {
    if (!currentWord) return;
    
    try {
      setIsLoading(true);
      setIsPlaying(true);
      
      // 优先使用Web Speech API（本地语音合成，无网络依赖，无CORS问题）
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
          // 如果语音合成失败，静默尝试外部音频源
          setIsPlaying(false);
          setIsLoading(false);
          tryExternalAudio();
        };
        
        speechSynthesis.speak(utterance);
        return;
      }
      
      // 如果不支持Web Speech API，尝试外部音频源
      await tryExternalAudio();
      
    } catch (error) {
      // 静默处理播放错误
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
      // 静默处理成功，不输出日志
    } catch (error) {
      // 静默处理有道词典错误，不输出到控制台
      
      try {
        // 尝试备用音频源
        audioRef.current.src = getBackupAudioUrl(currentWord.english, pronunciationType);
        audioRef.current.load();
        await audioRef.current.play();
        // 静默处理成功，不输出日志
      } catch (backupError) {
        // 静默处理备用音频源错误，直接使用Web Speech API
        if (!playWithSpeechAPI(currentWord.english, pronunciationType)) {
          console.warn('所有音频播放方案都不可用');
        }
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
          // 静默处理CORS相关错误，避免控制台报错
          const target = e.target as HTMLAudioElement;
          const errorMessage = target?.error?.message || '';
          const isBlockedByORB = errorMessage.includes('ERR_BLOCKED_BY_ORB') || 
                                target?.src?.includes('dict.youdao.com') ||
                                target?.src?.includes('fanyi.baidu.com');
          
          // 只有非CORS错误才输出到控制台
          if (!isBlockedByORB) {
            console.error('音频加载错误:', e);
          }
          
          setIsPlaying(false);
          
          // 尝试备用音频源
          if (audioRef.current && currentWord) {
            const currentSrc = audioRef.current.src;
            
            // 如果当前是主要音频源失败，尝试备用源
            if (currentSrc.includes('dict.youdao.com')) {
              // 静默切换到备用音频源
              audioRef.current.src = getBackupAudioUrl(currentWord.english, pronunciationType);
              audioRef.current.load();
            } else if (currentSrc.includes('fanyi.baidu.com')) {
              // 如果备用源也失败，使用Web Speech API
              if (playWithSpeechAPI(currentWord.english, pronunciationType)) {
                return; // 成功使用Speech API，直接返回
              }
            } else {
              // 所有音频源都失败，使用Web Speech API作为最后备选
              if (!playWithSpeechAPI(currentWord.english, pronunciationType)) {
                // 只有在Web Speech API也不可用时才显示错误
                console.warn('所有音频播放方案都不可用');
              }
            }
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
    if (currentWordIndex < availableWords.length - 1) {
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

  // 计算Levenshtein距离（编辑距离）
  const calculateLevenshteinDistance = (str1: string, str2: string): number => {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i += 1) {
      matrix[0][i] = i;
    }

    for (let j = 0; j <= str2.length; j += 1) {
      matrix[j][0] = j;
    }

    for (let j = 1; j <= str2.length; j += 1) {
      for (let i = 1; i <= str1.length; i += 1) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator, // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  };

  // 检查答案是否正确（包含容错）
  const isAnswerCorrect = (userAnswer: string, correctAnswer: string): boolean => {
    const userLower = userAnswer.toLowerCase().trim();
    const correctLower = correctAnswer.toLowerCase().trim();
    
    // 完全匹配
    if (userLower === correctLower) {
      return true;
    }
    
    // 计算编辑距离，允许1-2个字符的差异（根据单词长度调整）
    const distance = calculateLevenshteinDistance(userLower, correctLower);
    const threshold = correctLower.length <= 4 ? 1 : 2; // 短单词容错1个字符，长单词容错2个字符
    
    return distance <= threshold;
  };

  // 输入框抖动动画
  const triggerShakeAnimation = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 安全检查：确保currentWord存在
    if (!currentWord) {
      console.error('当前单词不存在');
      return;
    }
    
    // 处理提交逻辑
    const userAnswer = userInput.trim();
    const correctAnswer = currentWord.english;
    
    // 将当前单词标记为已作答
    setAnsweredWords(prev => new Set([...prev, correctAnswer.toLowerCase()]));
    
    if (isAnswerCorrect(userAnswer, correctAnswer)) {
      // 正确答案
      setCorrectAnswers(prev => [...prev, correctAnswer]);
      
      if (currentWordIndex < availableWords.length - 1) {
        handleNextWord();
      } else {
        // 完成所有单词，显示总结界面
        setShowSummary(true);
      }
    } else {
      // 错误答案
      setIncorrectAnswers(prev => [...prev, {word: correctAnswer, userAnswer: userAnswer}]);
      setWrongWords(prev => new Set([...prev, correctAnswer.toLowerCase()]));
      
      // 触发抖动动画
      triggerShakeAnimation();
      
      // 1.5秒后自动跳到下一题
      setTimeout(() => {
        if (currentWordIndex < availableWords.length - 1) {
          handleNextWord();
        } else {
          // 完成所有单词，显示总结界面
          setShowSummary(true);
        }
      }, 1500);
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
      {availableWords.length > 0 && currentWord && !showNoWordsWarning && !showSummary && (
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
                {currentWordIndex + 1} / {availableWords.length}
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
              src={currentStickerImage.startsWith('/') ? currentStickerImage : `/${currentStickerImage}`}
              alt={currentWord.english}
              className="w-45 h-45 object-contain"
              onError={(e) => {
                console.error(`图片加载失败: ${currentStickerImage}`, e);
              }}
              onLoad={() => {
                console.log(`图片加载成功: ${currentStickerImage}`);
              }}
            />
          )}
          {!currentStickerImage && currentWord && (
            <div className="w-45 h-45 bg-gray-200 flex items-center justify-center text-gray-500">
              暂无图片
            </div>
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
              <form onSubmit={handleSubmit} className="flex items-center space-x-3 w-full">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSubmit(e)}
                    placeholder="请输入听到的单词..."
                    className={`w-full px-4 py-3 text-lg text-center bg-transparent border-0 border-b-2 border-gray-300 focus:border-blue-500 focus:outline-none transition-colors ${
                      isShaking ? 'animate-shake border-red-500' : ''
                    }`}
                    autoFocus
                  />
                  {/* 回车符号 */}
                  <button
                    onClick={handleSubmit}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-blue-500 transition-colors"
                    title="提交答案"
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      {/* 键盘回车键的形状 */}
                      <path d="M9 10h6v4h-6z" fill="currentColor" opacity="0.2"/>
                      <path d="M9 10h6"/>
                      <path d="M15 10v4"/>
                      <path d="M15 14H9"/>
                      <path d="M9 14v-4"/>
                      {/* 回车箭头 */}
                      <path d="M19 12H9"/>
                      <path d="M15 8l4 4-4 4"/>
                    </svg>
                  </button>
                </div>
              </form>
            </div>

            {/* Hint text */}
            <div className="text-sm text-gray-600 text-center">
              <p>
                平板可手写输入，其他设备可利用输入法听写
              </p>
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
      
      {/* 总结界面 - 报纸样式 */}
      {showSummary && (
        <div className="min-h-screen flex flex-col bg-white">
          {/* 简化的头部 */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>返回</span>
              </button>
              <h1 className="text-xl font-semibold text-gray-800">
                听写完成
              </h1>
              <div className="w-16"></div> {/* 占位符保持居中 */}
            </div>
          </div>

          {/* 主要内容区域 */}
          <div className="flex-1 flex flex-col p-6 bg-white">
            {/* 简化的完成标题 */}
            <div className="text-center mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                {worldName} 听写练习完成
              </h2>
            </div>

            {/* 简化的统计信息 */}
            <div className="mb-8">
              <div className="text-center mb-6">
                <h3 className="text-lg font-medium text-gray-700">
                  学习成果统计
                </h3>
              </div>
              
              <div className="grid grid-cols-4 gap-4">
                {/* 正确答题数 */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="text-center">
                    <div className="text-2xl font-semibold text-green-600 mb-2">
                      {correctAnswers.length}
                    </div>
                    <div className="text-sm text-gray-600">
                      正确答题数
                    </div>
                  </div>
                </div>
                
                {/* 错误题目数 */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="text-center">
                    <div className="text-2xl font-semibold text-red-600 mb-2">
                      {incorrectAnswers.length}
                    </div>
                    <div className="text-sm text-gray-600">
                      错误题目数
                    </div>
                  </div>
                </div>
                
                {/* 题目总数 */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="text-center">
                    <div className="text-2xl font-semibold text-blue-600 mb-2">
                      {words.length}
                    </div>
                    <div className="text-sm text-gray-600">
                      题目总数
                    </div>
                  </div>
                </div>
                
                {/* 正确率 */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="text-center">
                    <div className="text-2xl font-semibold text-purple-600 mb-2">
                      {Math.round((correctAnswers.length / words.length) * 100)}%
                    </div>
                    <div className="text-sm text-gray-600">
                      正确率
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 错题列表 - 简化样式 */}
            {incorrectAnswers.length > 0 && (
              <div className="mb-8">
                <div className="text-center mb-6">
                  <h4 className="text-lg font-medium text-gray-700">
                    错题回顾
                  </h4>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="space-y-3 max-h-40 overflow-y-auto">
                    {incorrectAnswers.map((item, index) => (
                      <div key={`incorrect-${item.word}-${index}`} className="border-b border-gray-200 pb-3 last:border-b-0">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <span className="text-xs bg-gray-600 text-white px-2 py-1 rounded">
                              {index + 1}
                            </span>
                            <span className="font-medium text-gray-800">{item.word}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-gray-500 mb-1">你的答案</div>
                            <span className="text-sm text-red-600 bg-red-50 px-2 py-1 rounded">
                              {item.userAnswer}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 操作按钮 - 简化样式 */}
            <div className="grid grid-cols-2 gap-4">
              {/* 错题复练按钮 */}
              {incorrectAnswers.length > 0 && (
                <button
                  onClick={() => {
                    // 重置状态进入错题复练模式
                    const wrongWordsToRetry = incorrectAnswers.map(item => 
                      words.find(word => word.english === item.word)
                    ).filter(Boolean) as WordData[];
                    
                    setWords(wrongWordsToRetry);
                    setAvailableWords(wrongWordsToRetry);
                    setCurrentWordIndex(0);
                    setUserInput('');
                    setCorrectAnswers([]);
                    setIncorrectAnswers([]);
                    setWrongWords(new Set());
                    setShowSummary(false);
                    setIsShaking(false);
                    
                    console.log(`开始错题复练，共 ${wrongWordsToRetry.length} 个单词`);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  错题强化训练 ({incorrectAnswers.length})
                </button>
              )}
              
              {/* 返回按钮 */}
              <button
                onClick={() => router.back()}
                className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                返回世界选择
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

// 主导出组件，使用Suspense边界包装
export default function DictationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FFFBF5] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p className="text-gray-600">加载听写页面...</p>
      </div>
    </div>}>
      <DictationPageContent />
    </Suspense>
  );
}