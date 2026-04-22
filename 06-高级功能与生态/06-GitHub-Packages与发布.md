# GitHub Packages 与发布

> 将包管理、容器镜像和 Release 分发统一在 GitHub 平台，从构建到交付一站式完成。

## 概述

GitHub Packages 是 GitHub 内置的包托管服务，支持 npm、Maven、Gradle、NuGet、RubyGems 等主流包管理器，以及 Docker 和 OCI 容器镜像。它与 GitHub 仓库深度集成——包的版本历史、下载统计和权限管理都直接关联到仓库，无需额外配置第三方 Registry。

结合 GitHub Release 功能，你可以形成完整的交付流水线：代码提交触发 CI 构建，构建产物自动发布为 Package 或 Container Image，同时创建 Release 并附带变更日志。整个过程无需离开 GitHub 生态。

> [!NOTE]
> GitHub Packages 对公开仓库免费且不限量。私有仓库的 Package 根据账户类型有不同的免费额度：
> GitHub Free 账户包含 500 MB Packages 存储和 1 GB 数据传输（每月），
> GitHub Pro/Team/Enterprise 提供更高的免费额度。

## 核心操作

### npm 包发布

1. 配置 `.npmrc` 文件指向 GitHub npm Registry：

```bash
# 在项目根目录创建 .npmrc
echo "@OWNER:registry=https://npm.pkg.github.com" > .npmrc
```

2. 在 `package.json` 中确保仓库名称包含作用域：

```json
{
  "name": "@OWNER/your-package",
  "version": "1.0.0",
  "description": "你的包描述",
  "repository": {
    "type": "git",
    "url": "git://github.com/OWNER/your-package.git"
  }
}
```

3. 认证并发布：

```bash
# 使用 Personal Access Token 登录 GitHub npm Registry
npm login --scope=@OWNER --registry=https://npm.pkg.github.com

# 发布包
npm publish
```

4. 安装已发布的包：

```bash
# 在另一个项目中安装
npm install @OWNER/your-package
```

### Container Registry 使用

GitHub Container Registry（ghcr.io）支持 Docker 和 OCI 镜像：

```bash
# 登录 GitHub Container Registry
echo <your-token> | docker login ghcr.io -u USERNAME --password-stdin

# 构建镜像并打标签
docker build -t ghcr.io/OWNER/IMAGE_NAME:latest .

# 推送镜像
docker push ghcr.io/OWNER/IMAGE_NAME:latest

# 拉取镜像
docker pull ghcr.io/OWNER/IMAGE_NAME:latest

# 推送特定版本标签
docker tag ghcr.io/OWNER/IMAGE_NAME:latest ghcr.io/OWNER/IMAGE_NAME:v1.2.0
docker push ghcr.io/OWNER/IMAGE_NAME:v1.2.0
```

管理 Container Package 的可见性：

1. 前往仓库页面，点击右侧 **Packages** 区域。
2. 点击目标 Package 进入详情页。
3. 点击 **Package settings**。
4. 在 **Danger Zone** 区域修改可见性（Public 或 Private）。

### Maven 包发布

Java 项目可以通过 Gradle 或 Maven 发布到 GitHub Packages：

**Gradle 配置**（`build.gradle`）：

```groovy
plugins {
    id 'maven-publish'
}

publishing {
    repositories {
        maven {
            name = "GitHubPackages"
            url = uri("https://maven.pkg.github.com/OWNER/REPOSITORY")
            credentials {
                username = project.findProperty("gpr.user") ?: System.getenv("USERNAME")
                password = project.findProperty("gpr.key") ?: System.getenv("TOKEN")
            }
        }
    }
    publications {
        gpr(MavenPublication) {
            from(components.java)
        }
    }
}
```

发布和安装：

```bash
# 发布
./gradlew publish

# 安装——在消费项目的 build.gradle 中添加仓库
repositories {
    maven {
        url = uri("https://maven.pkg.github.com/OWNER/REPOSITORY")
        credentials {
            username = System.getenv("USERNAME")
            password = System.getenv("TOKEN")
        }
    }
}
```

### 通过 GitHub Actions 自动发布

将 Package 发布集成到 CI/CD 流水线中，实现全自动交付：

**npm 包自动发布**：

