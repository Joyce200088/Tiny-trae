// 检查Supabase存储桶是否存在的脚本
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// 读取.env.local文件
let supabaseUrl = '';
let supabaseAnonKey = '';

try {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const lines = envContent.split('\n');
  
  for (const line of lines) {
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
      supabaseUrl = line.split('=')[1].trim();
    }
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
      supabaseAnonKey = line.split('=')[1].trim();
    }
  }
} catch (error) {
  console.error('❌ 无法读取 .env.local 文件:', error.message);
}

// 必需的存储桶列表
const REQUIRED_BUCKETS = [
  'sticker-images',
  'background-images', 
  'world-thumbnails',
  'user-uploads'
];

async function checkSupabaseBuckets() {
  console.log('🔍 检查Supabase存储桶...\n');
  
  // 检查环境变量
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Supabase环境变量未配置');
    console.log('请检查 .env.local 文件中的配置:');
    console.log('- NEXT_PUBLIC_SUPABASE_URL');
    console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY');
    return;
  }
  
  console.log('✅ Supabase环境变量已配置');
  console.log(`📍 URL: ${supabaseUrl}`);
  console.log(`🔑 Key: ${supabaseAnonKey.substring(0, 20)}...`);
  console.log('');
  
  // 创建Supabase客户端
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  try {
    // 获取所有存储桶
    console.log('📦 获取存储桶列表...');
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('❌ 获取存储桶列表失败:', error.message);
      return;
    }
    
    console.log(`✅ 成功获取存储桶列表 (${buckets.length} 个)`);
    console.log('');
    
    // 显示现有存储桶
    console.log('📋 现有存储桶:');
    buckets.forEach(bucket => {
      console.log(`  - ${bucket.id} (${bucket.name})`);
    });
    console.log('');
    
    // 检查必需的存储桶
    console.log('🔍 检查必需的存储桶:');
    const existingBucketIds = buckets.map(b => b.id);
    const missingBuckets = [];
    
    REQUIRED_BUCKETS.forEach(bucketId => {
      if (existingBucketIds.includes(bucketId)) {
        console.log(`  ✅ ${bucketId} - 存在`);
      } else {
        console.log(`  ❌ ${bucketId} - 不存在`);
        missingBuckets.push(bucketId);
      }
    });
    
    console.log('');
    
    // 总结
    if (missingBuckets.length === 0) {
      console.log('🎉 所有必需的存储桶都存在！');
    } else {
      console.log(`⚠️  发现 ${missingBuckets.length} 个缺失的存储桶:`);
      missingBuckets.forEach(bucket => {
        console.log(`   - ${bucket}`);
      });
      console.log('');
      console.log('📝 解决方案:');
      console.log('1. 在Supabase控制台的SQL编辑器中执行 supabase/storage-setup.sql');
      console.log('2. 或者手动在Storage页面创建缺失的存储桶');
    }
    
    // 测试上传权限
    console.log('\n🧪 测试上传权限...');
    await testUploadPermissions(supabase, existingBucketIds);
    
  } catch (error) {
    console.error('❌ 检查过程中出错:', error.message);
  }
}

async function testUploadPermissions(supabase, bucketIds) {
  // 创建测试文件
  const testContent = 'test-upload-' + Date.now();
  const testBlob = new Blob([testContent], { type: 'text/plain' });
  
  for (const bucketId of bucketIds) {
    if (!REQUIRED_BUCKETS.includes(bucketId)) continue;
    
    try {
      const testPath = `test/upload-test-${Date.now()}.txt`;
      
      // 尝试上传
      const { data, error } = await supabase.storage
        .from(bucketId)
        .upload(testPath, testBlob);
      
      if (error) {
        console.log(`  ❌ ${bucketId} - 上传失败: ${error.message}`);
      } else {
        console.log(`  ✅ ${bucketId} - 上传成功`);
        
        // 清理测试文件
        await supabase.storage.from(bucketId).remove([testPath]);
      }
      
    } catch (error) {
      console.log(`  ❌ ${bucketId} - 上传异常: ${error.message}`);
    }
  }
}

// 运行检查
checkSupabaseBuckets().catch(console.error);