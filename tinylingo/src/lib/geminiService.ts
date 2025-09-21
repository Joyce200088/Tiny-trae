// Gemini AI服务，用于图片识别和英语内容生成

export interface EnglishLearningContent {
  english: string;      // 英文单词/短语
  chinese: string;      // 中文翻译
  example: string;      // 英文例句
  exampleChinese: string; // 例句中文翻译
  pronunciation?: string; // 发音（可选）
}

export interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

const GEMINI_API_KEY = 'AIzaSyCjzpGqvGow52_QWVW8uw_2yVDAGf6H_Uw';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`;

/**
 * 将Canvas转换为Base64格式
 */
function canvasToBase64(canvas: HTMLCanvasElement): string {
  const dataURL = canvas.toDataURL('image/jpeg', 0.8);
  const base64 = dataURL.split(',')[1];
  
  // 验证base64数据不为空
  if (!base64 || base64.length === 0) {
    throw new Error('Canvas转换为Base64失败：数据为空');
  }
  
  console.log('Base64数据长度:', base64.length);
  return base64;
}

/**
 * 调用Gemini API识别图片并生成英语学习内容
 */
export async function identifyImageAndGenerateContent(canvas: HTMLCanvasElement): Promise<EnglishLearningContent> {
  try {
    // 验证canvas是否有效
    if (!canvas || canvas.width === 0 || canvas.height === 0) {
      throw new Error('Canvas无效或为空');
    }
    
    const base64Image = canvasToBase64(canvas);
    console.log('准备发送API请求，图片数据长度:', base64Image.length);
    
    const prompt = `请仔细观察这张图片中的物品，然后生成英语学习内容。请严格按照以下JSON格式返回，不要添加任何其他文字：

{
  "english": "物品的英文名称（单词或短语）",
  "chinese": "对应的中文翻译",
  "example": "包含该英文单词的日常口语化句子，要自然流畅，像平时说话一样，详细描述图片中物品的具体特征",
  "exampleChinese": "例句的中文翻译"
}

要求：
1. 英文单词要准确、常用
2. 例句必须是日常口语化的自然表达，包含基本语法结构：
   - 主语：用I, We, This等自然的开头
   - 谓语：用常见动词（bought, got, have, found等）
   - 宾语：具体的物品名称
   - 定语：简单形容词（nice, old, wooden, small等）
   - 状语：日常时间地点（yesterday, last week, at the store等）
   - 补语：简单补充（that I really like, which looks great等）
3. 例句要详细描述图片中物品的具体特征：
   - 颜色、材质、大小、形状
   - 物品的状态、位置
   - 可见的细节特征
4. 例句长度控制在15-20个单词，不要太长
5. 语言要自然流畅，像日常对话
6. 避免过于正式或复杂的表达
7. 中文翻译要准确自然
8. 只返回JSON格式，不要其他解释文字

示例格式：
- 过于简单：This is a table.
- 过于复杂：I recently purchased this magnificent antique mahogany dining table that features exquisitely carved legs.
- 日常口语化：I bought this nice wooden table last week that has pretty carved legs.
- 日常口语化：We got this old leather chair that's really comfortable and looks great.`;

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: prompt
            },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: base64Image
              }
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.4,
        topK: 32,
        topP: 1,
        maxOutputTokens: 1024,
      }
    };

    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API错误详情:', errorText);
      throw new Error(`Gemini API请求失败: ${response.status} ${response.statusText}`);
    }

    const data: GeminiResponse = await response.json();
    
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('Gemini API返回数据格式错误');
    }

    const textContent = data.candidates[0].content.parts[0].text;
    
    // 尝试解析JSON响应
    try {
      console.log('原始响应:', textContent);
      
      // 提取JSON内容（可能包含markdown代码块）
      let jsonContent = textContent;
      
      // 如果包含markdown代码块，提取其中的JSON
      const codeBlockMatch = textContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (codeBlockMatch) {
        jsonContent = codeBlockMatch[1].trim();
      }
      
      // 尝试解析为数组或对象
      const parsed = JSON.parse(jsonContent);
      
      let parsedContent: EnglishLearningContent;
      
      if (Array.isArray(parsed)) {
        // 如果是数组，取第一个元素
        if (parsed.length === 0) {
          throw new Error('AI返回的数组为空');
        }
        parsedContent = parsed[0];
      } else {
        // 如果是对象，直接使用
        parsedContent = parsed;
      }
      
      // 验证必需字段
      if (!parsedContent.english || !parsedContent.chinese || !parsedContent.example || !parsedContent.exampleChinese) {
        throw new Error('AI返回的内容缺少必需字段');
      }
      
      return parsedContent;
    } catch (parseError) {
      console.error('解析AI响应失败:', parseError);
      console.error('原始响应:', textContent);
      
      // 返回默认内容
      return {
        english: 'Unknown Object',
        chinese: '未知物品',
        example: 'I can see an unknown object.',
        exampleChinese: '我能看到一个未知的物品。'
      };
    }
    
  } catch (error) {
    console.error('Gemini API调用失败:', error);
    
    // 返回默认内容
    return {
      english: 'Object',
      chinese: '物品',
      example: 'This is an object.',
      exampleChinese: '这是一个物品。'
    };
  }
}

/**
 * 批量识别多个物品
 */
export async function identifyMultipleImages(canvases: HTMLCanvasElement[]): Promise<EnglishLearningContent[]> {
  const results: EnglishLearningContent[] = [];
  
  // 为了避免API限制，逐个处理
  for (let i = 0; i < canvases.length; i++) {
    try {
      const content = await identifyImageAndGenerateContent(canvases[i]);
      results.push(content);
      
      // 添加延迟避免API限制
      if (i < canvases.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error(`识别第${i + 1}个物品失败:`, error);
      results.push({
        english: `Object ${i + 1}`,
        chinese: `物品 ${i + 1}`,
        example: `This is object number ${i + 1}.`,
        exampleChinese: `这是第${i + 1}个物品。`
      });
    }
  }
  
  return results;
}