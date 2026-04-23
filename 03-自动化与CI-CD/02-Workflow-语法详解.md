# Workflow 语法详解

> 深入掌握 GitHub Actions Workflow 的 YAML 语法——触发器、矩阵构建、条件表达式、环境变量与工作流命令。

## 概述

在 [GitHub Actions 入门](01-GitHub-Actions-入门) 中，你已经学会了创建基本的 Workflow。本章将深入解析 Workflow 的 YAML 语法细节，涵盖触发器的完整配置、矩阵策略、条件表达式、环境变量、默认值设置以及工作流命令等核心语法。

GitHub Actions 的 Workflow 语法基于 YAML 格式，但在此基础上定义了大量专用关键字。理解这些关键字的精确语义和行为，是从"能用"到"用好"的关键。很多高级自动化场景（如多平台测试、条件部署、环境隔离）都依赖于对语法的深入理解。

> [!NOTE]
> Workflow 文件的 YAML 解析遵循严格的规范。缩进必须使用空格（不能用 Tab），布尔值需要用引号包裹（如 `if: "true"`），字符串中的特殊字符可能需要转义。建议在提交前使用 YAML 在线验证工具检查语法。

## 核心操作

### 顶层结构

一个完整的 Workflow 文件包含以下顶层关键字：

```yaml
name: Workflow 名称                    # 可选，显示在 Actions 页面
run-name: 由 ${{ github.actor }} 触发  # 可选，显示运行记录的标题

on:                                    # 必需，定义触发条件
  push:
    branches: [ main ]

permissions:                           # 可选，定义 GITHUB_TOKEN 权限
  contents: read

env:                                   # 可选，全局环境变量
  NODE_VERSION: '20'

defaults:                              # 可选，默认配置
  run:
    shell: bash
    working-directory: ./app

concurrency:                           # 可选，并发控制
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:                                  # 必需，定义作业
  build:
    runs-on: ubuntu-latest
    steps:
      - run: echo "Hello"
```

### 触发器（on）详解

触发器决定了 Workflow 何时运行。以下是各类触发器的完整配置：

**Webhook 事件：**

```yaml
on:
  # 推送事件——支持分支、标签和路径过滤
  push:
    branches:
      - main
      - 'release/**'        # 通配符匹配
    tags:
      - 'v*'                # 匹配 v1.0、v2.1 等
    paths:
      - 'src/**'            # 只在 src 目录变更时触发
      - 'package.json'
    paths-ignore:           # 排除路径（与 paths 互斥）
      - 'docs/**'
      - '*.md'

  # Pull Request 事件
  pull_request:
    types: [ opened, synchronize, reopened ]  # 默认值
    branches: [ main ]

  # Issue 事件
  issues:
    types: [ opened, labeled ]

  # Issue 评论
  issue_comment:
    types: [ created ]

  # Release 事件
  release:
    types: [ published ]
```

**定时与手动事件：**

```yaml
on:
  # 定时执行（Cron 表达式）
  schedule:
    - cron: '30 5 * * 1-5'  # 工作日每天 5:30 UTC

  # 手动触发（支持输入参数）
  workflow_dispatch:
    inputs:
      deploy_target:
        description: '部署目标'
        required: true
        type: choice
        options:
          - staging
          - production
      version:
        description: '版本号'
        required: false
        type: string

  # 被其他 Workflow 调用
  workflow_call:
    inputs:
      config-path:
        required: true
        type: string
    secrets:
      deploy-key:
        required: true
```

**多事件组合：**

```yaml
on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]
  schedule:
    - cron: '0 0 * * 0'  # 每周日零点
  workflow_dispatch:       # 同时支持手动触发
```

### 权限控制（permissions）

`permissions` 用于限制 `GITHUB_TOKEN` 的权限范围，遵循最小权限原则：

```yaml
# 顶层设置——影响所有 Job
permissions:
  contents: read
  pull-requests: write

jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: read       # 只读仓库内容
      checks: write        # 写入检查结果
    steps:
      - uses: actions/checkout@v4
```

