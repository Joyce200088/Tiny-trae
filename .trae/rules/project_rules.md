5.更新日志单独维护在 CHANGELOG.md, 每次修改代码后要在 CHANGELOG.md 中添加相关记录，包括修改的文件、修改的内容、为什么要修改以及修改后的影响。如果修改没有被采纳，也要在CHANGELOG.md更新日志中添加相关记录，并标注为“未采纳”，并且把文件名前缀添加为“_no”。
6.最新被采纳的版本保留在 src/ 目录中作为当前生效实现。被新版本取代后，再把老版本移入 archive/。未采纳的实验/分支统一放 _no_archive/。
7.每次创建新的实验分支时，要在分支名前添加实验编号，如 E0_v1、E1_v1 等。
# Project Rules: English Stickers Learning App
### 1. 框架和依赖版本
- 前端框架：Next.js + React + TailwindCSS
- UI 组件：shadcn/ui（优先使用）
- 状态管理：React hooks + context，不使用 Redux/MobX
- 数据存储：Supabase (PostgreSQL + Supabase Storage)
- 图像/音频：贴纸图片、音频文件必须存储在 Supabase Storage 中，保证跨设备可见与持久化



### 2. 数据与存储规则
- 所有贴纸信息必须保存到 Supabase 表（跨设备可见）  
- 图片必须上传到 Supabase Storage  
- 不允许只存储在 localStorage，否则刷新后丢失  


### 3. UI 与交互规则
- 页面背景色固定为 #FFFBF5  
- 单词详情页、听写页、AI 生成世界页必须复用相同的 Sticker 数据结构  
- 页面导航必须清晰，不得嵌套过深
- 重点突出学习内容（贴纸、单词、练习），弱化不相关信息

### 4. 贴纸数据结构
所有贴纸必须遵循以下字段结构（不可缺漏，不得随意新增字段）：
```typescript
interface Sticker {
  word: string;             // 核心英文单词
  cn: string;               // 简洁准确的中文释义
  pos: "noun" | "verb" | "adj" | "adv";   // 词性
  image: string;            // 透明背景贴纸图标 (PNG/SVG URL)
  audio: {
    uk: string;             // 英音
    us: string;             // 美音
  };
  examples: {
    en: string;             // 英文例句
    cn: string;             // 中文翻译
  }[];                      // 2条
  mnemonic: string[];       // 词根词缀巧记方法，1 条
  masteryStatus: "new" | "fuzzy" | "mastered"; // 陌生 / 模糊 / 掌握
  tags: string[];           // 主题分类，由用户自定义设置（如 Kitchen, Tool, Food）
  relatedWords: {
    word: string;
    pos: "noun" | "verb" | "adj" | "adv";
  }[];                      // 10 个，规则如下：
                            // - 前 3 个必须是动词，且描述与核心词的交互动作
                            // - 其余 7 个可以是名词、形容词、副词，需与核心词强相关
}

### 5. 测试与质量
- 所有新增功能必须写单元测试（Jest/Testing Library）  
- 贴纸数据写入 Supabase 前必须校验数据结构完整性  


