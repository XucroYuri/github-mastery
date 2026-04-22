# 自定义 Action 开发

> 从 JavaScript Action 到 Docker Action 再到 Composite Action——创建、测试并发布你自己的可复用自动化组件。

## 概述

在 [常用Action与市场](03-常用Action与市场.md) 中，你已经学会了使用社区和官方提供的 Action。当现有 Action 无法满足需求时，你可以创建自己的 Action。GitHub 支持三种类型的自定义 Action：**JavaScript Action**、**Docker Action** 和 **Composite Action**，每种类型都有其适用场景。

JavaScript Action 执行速度最快，适合大多数轻量级任务；Docker Action 灵活性最高，可以在容器中运行任意语言和工具；Composite Action 是将多个 Step 打包为单个 Action 的简洁方式，不需要编写额外代码。理解它们的差异和开发流程，是构建高质量自动化组件的基础。

> [!NOTE]
> 自定义 Action 和 Workflow 是不同的概念。Workflow 定义在 `.github/workflows/` 目录下，由事件触发执行。Action 是可复用的 Step 组件，定义在仓库的 `action.yml` 文件中，被 Workflow 中的 `uses` 关键字引用。一个 Action 可以在多个 Workflow 中重复使用，也可以发布到 GitHub Marketplace 供他人使用。

## 核心操作

### 选择 Action 类型

三种类型的对比：

| 特性 | JavaScript Action | Docker Action | Composite Action |
|------|-------------------|---------------|------------------|
| 执行速度 | 快（秒级启动） | 慢（需构建镜像） | 快（直接运行 Step） |
| 语言支持 | JavaScript / TypeScript | 任意语言 | Shell / 其他 Action |
| 灵活性 | 中等 | 最高 | 中等 |
| 适用场景 | API 调用、文件操作 | 需要特殊工具链 | 封装多步流程 |
| 复杂度 | 中等 | 较高 | 最低 |

### 创建 JavaScript Action

JavaScript Action 是最常用的 Action 类型。以下是完整的创建流程：

**1. 初始化项目：**

```bash
mkdir my-js-action && cd my-js-action
npm init -y
npm install @actions/core @actions/github @actions/io
npm install --save-dev @vercel/ncc typescript @types/node
```

**2. 创建 `action.yml` 元数据文件：**

```yaml
# action.yml
name: 'PR 自动标签'
description: '根据 PR 变更的文件自动添加标签'
author: '<your-name>'

inputs:
  github-token:
    description: 'GitHub Token'
    required: true
    default: ${{ github.token }}
  config-path:
    description: '标签配置文件路径'
    required: false
    default: '.github/label-config.json'

outputs:
  labels-added:
    description: '添加的标签列表'

runs:
  using: 'node20'
  main: 'dist/index.js'

branding:
  icon: 'tag'
  color: 'blue'
```

**3. 编写 TypeScript 源码：**

```typescript
// src/index.ts
import * as core from '@actions/core';
import * as github from '@actions/github';

interface LabelConfig {
  patterns: string[];
  label: string;
}

async function run(): Promise<void> {
  try {
    const token = core.getInput('github-token');
    const configPath = core.getInput('config-path');

    const octokit = github.getOctokit(token);
    const { owner, repo } = github.context.repo;
    const prNumber = github.context.issue.number;

    if (!prNumber) {
      core.info('不在 PR 上下文中，跳过执行');
      return;
    }

    // 获取 PR 变更的文件列表
    const { data: files } = await octokit.rest.pulls.listFiles({
      owner,
      repo,
      pull_number: prNumber,
    });

    const changedFiles = files.map((f) => f.filename);

    // 根据文件路径匹配标签
    const labelConfig: LabelConfig[] = [
      { patterns: ['src/components/', 'src/styles/'], label: 'frontend' },
      { patterns: ['src/api/', 'src/models/'], label: 'backend' },
      { patterns: ['.github/workflows/'], label: 'ci-cd' },
      { patterns: ['docs/'], label: 'documentation' },
    ];

    const labelsToAdd: string[] = [];

    for (const config of labelConfig) {
      const matches = changedFiles.some((file) =>
        config.patterns.some((pattern) => file.startsWith(pattern))
      );
      if (matches) {
        labelsToAdd.push(config.label);
      }
    }

    if (labelsToAdd.length > 0) {
      await octokit.rest.issues.addLabels({
        owner,
        repo,
        issue_number: prNumber,
        labels: labelsToAdd,
      });

      core.setOutput('labels-added', labelsToAdd.join(', '));
      core.info(`添加标签: ${labelsToAdd.join(', ')}`);
    } else {
      core.info('没有匹配的标签');
    }
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    }
  }
}

run();
```

