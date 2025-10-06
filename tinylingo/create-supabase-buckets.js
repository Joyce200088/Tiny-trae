// 自动创建Supabase存储桶的脚本
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
  process.exit(1);
}

// 存储桶配置
const BUCKET_CONFIGS = [
  {
    id: 'sticker-images',
    name: 'sticker-images',
    public: true,
    fileSizeLimit: 5242880, // 5MB
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
  },
  {
    id: 'background-images', 
    name: 'background-images',
    public: true,
    fileSizeLimit: 10485760, // 10MB
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp']
  },
  {
    id: 'world-thumbnails',
    name: 'world-thumbnails', 
    public: true,
    fileSizeLimit: 5242880, // 5MB
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp']
  },
  {
    id: 'user-uploads',
    name: 'user-uploads',
    public: true, 
    fileSizeLimit: 10485760, // 10MB
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
  }
];

async function createSupabaseBuckets() {
  console.log('🚀 开始创建Supabase存储桶...\n');
  
  // 检查环境变量
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Supabase环境变量未配置');
    return;
  }
  
  console.log('✅ Supabase环境变量已配置');
  console.log(`📍 URL: ${supabaseUrl}`);
  console.log('');
  
  // 创建Supabase客户端
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  try {
    // 检查现有存储桶
    console.log('📦 检查现有存储桶...');
    const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ 获取存储桶列表失败:', listError.message);
      return;
    }
    
    const existingBucketIds = existingBuckets.map(b => b.id);
    console.log(`现有存储桶: ${existingBucketIds.length > 0 ? existingBucketIds.join(', ') : '无'}`);
    console.log('');
    
    // 创建缺失的存储桶
    let createdCount = 0;
    let skippedCount = 0;
    let failedCount = 0;
    
    for (const config of BUCKET_CONFIGS) {
      if (existingBucketIds.includes(config.id)) {
        console.log(`⏭️  跳过 ${config.id} - 已存在`);
        skippedCount++;
        continue;
      }
      
      console.log(`🔨 创建存储桶: ${config.id}`);
      console.log(`   - 名称: ${config.name}`);
      console.log(`   - 公开访问: ${config.public ? '是' : '否'}`);
      console.log(`   - 最大文件: ${(config.fileSizeLimit / 1024 / 1024).toFixed(1)}MB`);
      console.log(`   - 支持格式: ${config.allowedMimeTypes.join(', ')}`);
      
      try {
        const { data, error } = await supabase.storage.createBucket(config.id, {
          public: config.public,
          fileSizeLimit: config.fileSizeLimit,
          allowedMimeTypes: config.allowedMimeTypes
        });
        
        if (error) {
          console.log(`   ❌ 创建失败: ${error.message}`);
          failedCount++;
        } else {
          console.log(`   ✅ 创建成功`);
          createdCount++;
        }
        
      } catch (error) {
        console.log(`   ❌ 创建异常: ${error.message}`);
        failedCount++;
      }
      
      console.log('');
    }
    
    // 总结
    console.log('📊 创建结果总结:');
    console.log(`   ✅ 成功创建: ${createdCount} 个`);
    console.log(`   ⏭️  已存在跳过: ${skippedCount} 个`);
    console.log(`   ❌ 创建失败: ${failedCount} 个`);
    console.log('');
    
    if (createdCount > 0) {
      console.log('🎉 存储桶创建完成！');
      console.log('💡 提示: 如果需要设置RLS策略，请在Supabase控制台的SQL编辑器中执行 supabase/storage-setup.sql');
    }
    
    if (failedCount > 0) {
      console.log('⚠️  部分存储桶创建失败，可能需要管理员权限');
      console.log('📝 备选方案: 在Supabase控制台手动创建或执行SQL脚本');
    }
    
    // 验证创建结果
    console.log('\n🔍 验证创建结果...');
    const { data: finalBuckets, error: finalError } = await supabase.storage.listBuckets();
    
    if (finalError) {
      console.error('❌ 验证失败:', finalError.message);
      return;
    }
    
    const finalBucketIds = finalBuckets.map(b => b.id);
    const missingBuckets = BUCKET_CONFIGS.filter(config => !finalBucketIds.includes(config.id));
    
    if (missingBuckets.length === 0) {
      console.log('✅ 所有必需的存储桶都已存在！');
    } else {
      console.log(`❌ 仍有 ${missingBuckets.length} 个存储桶缺失:`);
      missingBuckets.forEach(bucket => {
        console.log(`   - ${bucket.id}`);
      });
    }
    
  } catch (error) {
    console.error('❌ 创建过程中出错:', error.message);
  }
}

// 运行创建脚本
createSupabaseBuckets().catch(console.error);