常用权限值：

| 权限 | 说明 | 可选值 |
|------|------|--------|
| `contents` | 仓库内容读写 | `read`、`write` |
| `pull-requests` | PR 操作 | `read`、`write` |
| `issues` | Issue 操作 | `read`、`write` |
| `checks` | Check 运行结果 | `read`、`write` |
| `packages` | GitHub Packages | `read`、`write` |
| `deployments` | 部署状态 | `read`、`write` |

> [!WARNING]
> 如果不设置 `permissions`，`GITHUB_TOKEN` 默认拥有 `write` 权限。建议在 Workflow 顶层显式设置 `permissions: {}` 或只授予所需的最小权限，避免安全风险。

### Job 配置详解

```yaml
jobs:
  build:
    name: 构建应用               # 可选，Job 显示名称
    runs-on: ubuntu-latest       # 运行环境
    needs: [ lint ]              # 依赖关系
    if: github.event_name == 'push'  # 条件执行
    timeout-minutes: 30          # 超时时间（默认 360 分钟）
    strategy:                    # 矩阵策略
      matrix:
        node-version: [18, 20, 22]
    env:                         # Job 级环境变量
      BUILD_ENV: production
    defaults:
      run:
        working-directory: ./app
    continue-on-error: true      # 即使失败也继续
    steps:
      - uses: actions/checkout@v4
      - run: npm install && npm run build
```

### 矩阵策略（strategy.matrix）

矩阵策略让你在多种配置组合下测试代码：

**基本矩阵：**

```yaml
jobs:
  test:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ ubuntu-latest, macos-latest, windows-latest ]
        node-version: [ 18, 20, 22 ]
      # 以上组合会产生 3 x 3 = 9 个 Job
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
      - run: npm ci && npm test
```

**排除与包含：**

```yaml
strategy:
  matrix:
    os: [ ubuntu-latest, macos-latest ]
    python-version: [ '3.10', '3.11', '3.12' ]
    exclude:
      # 排除特定组合
      - os: macos-latest
        python-version: '3.10'
    include:
      # 添加额外的组合
      - os: ubuntu-latest
        python-version: '3.12'
        experimental: true
```

**失败策略：**

```yaml
strategy:
  fail-fast: false     # 一个失败不影响其他矩阵组合
  max-parallel: 4      # 最多并行运行 4 个 Job
  matrix:
    node-version: [18, 20, 22]
```

> [!TIP]
> 设置 `fail-fast: false` 可以让所有矩阵组合都运行完毕，即使其中一些已经失败。这在调试多平台兼容性问题时非常有用，因为你可以在一次运行中看到所有平台的测试结果。

### 条件表达式（if）

GitHub Actions 支持丰富的条件表达式：

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'  # Job 级条件

    steps:
      # Step 级条件
      - name: 仅在 PR 中运行
        if: github.event_name == 'pull_request'
        run: echo "This is a PR"

      # 使用表达式函数
      - name: 检查文件变更
        if: contains(github.event.head_commit.message, '[deploy]')
        run: echo "Triggered by commit message"

      # 检查前一步的结果
      - name: 上一步成功时执行
        if: success()
        run: echo "Previous steps passed"

      - name: 上一步失败时执行
        if: failure()
        run: echo "Something went wrong"

      # 始终执行（即使之前有步骤失败）
      - name: 清理操作
        if: always()
        run: echo "Cleaning up"
```

常用表达式函数：

| 函数 | 说明 |
|------|------|
| `success()` | 之前所有 Step 都成功（默认） |
| `failure()` | 至少一个之前的 Step 失败 |
| `always()` | 无论之前的状态如何都执行 |
| `cancelled()` | Workflow 被取消时执行 |
| `contains(str, sub)` | 字符串包含检查 |
| `startsWith(str, prefix)` | 前缀匹配 |
| `endsWith(str, suffix)` | 后缀匹配 |
| `hashFiles(path)` | 计算文件哈希值 |

### 环境变量

环境变量可以在多个层级设置，优先级从高到低：

```yaml
env:                           # 1. Workflow 级（最低优先级）
  APP_NAME: my-app

