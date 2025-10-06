
// 修复后的完整 StickerData 接口
interface StickerData {
  id: string;
  word: string;
  cn: string;
  pos: "noun" | "verb" | "adj" | "adv";
  image: string;
  audio: {
    uk: string;
    us: string;
  };
  examples: {
    en: string;
    cn: string;
  }[];
  mnemonic: string[];
  masteryStatus: "new" | "fuzzy" | "mastered";
  tags: string[];
  relatedWords: {
    word: string;
    pos: "noun" | "verb" | "adj" | "adv";
  }[];
  // 兼容性字段
  name?: string;
  chinese?: string;
  phonetic?: string;
  category?: string;
  partOfSpeech?: string;
  thumbnailUrl?: string;
  createdAt?: string;
  sorted?: boolean;
  notes?: string;
}

// 完整的贴纸数据示例
const completeStickerExample = {
  "id": "sticker-1759743869586",
  "word": "apple",
  "cn": "苹果",
  "pos": "noun",
  "image": "/apple.png",
  "audio": {
    "uk": "/audio/apple-uk.mp3",
    "us": "/audio/apple-us.mp3"
  },
  "examples": [
    {
      "en": "I eat an apple every day.",
      "cn": "我每天吃一个苹果。"
    },
    {
      "en": "The apple is red and sweet.",
      "cn": "这个苹果又红又甜。"
    }
  ],
  "mnemonic": [
    "apple的记忆方法：联想红色的果实"
  ],
  "masteryStatus": "new",
  "tags": [
    "Fruit",
    "Food"
  ],
  "relatedWords": [
    {
      "word": "eat",
      "pos": "verb"
    },
    {
      "word": "pick",
      "pos": "verb"
    },
    {
      "word": "wash",
      "pos": "verb"
    },
    {
      "word": "fruit",
      "pos": "noun"
    },
    {
      "word": "red",
      "pos": "adj"
    },
    {
      "word": "sweet",
      "pos": "adj"
    },
    {
      "word": "tree",
      "pos": "noun"
    },
    {
      "word": "fresh",
      "pos": "adj"
    },
    {
      "word": "orchard",
      "pos": "noun"
    },
    {
      "word": "naturally",
      "pos": "adv"
    }
  ],
  "name": "apple",
  "chinese": "苹果",
  "phonetic": "/ˈæpl/",
  "category": "Food",
  "partOfSpeech": "noun",
  "thumbnailUrl": "/apple.png",
  "createdAt": "2025-10-06",
  "sorted": true,
  "notes": "A round fruit that grows on trees, commonly red, green, or yellow in color."
};

// 修复函数：将不完整的 stickerData 转换为完整结构
function fixStickerData(incompleteStickerData) {
  const fixed = {
    // 必需字段
    id: incompleteStickerData.id || `sticker-${Date.now()}`,
    word: incompleteStickerData.word || incompleteStickerData.name || '',
    cn: incompleteStickerData.cn || incompleteStickerData.chinese || '',
    pos: incompleteStickerData.pos || 'noun',
    image: incompleteStickerData.image || incompleteStickerData.thumbnailUrl || '',
    
    // 补充缺失的必需字段
    audio: incompleteStickerData.audio || {
      uk: `/audio/${incompleteStickerData.word || incompleteStickerData.name || 'word'}-uk.mp3`,
      us: `/audio/${incompleteStickerData.word || incompleteStickerData.name || 'word'}-us.mp3`
    },
    
    examples: incompleteStickerData.examples || [
      { 
        en: `This is a ${incompleteStickerData.word || incompleteStickerData.name || 'word'}.`, 
        cn: `这是一个${incompleteStickerData.cn || incompleteStickerData.chinese || '词'}。` 
      },
      { 
        en: `I like this ${incompleteStickerData.word || incompleteStickerData.name || 'word'}.`, 
        cn: `我喜欢这个${incompleteStickerData.cn || incompleteStickerData.chinese || '词'}。` 
      }
    ],
    
    mnemonic: incompleteStickerData.mnemonic ? 
      (Array.isArray(incompleteStickerData.mnemonic) ? incompleteStickerData.mnemonic : [incompleteStickerData.mnemonic]) :
      [`${incompleteStickerData.word || incompleteStickerData.name || 'word'}的记忆方法`],
    
    masteryStatus: incompleteStickerData.masteryStatus || 'new',
    
    tags: incompleteStickerData.tags || ['General'],
    
    relatedWords: incompleteStickerData.relatedWords || [
      { word: 'use', pos: 'verb' },
      { word: 'see', pos: 'verb' },
      { word: 'get', pos: 'verb' },
      { word: 'thing', pos: 'noun' },
      { word: 'good', pos: 'adj' },
      { word: 'nice', pos: 'adj' },
      { word: 'item', pos: 'noun' },
      { word: 'useful', pos: 'adj' },
      { word: 'object', pos: 'noun' },
      { word: 'well', pos: 'adv' }
    ],
    
    // 保留兼容性字段
    name: incompleteStickerData.name || incompleteStickerData.word,
    chinese: incompleteStickerData.chinese || incompleteStickerData.cn,
    phonetic: incompleteStickerData.phonetic || '',
    category: incompleteStickerData.category || 'General',
    partOfSpeech: incompleteStickerData.partOfSpeech || incompleteStickerData.pos || 'noun',
    thumbnailUrl: incompleteStickerData.thumbnailUrl || incompleteStickerData.image,
    createdAt: incompleteStickerData.createdAt || new Date().toISOString().split('T')[0],
    sorted: incompleteStickerData.sorted !== undefined ? incompleteStickerData.sorted : true,
    notes: incompleteStickerData.notes || ''
  };
  
  return fixed;
}
