# Issue 完整指南

> 掌握 GitHub Issue 的全部能力——从创建、模板、关联到自动化关闭，构建高效的任务追踪体系。

## 概述

Issue 是 GitHub 上最基本也最强大的协作单元。无论是报告 Bug、提出功能需求、记录技术决策，还是追踪项目进度，Issue 都是你的起点。它不仅仅是一个"工单系统"，更是团队沟通、知识沉淀和项目管理的核心枢纽。

一个结构清晰的 Issue 能让协作者在几秒钟内理解问题，而一个混乱的 Issue 则会浪费所有人的时间。GitHub 提供了模板、Label、Milestone、子任务、依赖关系等功能，帮助你系统化地管理每一个工作项。

> [!NOTE]
> GitHub Issue 与 Pull Request 共享同一套追踪机制。它们可以互相引用、共享 Label 和 Milestone，并在 [项目管理看板](06-项目管理看板) 中统一管理。

本章将带你从零开始掌握 Issue 的完整能力，包括创建、模板配置、关联关系以及自动化关闭等高级用法。

## 核心操作

### 创建 Issue

**浏览器端：**

1. 打开目标仓库页面，点击 **Issues** 标签页。
2. 点击右上角 **New issue** 按钮。
3. 如果仓库配置了模板，会先显示模板选择界面；否则直接进入编辑页面。
4. 填写标题和正文，添加 Label、Assignee、Milestone 等元信息。
5. 点击 **Submit new issue**。

**GitHub CLI：**

```bash
# 基本创建
gh issue create --title "修复登录页面样式错位" --body "在移动端浏览器中，登录按钮与输入框重叠。"

# 交互式创建（推荐，会引导你填写各字段）
gh issue create

# 一次性指定所有字段
gh issue create \
  --title "添加用户注册功能" \
  --body "实现邮箱注册流程，包含验证码验证。" \
  --label "enhancement" \
  --assignee "@me" \
  --milestone "v2.0"
```

> [!TIP]
> 使用 `gh issue create --web` 可以在命令行中快速跳转到浏览器端的创建页面，结合 CLI 的速度和 Web 界面的富文本编辑能力。

### 编写高质量 Issue

一个优秀的 Issue 应该包含以下要素：

| 要素 | 说明 | 示例 |
|------|------|------|
| 标题 | 简洁、明确、可搜索 | `fix: 移动端登录按钮与输入框重叠` |
| 背景 | 为什么要提这个 Issue | 用户反馈在 iPhone Safari 上无法点击登录按钮 |
| 复现步骤 | 编号列表，精确到操作步骤 | 1. 打开登录页 2. 使用 iPhone Safari 访问 3. 缩放至 75% |
| 期望行为 | 你认为应该怎样 | 按钮始终在输入框下方 20px 处 |
| 实际行为 | 实际发生了什么 | 按钮与输入框重叠，无法点击 |
| 环境信息 | 操作系统、浏览器版本等 | iOS 17.4, Safari 17.4 |

```markdown
## Bug 描述

在移动端浏览器中，登录按钮与输入框重叠，导致用户无法点击登录。

## 复现步骤

1. 打开 `https://example.com/login`
2. 使用 iPhone Safari 打开页面
3. 观察登录按钮位置

## 期望行为

登录按钮应在输入框下方，间距 20px。

## 实际行为

登录按钮与输入框垂直重叠约 10px。

## 环境

- 设备：iPhone 15 Pro
- 系统：iOS 17.4
- 浏览器：Safari 17.4
```

### 配置 Issue 模板

Issue 模板能显著提升 Issue 质量，减少来回沟通成本。

**通过浏览器配置：**

1. 进入仓库的 **Settings** 页面。
2. 在 **Features** 区域找到 **Issues**，点击 **Set up templates**。
3. 选择模板类型：
   - **Bug report**：Bug 报告模板，包含复现步骤和环境信息字段。
   - **Feature request**：功能请求模板，包含需求描述和使用场景。
   - **Custom**：完全自定义的模板。
4. 编辑模板内容，点击 **Propose changes** 提交。

**手动创建模板文件：**

```yaml
# .github/ISSUE_TEMPLATE/bug_report.yml
name: Bug 报告
description: 报告一个 Bug，帮助我们改进
labels: ["bug", "triage"]
assignees: []
body:
  - type: textarea
    id: description
    attributes:
      label: Bug 描述
      description: 清晰描述你遇到的问题
      placeholder: "当我执行...时，发生了..."
    validations:
      required: true
  - type: textarea
    id: steps
    attributes:
      label: 复现步骤
      description: 提供详细的复现步骤
      placeholder: |
        1. 打开...
        2. 点击...
        3. 看到...
      value: |
        1.
        2.
        3.
    validations:
      required: true
  - type: textarea
    id: expected
    attributes:
      label: 期望行为
      description: 你认为应该发生什么
    validations:
      required: true
  - type: dropdown
    id: severity
    attributes:
      label: 严重程度
      options:
        - 严重（功能完全不可用）
        - 较重（主要功能受影响）
        - 一般（次要功能受影响）
        - 轻微（UI 或文案问题）
    validations:
      required: true
