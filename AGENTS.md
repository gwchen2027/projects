# AGENTS.md

## 项目概览

DeAICraft - AI痕迹消除工坊，一个专业的AI文本改写工具网站。聚合全球免费降AI率API，内置6种改写策略，支持中英文，本地处理保护隐私。

## 技术栈

- **Framework**: Next.js 16 (App Router)
- **Core**: React 19
- **Language**: TypeScript 5
- **UI**: shadcn/ui + Tailwind CSS 4
- **包管理**: pnpm

## 目录结构

```
src/
├── app/
│   ├── api/
│   │   ├── rewrite/route.ts          # 内置改写引擎API
│   │   ├── detect/route.ts           # 文本AI检测API
│   │   ├── upload-detect/route.ts    # 文件上传解析+检测API
│   │   ├── providers/route.ts        # 获取可用Provider列表
│   │   └── external-rewrite/route.ts # 调用外部API改写
│   ├── layout.tsx                     # 根布局
│   ├── page.tsx                       # 主页面（客户端组件，含改写/检测双模式）
│   └── globals.css                    # 全局样式
├── components/ui/                     # shadcn/ui组件库
├── lib/
│   ├── rewrite-engine.ts             # 核心改写引擎（词典、策略、处理函数）
│   ├── ai-detector.ts                # AI检测引擎（特征分析、评分算法）
│   ├── providers.ts                  # 外部API Provider配置与调用
│   └── utils.ts                      # 通用工具
```

## 核心功能

### 内置改写引擎 (`/api/rewrite`)
- 同义词替换（中英文词典）
- 句式重构（AI典型句式 → 人性化表达）
- 口语化过渡词添加
- 句子节奏变化（burstiness调整）
- AI格式特征去除
- 人类写作不规则性模拟

### AI检测引擎 (`/api/detect`)
- 多维度特征分析：AI高频词、句式模式、句长方差、词汇多样性、过渡词密度、段落均匀度
- 综合评分算法（0-100分），输出判定结论
- 逐段分析，标记每段AI概率及原因
- 支持中英文自动识别

### 文件上传检测 (`/api/upload-detect`)
- 支持 TXT / PDF / DOCX / Markdown 格式
- 使用 pdf-parse v2 解析PDF，mammoth 解析DOCX
- 自动提取文本后执行AI检测
- 文件大小限制 10MB

### 外部API聚合 (`/api/external-rewrite`)
- 支持多个免费Provider（QuillBot、ParaphraseTool、TextSpinner等）
- 自动失败重试机制
- Provider配置在 `src/lib/providers.ts`

## 开发命令

```bash
pnpm dev          # 启动开发服务
pnpm build        # 构建生产版本
pnpm start        # 启动生产服务
pnpm ts-check     # TypeScript类型检查
pnpm lint         # ESLint检查
```

## 设计规范

- 深色主题：背景 #0a0a0f，面板 #12121a
- 主色：琥珀金 #d4a039
- 成功色：翡翠绿 #2dd4a8
- 详见 DESIGN.md
