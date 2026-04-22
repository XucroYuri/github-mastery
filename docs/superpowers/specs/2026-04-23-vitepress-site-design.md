# VitePress 静态网站设计文档

## 概述

为 GitHub 完全指南课程构建 VitePress 驱动的静态网站，部署到 GitHub Pages。直接引用现有 42 个 Markdown 教学文件，不移动或复制内容。

## 技术栈

- **VitePress** 1.x（Vue 驱动的文档站点生成器）
- **Node.js** 18+
- **GitHub Pages** 部署（通过 GitHub Actions）
- **vitepress-plugin-mermaid** — Mermaid 图表渲染

## 目录结构

```
github-mastery/
├── docs/
│   ├── .vitepress/
│   │   ├── config.ts          # VitePress 主配置
│   │   └── plugins/
│   │       └── githubAlerts.ts # > [!NOTE] 兼容插件
│   └── public/
│       └── logo.svg           # 站点 Logo（可选）
├── index.md                   # 首页（在仓库根目录，srcDir 范围内）
├── 00-前言与学习路线/          # 现有课程内容（不移动）
├── 01-基础操作/
├── 02-协作与工作流/
├── 03-自动化与CI-CD/
├── 04-代码质量与安全/
├── 05-文档与知识管理/
├── 06-高级功能与生态/
├── 07-管理与治理/
├── 08-实战案例集/
├── package.json
├── .gitignore                 # 更新：添加 node_modules 等
└── .github/
    └── workflows/
        └── deploy.yml         # 自动部署 workflow
```

## 核心配置

### VitePress config.ts

```typescript
// docs/.vitepress/config.ts
export default defineConfig({
  // 源文件在仓库根目录（docs 的上级）
  srcDir: '..',
  // 排除非课程文件，避免它们被生成页面
  srcExclude: [
    'README.md',        // 仓库根 README（与 index.md 路由冲突）
    'CONTRIBUTING.md',  // 贡献指南
    'REFERENCES.md',    // 参考资料索引（50KB+）
    '.github/**',       // Issue/PR 模板
    'docs/**',          // VitePress 项目目录本身
  ],
  // 输出到 docs/.vitepress/dist
  outDir: '.vitepress/dist',
  // GitHub Pages 部署路径
  base: '/github-mastery/',
  // 站点元数据
  title: 'GitHub 完全指南',
  description: '挖掘 GitHub 的全部潜力',
  // 中文
  lang: 'zh-CN',
  // 功能
  lastUpdated: true,
  // 注意：cleanUrls 在 GitHub Pages 上不完全生效（.html 重定向），
  // 但保持开启可让本地开发体验更好
  cleanUrls: true,
})
```

### 侧边栏结构

9 个可折叠侧边栏分组，每组包含章节 README + 专题文件：

```
- 前言与学习路线
  ├── 功能全景图
  └── 学习路线建议
- 基础操作
  ├── 注册与账号设置
  ├── 仓库创建与管理
  ├── 文件操作
  ├── 分支基础
  └── 提交与提交历史
- 协作与工作流
  ├── Issue 完整指南
  ├── 标签与里程碑
  ├── PR 完整生命周期
  ├── 代码审查
  ├── 分支策略与 Git Flow
  └── 项目管理看板
... (其余章节同理)
```

侧边栏链接使用 `link` 属性指向实际文件路径（相对于 `srcDir`）。标题从文件 H1 自动提取（VitePress 默认行为）。

### 导航栏

```
[Logo] GitHub 完全指南          [GitHub 仓库]
```

- 左侧：站点 Logo + 标题
- 右侧：GitHub 仓库链接图标

### 搜索

使用 VitePress 内置搜索（基于 miniSearch），中文友好，无需额外配置。

### 前后页导航

VitePress 内置的 prev/next 导航，根据侧边栏顺序自动生成。

### 代码块增强

VitePress 内置支持：
- 行号显示（默认开启）
- 复制按钮（默认开启）
- 语法高亮（Shiki）

## 告示块兼容

### 问题

