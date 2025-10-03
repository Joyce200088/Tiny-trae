import { GoogleGenerativeAI } from '@google/generative-ai';

// 初始化Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'AIzaSyCjzpGqvGow52_QWVW8uw_2yVDAGf6H_Uw');

// 获取模型实例
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

// 重试配置接口
interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
}

// 默认重试配置 - 增强版本以应对持续的API过载
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 5,     // 增加到5次重试
  baseDelay: 2000,   // 增加基础延迟到2秒
  maxDelay: 30000    // 增加最大延迟到30秒
};

// 重试函数，支持指数退避
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // 检查是否是可重试的错误
      const isRetryableError = isRetryable(error as Error);
      
      if (attempt === config.maxRetries || !isRetryableError) {
        throw lastError;
      }
      
      // 计算延迟时间（指数退避）
      const delay = Math.min(
        config.baseDelay * Math.pow(2, attempt),
        config.maxDelay
      );
      
      console.log(`API call failed (attempt ${attempt + 1}/${config.maxRetries + 1}), retrying in ${delay}ms...`, error);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

// 判断错误是否可重试
function isRetryable(error: Error): boolean {
  const errorMessage = error.message.toLowerCase();
  
  // 可重试的错误类型
  const retryableErrors = [
    'overloaded',
    'service unavailable',
    'timeout',
    'network error',
    'connection refused',
    'internal error',
    '503',
    '502',
    '500',
    '429' // Rate limit
  ];
  
  return retryableErrors.some(retryableError => 
    errorMessage.includes(retryableError)
  );
}

export interface WordAnalysisRequest {
  word: string;
  currentChinese?: string;
  currentPartOfSpeech?: string;
  currentExamples?: string[];
  currentMnemonic?: string | string[];
  currentTags?: string[];
  currentRelatedWords?: Array<{
    word: string;
    chinese: string;
    partOfSpeech: string;
  }>;
}

export interface WordAnalysisResponse {
  word: string;
  cn: string;
  pos: string;
  image: string;
  phonetic: string; // 修改为phonetic音标字段
  examples: Array<{
    english: string;
    chinese: string;
  }>;
  mnemonic: string;
  masteryStatus: 'unfamiliar' | 'vague' | 'mastered';
  relatedWords: Array<{
    word: string;
    chinese: string;
    partOfSpeech: 'noun' | 'verb' | 'adjective' | 'adverb';
  }>;
}

