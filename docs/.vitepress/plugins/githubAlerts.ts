import type Plugin from 'markdown-it'
import type { PluginSimple } from 'markdown-it'

/**
 * 将 GitHub 风格的告示块语法转换为 VitePress 兼容的 ::: 容器语法。
 *
 * 转换映射：
 *   > [!NOTE]      →  :::info
 *   > [!TIP]       →  :::tip
 *   > [!WARNING]   →  :::warning
 *   > [!IMPORTANT]  →  :::danger
 *   > [!CAUTION]   →  :::danger
 *
 * 仅在构建时转换，不修改原始 md 文件。
 * 占位符转义已移至 Vite 插件（escapeVueSyntax.ts）中处理。
 */
export const githubAlertsPlugin: PluginSimple = (md: Plugin) => {
  const defaultRender = md.render.bind(md)

  md.render = (src: string, env: any) => {
    const converted = convertGithubAlerts(src)
    return defaultRender(converted, env)
  }
}

const ALERT_TYPES: Record<string, string> = {
  NOTE: 'info',
  TIP: 'tip',
  WARNING: 'warning',
  IMPORTANT: 'danger',
  CAUTION: 'danger',
}

const ALERT_REGEX = /^> \[!(NOTE|TIP|WARNING|IMPORTANT|CAUTION)\]\n((?:> .*\n)*)/gm

function convertGithubAlerts(src: string): string {
  return src.replace(ALERT_REGEX, (_match, type: string, content: string) => {
    const containerType = ALERT_TYPES[type] || 'info'
    const innerContent = content
      .split('\n')
      .filter((line: string) => line.length > 0)
      .map((line: string) => line.replace(/^> /, ''))
      .join('\n')
    return `:::${containerType}\n${innerContent}\n:::\n`
  })
}