**4. 构建并提交：**

```bash
# 编译 TypeScript 并打包为单文件
npx ncc build src/index.ts -o dist

# 确保 dist/ 被提交到仓库
git add action.yml dist/index.js package.json
git commit -m "feat: 创建 PR 自动标签 Action"
```

> [!WARNING]
> JavaScript Action 必须提交编译后的 `dist/` 目录。GitHub Actions 运行时使用的是 `action.yml` 中 `main` 字段指定的文件路径，而不是源码。如果你忘记提交 `dist/`，Action 将无法运行。

### 创建 Composite Action

Composite Action 是将多个 Step 封装为单个 Action 的最简方式，不需要编写 JavaScript 代码：

**目录结构：**

```text
my-composite-action/
  action.yml
  setup.sh
```

**`action.yml`：**

```yaml
# action.yml
name: 'Node.js 构建缓存'
description: '安装依赖、构建并缓存产物'
inputs:
  node-version:
    description: 'Node.js 版本'
    required: false
    default: '20'
  build-command:
    description: '构建命令'
    required: false
    default: 'npm run build'
  output-path:
    description: '构建产物路径'
    required: false
    default: 'dist/'

runs:
  using: 'composite'
  steps:
    - name: 设置 Node.js
      uses: actions/setup-node@v4
      with:
        node-version: ${{ inputs.node-version }}
        cache: npm

    - name: 安装依赖
      shell: bash
      run: npm ci

    - name: 构建
      shell: bash
      run: ${{ inputs.build-command }}

    - name: 上传构建产物
      uses: actions/upload-artifact@v4
      with:
        name: build-output
        path: ${{ inputs.output-path }}
        retention-days: 3
```

**在 Workflow 中使用：**

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: <owner>/my-composite-action@v1
        with:
          node-version: '20'
          build-command: npm run build:prod
```

> [!TIP]
> Composite Action 中的每个 `run` 步骤都必须指定 `shell`（如 `bash`），否则会报错。这是 Composite Action 与普通 Workflow 语法的一个重要区别。

### 创建 Docker Action

Docker Action 适合需要特殊工具链或非 JavaScript 运行时的场景：

**`action.yml`：**

```yaml
name: 'Markdown 检查'
description: '使用 markdownlint 检查 Markdown 文件'
inputs:
  files:
    description: '要检查的文件路径'
    required: false
    default: '**/*.md'
  config:
    description: '配置文件路径'
    required: false
    default: '.markdownlint.json'

runs:
  using: 'docker'
  image: 'Dockerfile'

branding:
  icon: 'check-circle'
  color: 'green'
```

**`Dockerfile`：**

```dockerfile
FROM node:20-slim

RUN npm install -g markdownlint-cli

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
```

**`entrypoint.sh`：**

```bash
#!/bin/bash
set -e

FILES="${INPUT_FILES:-**/*.md}"
CONFIG="${INPUT_CONFIG:-.markdownlint.json}"

echo "检查文件: $FILES"
echo "配置文件: $CONFIG"

if [ -f "$CONFIG" ]; then
  markdownlint "$FILES" --config "$CONFIG"
else
  markdownlint "$FILES"
