# 常用 Action 与市场

> 善用 GitHub Marketplace 和官方 Actions 生态——从 checkout、setup-* 到缓存、发布，用现成组件拼出强大流水线。

## 概述

在前两章中，你学习了 GitHub Actions 的核心概念和 [Workflow 语法详解](02-Workflow-语法详解.md)。但真正让 Workflow 强大的是丰富的 Action 生态——GitHub Marketplace 上有数以万计的 Action，覆盖了从代码检出、环境搭建到构建发布、通知集成的方方面面。

Action 是 Workflow 中 Step 的可复用组件。你可以把 Action 理解为"函数"——它接收输入（`with`），执行逻辑，然后返回输出（`outputs`）。GitHub 官方维护了一系列高质量 Action（如 `actions/checkout`、`actions/setup-node`），社区也贡献了大量优秀的第三方 Action。掌握这些常用 Action 的配置技巧，能让你用最少的代码实现最复杂的自动化流程。

> [!NOTE]
> 使用第三方 Action 时需要注意版本安全。始终指定具体的版本标签（如 `@v4`）或 Commit SHA（如 `@b4ffde65f46336ab88eb53be808477a3936bae11`），避免使用 `@main` 这样的可变引用，因为仓库维护者可能在 `main` 分支上推送恶意代码。

## 核心操作

### actions/checkout —— 检出代码

`checkout` 是几乎所有 Workflow 的第一步，用于将仓库代码克隆到 Runner 的工作目录中：

```yaml
steps:
  # 基本用法——检出当前仓库
  - uses: actions/checkout@v4

  # 检出特定分支
  - uses: actions/checkout@v4
    with:
      ref: develop

  # 检出 PR 的 Head Commit
  - uses: actions/checkout@v4
    if: github.event_name == 'pull_request'
    with:
      ref: ${{ github.event.pull_request.head.sha }}

  # 同时检出多个仓库
  - uses: actions/checkout@v4
    with:
      repository: <owner>/<repo>
      path: ./external-repo
      token: ${{ secrets.PAT_TOKEN }}

  # 获取完整 Git 历史（用于版本号生成等场景）
  - uses: actions/checkout@v4
    with:
      fetch-depth: 0    # 默认为 1，只获取最新 Commit

  # 检出子模块
  - uses: actions/checkout@v4
    with:
      submodules: recursive
```

常用参数：

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `repository` | 当前仓库 | 要检出的仓库（`owner/repo` 格式） |
| `ref` | 触发分支/标签 | 检出的 Git 引用 |
| `path` | 仓库根目录 | 克隆到的相对路径 |
| `fetch-depth` | 1 | Git 历史深度，0 表示完整历史 |
| `submodules` | false | 是否检出子模块 |
| `token` | `GITHUB_TOKEN` | 用于认证的 Token |
| `lfs` | false | 是否拉取 Git LFS 文件 |

### setup-* 系列 —— 配置语言环境

GitHub 官方为常见编程语言提供了 `setup-*` Action：

**Node.js：**

```yaml
steps:
  - uses: actions/checkout@v4

  - uses: actions/setup-node@v4
    with:
      node-version: '20'
      cache: 'npm'           # 自动缓存 npm 依赖
      cache-dependency-path: '**/package-lock.json'

  - run: npm ci
  - run: npm test
```

**Python：**

```yaml
steps:
  - uses: actions/checkout@v4

  - uses: actions/setup-python@v5
    with:
      python-version: '3.12'
      cache: 'pip'
      cache-dependency-path: '**/requirements.txt'

  - run: pip install -r requirements.txt
  - run: pytest
```

**Java：**

```yaml
steps:
  - uses: actions/checkout@v4

  - uses: actions/setup-java@v4
    with:
      distribution: 'temurin'   # JDK 发行版
      java-version: '17'
      cache: 'maven'            # 支持 maven / gradle / sbt

  - run: mvn clean verify
```

**Go：**

```yaml
steps:
  - uses: actions/checkout@v4

  - uses: actions/setup-go@v5
    with:
      go-version: '1.22'
      cache: true

  - run: go test ./...
```

