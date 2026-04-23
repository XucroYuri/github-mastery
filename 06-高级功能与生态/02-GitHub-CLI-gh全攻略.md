# GitHub CLI gh 全攻略

> 一个命令行工具掌控 GitHub 全部工作流，从 Issue 到 Release 无需离开终端。

## 概述

GitHub CLI（命令行界面，简称 `gh`）是 GitHub 官方推出的命令行工具。它将 Pull Request、Issue、Actions、Release 等 GitHub 功能全部搬到终端里，让你在编码和协作之间无缝切换，不再需要频繁打开浏览器。

`gh` 不仅仅是一个 API 包装器——它支持交互式选择、输出格式化、管道组合和扩展机制。你可以用它完成日常 90% 以上的 GitHub 操作，还可以通过扩展（extension）和脚本化将其嵌入自动化流水线。

> [!NOTE]
> GitHub CLI 目前处于积极开发状态，新功能持续加入。建议定期运行 `gh version` 检查版本，
> 并通过 `gh extension upgrade --all` 更新所有已安装的扩展。最新的子命令和参数可通过
> `gh help` 或 `gh <command> help` 查看完整文档。

## 核心操作

### 安装与认证

1. 使用 Homebrew 安装（macOS 推荐）：

```bash
brew install gh
```

2. Linux 系统可通过官方 APT/YUM 仓库安装：

```bash
# Debian/Ubuntu
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | \
  sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] \
  https://cli.github.com/packages stable main" | \
  sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update && sudo apt install gh
```

3. 完成安装后进行认证：

```bash
gh auth login
```

认证过程是交互式的：选择 GitHub.com 或 GitHub Enterprise，选择协议（HTTPS 或 SSH），然后通过浏览器或 token 完成登录。

4. 验证认证状态：

```bash
gh auth status
```

> [!TIP]
> 如果你需要在 CI 环境中使用 `gh`，可以通过环境变量 `GH_TOKEN` 直接传入 Personal Access Token，
> 无需交互式登录。Actions 运行器中自动可用的 `GITHUB_TOKEN` 也被 `gh` 识别。

### 仓库操作

```bash
# 克隆仓库（支持简写 owner/repo 格式）
gh repo clone owner/repo

# 在浏览器中打开当前仓库
gh repo view --web

# 查看仓库信息（JSON 格式输出）
gh repo view owner/repo --json name,description,stargazerCount

# 创建新仓库
gh repo create my-project --public --description "项目描述" --clone

# Fork 仓库
gh repo fork owner/repo --clone
```

### Issue 管理

```bash
# 创建 Issue（交互式）
gh issue create

# 快速创建 Issue（非交互式）
gh issue create --title "修复登录页崩溃" --body "步骤：1. 打开登录页 2. 点击提交"

# 列出 Issue（支持筛选）
gh issue list --state open --label bug --limit 20

# 查看 Issue 详情
gh issue view 42

# 在浏览器中打开 Issue
gh issue view 42 --web

# 关闭 Issue
gh issue close 42

# 重新打开 Issue
gh issue reopen 42
```

### Pull Request 工作流

```bash
# 创建 PR（交互式引导）
gh pr create

# 快速创建 PR
gh pr create --title "feat: 添加用户注册" --body "实现了邮箱注册流程" --reviewer octocat

# 以草稿形式创建
gh pr create --draft --title "WIP: 重构认证模块"

# 列出 PR
gh pr list --state open --author @me

# 检出别人的 PR 到本地（方便 Review）
gh pr checkout 123

# 查看 PR 详情
gh pr view 123

# Review PR 并批准
gh pr review 123 --approve --body "代码质量优秀，批准合并。"

# 合并 PR
gh pr merge 123 --squash --delete-branch
```

### Actions 操作

```bash
# 查看 Workflow 列表
gh workflow list

# 查看 Workflow 运行记录
gh run list --workflow ci.yml --limit 5

# 查看某次运行的详细步骤
gh run view <run-id>

# 实时跟踪运行日志
gh run watch <run-id>

# 手动触发 Workflow
gh workflow run ci.yml --ref feature-branch

# 下载运行产物
gh run download <run-id> --name test-results
```

### Release 管理

```bash
# 创建 Release
gh release create v1.2.0 --title "v1.2.0" --notes "修复了关键安全漏洞"

# 从 CHANGELOG 生成 Release Notes
gh release create v1.2.0 --generate-notes

# 上传附件
gh release upload v1.2.0 ./dist/app.tar.gz ./dist/checksums.txt

# 下载 Release 资源
gh release download v1.2.0 --output ./dist

# 列出所有 Release
gh release list --limit 10
```

### Gist 管理

```bash
# 创建 Gist
gh gist create script.sh --public --desc "部署脚本"

# 查看自己的 Gist
gh gist list --public

# 编辑 Gist
gh gist edit <gist-id>

# 查看 Gist 内容
gh gist view <gist-id>
```

