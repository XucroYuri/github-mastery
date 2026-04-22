# GitHub API 与集成

> 通过 REST 和 GraphQL 双协议接口，将 GitHub 能力嵌入你的工具链和工作流。

## 概述

GitHub 提供两套 API：REST API 和 GraphQL API。REST API 覆盖几乎所有 GitHub 功能，是大多数集成的首选；GraphQL API 则允许你按需查询精确字段，一次请求获取关联数据，减少网络往返。两者共享相同的认证体系和速率限制策略。

无论你是编写自动化脚本、构建 GitHub App、还是将 GitHub 数据集成到内部仪表盘，理解 API 的核心机制都是第一步。本专题将从认证、请求、分页、速率限制到 Webhook 全链路讲解，帮助你构建可靠的集成方案。

> [!NOTE]
> GitHub REST API 基于 OpenAPI 规范描述，所有端点的参数、返回值和示例都可以在官方文档中直接查阅。
> GraphQL API 则提供了完整的 Schema 定义，你可以通过 GraphiQL Explorer 在线探索和调试查询语句。

## 核心操作

### 认证方式

所有 API 请求都需要认证。GitHub 支持以下几种 Token 类型：

1. **Personal Access Token（PAT）**——适合个人脚本和工具：

```bash
# 创建 Classic Token
# 前往 Settings → Developer settings → Personal access tokens → Tokens (classic)

# 创建 Fine-grained Token（推荐）
# 前往 Settings → Developer settings → Personal access tokens → Fine-grained tokens
# Fine-grained Token 支持仓库级别的权限控制
```

2. **在请求中使用 Token**：

```bash
# 使用 HTTP Header
curl -H "Authorization: Bearer <your-token>" \
  https://api.github.com/user

# 使用 gh 命令（自动处理认证）
gh api user
```

3. **GitHub Actions 中的 GITHUB_TOKEN**：

```yaml
- name: 调用 API
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  run: |
    curl -H "Authorization: Bearer $GITHUB_TOKEN" \
      https://api.github.com/repos/${{ github.repository }}/issues
```

> [!WARNING]
> 绝对不要将 Token 硬编码在代码中或提交到 Git 仓库。使用环境变量或 Secrets 管理工具存储 Token。
> 如果 Token 不小心泄露，立即到 Settings → Developer settings 中撤销它。

### REST API 基础调用

REST API 使用标准 HTTP 方法操作资源：

```bash
# GET — 获取资源
curl -H "Authorization: Bearer <token>" \
  https://api.github.com/repos/OWNER/REPO/issues

# POST — 创建资源
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -H "Accept: application/vnd.github+json" \
  https://api.github.com/repos/OWNER/REPO/issues \
  -d '{"title":"新建 Issue","body":"问题描述"}'

# PATCH — 更新资源
curl -X PATCH \
  -H "Authorization: Bearer <token>" \
  -H "Accept: application/vnd.github+json" \
  https://api.github.com/repos/OWNER/REPO/issues/42 \
  -d '{"state":"closed"}'

# DELETE — 删除资源
curl -X DELETE \
  -H "Authorization: Bearer <token>" \
  https://api.github.com/repos/OWNER/REPO/comments/12345
```

常用端点一览：

| 操作 | 端点 | 方法 |
|------|------|------|
| 获取当前用户 | `/user` | GET |
| 列出仓库 Issue | `/repos/{owner}/{repo}/issues` | GET |
| 创建 Issue | `/repos/{owner}/{repo}/issues` | POST |
| 列出 PR | `/repos/{owner}/{repo}/pulls` | GET |
| 列出 Workflow 运行 | `/repos/{owner}/{repo}/actions/runs` | GET |
| 获取仓库内容 | `/repos/{owner}/{repo}/contents/{path}` | GET |

### GraphQL API 查询

GraphQL 允许你在一次请求中获取多个关联资源，只返回你需要的字段：

```bash
# 使用 curl 发送 GraphQL 请求
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  https://api.github.com/graphql \
  -d '{"query":"{ viewer { login name repositories(first: 5) { nodes { name stargazerCount } } } }"}'
```