> [!TIP]
> `setup-*` Action 内置了依赖缓存功能，只需设置 `cache` 参数即可。这比手动配置 [actions/cache](#actionscache--依赖缓存) 更简单，推荐优先使用。

### actions/cache —— 依赖缓存

缓存可以大幅缩短依赖安装时间。当 `setup-*` 的内置缓存不满足需求时，可以使用 `actions/cache`：

```yaml
steps:
  - uses: actions/checkout@v4

  # 基本缓存
  - name: 缓存 npm 模块
    uses: actions/cache@v4
    with:
      path: ~/.npm
      key: npm-${{ runner.os }}-${{ hashFiles('**/package-lock.json') }}
      restore-keys: |
        npm-${{ runner.os }}-

  # 缓存多个路径
  - name: 缓存多个目录
    uses: actions/cache@v4
    with:
      path: |
        ~/.npm
        ~/.cache/pip
        node_modules
      key: deps-${{ runner.os }}-${{ hashFiles('**/package-lock.json', '**/requirements.txt') }}
```

不同语言和工具的常用缓存路径：

| 工具 | 缓存路径 |
|------|----------|
| npm | `~/.npm` |
| pip | `~/.cache/pip` |
| Maven | `~/.m2/repository` |
| Gradle | `~/.gradle/caches` |
| Go | `~/go/pkg/mod` |
| Cargo (Rust) | `~/.cargo/registry` |
| Yarn | `~/.cache/yarn` |

缓存的 `key` 设计很关键。使用 `hashFiles` 计算锁文件的哈希值作为 key，当锁文件变更时缓存自动失效。`restore-keys` 作为回退策略，当精确匹配不到时使用前缀匹配恢复最近的缓存。

### actions/upload-artifact 与 download-artifact

Artifact 用于在 Job 之间或 Workflow 运行之间持久化数据：

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm run build

      - name: 上传构建产物
        uses: actions/upload-artifact@v4
        with:
          name: build-output           # Artifact 名称
          path: |                       # 要上传的路径（支持多路径）
            dist/
            build-report.json
          retention-days: 5             # 保留天数（默认 90 天）
          compression-level: 6          # 压缩级别（0-9）
          if-no-files-found: error      # 没有文件时的行为

  test:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: 下载构建产物
        uses: actions/download-artifact@v4
        with:
          name: build-output
          path: dist/                   # 下载到的目标路径

      - run: npm run test:e2e
```

> [!WARNING]
> Artifact 对单个文件大小限制为 5 GB（免费版）。Artifact 数据会占用仓库的存储配额，免费版为 500 MB/月。建议设置合理的 `retention-days`，及时清理不再需要的 Artifact。

### actions/github-script

`github-script` 让你在 Workflow 中直接调用 GitHub API 和 Octokit，无需编写 Shell 脚本：

```yaml
jobs:
  comment:
    runs-on: ubuntu-latest
    steps:
      # 在 Issue 中添加评论
      - uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.issue.number,
              body: '感谢你的反馈！我们会尽快处理。'
            })

      # 根据 PR 变更文件添加标签
      - uses: actions/github-script@v7
        with:
          script: |
            const { data: files } = await github.rest.pulls.listFiles({
              owner: context.repo.owner,
              repo: context.repo.repo,
              pull_number: context.issue.number
            });

            const labels = new Set();
            for (const file of files) {
              if (file.filename.startsWith('src/components/')) labels.add('frontend');
              if (file.filename.startsWith('src/api/')) labels.add('backend');
              if (file.filename.endsWith('.css')) labels.add('style');
            }

            if (labels.size > 0) {
              await github.rest.issues.addLabels({
                owner: context.repo.owner,
                repo: context.repo.repo,
                issue_number: context.issue.number,
                labels: [...labels]
              });
            }
```

### Docker 构建 Action

构建和推送 Docker 镜像是 CI/CD 中的常见需求：

```yaml
jobs:
  docker:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: 设置 Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: 登录 Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}

      - name: 构建并推送
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: |
            <username>/<image>:latest
            <username>/<image>:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

### 发布 Release

自动发布 Release 是 CI/CD 流程的重要组成部分：

```yaml
jobs:
  release:
    runs-on: ubuntu-latest
    if: startsWith(github.ref, 'refs/tags/v')
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - run: npm ci && npm run build

      - name: 创建 Release
        uses: softprops/action-gh-release@v2
        with:
          files: |
            dist/*.tar.gz
            dist/*.zip
          body: |
            ## 变更内容

            请查看下方的 Commit 历史了解详细变更。

            ## 安装方式

            ```bash
            npm install <package>@${{ github.ref_name }}
            ```
          draft: false
          prerelease: ${{ contains(github.ref_name, 'beta') || contains(github.ref_name, 'rc') }}
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## 进阶技巧

### 在 Marketplace 中寻找 Action

1. 访问 [github.com/marketplace](https://github.com/marketplace) 并选择 **Actions** 类别。
2. 使用搜索框输入关键词（如 `deploy`、`slack`、`terraform`）。
3. 查看 Action 的 Stars 数、最近更新时间和兼容性信息。
4. 点击进入详情页查看文档和使用示例。

> [!TIP]
> 优先选择带有 "Verified creator" 徽章的 Action（表示由 GitHub 认证的开发者或组织发布），以及 Stars 数较高、最近有更新的 Action。

### 使用 Commit SHA 固定 Action 版本

为了安全性，推荐在生产环境中使用 Commit SHA 而非版本标签引用 Action：

```yaml
# 使用版本标签（推荐用于开发环境）
- uses: actions/checkout@v4