```yaml
name: Publish npm Package
on:
  release:
    types: [published]

jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://npm.pkg.github.com'
      - run: npm ci
      - run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

**容器镜像自动发布**：

```yaml
name: Publish Container Image
on:
  push:
    branches: [main]
    tags: ['v*']

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4

      - name: 登录 GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: 提取 Docker 元数据
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ghcr.io/${{ github.repository }}
          tags: |
            type=ref,event=branch
            type=semver,pattern={{version}}
            type=sha

      - name: 构建并推送
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
```

> [!TIP]
> Actions 中的 `GITHUB_TOKEN` 自动拥有 Package 读写权限。你只需要在 Workflow 中声明
> `permissions: packages: write` 即可，无需额外创建 Token。

### 创建 Release

Release 是向用户分发软件版本的标准方式：

1. 在仓库页面点击右侧 **Releases** → **Create a new release**。
2. 点击 **Choose a tag**，输入新版本号（如 `v1.2.0`）并创建标签。
3. 填写 Release 标题和说明。
4. 点击 **Generate release notes** 自动生成变更日志。
5. 可选：上传编译产物作为附件。
6. 选择 **Set as latest release** 后点击 **Publish release**。

使用 CLI 管理 Release：

```bash
# 创建 Release
gh release create v1.2.0 --title "v1.2.0" --notes "## 新功能
- 添加用户注册
- 优化搜索性能

## 修复
- 修复登录超时问题"

# 自动生成 Release Notes
gh release create v1.2.0 --generate-notes

# 上传附件
gh release upload v1.2.0 ./dist/app-linux-amd64 ./dist/app-darwin-arm64

# 下载 Release 资源
gh release download v1.2.0 --output ./downloads

# 列出所有 Release
gh release list --limit 10

# 删除 Release
gh release delete v1.2.0 --yes
```

## 进阶技巧

### 自动化 Release 工作流

结合 Conventional Commits 自动化版本发布：

```yaml
name: Auto Release
on:
  push:
    branches: [main]

jobs:
  release:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: 分析提交信息决定版本
        id: version
        run: |
          LAST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "")
          if [ -z "$LAST_TAG" ]; then
            echo "version=v1.0.0" >> $GITHUB_OUTPUT
          else
            # 检查是否有 feat 或 fix 提交
            COMMITS=$(git log ${LAST_TAG}..HEAD --oneline)
            if echo "$COMMITS" | grep -q "feat"; then
              # Minor 版本升级
              echo "version=$(echo $LAST_TAG | awk -F. '{$2+=1;$3=0}1' OFS=. | sed 's/v//')" >> $GITHUB_OUTPUT
            elif echo "$COMMITS" | grep -q "fix"; then
              # Patch 版本升级
              echo "version=$(echo $LAST_TAG | awk -F. '{$3+=1}1' OFS=. | sed 's/v//')" >> $GITHUB_OUTPUT
            fi
          fi

      - name: 创建 Release
        if: steps.version.outputs.version != ''
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          gh release create v${{ steps.version.outputs.version }} \
            --generate-notes \
            --title "v${{ steps.version.outputs.version }}"
```

### Package 版本管理与清理

随着版本迭代，旧的 Package 版本会占用大量存储空间。定期清理可以控制成本：

```bash
# 列出包的所有版本
gh api repos/OWNER/REPO/packages/npm/@OWNER/PACKAGE-NAME/versions \
  --jq '.[] | "\(.id) \(.version) \(.created_at)"'

# 删除特定版本
gh api repos/OWNER/REPO/packages/npm/@OWNER/PACKAGE-NAME/versions/<version-id> \
  --method DELETE
```

> [!WARNING]
> 已删除的 Package 版本不可恢复。确保没有任何项目依赖该版本后再执行删除。
> 推荐保留最新的稳定版本和所有主要版本的最新修订版。

### 多架构容器镜像构建

使用 Docker Buildx 构建多架构（amd64/arm64）镜像：

```yaml
- name: 设置 Docker Buildx
  uses: docker/setup-buildx-action@v3

- name: 构建并推送多架构镜像
  uses: docker/build-push-action@v5
  with:
    context: .
    platforms: linux/amd64,linux/arm64
    push: true
    tags: |
      ghcr.io/${{ github.repository }}:latest
      ghcr.io/${{ github.repository }}:${{ github.ref_name }}
    cache-from: type=gha
    cache-to: type=gha,mode=max
