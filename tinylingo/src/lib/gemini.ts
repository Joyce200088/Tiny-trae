import { GoogleGenerativeAI } from '@google/generative-ai';

// 初始化Gemini AI
const genAI = new GoogleGenerativeAI('AIzaSyCjzpGqvGow52_QWVW8uw_2yVDAGf6H_Uw');

// 获取模型实例
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

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
  audio: string;
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
  "audio": "音频建议描述",
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
  "mnemonic": "一句简洁的记忆方法（基于发音、词根或联想）",
  "masteryStatus": "familiar",
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
2. 例句要实用，体现单词的常见用法
3. 记忆方法要有创意，帮助中文使用者记忆
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
    audio: "建议添加标准美式发音",
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
    masteryStatus: "familiar",
    relatedWords: [
      { word: "related1", chinese: "相关词1", partOfSpeech: "noun" },
      { word: "related2", chinese: "相关词2", partOfSpeech: "verb" },
      { word: "related3", chinese: "相关词3", partOfSpeech: "adjective" }
    ]
  };
}