```

> [!WARNING]
> 模板文件必须放在 `.github/ISSUE_TEMPLATE/` 目录下。YAML 模板使用 `.yml` 扩展名，Markdown 模板使用 `.md` 扩展名。两种格式不能混用同一文件。

**配置模板选择器：**

如果你想控制模板的显示顺序或添加自定义链接，创建配置文件：

```yaml
# .github/ISSUE_TEMPLATE/config.yml
blank_issues_enabled: false
contact_links:
  - name: GitHub 社区支持
    url: https://github.com/orgs/community/discussions
    about: 提问和讨论请在社区论坛进行
  - name: 文档
    url: https://docs.github.com
    about: 查看官方文档获取帮助
```

设置 `blank_issues_enabled: false` 可以禁止用户跳过模板直接创建空白 Issue。

### 关联 Issue

Issue 之间、Issue 与 Pull Request 之间可以建立多种关联关系。

**引用其他 Issue 或 PR：**

在 Issue 或 PR 正文中使用 `#<编号>` 即可引用。例如 `#42` 会自动生成指向第 42 号 Issue 的链接。

**使用关键词自动关闭 Issue：**

在 Pull Request 或 Commit 消息中使用以下关键词，可以在 PR 合并时自动关闭对应的 Issue：

| 关键词 | 示例 |
|--------|------|
| close | `close #42` |
| closes | `closes #42` |
| closed | `closed #42` |
| fix | `fix #42` |
| fixes | `fixes #42` |
| fixed | `fixed #42` |
| resolve | `resolve #42` |
| resolves | `resolves #42` |
| resolved | `resolved #42` |

```bash
# 在 Commit 消息中关闭 Issue
git commit -m "fix: 修复移动端登录按钮重叠问题, fixes #42"

# 在 PR 描述中关闭多个 Issue
gh pr create --title "修复移动端样式问题" --body "fixes #42, resolves #43"
```

> [!TIP]
> 关键词不区分大小写（`Close` 和 `close` 都有效），但编号前的 `#` 不能省略。一个 PR 可以同时关闭多个 Issue。

### 子任务与依赖关系

**添加子任务（Sub-issues）：**

子任务允许你将一个大型 Issue 拆分为多个可追踪的小任务：

1. 打开父 Issue 页面。
2. 在右侧边栏找到 **Sub-issues** 区域。
3. 点击 **Add sub-issue**，选择或创建子 Issue。

**创建依赖关系：**

依赖关系用于标记 Issue 之间的先后顺序（例如"B 依赖 A 先完成"）：

1. 打开 Issue 页面。
2. 在右侧边栏找到 **Dependencies** 区域。
3. 点击 **Add dependency**，选择被依赖的 Issue。

### 管理 Issue 状态

GitHub 提供了多种方式追踪和更新 Issue 状态：

```bash
# 关闭 Issue
gh issue close <number>

# 重新打开 Issue
gh issue reopen <number>

# 编辑 Issue 标题和正文
gh issue edit <number> --title "新标题" --body "新内容"

# 添加 Label
gh issue edit <number> --add-label "bug,high-priority"

# 设置 Milestone
gh issue edit <number> --milestone "v2.0"

# 指派负责人
gh issue edit <number> --add-assignee "@me"

# 查看 Issue 列表
gh issue list --state open --label bug --limit 20

# 查看 Issue 详情
gh issue view <number>
```

## 进阶技巧

### 使用 Tasklist 组织工作

Tasklist 是 Issue 正文中嵌入的任务清单，可以追踪子任务的完成进度：

```markdown
## v2.0 发布清单

- [ ] 用户注册功能
  - [ ] #101 邮箱验证
  - [ ] #102 手机号绑定
- [ ] 支付模块重构
  - [x] #103 接入新支付渠道
  - [ ] #104 退款流程优化
- [x] #105 性能优化
```

每个 `#编号` 会自动链接到对应 Issue，勾选后会同步更新状态。Tasklist 右侧会显示进度条，直观反映整体完成度。

### 使用 GitHub API 批量操作

当需要批量创建或修改 Issue 时，GitHub API 比手动操作更高效：

```bash
# 使用 gh api 调用 GitHub REST API
# 批量创建 Issue
for title in "功能A" "功能B" "功能C"; do
  gh api \
    --method POST \
    repos/<owner>/<repo>/issues \
    -f title="$title" \
    -f body="待补充详细描述" \
    -f labels='["enhancement"]' \
    --jq '.number'
done

# 查询所有打开的 Issue 数量
gh api repos/<owner>/<repo> --jq '.open_issues_count'
```