# 使用 Commit SHA（推荐用于生产环境）
- uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11
```

Commit SHA 是不可变的，可以防止仓库维护者在标签上推送恶意更新。你可以在 Action 仓库的 Commits 页面或通过 `git log` 找到对应版本的 SHA。

### 组合多个 Action 构建完整 Workflow

以下示例展示了如何组合多个 Action 构建一个完整的测试与发布流程：

```yaml
name: CI/CD

on:
  push:
    branches: [ main ]
    tags: [ 'v*' ]

permissions:
  contents: read

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18, 20]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: npm
      - run: npm ci
      - run: npm test
      - run: npm run lint

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: npm
      - run: npm ci && npm run build
      - uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/

  release:
    needs: build
    runs-on: ubuntu-latest
    if: startsWith(github.ref, 'refs/tags/v')
    permissions:
      contents: write
    steps:
      - uses: actions/download-artifact@v4
        with:
          name: dist
          path: dist/
      - uses: softprops/action-gh-release@v2
        with:
          files: dist/**
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## 常见问题

### Q: 如何判断一个第三方 Action 是否安全？

查看以下指标：仓库是否开源且活跃维护、是否有安全审计记录、Stars 数和下载量、最近 Commit 时间、Issue 是否得到及时回复。对于关键项目，建议 Fork 该 Action 并使用自己 Fork 的版本。

### Q: Action 的 `@v4` 和 `@main` 有什么区别？

`@v4` 是版本标签，指向固定的发布版本，行为稳定。`@main` 指向仓库的主分支最新代码，每次运行可能使用不同的代码。生产环境严禁使用 `@main`。

### Q: 如何在 Workflow 中使用私有仓库的 Action？

需要在 `uses` 中指定完整的仓库路径，并提供具有 `repo` 权限的 Personal Access Token：

```yaml
- uses: <owner>/<private-action>@v1
  with:
    token: ${{ secrets.PAT_TOKEN }}
```

同时在检出代码时也需要配置 `token` 参数。

### Q: `actions/cache` 的缓存什么时候失效？

缓存会在 7 天未被访问后自动删除。当 `key` 完全匹配时恢复缓存，匹配不到时会尝试 `restore-keys` 的前缀匹配。`hashFiles` 的结果变化会生成新的 key，从而绕过旧缓存。

### Q: Artifact 和缓存有什么区别？

Artifact 用于在 Job 之间或 Workflow 运行之间传递构建产物，支持手动下载。缓存主要用于加速依赖安装，由 `key` 管理，面向机器读取。Artifact 适合存储构建结果（如二进制文件、测试报告），缓存适合存储中间产物（如 `node_modules`、`.m2/repository`）。

### Q: 如何在 Workflow 中发送通知？

可以结合 Slack、Discord、邮件等第三方 Action。例如使用 `slackapi/slack-github-action` 发送 Slack 通知：

```yaml
- uses: slackapi/slack-github-action@v1
  with:
    payload: |
      {
        "text": "部署完成: ${{ github.event.head_commit.message }}"
      }
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

### Q: 如何查看某个 Action 的可用参数？

在 GitHub Marketplace 中搜索该 Action，进入详情页查看 `README` 中的 `inputs` 表格。你也可以直接访问 Action 的源码仓库，查看 `action.yml` 文件中的 `inputs` 定义。

### Q: 一个 Workflow 中可以使用多少个 Action？

没有硬性上限。但单个 Job 最多支持 100 个 Step，每个 Step 最多执行 2 小时。合理的做法是将复杂流程拆分为多个 Job，利用 `needs` 编排执行顺序。

## 参考链接

| 标题 | 说明 |
|------|------|
| [Checkout Action](https://github.com/marketplace/actions/checkout) | 代码检出的完整参数文档 |
| [Setup Node.js](https://github.com/marketplace/actions/setup-node-js-environment) | Node.js 环境配置 |
| [actions/github-script](https://github.com/actions/github-script) | GitHub API 脚本执行 |
| [Build and push Docker images](https://github.com/marketplace/actions/build-and-push-docker-images) | Docker 构建与推送 |
| [GitHub Marketplace](https://github.com/marketplace?type=actions) | Actions 市场首页 |