fi
```

> [!NOTE]
> Docker Action 的输入参数会自动作为环境变量注入到容器中，变量名为 `INPUT_<大写参数名>`。例如 `files` 参数对应 `INPUT_FILES` 环境变量。这是 Docker Action 与 JavaScript Action 在输入处理上的关键区别。

### action.yml 元数据详解

所有类型的 Action 都需要一个 `action.yml` 文件：

```yaml
name: 'Action 名称'                    # 必需，在 Marketplace 中显示
description: '一句话描述'               # 必需
author: '<作者>'                        # 可选

inputs:                                 # 定义输入参数
  <param-name>:
    description: '参数说明'
    required: true                      # 是否必填
    default: '默认值'                   # 可选默认值

outputs:                                # 定义输出参数
  <output-name>:
    description: '输出说明'

runs:                                   # 必需，定义执行方式
  using: 'node20'                       # node20 / docker / composite
  main: 'dist/index.js'                 # JavaScript Action 入口

branding:                               # 可选，Marketplace 图标
  icon: 'check-circle'                  # Feather Icons 名称
  color: 'green'                        # 白色背景颜色
```

### 在本地测试 Action

使用 [`act`](https://github.com/nektos/act) 工具可以在本地运行 GitHub Actions 进行测试：

```bash
# 安装 act（macOS）
brew install act

# 列出所有 Workflow
act -l

# 运行 push 事件触发的 Workflow
act push

# 运行特定 Job
act -j build

# 使用特定事件
act pull_request

# 开启详细日志
act -v push
```

对于 JavaScript Action，也可以直接编写单元测试：

```typescript
// __tests__/main.test.ts
import * as core from '@actions/core';
import { run } from '../src/main';

// Mock @actions/core
jest.mock('@actions/core');

describe('PR 自动标签 Action', () => {
  it('应该为前端文件添加 frontend 标签', async () => {
    const mockSetOutput = jest.fn();
    (core.getInput as jest.Mock).mockImplementation((name: string) => {
      if (name === 'github-token') return 'fake-token';
      return '';
    });
    (core.setOutput as jest.Mock) = mockSetOutput;

    // 这里可以添加更详细的测试逻辑
    expect(true).toBe(true);
  });
});
```

## 进阶技巧

### 发布 Action 到 Marketplace

1. 确保你的仓库是公开的，并且根目录包含 `action.yml`。
2. 在仓库页面点击右侧的 **Release** 区域，创建一个新的 Release。
3. 填写版本号（如 `v1.0.0`），编写 Release 说明。
4. 在发布页面底部勾选 **Publish this Action to the GitHub Marketplace**。
5. 确认 Action 的类别和合规性检查通过后，点击 **Publish release**。

发布后，用户可以通过 `<owner>/<action-name>@v1` 引用你的 Action。

**版本管理最佳实践：**

```bash
# 创建主版本标签，指向最新的次版本
git tag -a v1 -m "Update v1 tag to v1.2.3"
git tag -a v1.2 -m "Update v1.2 tag to v1.2.3"

# 推送标签
git push origin --tags
```

用户使用 `@v1` 时会自动获取 v1 系列的最新版本，使用 `@v1.2` 则获取 v1.2 系列的最新补丁。

### 使用 Action 输出实现 Job 间通信

```yaml
# action.yml
name: '版本号提取'
outputs:
  version:
    description: '提取的版本号'
    value: ${{ steps.extract.outputs.version }}
  major:
    description: '主版本号'
    value: ${{ steps.extract.outputs.major }}
runs:
  using: 'composite'
  steps:
    - id: extract
      shell: bash
      run: |
        VERSION=$(cat package.json | jq -r .version)
        MAJOR=$(echo $VERSION | cut -d. -f1)
        echo "version=$VERSION" >> $GITHUB_OUTPUT
        echo "major=$MAJOR" >> $GITHUB_OUTPUT
