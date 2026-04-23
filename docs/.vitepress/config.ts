import { defineConfig } from 'vitepress'
import { githubAlertsPlugin } from './plugins/githubAlerts'
import { escapeVueSyntaxPlugin } from './plugins/escapeVueSyntax'
import { withMermaid } from 'vitepress-plugin-mermaid'

export default defineConfig(
  withMermaid({
    // Vite 插件：在 Vue SFC 编译前转义 {{ }} 和 <placeholder> 语法
    vite: {
      plugins: [escapeVueSyntaxPlugin()],
    },
    // 源文件在仓库根目录（docs 的上级）
    srcDir: '..',
    // 排除非课程文件
    srcExclude: [
      'README.md',
      'CONTRIBUTING.md',
      'REFERENCES.md',
      '.github/**',
      'docs/**',
      'package.json',
      'package-lock.json',
      'assets/**',
      'LICENSE',
    ],
    // 输出到 docs/.vitepress/dist
    outDir: '.vitepress/dist',
    // GitHub Pages 部署路径
    base: '/github-mastery/',
    // 站点元数据
    title: 'GitHub 完全指南',
    description: '挖掘 GitHub 的全部潜力 — 从基础操作到高级生态的系统课程',
    lang: 'zh-CN',
    // <head> 标签
    head: [
      ['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }],
      ['meta', { name: 'theme-color', content: '#24292f' }],
      ['meta', { property: 'og:type', content: 'website' }],
      ['meta', { property: 'og:title', content: 'GitHub 完全指南' }],
      ['meta', { property: 'og:description', content: '从基础操作到高级生态的系统课程' }],
      ['meta', { property: 'og:image', content: '/github-mastery/logo.svg' }],
    ],
    // 功能
    lastUpdated: true,
    cleanUrls: true,
    ignoreDeadLinks: true,
    // Sitemap — 页面 URL 是相对路径，VitePress 用 hostname 拼接
    sitemap: {
      hostname: 'https://xucroyuri.github.io/github-mastery/',
      transformItems(items) {
        return items.map((item) => ({
          ...item,
          url: '/github-mastery/' + item.url.replace(/^\//, ''),
        }))
      },
    },
    // Markdown 配置
    markdown: {
      lineNumbers: true,
      config(md) {
        md.use(githubAlertsPlugin)
      },
    },
    // Mermaid 配置
    mermaid: {
      // 参考 https://mermaid.js.org/config/setup/modules/mermaidAPI.html#mermaidapi-configuration-defaults
    },
    // 主题配置
    themeConfig: {
      logo: '/logo.svg',
      // 中文 UI 文本
      docFooter: {
        prev: '上一节',
        next: '下一节',
      },
      outline: {
        level: [2, 3],
        label: '本页目录',
      },
      lastUpdated: {
        text: '更新于',
      },
      returnToTopLabel: '回到顶部',
      sidebarMenuLabel: '菜单',
      darkModeSwitchLabel: '主题',
      lightModeSwitchTitle: '切换到浅色模式',
      darkModeSwitchTitle: '切换到深色模式',
      nav: [
        {
          text: '学习路线',
          link: '/00-前言与学习路线/学习路线建议',
        },
        {
          text: 'GitHub',
          link: 'https://github.com/XucroYuri/github-mastery',
        },
      ],
      socialLinks: [
        { icon: 'github', link: 'https://github.com/XucroYuri' },
      ],
      search: {
        provider: 'local',
      },
      editLink: {
        pattern: 'https://github.com/XucroYuri/github-mastery/edit/main/:path',
        text: '在 GitHub 上编辑此页',
      },
      footer: {
        message: '基于 MIT 许可发布 · GitHub 完全指南',
        copyright: 'Copyright © 2024-present',
      },
      sidebar: [
        {
          text: '00 · 前言与学习路线',
          items: [
            { text: '章节导览', link: '/00-前言与学习路线/README' },
            { text: '功能全景图', link: '/00-前言与学习路线/GitHub-功能全景图' },
            { text: '学习路线建议', link: '/00-前言与学习路线/学习路线建议' },
          ],
        },
        {
          text: '01 · 基础操作',
          items: [
            { text: '章节导览', link: '/01-基础操作/README' },
            { text: '注册与账号设置', link: '/01-基础操作/01-注册与账号设置' },
            { text: '仓库创建与管理', link: '/01-基础操作/02-仓库创建与管理' },
            { text: '文件操作', link: '/01-基础操作/03-文件操作-创建编辑删除' },
            { text: '分支基础', link: '/01-基础操作/04-分支基础' },
            { text: '提交与提交历史', link: '/01-基础操作/05-提交与提交历史' },
          ],
        },
        {
          text: '02 · 协作与工作流',
          items: [
            { text: '章节导览', link: '/02-协作与工作流/README' },
            { text: 'Issue 完整指南', link: '/02-协作与工作流/01-Issue-完整指南' },
            { text: '标签与里程碑', link: '/02-协作与工作流/02-标签与里程碑' },
            { text: 'PR 完整生命周期', link: '/02-协作与工作流/03-PR-完整生命周期' },
            { text: '代码审查', link: '/02-协作与工作流/04-代码审查' },
            { text: '分支策略与 Git Flow', link: '/02-协作与工作流/05-分支策略与Git-Flow' },
            { text: '项目管理看板', link: '/02-协作与工作流/06-项目管理看板' },
          ],
        },
        {
          text: '03 · 自动化与 CI/CD',
          items: [
            { text: '章节导览', link: '/03-自动化与CI-CD/README' },
            { text: 'Actions 入门', link: '/03-自动化与CI-CD/01-GitHub-Actions-入门' },
            { text: 'Workflow 语法详解', link: '/03-自动化与CI-CD/02-Workflow-语法详解' },
            { text: '常用 Action 与市场', link: '/03-自动化与CI-CD/03-常用Action与市场' },
            { text: 'CI/CD 实战', link: '/03-自动化与CI-CD/04-CI-CD实战' },
            { text: '自定义 Action 开发', link: '/03-自动化与CI-CD/05-自定义Action开发' },
            { text: '安全与密钥管理', link: '/03-自动化与CI-CD/06-安全与密钥管理' },
          ],
        },
        {
          text: '04 · 代码质量与安全',
          items: [
            { text: '章节导览', link: '/04-代码质量与安全/README' },
            { text: '代码扫描与 CodeQL', link: '/04-代码质量与安全/01-代码扫描与Code-QL' },
            { text: '依赖审查与 Dependabot', link: '/04-代码质量与安全/02-依赖审查与Dependabot' },
            { text: '安全策略与漏洞披露', link: '/04-代码质量与安全/03-安全策略与漏洞披露' },
            { text: '分支保护与规则集', link: '/04-代码质量与安全/04-分支保护与规则集' },
          ],
        },
        {
          text: '05 · 文档与知识管理',
          items: [
            { text: '章节导览', link: '/05-文档与知识管理/README' },
            { text: 'Wiki 使用指南', link: '/05-文档与知识管理/01-Wiki-使用指南' },
            { text: 'GitHub Pages 建站', link: '/05-文档与知识管理/02-GitHub-Pages建站' },
            { text: 'Discussions 社区', link: '/05-文档与知识管理/03-Discussions社区' },
            { text: 'README 与文档最佳实践', link: '/05-文档与知识管理/04-README与文档最佳实践' },
          ],
        },
        {
          text: '06 · 高级功能与生态',
          items: [
            { text: '章节导览', link: '/06-高级功能与生态/README' },
            { text: 'Copilot 深度使用', link: '/06-高级功能与生态/01-GitHub-Copilot深度使用' },
            { text: 'CLI gh 全攻略', link: '/06-高级功能与生态/02-GitHub-CLI-gh全攻略' },
            { text: 'API 与集成', link: '/06-高级功能与生态/03-GitHub-API与集成' },
            { text: 'Apps 与 OAuth App', link: '/06-高级功能与生态/04-GitHub-Apps与OAuth-App' },
            { text: 'Codespaces 云开发', link: '/06-高级功能与生态/05-Codespaces云开发' },
            { text: 'Packages 与发布', link: '/06-高级功能与生态/06-GitHub-Packages与发布' },
            { text: 'Models 与 AI 生态', link: '/06-高级功能与生态/07-GitHub-Models与AI生态' },
          ],
        },
        {
          text: '07 · 管理与治理',
          items: [
            { text: '章节导览', link: '/07-管理与治理/README' },
            { text: '组织与团队管理', link: '/07-管理与治理/01-组织与团队管理' },
            { text: '权限与角色体系', link: '/07-管理与治理/02-权限与角色体系' },
            { text: '审计日志与合规', link: '/07-管理与治理/03-审计日志与合规' },
            { text: '企业级功能 GHE', link: '/07-管理与治理/04-企业级功能-GHE' },
          ],
        },
        {
          text: '08 · 实战案例集',
          items: [
            { text: '章节导览', link: '/08-实战案例集/README' },
            { text: '开源项目维护指南', link: '/08-实战案例集/01-开源项目维护指南' },
            { text: '个人作品集搭建', link: '/08-实战案例集/02-个人作品集搭建' },
            { text: '团队协作最佳实践', link: '/08-实战案例集/03-团队协作最佳实践' },
            { text: '自动化发布流水线', link: '/08-实战案例集/04-自动化发布流水线' },
          ],
        },
      ],
    },
  }),
)