### Issue 中的代码片段与日志

Issue 支持完整的 Markdown 格式。当代码或日志较长时，使用折叠语法保持页面整洁：

```markdown
<details>
<summary>点击展开错误日志</summary>

```
TypeError: Cannot read properties of undefined (reading 'map')
    at UserList (src/components/UserList.tsx:23:18)
    at renderWithHooks (node_modules/react-dom/cjs/react-dom.development.js:16175:20)
```

</details>
```

> [!NOTE]
> Issue 正文中支持使用 ` ``` ` 代码块并指定语言来启用语法高亮。例如 ` ```typescript ` 可以让 TypeScript 代码正确着色。同时，你可以在代码块中使用行号标注来引导审查者关注特定行。

### 锁定和转移 Issue

```bash
# 锁定 Issue（禁止评论，通常用于已解决但评论过热的 Issue）
gh api --method PUT repos/<owner>/<repo>/issues/<number>/lock \
  -f lock_reason="resolved"

# 转移 Issue 到另一个仓库（需要在浏览器端操作）
# 在 Issue 页面右侧边栏点击 "Transfer issue"
```

## 常见问题

### Q: Issue 和 Discussion 有什么区别？

Issue 用于追踪具体的工作项（Bug、功能需求），有明确的打开/关闭状态。Discussion 用于开放式讨论（想法交流、问答、公告），没有状态概念。如果你的话题不需要"被解决"，就应该使用 Discussion 而不是 Issue。

### Q: 如何批量关闭过期的 Issue？

可以使用 GitHub CLI 结合搜索语法批量操作：

```bash
# 关闭所有超过 90 天未更新的 Issue
gh issue list --state open --search "updated:<2024-01-01" --json number \
  --jq '.[].number' | xargs -I {} gh issue close {}
```

但建议先列出预览，确认无误后再执行关闭操作。

### Q: 如何在 Issue 中提及团队成员？

在 Issue 正文或评论中使用 `@<username>` 即可提及相关成员。被提及的人会收到通知。使用 `@<team-name>` 可以提及整个团队（需要在 Organization 中创建 Team）。

### Q: 自动关闭关键词对 Commit 和 PR 都有效吗？

是的。无论关键词出现在 Commit 消息还是 PR 描述中，只要对应的 Commit 被合并到仓库的默认分支，关联的 Issue 就会被自动关闭。但如果 Commit 合并到了非默认分支，Issue 不会被关闭。

### Q: 一个 PR 能关闭多个 Issue 吗？

可以。在 PR 描述中使用多个关闭关键词即可，例如 `fixes #10, closes #11, resolves #12`。合并后这三个 Issue 都会被自动关闭。

### Q: 如何设置 Issue 创建权限？

在仓库的 **Settings > General > Features** 区域，可以关闭 Issues 功能（对所有人禁止创建）。对于 Organization 仓库，还可以在 **Settings > Moderation options** 中限制只有组织成员才能创建 Issue，外部协作者只能通过模板创建。

### Q: Issue 模板支持哪些字段类型？

YAML 格式模板支持丰富的字段类型：`textarea`（多行文本）、`input`（单行文本）、`dropdown`（下拉选择）、`checkboxes`（复选框）和 `markdown`（纯展示文本）。Markdown 格式模板则自由度更高，但没有表单验证功能。

### Q: 如何将 Issue 关联到 Projects 看板？

在 Issue 页面右侧边栏的 **Projects** 区域，点击 **Add to project** 即可将 Issue 添加到指定的 Projects V2 看板中。更多关于看板的使用方法，参见 [项目管理看板](06-项目管理看板)。

## 参考链接

| 标题 | 说明 |
|------|------|
| [About issues](https://docs.github.com/articles/about-issues) | Issue 功能概念与核心用例介绍 |
| [Creating an issue](https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/creating-an-issue) | 创建 Issue 的详细步骤 |
| [Adding sub-issues](https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/adding-sub-issues) | 子任务的添加与管理 |
| [Creating issue dependencies](https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/creating-issue-dependencies) | Issue 依赖关系的创建方法 |
| [Configuring issue templates](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/configuring-issue-templates-for-your-repository) | 模板配置完整指南 |
| [About issue and PR templates](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/about-issue-and-pull-request-templates) | 模板类型与最佳实践 |
| [Best Practices for Writing Effective GitHub Issues](https://github.com/orgs/community/discussions/147722) | 社区讨论中的 Issue 编写最佳实践 |
| [GitHub Issues 功能页](https://github.com/features/issues) | Issue 功能官方介绍页 |
| [gh issue](https://cli.github.com/manual/gh_issue) | GitHub CLI Issue 命令手册 |
