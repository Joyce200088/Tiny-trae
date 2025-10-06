// 调试贴纸数据同步问题的脚本
// 用于测试数组字段格式和Supabase同步

const fs = require('fs');
const path = require('path');

// 读取环境变量
function loadEnvVars() {
  const envPath = path.join(__dirname, '.env.local');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};
  
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      envVars[key.trim()] = value.trim();
    }
  });
  
  return envVars;
}

// 创建测试贴纸数据
function createTestStickerData() {
  return {
    user_id: 'test-user-123',
    sticker_id: 'test-sticker-' + Date.now(),
    word: 'test',
    cn: '测试',
    pos: 'noun',
    image: '/images/test.png',
    audio: {
      uk: '/audio/test-uk.mp3',
      us: '/audio/test-us.mp3'
    },
    examples: [
      { en: 'This is a test.', cn: '这是一个测试。' },
      { en: 'We need to test this.', cn: '我们需要测试这个。' }
    ],
    mnemonic: ['test 来自拉丁语 testum，意为"见证"'],
    mastery_status: 'new',
    tags: ['测试', 'debug'],
    related_words: [
      { word: 'examine', pos: 'verb' },
      { word: 'check', pos: 'verb' },
      { word: 'verify', pos: 'verb' }
    ],
    is_deleted: false
  };
}

// 测试数组字段格式
function testArrayFormats() {
  console.log('🔍 测试数组字段格式...\n');
  
  const testData = createTestStickerData();
  
  // 检查各个数组字段
  const arrayFields = {
    examples: testData.examples,
    mnemonic: testData.mnemonic,
    tags: testData.tags,
    related_words: testData.related_words
  };
  
  Object.entries(arrayFields).forEach(([fieldName, fieldValue]) => {
    console.log(`📋 ${fieldName}:`);
    console.log(`   类型: ${Array.isArray(fieldValue) ? 'Array' : typeof fieldValue}`);
    console.log(`   长度: ${Array.isArray(fieldValue) ? fieldValue.length : 'N/A'}`);
    console.log(`   内容: ${JSON.stringify(fieldValue)}`);
    console.log(`   SQL格式: ${formatForSQL(fieldValue)}`);
    console.log('');
  });
}

// 格式化为SQL兼容格式
function formatForSQL(value) {
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return "'{}'"; // PostgreSQL空数组格式
    }
    
    // 检查是否是字符串数组
    if (value.every(item => typeof item === 'string')) {
      return `'{${value.map(item => `"${item.replace(/"/g, '\\"')}"`).join(',')}}'`;
    }
    
    // 检查是否是对象数组（JSONB格式）
    if (value.every(item => typeof item === 'object')) {
      return `'${JSON.stringify(value)}'`;
    }
  }
  
  return JSON.stringify(value);
}

// 测试Supabase连接和插入
async function testSupabaseInsert() {
  console.log('🚀 测试Supabase连接和数据插入...\n');
  
  try {
    const envVars = loadEnvVars();
    const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase环境变量未配置');
    }
    
    console.log(`📍 Supabase URL: ${supabaseUrl}`);
    console.log(`🔑 API Key: ${supabaseKey.substring(0, 20)}...`);
    
    // 动态导入Supabase客户端
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // 测试连接
    const { data: connectionTest, error: connectionError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (connectionError) {
      console.error('❌ Supabase连接失败:', connectionError);
      return false;
    }
    
    console.log('✅ Supabase连接成功');
    
    // 创建测试数据
    const testSticker = createTestStickerData();
    console.log('📦 测试贴纸数据:');
    console.log(JSON.stringify(testSticker, null, 2));
    
    // 尝试插入数据
    const { data, error } = await supabase
      .from('user_stickers')
      .insert([testSticker])
      .select();
    
    if (error) {
      console.error('❌ 插入失败:', error);
      console.error('错误详情:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      
      // 分析错误类型
      if (error.code === '22P02') {
        console.log('\n🔍 数组格式错误分析:');
        console.log('这是PostgreSQL的"malformed array literal"错误');
        console.log('可能的原因:');
        console.log('1. 数组字段格式不正确');
        console.log('2. 空字符串被当作数组处理');
        console.log('3. JSONB字段格式错误');
        
        // 测试修复后的数据
        console.log('\n🔧 尝试修复数据格式...');
        const fixedSticker = fixArrayFields(testSticker);
        console.log('修复后的数据:');
        console.log(JSON.stringify(fixedSticker, null, 2));
        
        const { data: fixedData, error: fixedError } = await supabase
          .from('user_stickers')
          .insert([fixedSticker])
          .select();
        
        if (fixedError) {
          console.error('❌ 修复后仍然失败:', fixedError);
        } else {
          console.log('✅ 修复后插入成功!');
          console.log('插入的数据:', fixedData);
        }
      }
      
      return false;
    }
    
    console.log('✅ 插入成功!');
    console.log('插入的数据:', data);
    return true;
    
  } catch (error) {
    console.error('❌ 测试异常:', error);
    return false;
  }
}

// 修复数组字段格式
function fixArrayFields(sticker) {
  const fixed = { ...sticker };
  
  // 确保mnemonic是字符串数组
  if (!Array.isArray(fixed.mnemonic)) {
    fixed.mnemonic = [];
  }
  
  // 确保tags是字符串数组
  if (!Array.isArray(fixed.tags)) {
    fixed.tags = [];
  }
  
  // 确保examples是对象数组（JSONB）
  if (!Array.isArray(fixed.examples)) {
    fixed.examples = [];
  }
  
  // 确保related_words是对象数组（JSONB）
  if (!Array.isArray(fixed.related_words)) {
    fixed.related_words = [];
  }
  
  // 确保audio是对象（JSONB）
  if (typeof fixed.audio !== 'object' || fixed.audio === null) {
    fixed.audio = { uk: '', us: '' };
  }
  
  return fixed;
}

// 主函数
async function main() {
  console.log('🐛 贴纸数据同步调试工具\n');
  console.log('=' .repeat(50));
  
  // 测试数组格式
  testArrayFormats();
  
  console.log('=' .repeat(50));
  
  // 测试Supabase插入
  await testSupabaseInsert();
  
  console.log('\n🏁 调试完成');
}

// 运行主函数
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  createTestStickerData,
  testArrayFormats,
  testSupabaseInsert,
  fixArrayFields
};