export async function analyzeWordWithGemini(request: WordAnalysisRequest): Promise<WordAnalysisResponse> {
  try {
    const prompt = `
请分析英语单词 "${request.word}" 并提供以下信息的建议。请以JSON格式返回，严格按照以下结构：

{
  "word": "${request.word}",
  "cn": "中文释义（简洁准确）",
  "pos": "词性（noun/verb/adjective/adverb等）",
  "image": "图片建议描述",
  "phonetic": "国际音标（如/ˈæpəl/）",
  "examples": [
    {
      "english": "英文例句1",
      "chinese": "中文翻译1"
    },
    {
      "english": "英文例句2", 
      "chinese": "中文翻译2"
    }
  ],
  "mnemonic": "一句简洁的记忆方法（基于词根词缀联想）",
  "masteryStatus": "unfamiliar",
  "relatedWords": [
    {"word": "相关词1", "chinese": "中文1", "partOfSpeech": "词性1"},
    {"word": "相关词2", "chinese": "中文2", "partOfSpeech": "词性2"},
    {"word": "相关词3", "chinese": "中文3", "partOfSpeech": "词性3"},
    {"word": "相关词4", "chinese": "中文4", "partOfSpeech": "词性4"},
    {"word": "相关词5", "chinese": "中文5", "partOfSpeech": "词性5"},
    {"word": "相关词6", "chinese": "中文6", "partOfSpeech": "词性6"},
    {"word": "相关词7", "chinese": "中文7", "partOfSpeech": "词性7"},
    {"word": "相关词8", "chinese": "中文8", "partOfSpeech": "词性8"},
    {"word": "相关词9", "chinese": "中文9", "partOfSpeech": "词性9"},
    {"word": "相关词10", "chinese": "中文10", "partOfSpeech": "词性10"}
  ]
}

要求：
1. 中文释义要准确简洁，符合中国学习者习惯
2. 例句要地道实用，体现单词的常见用法
3. 记忆方法用词根/词缀联想，或场景联想
4. 相关词要与核心词强相关，包含不同词性，按相关性排序
5. **重要：相关词的前3个必须是动词，描述与该物品的交互动作**
   - 如果是物品/名词，前3个相关词必须是与该物品交互的动词（如：grab抓取, cut切割, wash清洗, use使用, hold握住, open打开, close关闭, clean清洁, fix修理, move移动等）
   - 这些动词必须与核心词强相关，描述人们如何与该物品互动
   - 动词要常用、实用，符合日常使用场景
6. 其余7个相关词可以包含同义词、反义词、搭配词、相关名词等不同词性
7. 对于动词，相关词应包含同义词、反义词、搭配词
8. 对于形容词，相关词应包含同义词、反义词、程度词
9. 对于副词，相关词应包含相关的形容词、动词、其他副词
10. 请确保返回的是有效的JSON格式，不要包含任何其他文本

当前单词信息（供参考）：
- 当前中文释义：${request.currentChinese || '无'}
- 当前词性：${request.currentPartOfSpeech || '无'}
- 当前例句：${request.currentExamples?.join('; ') || '无'}
- 当前记忆方法：${Array.isArray(request.currentMnemonic) ? request.currentMnemonic.join('; ') : request.currentMnemonic || '无'}
- 当前相关词：${request.currentRelatedWords?.map(w => `${w.word}(${w.chinese})`).join(', ') || '无'}
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // 尝试解析JSON响应
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      
      const analysisResult = JSON.parse(jsonMatch[0]);
      
      // 验证必要字段
      if (!analysisResult.word || !analysisResult.cn || !analysisResult.examples) {
        throw new Error('Invalid response structure');
      }
      
      return analysisResult;
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', parseError);
      console.error('Raw response:', text);
      
      // 返回默认结构
      return createFallbackResponse(request.word);
    }
  } catch (error) {
    console.error('Gemini API error:', error);
    
    // 返回默认结构
    return createFallbackResponse(request.word);
  }
}

function createFallbackResponse(word: string): WordAnalysisResponse {
  return {
    word: word,
    cn: `${word}的中文释义`,
    pos: "noun",
    image: `建议使用更清晰的${word}图片`,
    phonetic: `/${word}/`, // 修改为phonetic字段
    examples: [
      {
        english: `This is an example sentence with ${word}.`,
        chinese: `这是一个包含${word}的例句。`
      },
      {
        english: `The ${word} is very useful in daily life.`,
        chinese: `${word}在日常生活中非常有用。`
      }
    ],
    mnemonic: `${word} 可以联想记忆，建议结合发音和词义特点`,
    masteryStatus: "unfamiliar",
    relatedWords: [
      { word: "related1", chinese: "相关词1", partOfSpeech: "noun" },
      { word: "related2", chinese: "相关词2", partOfSpeech: "verb" },
      { word: "related3", chinese: "相关词3", partOfSpeech: "adjective" }
    ]
  };
}

// ===== AI世界生成功能 =====

// 生成场景描述
export async function generateSceneDescription(userInput: string): Promise<string> {
  return retryWithBackoff(async () => {
    const prompt = `
作为一个英语学习世界的创建助手，请根据用户输入生成一个详细的场景描述。

用户输入：${userInput}

请生成一个适合英语学习的场景描述，要求：
1. 描述要生动具体，包含环境、物品、人物等元素
2. 适合英语学习，包含常见的日常词汇
3. 长度控制在100-200字
4. 用中文描述

请直接返回场景描述，不要包含其他解释文字。
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  });
}

