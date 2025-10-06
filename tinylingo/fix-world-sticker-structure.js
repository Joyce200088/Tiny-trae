/**
 * 修复世界数据中的贴纸信息结构不完整问题
 * 
 * 问题：
 * 1. dictation/page.tsx 中的 stickerData 缺少 audio, examples, relatedWords, masteryStatus 等字段
 * 2. 测试文件中的 stickerData 结构不完整
 * 3. 需要确保所有世界数据中的贴纸都符合完整的 Sticker 接口规范
 */

const fs = require('fs');
const path = require('path');

// 完整的贴纸数据结构模板
const COMPLETE_STICKER_TEMPLATE = {
  id: '',
  word: '',
  cn: '',
  pos: 'noun', // "noun" | "verb" | "adj" | "adv"
  image: '',
  audio: {
    uk: '',
    us: ''
  },
  examples: [
    { en: '', cn: '' },
    { en: '', cn: '' }
  ],
  mnemonic: [''],
  masteryStatus: 'new', // "new" | "fuzzy" | "mastered"
  tags: [],
  relatedWords: [
    // 前3个必须是动词
    { word: '', pos: 'verb' },
    { word: '', pos: 'verb' },
    { word: '', pos: 'verb' },
    // 其余7个可以是名词、形容词、副词
    { word: '', pos: 'noun' },
    { word: '', pos: 'adj' },
    { word: '', pos: 'adv' },
    { word: '', pos: 'noun' },
    { word: '', pos: 'adj' },
    { word: '', pos: 'noun' },
    { word: '', pos: 'adv' }
  ],
  // 兼容性字段
  name: '',
  chinese: '',
  phonetic: '',
  category: '',
  partOfSpeech: '',
  thumbnailUrl: '',
  createdAt: '',
  sorted: true,
  notes: ''
};

// 需要检查的文件列表
const FILES_TO_CHECK = [
  'src/app/dictation/page.tsx',
  'test-world-save-debug.html',
  'test-world-save-complete.html'
];

/**
 * 分析 stickerData 结构
 */
