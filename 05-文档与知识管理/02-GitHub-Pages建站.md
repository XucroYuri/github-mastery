# GitHub Pages 建站

> 从零搭建免费静态站点，涵盖 Jekyll 配置、自定义域名与部署源选择。

## 概述

GitHub Pages 是 GitHub 提供的免费静态站点托管服务。你可以直接从 Repository 发布网页，
用于项目文档、个人博客、作品集展示等场景。每个 GitHub 账户可以拥有一个用户站点
（`<username>.github.io`）和无限个项目站点（`<username>.github.io/<repo>`）。

GitHub Pages 原生支持 Jekyll 静态站点生成器，同时也可以部署任何纯静态 HTML 文件。
结合 GitHub Actions，你还可以使用 Hugo、Next.js、VuePress 等任意框架生成站点后部署。

> [!NOTE]
GitHub Pages 对免费账户有如下限制：站点源仓库不超过 1 GB；每月带宽不超过 100 GB；
每小时构建不超过 10 次。对于个人博客和项目文档来说，这些限制通常不会成为瓶颈。
GitHub Pages 不支持服务端逻辑（PHP、Node.js 等），仅限静态内容。

## 核心操作

### 创建用户站点

1. 在 GitHub 上创建一个名为 `<username>.github.io` 的新仓库（`<username>` 替换为你的 GitHub 用户名）。
2. 克隆仓库到本地：

```bash
git clone https://github.com/<username>/<username>.github.io.git
cd <username>.github.io
```

3. 创建 `index.html` 作为首页：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>My GitHub Pages</title>
</head>
<body>
    <h1>Hello, GitHub Pages!</h1>
    <p>欢迎访问我的站点。</p>
</body>
</html>
```

4. 提交并推送：

```bash
git add index.html
git commit -m "初始化 GitHub Pages 站点"
git push origin main
```

5. 等待几分钟，访问 `https://<username>.github.io` 即可看到站点。

### 创建项目站点

项目站点可以放在任意仓库中，部署分支和目录可在 Settings 中配置：

1. 进入仓库的 **Settings** → **Pages**。
2. 在 **Source** 下拉菜单中选择部署源：
   - **Deploy from a branch**——从指定分支的指定目录部署
   - **GitHub Actions**——通过自定义工作流部署
3. 选择分支（如 `main`）和目录（如 `/root` 或 `/docs`）。
4. 点击 **Save**，等待部署完成。
5. 页面顶部会显示站点地址：`https://<username>.github.io/<repo>`。

> [!TIP]
如果选择从 `/docs` 目录部署，你可以将站点源文件放在 `docs/` 中，
而项目根目录保留代码文件，实现代码与文档的干净分离。

### 使用 Jekyll 构建站点

Jekyll 是 GitHub Pages 原生支持的静态站点生成器，无需额外配置即可使用。

1. 在仓库根目录创建 `_config.yml` 配置文件：

```yaml
title: 我的项目文档
description: 基于 Jekyll 的项目文档站点
theme: jekyll-theme-cayman
markdown: kramdown
kramdown:
  input: GFM
```

2. 创建 `index.md` 作为首页：

```markdown
---
layout: home
title: 首页
---

# 欢迎

这是基于 Jekyll 构建的项目文档站点。
```

3. 创建 `about.md` 等其他页面，提交推送后 GitHub 会自动构建。

> [!WARNING]
GitHub Pages 使用的 Jekyll 版本有滞后，且只支持白名单内的插件。
如果你使用了自定义插件，必须使用 GitHub Actions 在本地构建后部署 `_site` 目录，
而不能依赖 GitHub 的自动构建。

### 配置自定义域名

1. 在域名注册商处添加 DNS 记录：
   - **Apex 域名**（如 `example.com`）：添加 A 记录，指向 GitHub Pages 的 IP 地址。
   - **子域名**（如 `www.example.com`）：添加 CNAME 记录，指向 `<username>.github.io`。

2. GitHub Pages 的 A 记录 IP 地址：

```
185.199.108.153
185.199.109.153
185.199.110.153
185.199.111.153
```

3. 在仓库的 **Settings** → **Pages** → **Custom domain** 中填入你的域名。
4. 勾选 **Enforce HTTPS** 强制使用 HTTPS。
5. 在仓库根目录（或部署目录）创建 `CNAME` 文件，内容为你的域名：

```bash
echo "www.example.com" > CNAME
```

```mermaid
graph LR
    A[用户访问域名] --> B[DNS 解析]
    B --> C{记录类型}
    C -->|A 记录| D[GitHub Pages IP]
    C -->|CNAME 记录| E[username.github.io]
    D --> F[GitHub Pages 服务器]
    E --> F
    F --> G[返回站点内容]
```

## 进阶技巧

### 使用 GitHub Actions 部署任意框架

当你的站点需要使用 Jekyll 之外的框架时，可以通过 GitHub Actions 实现自定义构建流程：

```yaml
name: Deploy Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist
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

这个工作流支持 VuePress、Next.js、Astro、Hugo 等任何能输出静态文件的框架。

### 选择部署源策略

GitHub Pages 提供两种部署方式，各有适用场景：

| 部署源 | 适用场景 | 优点 | 限制 |
|--------|---------|------|------|
| 从分支部署 | 纯 HTML 或 Jekyll 站点 | 配置简单，无需工作流 | 仅支持 Jekyll 白名单插件 |
| GitHub Actions | 任意框架 | 灵活，支持自定义构建 | 需要编写工作流文件 |

推荐新项目使用 GitHub Actions 部署方式，它更灵活且不受 Jekyll 版本限制。

### 本地预览 Jekyll 站点

在推送到 GitHub 之前，你可以在本地预览站点效果：

```bash
# 安装 Ruby 和 Bundler（macOS）
brew install ruby
gem install bundler