### 搜索与浏览

`gh search` 是跨仓库搜索的利器，支持搜索仓库、Issue、PR 和代码：

```bash
# 搜索仓库
gh search repos "react component library" --language typescript --sort stars

# 搜索 Issue
gh search issues "memory leak" --repo owner/repo --state open

# 搜索 PR
gh search prs --author @me --state merged --limit 20

# 搜索代码（支持正则表达式）
gh search code "className" --repo owner/repo --language javascript
```

### 标签与里程碑管理

```bash
# 列出仓库标签
gh label list

# 创建自定义标签
gh label create "priority:high" --color FF0000 --description "高优先级"

# 删除标签
gh label delete "wontfix"

# 为 Issue 添加标签
gh issue edit 42 --add-label "bug,priority:high"

# 管理里程碑
gh api repos/OWNER/REPO/milestones --method POST \
  -f title="v2.0" -f description="第二个大版本" -f due_on="2025-12-31T00:00:00Z"
```

### 全局配置管理

`gh config` 用于管理 CLI 的全局和本地配置：

```bash
# 查看所有配置
gh config list

# 设置默认编辑器
gh config set editor "code --wait"

# 设置默认 Git 协议
gh config set git_protocol ssh

# 设置提示器偏好（禁用交互式提示）
gh config set prompt disabled

# 本地配置（仅影响当前仓库）
gh config set --local prompt enabled
```

## 进阶技巧

### 使用 --jq 和 --json 提取数据

`gh` 的每个列表命令都支持 `--json` 输出，结合 `--jq` 可以精确提取字段：

```bash
# 提取所有打开的 Issue 标题和作者
gh issue list --state open --json title,author --jq '.[] | "\(.title) — \(.author.login)"'

# 获取仓库的默认分支
gh repo view --json defaultBranchRef --jq '.defaultBranchRef.name'

# 获取最近失败的 CI 运行信息
gh run list --status failure --json name,headBranch,createdAt --jq '.[:5]'
```

### 使用 --web 回退浏览器

几乎所有 `gh` 命令都支持 `--web` 参数。当你发现终端展示不够直观时，加一个 `--web` 就能在浏览器中查看完整页面：

```bash
gh repo view --web
gh issue view 42 --web
gh pr view 123 --web
```

### gh run 的实用操作

除了基本的查看和触发，`gh run` 还支持更多实用操作：

```bash
# 查看失败步骤的详细日志
gh run view <run-id> --log-failed

# 取消正在运行的 Workflow
gh run cancel <run-id>

# 重新运行失败的 Workflow
gh run rerun <run-id> --failed

# 等待运行完成（脚本中常用）
gh run watch <run-id> --exit-status
```

`gh run watch` 在脚本化场景中特别有用——它会阻塞直到 Workflow 完成，
并返回非零退出码表示失败，非常适合在部署流水线中使用。

### 批量操作脚本

`gh` 天然适合脚本化。以下是几个常见的批量操作示例：

```bash
# 批量关闭过期的 Issue
gh issue list --state open --label "stale" --json number --jq '.[].number' | \
  xargs -I {} gh issue close {} --reason "not planned"

# 列出团队所有成员的打开 PR
for member in alice bob charlie; do
  echo "=== $member ==="
  gh pr list --author "$member" --state open
done

# 批量克隆组织下的所有仓库
gh repo list my-org --json name --jq '.[].name' | \
  xargs -I {} gh repo clone my-org/{}

# 自动等待 CI 通过后合并 PR
gh pr checks 123 --watch && gh pr merge 123 --squash --delete-branch
```

### 安装和使用扩展

GitHub CLI 拥有丰富的扩展生态，可以添加新功能：

```bash
# 浏览可用的扩展
gh extension browse

# 安装扩展（例如 GitHub Copilot CLI）
gh extension install github/gh-copilot

# 安装其他常用扩展
gh extension install dlvhdr/gh-dash        # PR/Issue 仪表盘
gh extension install meiji163/gh-notify     # 通知管理

# 列出已安装的扩展
gh extension list

# 升级所有扩展
gh extension upgrade --all

# 创建你自己的扩展
gh extension create my-extension
```

> [!TIP]
> 扩展本质上是一个可执行脚本。你可以用 Bash、Python、Go 等任何语言编写。
> 运行 `gh extension create hello-world` 即可生成脚手架，快速开始开发。

### 在 GitHub Actions 中使用 gh

Actions 运行器预装了 `gh`，你可以直接在 Workflow 中使用：

```yaml
name: Auto Label PR
on:
  pull_request:
    types: [opened]

jobs:
  label:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: 为 PR 添加标签
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          gh pr edit ${{ github.event.pull_request.number }} \
            --add-label "needs-review"
```

### 设置别名

`gh` 支持自定义别名，为常用命令创建快捷方式：

