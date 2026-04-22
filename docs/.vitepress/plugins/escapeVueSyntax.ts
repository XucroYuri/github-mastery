import type { Plugin } from 'vite'

/**
 * Vite 插件：在 Vue SFC 编译前转义 .md 文件中的 Vue 模板语法和占位符。
 *
 * 问题 1: GitHub Actions 表达式使用 ${{ }} 语法（如 ${{ github.sha }}），
 *         被 Vue 模板编译器误认为模板插值。
 * 问题 2: 课程文件中大量使用 <placeholder> 占位符（如 <name>、<branch-name>），
 *         被 Vue 误认为 HTML 标签。
 *
 * 本插件在 Vue 编译前处理这些语法，避免编译失败。
 * 仅在构建时生效，不修改原始 md 文件。
 */
export function escapeVueSyntaxPlugin(): Plugin {
  return {
    name: 'escape-vue-syntax',
    enforce: 'pre',
    transform(code, id) {
      if (!id.endsWith('.md')) return null

      let result = code

      // 1. 转义 {{ }} — Vue 模板插值语法
      result = result.replace(/\{\{/g, '\\{\\{')
      result = result.replace(/\}\}/g, '\\}\\}')

      // 2. 转义非代码块中的 <placeholder> 占位符
      result = escapePlaceholders(result)

      return result
    },
  }
}

// 常见合法 HTML 标签
const KNOWN_HTML_TAGS = new Set([
  'a', 'abbr', 'address', 'area', 'article', 'aside', 'audio',
  'b', 'base', 'blockquote', 'body', 'br', 'button',
  'canvas', 'caption', 'cite', 'code', 'col', 'colgroup',
  'data', 'datalist', 'dd', 'del', 'details', 'dialog', 'div', 'dl', 'dt',
  'em', 'embed',
  'fieldset', 'figcaption', 'figure', 'footer', 'form',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'head', 'header', 'hr', 'html',
  'i', 'iframe', 'img', 'input', 'ins',
  'kbd',
  'label', 'legend', 'li', 'link',
  'main', 'map', 'mark', 'meta', 'meter',
  'nav',
  'object', 'ol', 'optgroup', 'option', 'output',
  'p', 'param', 'picture', 'pre', 'progress',
  'q',
  's', 'samp', 'script', 'section', 'select', 'slot', 'small', 'source',
  'span', 'strong', 'style', 'sub', 'summary', 'sup', 'svg',
  'table', 'tbody', 'td', 'template', 'textarea', 'tfoot', 'th', 'thead',
  'time', 'title', 'tr', 'track',
  'u', 'ul',
  'video',
  'wbr',
])

function escapePlaceholders(src: string): string {
  const lines = src.split('\n')
  const result: string[] = []
  let inCodeBlock = false

  for (const line of lines) {
    if (line.trimStart().startsWith('```')) {
      inCodeBlock = !inCodeBlock
      result.push(line)
      continue
    }

    if (inCodeBlock) {
      result.push(line)
      continue
    }

    // 在非代码行中，转义不对应已知 HTML 标签的 <...> 模式
    // 但保留行内代码 (`...`) 中的内容
    result.push(escapeLinePlaceholders(line))
  }

  return result.join('\n')
}

function escapeLinePlaceholders(line: string): string {
  const segments = splitPreservingDelimiters(line, /`[^`]+`/g)
  return segments.map((seg) => {
    if (seg.startsWith('`')) return seg
    return seg.replace(/<(\/?)([\w][\w-]*)(\s[^>]*)?\/?>/g, (match, _slash: string, tag: string) => {
      if (KNOWN_HTML_TAGS.has(tag.toLowerCase())) {
        return match
      }
      return match.replace(/</g, '\\<').replace(/>/g, '\\>')
    })
  }).join('')
}

function splitPreservingDelimiters(str: string, regex: RegExp): string[] {
  const result: string[] = []
  let lastIndex = 0
  let m: RegExpExecArray | null
  const re = new RegExp(regex.source, regex.flags)
  while ((m = re.exec(str)) !== null) {
    if (m.index > lastIndex) {
      result.push(str.slice(lastIndex, m.index))
    }
    result.push(m[0])
    lastIndex = re.lastIndex
  }
  if (lastIndex < str.length) {
    result.push(str.slice(lastIndex))
  }
  return result
}