使用 `gh api graphql` 可以更方便地执行查询：

```bash
# 查询仓库的 Issue 和 PR 数量
gh api graphql -f query='
  query($owner: String!, $repo: String!) {
    repository(owner: $owner, name: $repo) {
      issues(states: OPEN) {
        totalCount
      }
      pullRequests(states: OPEN) {
        totalCount
      }
    }
  }
' -f owner=OWNER -f repo=REPO
```

GraphQL 的 Mutation 用于修改数据：

```bash
# 通过 Mutation 添加 Issue 评论
gh api graphql -f query='
  mutation($id: ID!, $body: String!) {
    addComment(input: {subjectId: $id, body: $body}) {
      commentEdge {
        node {
          body
          createdAt
        }
      }
    }
  }
' -f id=<issue-node-id> -f body="通过 GraphQL 添加的评论"
```

> [!TIP]
> 使用 [GitHub GraphQL Explorer](https://docs.github.com/en/graphql/overview/explorer) 可以在线编写、
> 调试和测试 GraphQL 查询。它提供自动补全和 Schema 文档，是学习和开发的好帮手。

### 分页处理

API 返回大量数据时会自动分页。REST API 使用 Link Header，GraphQL 使用游标分页：

```bash
# REST API 分页——使用 per_page 和 page 参数
curl -H "Authorization: Bearer <token>" \
  "https://api.github.com/repos/OWNER/REPO/issues?per_page=10&page=2"

# 使用 gh 的 --paginate 自动获取所有页
gh api repos/OWNER/REPO/issues --paginate --jq '.[].title'
```

GraphQL 游标分页示例：

```graphql
query($owner: String!, $repo: String!, $cursor: String) {
  repository(owner: $owner, name: $repo) {
    issues(first: 25, after: $cursor, states: OPEN) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        number
        title
      }
    }
  }
}
```

### 速率限制

GitHub API 对请求频率有限制，避免服务器过载：

```bash
# 查看当前速率限制状态
curl -H "Authorization: Bearer <token>" \
  https://api.github.com/rate_limit

# 或使用 gh
gh api rate_limit --jq '.resources.core | "剩余: \(.remaining)/\(.limit), 重置时间: \(.reset)"'
```

速率限制规则：

| 认证方式 | Core 限制 | 搜索限制 |
|----------|-----------|----------|
| 未认证 | 60 次/小时 | 10 次/分钟 |
| Personal Access Token | 5,000 次/小时 | 30 次/分钟 |
| GitHub App（安装令牌） | 5,000 次/小时 | 30 次/分钟 |
| GITHUB_TOKEN（Actions） | 1,000 次/小时 | 30 次/分钟 |

> [!WARNING]
> 超出速率限制后，API 返回 `403 Forbidden` 状态码，响应体包含 `x-ratelimit-reset` Header
> 指示限制重置的 Unix 时间戳。编写集成代码时务必实现退避（backoff）逻辑。

### Webhook 配置

Webhook 让你的服务在 GitHub 事件发生时自动收到 HTTP 回调通知：

1. 在仓库 Settings → Webhooks → Add webhook 中配置。
2. 填写 **Payload URL**——你的服务端接收地址。
3. 选择 **Content type**——推荐 `application/json`。
4. 设置 **Secret**——用于验证请求确实来自 GitHub。
5. 选择要监听的事件类型。

验证 Webhook 签名的 Node.js 示例：

```javascript
const crypto = require('crypto');

function verifySignature(payloadBody, signatureHeader, secret) {
  const signature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payloadBody))
    .digest('hex');
  const expected = `sha256=${signature}`;
  return crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(signatureHeader)
  );
}
```

常见的 Webhook 事件：

| 事件 | 触发时机 |
|------|----------|
| `push` | 仓库收到 Git push |
| `pull_request` | PR 被创建、更新或合并 |
| `issues` | Issue 被创建或修改 |
| `issue_comment` | Issue 或 PR 收到评论 |
| `workflow_run` | Actions Workflow 运行完成 |
| `release` | Release 被创建或发布 |

## 进阶技巧

### 使用 Octokit.js 封装 API 调用

Octokit.js 是 GitHub 官方维护的 REST/GraphQL 客户端库，处理了认证、分页、重试等细节：

```javascript
import { Octokit } from 'octokit';

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

// 获取仓库 Issue
const { data: issues } = await octokit.rest.issues.listForRepo({
  owner: 'OWNER',
  repo: 'REPO',
  state: 'open',
  per_page: 10,
});

// 自动分页获取所有 Issue
const allIssues = await octokit.paginate(
  octokit.rest.issues.listForRepo,
  {
    owner: 'OWNER',
    repo: 'REPO',
    state: 'open',
  }
);
console.log(`共 ${allIssues.length} 个打开的 Issue`);

// GraphQL 查询
const result = await octokit.graphql(`
  query($owner: String!, $repo: String!) {
    repository(owner: $owner, name: $repo) {
      stargazerCount
      forkCount
    }
  }
`, { owner: 'OWNER', repo: 'REPO' });
```

### 使用条件请求节省配额

GitHub API 支持 ETag 和 Last-Modified 机制。如果你的请求结果在上次之后没有变化，服务器返回 `304 Not Modified`，不计入速率限制：

```bash
# 首次请求，记录 ETag
curl -I -H "Authorization: Bearer <token>" \
  https://api.github.com/repos/OWNER/REPO
# 响应头包含 ETag: "abc123"

# 后续请求带上 If-None-Match
curl -H "Authorization: Bearer <token>" \
  -H 'If-None-Match: "abc123"' \
  https://api.github.com/repos/OWNER/REPO
# 如果没有变化，返回 304，不消耗配额
```

### 编写健壮的 API 集成脚本

以下是一个带重试和错误处理的 Bash 脚本模板：

```bash
#!/usr/bin/env bash
set -euo pipefail

MAX_RETRIES=3
RETRY_DELAY=5

function api_call() {
  local attempt=1
  while [ $attempt -le $MAX_RETRIES ]; do
    response=$(gh api "$1" 2>&1) && {
      echo "$response"
      return 0
    }
    echo "第 $attempt 次请求失败，${RETRY_DELAY} 秒后重试..." >&2
    sleep $RETRY_DELAY
    attempt=$((attempt + 1))
  done
  echo "达到最大重试次数，退出。" >&2
  return 1
}

# 批量获取仓库信息
repos=("repo-a" "repo-b" "repo-c")
for repo in "${repos[@]}"; do
  data=$(api_call "repos/OWNER/$repo" || continue)
  stars=$(echo "$data" | jq -r '.stargazers_count')
  echo "$repo: $stars stars"
done
```

### REST API 最佳实践

遵循以下实践可以让你的集成更可靠：

1. **使用最新的 API 版本**——在请求头中指定 `X-GitHub-Api-Version: 2022-11-28`。
2. **处理分页**——始终检查 `Link` Header 中的下一页链接，不要假设一次请求能拿到所有数据。
3. **实现指数退避**——遇到 `429` 或 `5xx` 错误时，等待后重试，每次等待时间翻倍。
4. **缓存不变数据**——使用 ETag 和条件请求，避免重复获取未变化的数据。
5. **选择合适的 Token 类型**——Fine-grained Token 提供最小权限原则，比 Classic Token 更安全。

关于在 GitHub App 中使用 API 的完整流程，参见 [GitHub Apps 与 OAuth App](04-GitHub-Apps与OAuth-App.md)。

## 常见问题

### Q: REST API 和 GraphQL API 应该选哪个？

两者功能基本等价。选择建议：如果你只需简单调用几个端点，REST 更直观易上手；
如果你需要一次获取多种关联数据（例如仓库的 Issue、PR、提交和贡献者），GraphQL 更高效。
已有 REST 集成无需迁移到 GraphQL——两者可以混合使用。

### Q: GITHUB_TOKEN 和 Personal Access Token 有什么区别？

`GITHUB_TOKEN` 是 GitHub Actions 自动创建的临时 Token，仅在 Workflow 运行期间有效，
权限范围限定在当前仓库。Personal Access Token 是你手动创建的长期 Token，权限范围更广。
在生产环境中，推荐优先使用 `GITHUB_TOKEN` 或 GitHub App 的安装令牌，遵循最小权限原则。

### Q: 如何处理 API 返回的 422 Unprocessable Entity 错误？

422 错误通常表示请求格式正确但数据验证失败。常见原因包括：缺少必填字段、字段值格式不正确、
资源已存在等。检查响应体中的 `message` 和 `errors` 字段，它们会告诉你具体哪些字段有问题。

### Q: Webhook 事件丢失了怎么办？

GitHub Webhook 不保证 100% 投递。如果可靠性要求高，建议使用轮询 API 作为兜底方案。
你可以记录最后处理的事件 ID，定期轮询 API 补齐可能遗漏的事件。
对于关键操作，也可以在 Webhook 处理逻辑中加入幂等性设计，使重复投递不会产生副作用。

### Q: 如何在 API 调用中获取仓库文件内容？

使用 Contents API 可以获取文件内容和目录列表：

```bash
# 获取文件内容（Base64 编码）
gh api repos/OWNER/REPO/contents/README.md --jq '.content' | base64 -d

# 获取目录列表
gh api repos/OWNER/REPO/contents/src --jq '.[].name'
```

对于大文件，Contents API 有 1MB 限制。超过限制时需要使用 Git Blob API 或 Git Data API。

### Q: GraphQL API 的 rate limit 如何计算？

GraphQL 使用"点数"（point）计算速率限制，而非简单的请求次数。默认每小时 5,000 点。
每个查询消耗的点数取决于请求的节点数量。查询响应中包含 `rateLimit` 字段，
显示本次消耗的点数和剩余配额：

```graphql
query {
  viewer {
    login
  }
  rateLimit {
    cost
    remaining
    resetAt
  }
}
```

### Q: 如何测试 API 请求而不消耗速率限制？

使用条件请求（If-None-Match / ETag）是最有效的方式——304 响应不消耗配额。
此外，GitHub 提供 `http://api.github.local` 作为本地测试端点（需要 GitHub Enterprise Server）。
开发阶段也可以使用 GitHub 的 Octokit 模拟工具进行单元测试。

### Q: 如何在 CI 中自动创建 Issue 报告测试失败？

以下 Workflow 在测试失败时自动创建 Issue：

```yaml
name: CI
on: [push]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm test || echo "TEST_FAILED=true" >> $GITHUB_ENV
      - name: 报告失败
        if: env.TEST_FAILED == 'true'
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          gh issue create \
            --title "测试失败: ${{ github.sha }}" \
            --body "提交 ${{ github.sha }} 的 CI 测试失败，请查看 [日志](${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }})" \
            --label bug
```

## 参考链接

| 标题 | 说明 |
|------|------|
| [GitHub REST API Documentation](https://docs.github.com/en/rest) | REST API 完整文档 |
| [GitHub GraphQL API Documentation](https://docs.github.com/en/graphql) | GraphQL API 文档和 Schema |
| [Best Practices for REST API](https://docs.github.com/en/rest/using-the-rest-api/best-practices-for-using-the-rest-api) | REST API 使用最佳实践 |
| [Rate Limits for the REST API](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api) | 速率限制详细规则 |
| [Scripting with REST API and JavaScript](https://docs.github.com/en/rest/guides/scripting-with-the-rest-api-and-javascript) | JavaScript 脚本化指南 |
| [octokit/octokit.js](https://github.com/octokit/octokit.js) | 官方 JavaScript SDK |
| [octokit/handbook](https://github.com/octokit/handbook) | Octokit 使用手册 |
| [An Introduction to GraphQL via GitHub API](https://www.cloudbees.com/blog/an-introduction-to-graphql-via-the-github-api) | GraphQL 入门教程 |
| [About Webhooks](https://docs.github.com/en/webhooks/using-webhooks/creating-webhooks) | Webhook 创建和配置指南 |