```

### Package 权限精细控制

对于组织内的 Package，可以配置精细的访问权限：

1. 进入 Package 页面 → **Package settings**。
2. 在 **Manage Actions access** 中关联仓库。
3. 在 **Danger Zone** 中配置谁可以拉取：
   - **Public**——所有人可拉取。
   - **Inherit access from repository**——与关联仓库的权限一致。
   - **Select organizations or users**——指定可访问的团队或个人。

### Release Notes 自定义模板

GitHub 支持自定义 Release Notes 模板。在仓库中创建 `.github/release.yml`：

```yaml
changelog:
  exclude:
    labels:
      - ignore-for-release
      - dependencies
  categories:
    - title: "🚀 新功能"
      labels:
        - feature
        - enhancement
    - title: "🐛 Bug 修复"
      labels:
        - bug
        - fix
    - title: "🔧 维护"
      labels:
        - maintenance
        - refactor
    - title: "其他变更"
      labels:
        - "*"
```

## 常见问题

### Q: npm publish 报 401 认证错误怎么办？

检查以下几点：`.npmrc` 中的 Registry 地址是否正确（`https://npm.pkg.github.com`）；
Token 是否有 `write:packages` 权限；`package.json` 中的包名是否以 `@OWNER/` 为作用域前缀；
是否执行了 `npm login` 或通过环境变量提供了 `NODE_AUTH_TOKEN`。

### Q: Container Image 推送报 403 错误？

确保：Token 有 `write:packages` 权限；镜像标签以 `ghcr.io/OWNER/` 开头；
已成功执行 `docker login ghcr.io`；如果使用 Actions，确认 `permissions` 中包含
`packages: write`。新创建的 Container Package 默认为 Private，可在 Package 设置中修改。

### Q: 如何删除一个 Package？

前往 Package 页面 → Package settings → Danger Zone → Delete this package。
删除 Package 会移除所有版本和下载统计，不可恢复。如果你只想删除特定版本，
在 Package 版本列表中找到对应版本并删除。

### Q: 私有仓库的 Package 可以让外部用户访问吗？

可以。在 Package 设置中将可见性设为 Public（对于 Container Image），或通过
"Manage Actions access" 将 Package 关联到一个公开仓库，让公开仓库的 Workflow
可以拉取该 Package。对于 npm/Maven 等，可以单独设置 Package 的访问权限。

### Q: Release 和 Tag 有什么关系？

Release 基于 Git Tag 创建，但比 Tag 多了标题、说明、附件和发布状态。
你可以把 Release 理解为"增强版 Tag"。创建 Release 时如果 Tag 不存在，
GitHub 会自动创建。Release 的附件（如编译好的二进制文件）是 Tag 不具备的功能。

### Q: 如何在 Release 中上传大文件？

单个附件的大小限制为 2 GB。如果需要分发更大的文件，建议使用 Container Registry
托管镜像，或使用外部存储服务（如 S3）并在 Release Notes 中提供下载链接。
GitHub Release 适合分发编译产物、安装包和校验文件。

### Q: GitHub Packages 和其他 Registry（npmjs.com、Docker Hub）可以同时使用吗？

可以。很多项目同时在多个 Registry 发布。例如，npm 包同时发布到 npmjs.com（面向公众）
和 GitHub Packages（面向内部团队）。你可以在 CI 中配置多个发布步骤，分别推送到不同的 Registry。

### Q: 如何查看 Package 的下载统计？

进入 Package 页面，可以看到总下载量和按版本分类的下载统计。你也可以通过 API 获取：

```bash
gh api repos/OWNER/REPO/packages/container/PACKAGE-NAME \
  --jq '{name: .name, downloads: .statistics.downloads}'
```

## 参考链接

| 标题 | 说明 |
|------|------|
| [GitHub Packages Documentation](https://docs.github.com/packages) | 官方完整文档 |
| [Publishing a Package](https://docs.github.com/en/packages/learn-github-packages/publishing-a-package) | 包发布教程 |
| [Working with a GitHub Packages Registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry) | Registry 使用指南 |
| [Working with the Container Registry](https://docs.github.com/packages/working-with-a-github-packages-registry/working-with-the-container-registry) | Container Registry 详解 |
| [Publishing and Installing with GitHub Actions](https://docs.github.com/en/packages/managing-github-packages-using-github-actions-workflows/publishing-and-installing-a-package-with-github-actions) | Actions 集成发布 |
| [About Releases](https://docs.github.com/repositories/releasing-projects-on-github/about-releases) | Release 概念介绍 |
| [Managing Releases in a Repository](https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository) | Release 管理操作 |
