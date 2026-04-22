# 贡献指南

感谢你对 GitHub 完全指南的贡献！本仓库是一个开源知识课程，每一份贡献都在帮助更多人挖掘 GitHub 的全部潜力。

## 如何贡献

### 修正与补充

1. Fork 本仓库
2. 创建分支：`git checkout -b fix/your-topic`
3. 提交修改，遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范
4. 提交 Pull Request，描述修改内容与原因

### 新增专题

1. 先通过 Issue 讨论你计划新增的专题
2. 获得维护者确认后，按照现有章节的格式撰写
3. 提交 PR 并关联原始 Issue

## 写作规范

- **语言**：中文为主，技术术语保留英文原文（如 Pull Request、Workflow、CodeQL）
- **格式**：使用 GFM（GitHub Flavored Markdown），善用告示语法（`> [!NOTE]`、`> [!TIP]`、`> [!WARNING]`）
- **结构**：每个专题文件包含——概述、核心操作、进阶技巧、常见问题、参考链接
- **截图**：放置于 `assets/images/` 下，使用相对路径引用
- **图解**：放置于 `assets/diagrams/` 下

## 提交信息格式

```
type(scope): description

类型：feat（新增内容）、fix（修正错误）、docs（文档调整）、refactor（重构结构）
范围：章节编号或功能模块
```

示例：
- `feat(03): 添加矩阵构建策略章节`
- `fix(02): 修正 PR 合并策略描述`
- `docs: 更新学习路线图`

## 代码审查

所有 PR 需要至少一位维护者审查通过后方可合并。