jobs:
  build:
    env:                       # 2. Job 级
      APP_NAME: my-app-build

    steps:
      - name: 构建
        env:                   # 3. Step 级（最高优先级）
          APP_NAME: my-app-step
        run: echo "APP_NAME is $APP_NAME"

      - name: 引用上下文
        env:
          GITHUB_SHA: ${{ github.sha }}
          RUNNER_OS: ${{ runner.os }}
        run: |
          echo "Commit: $GITHUB_SHA"
          echo "Runner: $RUNNER_OS"
```

> [!NOTE]
> 在 `env` 块中引用变量必须使用 `${{ }}` 语法，例如 `${{ github.sha }}`。在 `run` 块中引用环境变量使用 `$` 前缀（Linux/macOS）或 `%VAR%`（Windows）。

### 工作流命令（Workflow Commands）

GitHub Actions 提供了一组特殊命令，通过 `echo` 输出特定格式的字符串来控制 Workflow 行为：

```yaml
steps:
  - name: 设置输出参数
    id: step1
    run: |
      echo "result=hello" >> $GITHUB_OUTPUT

  - name: 使用输出参数
    run: echo "Result is ${{ steps.step1.outputs.result }}"

  - name: 设置多行输出
    id: step2
    run: |
      EOF=$(dd if=/dev/urandom bs=15 count=1 status=none | base64)
      echo "content<<$EOF" >> $GITHUB_OUTPUT
      echo "第一行" >> $GITHUB_OUTPUT
      echo "第二行" >> $GITHUB_OUTPUT
      echo "$EOF" >> $GITHUB_OUTPUT

  - name: 设置环境变量
    run: |
      echo "DEPLOY_ENV=staging" >> $GITHUB_ENV

  - name: 使用设置的环境变量
    run: echo "Deploy to $DEPLOY_ENV"

  - name: 添加 Job Summary
    run: |
      echo "## 测试结果 :white_check_mark:" >> $GITHUB_STEP_SUMMARY
      echo "| 测试项 | 状态 |" >> $GITHUB_STEP_SUMMARY
      echo "|--------|------|" >> $GITHUB_STEP_SUMMARY
      echo "| 单元测试 | 通过 |" >> $GITHUB_STEP_SUMMARY
      echo "| 集成测试 | 通过 |" >> $GITHUB_STEP_SUMMARY

  - name: 添加系统路径
    run: echo "$HOME/.local/bin" >> $GITHUB_PATH

  - name: 分组日志
    run: |
      echo "::group::安装依赖"
      npm ci
      echo "::endgroup::"

      echo "::group::运行测试"
      npm test
      echo "::endgroup::"

  - name: 警告与错误注解
    run: |
      echo "::warning file=app.js,line=10,col=5::发现未使用的变量"
      echo "::error file=src/main.ts,line=42::类型错误"
```

### Artifact 与缓存

**上传和下载 Artifact：**

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
          name: dist
          path: dist/
          retention-days: 5

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: 下载构建产物
        uses: actions/download-artifact@v4
        with:
          name: dist
          path: dist/
```

**依赖缓存：**

```yaml
steps:
  - uses: actions/checkout@v4

  - name: 缓存 Node.js 模块
    uses: actions/cache@v4
    with:
      path: ~/.npm
      key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
      restore-keys: |
        ${{ runner.os }}-node-
```

## 进阶技巧

### 并发控制

使用 `concurrency` 避免同一 Workflow 的多次运行互相冲突：

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
```

设置 `cancel-in-progress: true` 后，当新的运行开始时，同组中正在进行的运行会被自动取消。这在部署场景中特别有用——确保只有最新的代码被部署。

### 使用 Reusable Workflow

Reusable Workflow 允许你在一个 Workflow 中调用另一个 Workflow，实现复用：

```yaml
# .github/workflows/called.yml（被调用的 Workflow）
on:
  workflow_call:
    inputs:
      node-version:
        required: true
        type: string
    secrets:
      token:
        required: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ inputs.node-version }}