// 生成场景相关词汇
export async function generateVocabularyForScene(
  scene: string,
  count: number = 30
): Promise<Array<{
  word: string;
  translation: string;
  pronunciation: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: string;
}>> {
  return retryWithBackoff(async () => {
    const prompt = `
请为场景"${scene}"生成${count}个相关的英语名词词汇。

要求：
1. 词汇是必须与场景高度相关的物品名词
2. 提供准确的中文翻译
3. 提供准确的音标发音
4. 按主题分类

请以JSON格式返回：
[
  {
    "word": "apple",
    "translation": "苹果",
    "pronunciation": "/ˈæpəl/",
    "difficulty": "beginner",
    "category": "水果"
  }
]

只返回JSON数组，不要包含其他文字。确保生成${count}个词汇。
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // 清理响应文本，移除可能的markdown格式
    const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    try {
      return JSON.parse(cleanText);
    } catch (parseError) {
      console.error('Error parsing vocabulary JSON:', parseError);
      throw new Error('Failed to parse vocabulary response');
    }
  });
}

// 生成词汇列表
export async function generateVocabulary(sceneDescription: string): Promise<Array<{
  word: string;
  translation: string;
  pronunciation: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: string;
}>> {
  return retryWithBackoff(async () => {
    const prompt = `
基于以下场景描述，生成适合英语学习的名词词汇列表：

场景描述：${sceneDescription}

请生成20-40个相关的英语名词，这些名词应该是具体的、可视化的物体，方便AI生成图片。每个词汇包含：
1. 英文单词（仅限名词）
2. 中文翻译
3. 音标发音
4. 词汇分类（固定为"noun"）

要求：
- 只生成名词（noun），不要动词、形容词等其他词性
- 选择具体的、可视化的物体名词，避免抽象概念
- 确保这些名词适合用于图片生成

请以JSON格式返回，格式如下：
[
  {
    "word": "apple",
    "translation": "苹果",
    "pronunciation": "/ˈæpəl/",
    "difficulty": "beginner",
    "category": "noun"
  }
]

只返回JSON数组，不要包含其他文字。
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // 清理响应文本，移除可能的markdown格式
    const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    try {
      return JSON.parse(cleanText);
    } catch (parseError) {
      console.error('Error parsing vocabulary JSON:', parseError);
      throw new Error('Failed to parse vocabulary response');
    }
  });
}