```bash
# 设置别名
gh alias set pv 'pr view'
gh alias set il 'issue list --state open --author @me'
gh alias set rc 'repo create --public --clone'

# 使用别名
gh pv 123
gh il

# 列出所有别名
gh alias list
```

### API 直接调用

当内置子命令不满足需求时，可以使用 `gh api` 直接调用 REST 或 GraphQL API：

```bash
# 调用 REST API
gh api repos/OWNER/REPO/branches

# 使用分页
gh api repos/OWNER/REPO/pulls --paginate --jq '.[].title'

# 发送 POST 请求
gh api repos/OWNER/REPO/issues \
  --method POST \
  -f title="通过 API 创建的 Issue" \
  -f body="这是正文内容"

# 调用 GraphQL API
gh api graphql -f query='
  query($owner: String!, $repo: String!) {
    repository(owner: $owner, name: $repo) {
      issues(states: OPEN, first: 5) {
        nodes { title number }
      }
    }
  }
' -f owner=OWNER -f repo=REPO
```

关于 GraphQL API 的更多用法，参见 [GitHub API 与集成](03-GitHub-API与集成)。

## 常见问题

### Q: gh 支持GitHub Enterprise 吗？

支持。认证时选择 GitHub Enterprise Server，输入你的实例 URL 即可：

```bash
gh auth login --hostname github.example.com
```

你还可以在多个 GitHub 实例之间切换，`gh` 会自动根据仓库的远程 URL 选择正确的认证信息。

### Q: 如何在 gh 中使用 SSH 而非 HTTPS？

认证时会提示选择首选协议，选择 SSH 即可。如果已经用 HTTPS 认证过，可以重新运行 `gh config set git_protocol ssh` 修改默认协议。
这只影响 `gh repo clone` 等命令生成的 URL，不影响已有仓库的远程地址。

### Q: gh 的输出可以格式化为表格吗？

可以。使用 `--json` 配合 `--jq` 可以自定义输出格式。此外，`gh` 的默认输出已经是人类友好的表格形式。
如果需要机器可读的格式，使用 `--json` 或 `--csv`（部分命令支持）。

### Q: 如何撤销 gh auth login 的认证？

运行以下命令即可注销：

```bash
gh auth logout
```

如果你想清除所有认证信息（包括 token），可以加上 `--hostname` 参数指定要注销的主机。

### Q: gh 能管理 GitHub Organizations 吗？

可以。`gh` 支持组织相关的操作，例如邀请成员、管理团队等：

```bash
# 列出组织成员
gh org list-members my-org

# 邀请成员
gh api orgs/my-org/memberships/username --method PUT -f role=member
```

部分组织管理功能需要通过 `gh api` 直接调用 API 完成。

### Q: gh 扩展的安全风险如何评估？

安装扩展前请注意：扩展以你的 GitHub 身份执行命令，拥有与你相同的权限。
建议只安装来自可信作者的扩展，并在安装前阅读源代码。你可以通过 `gh extension browse` 查看社区评分和下载量。

> [!WARNING]
> 恶意扩展可能窃取你的认证 Token 或对仓库执行破坏性操作。
> 安装第三方扩展前务必审查源代码，特别是包含网络请求或文件系统操作的扩展。

### Q: 如何在 Windows 上使用 gh？

Windows 用户可以通过以下方式安装：

```bash
# 使用 winget
winget install GitHub.cli

# 使用 Chocolatey
choco install gh

# 使用 Scoop
scoop install gh
```

安装后使用方式与 macOS/Linux 完全一致。Windows Terminal 和 PowerShell 均支持 `gh` 的交互式选择界面。

### Q: gh 和 hub 有什么区别？

`hub` 是 GitHub 早期推出的命令行工具，已被 `gh` 取代。`gh` 是完全重写的版本，
拥有更丰富的子命令、扩展系统和更好的脚本支持。GitHub 官方推荐所有用户迁移到 `gh`，
`hub` 已不再积极维护。

## 参考链接

| 标题 | 说明 |
|------|------|
| [GitHub CLI Manual](https://cli.github.com/manual/) | 官方完整命令参考手册 |
| [GitHub CLI Quickstart](https://docs.github.com/en/github-cli/github-cli/quickstart) | 快速入门指南 |
| [Creating GitHub CLI Extensions](https://docs.github.com/en/github-cli/github-cli/creating-github-cli-extensions) | 扩展开发教程 |
| [Using GitHub CLI Extensions](https://docs.github.com/en/github-cli/github-cli/using-github-cli-extensions) | 扩展安装和使用指南 |
| [GitHub CLI Tutorial — Codecademy](https://www.codecademy.com/article/github-cli-tutorial) | 第三方图文教程 |
| [Pragmatic Programmer's Guide to GitHub CLI](https://nearform.com/digital-community/the-pragmatic-programmers-guide-to-github-cli/) | 进阶使用技巧合集 |