```

```yaml
# .github/workflows/caller.yml（调用方）
on:
  push:
    branches: [ main ]

jobs:
  call-build:
    uses: ./.github/workflows/called.yml
    with:
      node-version: '20'
    secrets:
      token: ${{ secrets.GITHUB_TOKEN }}
```

### 使用 Job 输出传递数据

Job 之间可以通过输出传递数据：

```yaml
jobs:
  setup:
    runs-on: ubuntu-latest
    outputs:
      version: ${{ steps.get-version.outputs.version }}
    steps:
      - id: get-version
        run: echo "version=1.2.3" >> $GITHUB_OUTPUT

  build:
    needs: setup
    runs-on: ubuntu-latest
    steps:
      - run: echo "Building version ${{ needs.setup.outputs.version }}"
```

## 常见问题

### Q: `on.push.paths` 和 `on.push.paths-ignore` 可以同时使用吗？

不可以。`paths` 和 `paths-ignore` 互斥——只能使用其中一个。如果你需要更复杂的过滤逻辑，可以在 Job 级别使用 `if` 条件表达式来判断变更的文件。

### Q: 矩阵策略中 `exclude` 和 `include` 的执行顺序是什么？

先应用 `exclude` 排除组合，再应用 `include` 添加组合。`include` 添加的组合即使不在原矩阵中也会被包含进来，并且可以为组合添加额外的变量。

### Q: `if` 条件中的 `success()` 是默认值吗？

是的。Step 的 `if` 条件默认隐含 `success()`，即之前所有 Step 都成功时才会执行。如果你自定义了 `if` 条件，则需要显式加上 `success() && <你的条件>` 来保留这个检查。

### Q: 如何在 `if` 条件中引用环境变量？

`if` 条件在 Shell 执行之前求值，所以不能直接使用 `$ENV_VAR`。需要通过 `env` 上下文引用：`if: ${{ env.MY_VAR == 'value' }}`。

### Q: `GITHUB_OUTPUT` 和 `set-output` 命令有什么区别？

`set-output` 是旧版命令（通过 `echo "::set-output name=key::value"`），已在 2023 年废弃。现在必须使用 `$GITHUB_OUTPUT` 文件（`echo "key=value" >> $GITHUB_OUTPUT`）。

### Q: `always()` 会导致被取消的 Job 中的 Step 也执行吗？

不会。`always()` 只在 Job 没有被取消时生效。如果整个 Workflow 被取消，`always()` 的 Step 也会被跳过。如果你确实需要在取消时也执行，可以使用 `if: cancelled() || always()`。

### Q: 如何在 YAML 中正确处理包含特殊字符的字符串？

如果字符串包含 `${{ }}`、`:`、`#`、`{`、`}` 等特殊字符，建议用双引号或单引号包裹。在 `run` 块中使用 `$` 符号引用环境变量时，如果 YAML 中使用了双引号，需要转义为 `"$VAR"` 或使用 `'` 包裹整个值。

### Q: 一个 Workflow 文件最大可以多大？

GitHub 建议单个 Workflow 文件不超过 1 MB。对于复杂的 Workflow，推荐使用 [Reusable Workflow](#使用-reusable-workflow) 拆分逻辑，或使用 Composite Action 封装重复的步骤。

## 参考链接

| 标题 | 说明 |
|------|------|
| [Workflow syntax for GitHub Actions](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions) | 官方 Workflow 语法完整参考 |
| [Expressions](https://docs.github.com/en/actions/concepts/workflows-and-actions/expressions) | 表达式与函数参考 |
| [Events that trigger workflows](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows) | 所有触发事件类型 |
| [Workflow commands](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-commands) | 工作流命令完整列表 |
| [Dependency caching reference](https://docs.github.com/en/actions/reference/workflows-and-actions/dependency-caching) | 缓存机制参考 |