// 生成贴纸信息
export async function generateStickerInfo(
  word: string,
  translation: string,
  style: string = 'cartoon',
  perspective: string = 'front'
): Promise<{
  word: string;
  translation: string;
  description: string;
  imagePrompt: string;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  pronunciation: string;
  examples: Array<{
    english: string;
    chinese: string;
  }>;
}> {
  return retryWithBackoff(async () => {
    const prompt = `
为英语单词"${word}"（中文：${translation}）生成详细的贴纸信息。

风格：${style}
视角：${perspective}

请生成：
1. 贴纸描述（中文，简洁明了）
2. 图片生成提示（英文，详细描述）
3. 准确的单词音标发音
4. 例句（2个，包含英文和中文）

请以JSON格式返回：
{
  "word": "${word}",
  "translation": "${translation}",
  "description": "可爱的卡通苹果贴纸",
  "imagePrompt": "A cute cartoon apple sticker, ${style} style, ${perspective} view, vibrant colors, simple design, white background, high quality",
  "tags": ["水果", "食物", "健康"],
  "difficulty": "beginner",
  "pronunciation": "/ˈæpəl/",
  "examples": [
    {
      "english": "I eat an apple every day.",
      "chinese": "我每天吃一个苹果。"
    },
    {
      "english": "The apple is red and sweet.",
      "chinese": "这个苹果又红又甜。"
    }
  ]
}

只返回JSON对象，不要包含其他文字。
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // 清理响应文本，移除可能的markdown格式
    const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    try {
      return JSON.parse(cleanText);
    } catch (parseError) {
      console.error('Error parsing sticker info JSON:', parseError);
      throw new Error('Failed to parse sticker info response');
    }
  });
}

// 生成贴纸描述
export async function generateStickerDescriptions(
  approvedWords: Array<{ word: string; translation: string }>,
  style: string,
  viewpoint?: string
): Promise<Array<{
  word: string;
  description: string;
  imagePrompt: string;
}>> {
  try {
    const wordsText = approvedWords.map(w => `${w.word} (${w.translation})`).join(', ');
    
    const prompt = `
为以下英语词汇生成贴纸描述和图片生成提示：

词汇列表：${wordsText}
风格：${style}${viewpoint ? `\n视角：${viewpoint}` : ''}

为每个词汇生成：
1. 简短的贴纸描述（中文，20字以内）
2. 详细的图片生成提示（英文，适合AI图片生成）${viewpoint ? `，使用${viewpoint}视角` : ''}

请以JSON格式返回：
[
  {
    "word": "apple",
    "description": "红色苹果贴纸",
    "imagePrompt": "A cute red apple sticker with ${style} style${viewpoint ? `, ${viewpoint} view` : ''}, simple design, white background, vibrant colors"
  }
]

只返回JSON数组，不要包含其他文字。
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    try {
      return JSON.parse(cleanText);
    } catch (parseError) {
      console.error('Error parsing sticker descriptions JSON:', parseError);
      throw new Error('Failed to parse sticker descriptions response');
    }
  } catch (error) {
    console.error('Error generating sticker descriptions:', error);
    throw new Error('Failed to generate sticker descriptions');
  }
}

// 生成世界草图描述
export async function generateWorldSketch(
  sceneDescription: string,
  approvedStickers: Array<{ word: string; translation: string }>,
  style: string,
  layout: string
): Promise<{
  title: string;
  description: string;
  imagePrompt: string;
}> {
  try {
    const stickersText = approvedStickers.map(s => s.word).join(', ');
    
    const prompt = `
基于以下信息生成英语学习世界的草图描述：

场景描述：${sceneDescription}
包含贴纸：${stickersText}
视觉风格：${style}
布局方式：${layout}

请生成：
1. 世界标题（中文，10字以内）
2. 世界描述（中文，50-100字）
3. 图片生成提示（英文，详细描述整个场景的视觉效果）

请以JSON格式返回：
{
  "title": "魔法厨房",
  "description": "一个充满魔法的厨房世界，包含各种厨具和食材，适合学习日常英语词汇。",
  "imagePrompt": "A magical kitchen scene with floating utensils, colorful ingredients, warm lighting, cartoon style, educational and friendly atmosphere"
}

只返回JSON对象，不要包含其他文字。
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    try {
      return JSON.parse(cleanText);
    } catch (parseError) {
      console.error('Error parsing world sketch JSON:', parseError);
      throw new Error('Failed to parse world sketch response');
    }
  } catch (error) {
    console.error('Error generating world sketch:', error);
    throw new Error('Failed to generate world sketch');
  }
}

// 生成贴纸
export async function generateStickers(vocabulary: Array<{
  word: string;
  translation: string;
  pronunciation: string;
  category: string;
}>): Promise<Array<{
  id: string;
  word: string;
  translation: string;
  pronunciation: string;
  category: string;
  imageUrl: string;
}>> {
  return retryWithBackoff(async () => {
    // 为每个词汇生成贴纸
    const stickers = vocabulary.map((vocab, index) => ({
      id: `sticker-${index + 1}`,
      word: vocab.word,
      translation: vocab.translation,
      pronunciation: vocab.pronunciation,
      category: vocab.category,
      imageUrl: `/api/placeholder/150/150?text=${encodeURIComponent(vocab.word)}`
    }));

    return stickers;
  });
}