# 在仓库根目录初始化
bundle init
bundle add jekyll

# 启动本地服务器
bundle exec jekyll serve

# 浏览器访问 http://127.0.0.1:4000
```

本地预览可以大幅缩短调试周期，避免频繁推送后等待构建。

### Jekyll 主题与布局

GitHub Pages 支持多种官方主题，你可以在 `_config.yml` 中指定：

```yaml
theme: minimal  # 简洁风格，适合项目文档
# theme: jekyll-theme-cayman  # 彩色页头，适合个人站点
# theme: jekyll-theme-slate  # 暗色调，适合技术博客
```

如果需要更深度的定制，可以覆盖主题的默认布局文件。在项目根目录创建 `_layouts/default.html`，
Jekyll 会优先使用你的自定义布局而非主题默认布局。你也可以在 `_includes/` 目录中创建可复用的
页面片段（如导航栏、页脚），然后在布局文件中通过 `{% include nav.html %}` 引用。

### 静态站点框架对比

除了 Jekyll，以下框架也常用于 GitHub Pages 站点：

| 框架 | 语言 | 特点 | 适用场景 |
|------|------|------|---------|
| Hugo | Go | 构建极快，单二进制文件 | 大型博客、文档站 |
| VuePress | JavaScript | 基于 Vue，Markdown 优先 | 技术文档 |
| Next.js (SSG) | JavaScript | React 生态，功能丰富 | 复杂交互站点 |
| Astro | JavaScript | 多框架支持，默认零 JS | 内容型站点 |
| MkDocs | Python | 配置简单，Material 主题 | 项目文档 |

选择框架时考虑团队技术栈和项目需求。所有框架都通过 GitHub Actions 部署，配置方式大同小异。

## 常见问题

### Q: GitHub Pages 支持重定向吗？

Jekyll 支持通过插件 `jekyll-redirect-from` 实现页面重定向。在 `_config.yml` 中添加插件配置，
然后在需要重定向的页面前置数据中指定 `redirect_from` 字段即可。
如果你需要在非 Jekyll 站点中实现重定向，可以创建一个包含 `<meta http-equiv="refresh">` 标签的 HTML 文件。
注意 GitHub Pages 不支持服务器端 301/302 重定向。

### Q: 为什么推送后站点没有更新？

GitHub Pages 的构建通常需要 1-3 分钟。你可以在仓库的 **Actions** 标签页查看构建进度。
如果使用分支部署方式，还可能触发了每小时 10 次的构建限制。
另外，浏览器缓存也可能导致看到旧内容——尝试强制刷新（`Ctrl + Shift + R`）。

### Q: GitHub Pages 支持 HTTPS 吗？

支持，且强烈推荐开启。在 Settings → Pages → Custom domain 下方勾选 **Enforce HTTPS**。
对于默认的 `*.github.io` 域名，HTTPS 是自动启用的。自定义域名需要等待 DNS 生效后才能开启。
如果选项显示灰色，请确认 DNS 记录已正确配置并等待几分钟。

### Q: 一个账户可以有多少个 GitHub Pages 站点？

每个账户（或组织）可以有一个用户/组织站点（`<username>.github.io`），以及无限个项目站点
（`<username>.github.io/<repo>`）。用户站点必须使用专门的仓库名，而项目站点可以来自任意仓库。

### Q: 如何给 GitHub Pages 站点添加 404 页面？

在站点根目录创建 `404.html` 或 `404.md` 文件即可。Jekyll 会自动将其作为 404 页面使用。
确保该页面包含 YAML 前置数据（front matter）：

```markdown
---
layout: default
title: 页面未找到
permalink: /404.html
---

抱歉，你访问的页面不存在。

[返回首页](/)
```

### Q: 可以用 GitHub Pages 托管商业网站吗？

GitHub Pages 主要面向项目文档和个人站点，不推荐用于高流量商业站点。
服务条款禁止将 GitHub Pages 作为免费 CDN 或文件托管服务使用。
如果需要托管商业站点，建议考虑 GitHub Pages 的付费替代方案（如 Netlify、Vercel）。

### Q: 部署时出现 Jekyll 构建错误怎么办？

最常见的错误原因是 Markdown 语法问题或 YAML 前置数据格式错误。
在 Actions 标签页中查看构建日志，找到具体的错误信息。
常见的修复方法包括：检查 `_config.yml` 的缩进格式；确认 Markdown 文件中的
YAML 前置数据用 `---` 正确包围；移除不支持的插件。

### Q: 如何查看站点的访问统计？

GitHub Pages 本身不提供访问统计。你可以集成第三方分析工具：
Google Analytics（最常用）、Cloudflare Web Analytics（注重隐私）、
Plausible（开源、无 Cookie）。将分析脚本添加到 Jekyll 的布局模板中即可全局生效。

### Q: `_config.yml` 修改后为什么没有生效？

`_config.yml` 的修改需要重新构建才能生效。GitHub Pages 在每次推送时会自动触发重建。
如果你在本地预览，需要重启 `jekyll serve` 命令——`_config.yml` 的变更不会被热加载。

## 参考链接

| 标题 | 说明 |
|------|------|
| [About GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/about-github-pages) | GitHub Pages 功能概述与限制说明 |
| [Creating a GitHub Pages site](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site) | 创建 GitHub Pages 站点的官方教程 |
| [Configuring a custom domain](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site) | 自定义域名配置完整指南 |
| [GitHub Pages 官方文档](https://docs.github.com/en/pages) | GitHub Pages 文档首页 |
| [Jekyll 官方文档](https://jekyllrb.com/docs/) | Jekyll 静态站点生成器文档 |