```

### 在组织内共享 Action

对于私有 Action 或组织内部 Action，无需发布到 Marketplace：

```yaml
# 引用同一组织内其他仓库的 Action
steps:
  - uses: <org>/<shared-action>@v1
    with:
      param: value

# 引用同一仓库内子目录的 Action
steps:
  - uses: ./.github/actions/my-action
    with:
      param: value
```

组织内部共享 Action 的推荐目录结构：

```text
.github/
  actions/
    setup-env/
      action.yml
    build-and-test/
      action.yml
    deploy/
      action.yml
  workflows/
    ci.yml
    deploy.yml
```

## 常见问题

### Q: JavaScript Action 应该提交 `node_modules` 吗？

不应该。使用 `@vercel/ncc` 将代码和依赖打包成单文件（`dist/index.js`），只提交打包后的文件。这样可以减小仓库体积，加快 Action 的下载和启动速度。

### Q: Composite Action 可以调用其他 Action 吗？

可以。Composite Action 的 Step 中可以使用 `uses` 引用其他 Action，也可以使用 `run` 执行 Shell 命令。但 Composite Action 不能使用 `secrets` 上下文——密钥需要从调用方通过 `inputs` 传入。

### Q: Docker Action 构建太慢怎么办？

Docker Action 每次运行都需要构建镜像，启动时间可能需要 30 秒以上。如果你的任务不需要特殊工具链，优先考虑 JavaScript Action 或 Composite Action。如果必须使用 Docker Action，可以通过精简 Dockerfile（使用 `alpine` 基础镜像、减少 RUN 层数）来缩短构建时间。

### Q: 如何在 Action 中处理敏感数据？

不要在 Action 的输入参数中传递密钥。密钥应该通过 Workflow 的 `secrets` 上下文传入，并在 Action 内部使用 `core.setSecret()` 标记输出，防止在日志中泄露。参见 [安全与密钥管理](06-安全与密钥管理.md) 了解更多安全实践。

### Q: Action 可以跨仓库复用吗？

可以。公开仓库的 Action 可以被任何 Workflow 引用。私有仓库的 Action 需要通过 `token` 参数认证后才能引用。组织内部建议将通用 Action 集中管理在一个专用仓库中。

### Q: 如何更新已发布的 Action 版本？

创建新的 Git 标签并发布 Release 即可。建议维护主版本标签（如 `v1`），每次发布新次版本时更新主版本标签的指向。这样用户使用 `@v1` 就能自动获取最新的兼容更新。

### Q: `@vercel/ncc` 和 `@vercel/ncc` 有什么替代方案？

除了 `@vercel/ncc`，你还可以使用 `esbuild`（更快）或 `webpack`（更灵活）进行打包。`ncc` 的优势是开箱即用，对 `@actions/*` 包的兼容性最好。对于简单的 Action，`ncc` 是最推荐的选择。

### Q: 如何为 Action 编写文档？

在 Action 仓库的 `README.md` 中包含以下内容：功能描述、输入参数表格、输出参数表格、使用示例 YAML、许可协议。良好的文档是 Action 被 [CI/CD 实战](04-CI-CD实战.md) 中广泛采用的关键。

## 参考链接

| 标题 | 说明 |
|------|------|
| [About custom actions](https://docs.github.com/en/actions/creating-actions/about-custom-actions) | 自定义 Action 概念与类型对比 |
| [Creating a JavaScript action](https://docs.github.com/en/actions/creating-actions/creating-a-javascript-action) | JavaScript Action 创建教程 |
| [Creating a composite action](https://docs.github.com/en/actions/creating-actions/creating-a-composite-action) | Composite Action 创建教程 |
| [Creating a Docker container action](https://docs.github.com/en/actions/sharing-automations/creating-actions/creating-a-docker-container-action) | Docker Action 创建教程 |
| [Metadata syntax for GitHub Actions](https://docs.github.com/en/actions/creating-actions/metadata-syntax-for-github-actions) | action.yml 元数据语法参考 |