function analyzeStickerData(filePath) {
  console.log(`\n=== 分析文件: ${filePath} ===`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ 文件不存在: ${filePath}`);
    return { issues: [], suggestions: [] };
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const issues = [];
  const suggestions = [];
  
  // 查找 stickerData 对象（使用更精确的匹配方法）
  const stickerDataRegex = /stickerData:\s*\{[\s\S]*?\n\s*\}\s*(?=\n\s*\})/g;
  const stickerDataMatches = content.match(stickerDataRegex);
  
  if (!stickerDataMatches) {
    console.log('ℹ️  未找到 stickerData 对象');
    return { issues, suggestions };
  }
  
  console.log(`📊 找到 ${stickerDataMatches.length} 个 stickerData 对象`);
  
  stickerDataMatches.forEach((match, index) => {
    console.log(`\n--- stickerData ${index + 1} ---`);
    console.log(match);
    
    // 检查必需字段
    const requiredFields = ['audio', 'examples', 'mnemonic', 'masteryStatus', 'relatedWords'];
    const missingFields = [];
    
    requiredFields.forEach(field => {
      if (!match.includes(field)) {
        missingFields.push(field);
      }
    });
    
    if (missingFields.length > 0) {
      const issue = `stickerData ${index + 1} 缺少字段: ${missingFields.join(', ')}`;
      issues.push(issue);
      console.log(`❌ ${issue}`);
    } else {
      console.log('✅ 包含所有必需字段');
    }
  });
  
  // 生成修复建议
  if (issues.length > 0) {
    suggestions.push(`修复 ${filePath}:`);
    suggestions.push('1. 更新 StickerData 接口定义');
    suggestions.push('2. 为现有 stickerData 对象添加缺失字段');
    suggestions.push('3. 确保新创建的贴纸数据包含完整结构');
  }
  
  return { issues, suggestions };
}

/**
 * 生成完整的贴纸数据示例
 */
function generateCompleteStickerExample(baseName = 'apple', baseCn = '苹果') {
  return {
    id: `sticker-${Date.now()}`,
    word: baseName,
    cn: baseCn,
    pos: 'noun',
    image: `/${baseName}.png`,
    audio: {
      uk: `/audio/${baseName}-uk.mp3`,
      us: `/audio/${baseName}-us.mp3`
    },
    examples: [
      { en: `I eat an ${baseName} every day.`, cn: `我每天吃一个${baseCn}。` },
      { en: `The ${baseName} is red and sweet.`, cn: `这个${baseCn}又红又甜。` }
    ],
    mnemonic: [`${baseName}的记忆方法：联想红色的果实`],
    masteryStatus: 'new',
    tags: ['Fruit', 'Food'],
    relatedWords: [
      { word: 'eat', pos: 'verb' },
      { word: 'pick', pos: 'verb' },
      { word: 'wash', pos: 'verb' },
      { word: 'fruit', pos: 'noun' },
      { word: 'red', pos: 'adj' },
      { word: 'sweet', pos: 'adj' },
      { word: 'tree', pos: 'noun' },
      { word: 'fresh', pos: 'adj' },
      { word: 'orchard', pos: 'noun' },
      { word: 'naturally', pos: 'adv' }
    ],
    // 兼容性字段
    name: baseName,
    chinese: baseCn,
    phonetic: `/ˈæpl/`,
    category: 'Food',
    partOfSpeech: 'noun',
    thumbnailUrl: `/${baseName}.png`,
    createdAt: new Date().toISOString().split('T')[0],
    sorted: true,
    notes: `A round fruit that grows on trees, commonly red, green, or yellow in color.`
  };
}

/**
 * 生成修复后的代码片段
 */
function generateFixedCode() {
  const completeStickerExample = generateCompleteStickerExample();
  
  return `
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
const completeStickerExample = ${JSON.stringify(completeStickerExample, null, 2)};

// 修复函数：将不完整的 stickerData 转换为完整结构
function fixStickerData(incompleteStickerData) {
  const fixed = {
    // 必需字段
    id: incompleteStickerData.id || \`sticker-\${Date.now()}\`,
    word: incompleteStickerData.word || incompleteStickerData.name || '',
    cn: incompleteStickerData.cn || incompleteStickerData.chinese || '',
    pos: incompleteStickerData.pos || 'noun',
    image: incompleteStickerData.image || incompleteStickerData.thumbnailUrl || '',
    
    // 补充缺失的必需字段
    audio: incompleteStickerData.audio || {
      uk: \`/audio/\${incompleteStickerData.word || incompleteStickerData.name || 'word'}-uk.mp3\`,
      us: \`/audio/\${incompleteStickerData.word || incompleteStickerData.name || 'word'}-us.mp3\`
    },
    
    examples: incompleteStickerData.examples || [
      { 
        en: \`This is a \${incompleteStickerData.word || incompleteStickerData.name || 'word'}.\`, 
        cn: \`这是一个\${incompleteStickerData.cn || incompleteStickerData.chinese || '词'}。\` 
      },
      { 
        en: \`I like this \${incompleteStickerData.word || incompleteStickerData.name || 'word'}.\`, 
        cn: \`我喜欢这个\${incompleteStickerData.cn || incompleteStickerData.chinese || '词'}。\` 
      }
    ],
    
    mnemonic: incompleteStickerData.mnemonic ? 
      (Array.isArray(incompleteStickerData.mnemonic) ? incompleteStickerData.mnemonic : [incompleteStickerData.mnemonic]) :
      [\`\${incompleteStickerData.word || incompleteStickerData.name || 'word'}的记忆方法\`],
    
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
`;
}

/**
 * 主函数
 */
function main() {
  console.log('🔍 开始检查世界数据中的贴纸信息结构...\n');
  
  const allIssues = [];
  const allSuggestions = [];
  
  // 检查每个文件
  FILES_TO_CHECK.forEach(filePath => {
    const { issues, suggestions } = analyzeStickerData(filePath);
    allIssues.push(...issues);
    allSuggestions.push(...suggestions);
  });
  
  // 生成报告
  console.log('\n' + '='.repeat(60));
  console.log('📋 检查结果汇总');
  console.log('='.repeat(60));
  
  if (allIssues.length === 0) {
    console.log('✅ 所有贴纸数据结构都是完整的！');
  } else {
    console.log(`❌ 发现 ${allIssues.length} 个问题:`);
    allIssues.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue}`);
    });
  }
  
  if (allSuggestions.length > 0) {
    console.log('\n💡 修复建议:');
    allSuggestions.forEach((suggestion, index) => {
      console.log(`${index + 1}. ${suggestion}`);
    });
  }
  
  // 生成修复代码
  const fixedCode = generateFixedCode();
  const fixedCodePath = 'sticker-data-fix-template.js';
  fs.writeFileSync(fixedCodePath, fixedCode);
  
  console.log(`\n📄 已生成修复代码模板: ${fixedCodePath}`);
  console.log('\n🔧 下一步操作:');
  console.log('1. 查看生成的修复代码模板');
  console.log('2. 更新 dictation/page.tsx 中的 StickerData 接口');
  console.log('3. 使用 fixStickerData 函数修复现有的不完整数据');
  console.log('4. 确保新创建的世界数据包含完整的贴纸结构');
  
  return {
    issuesFound: allIssues.length,
    suggestions: allSuggestions,
    fixedCodeGenerated: true
  };
}

// 运行检查
if (require.main === module) {
  main();
}

module.exports = { main, analyzeStickerData, generateCompleteStickerExample };