42 个课程文件使用 GitHub 风格告示语法：
```markdown
> [!NOTE]
> 内容
```

VitePress 使用不同的语法：
```markdown
:::info
内容
:::
```

### 方案：原始字符串替换

编写 VitePress 构建钩子（`docs/.vitepress/plugins/githubAlerts.ts`），在 markdown-it 处理前对原始 Markdown 文本进行正则替换。**不修改原始 md 文件。**

解析策略：
- 使用正则匹配 `> [!TYPE]\n> content` 模式（支持多行 `>` 引用延续）
- 将匹配到的块替换为 `:::type\ncontent\n:::` 格式
- 需处理的边界情况：告示块内包含空行（`>\n> text`）、告示块与非告示引用块之间的转换

映射规则：
- `> [!NOTE]` → `:::info`
- `> [!TIP]` → `:::tip`
- `> [!WARNING]` → `:::warning`
- `> [!IMPORTANT]` → `:::danger`
- `> [!CAUTION]` → `:::danger`

## Mermaid 支持

安装 `vitepress-plugin-mermaid`，在 config.ts 中注册。现有文件中 ````mermaid` 代码块将自动渲染为 SVG 图表。

## 首页设计

`index.md`（仓库根目录）使用 VitePress frontmatter 自定义布局：

> 注意：首页文件放在仓库根目录 `index.md`，而非 `docs/index.md`。因为 `srcDir: '..'` 指向仓库根目录，VitePress 只会扫描 srcDir 内的文件，`docs/index.md` 不在扫描范围内。`srcExclude` 已排除原有的 `README.md` 避免路由冲突。

```yaml
---
layout: home
hero:
  name: GitHub 完全指南
  text: 挖掘 GitHub 的全部潜力
  tagline: 从基础操作到高级生态，9 大章节 42 个专题
  actions:
    - theme: brand
      text: 开始学习
      link: /00-前言与学习路线/
    - theme: alt
      text: GitHub 仓库
      link: https://github.com/xucroyuri/github-mastery
features:
  - title: 基础操作
    details: 仓库、分支、提交、文件操作
  - title: 协作工作流
    details: Issue、PR、代码审查、项目管理
  - ... (9 个章节卡片)
---
```

## 部署

### GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy VitePress site
on:
  push:
    branches: [main]
  workflow_dispatch:
permissions:
  contents: read
  pages: write
  id-token: write
concurrency:
  group: pages
  cancel-in-progress: false
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # 完整 git 历史，确保 lastUpdated 时间戳准确
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run docs:build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: docs/.vitepress/dist
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/deploy-pages@v4
        id: deployment
```

### GitHub Pages 配置

仓库 Settings → Pages → Source: GitHub Actions

## .gitignore 更新

追加：
```
# Node / VitePress
node_modules/
docs/.vitepress/dist/
docs/.vitepress/cache/
```

## package.json

```json
{
  "name": "github-mastery",
  "private": true,
  "scripts": {
    "docs:dev": "vitepress dev docs",
    "docs:build": "vitepress build docs",
    "docs:preview": "vitepress preview docs"
  },
  "devDependencies": {
    "vitepress": "^1.6",
    "vitepress-plugin-mermaid": "^2.0"
  }
}
```

## 约束与决策

1. **不修改现有 42 个课程文件** — 所有兼容性通过构建时处理
2. **不复制内容** — VitePress 通过 `srcDir` 直接读取
3. **章节 README 作为章节首页** — 点击侧边栏章节标题进入 README
4. **中文 UI** — `lang: 'zh-CN'`，主题文字可能需要自定义中文翻译
5. **无自定义域名** — 部署到 `/github-mastery/` 子路径
6. **零 JavaScript 编写** — 纯配置，不写 Vue 组件

## 实现任务清单

1. 初始化 package.json 和安装依赖
2. 创建 docs/.vitepress/config.ts（完整配置）
3. 编写 githubAlerts markdown-it 插件
4. 创建首页 index.md（仓库根目录）
5. 更新 .gitignore
6. 创建 deploy.yml workflow
7. 验证本地构建成功
8. 提交所有变更
