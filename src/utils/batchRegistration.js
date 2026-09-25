export const BATCH_CODE_PATTERN = /^[A-Za-z]{1,4}-\d{1,4}$/

const PAGE_RANGE_PATTERN = /^(\d{1,4})\s*[-–—~～至]\s*(\d{1,4})$/
const SINGLE_PAGE_PATTERN = /^\d{1,4}$/
const TOKEN_SPLIT_PATTERN = /[\s,，、;；|｜]+/

export const ROW_STATUS_META = {
  ready: { label: '可写入', tone: 'ready' },
  empty: { label: '空记录', tone: 'empty' },
  invalid: { label: '待补全', tone: 'invalid' },
  duplicate: { label: '批次重复', tone: 'duplicate' },
  reversed: { label: '页别反写', tone: 'reversed' },
}

export function normalizeBatchCode(code) {
  return String(code ?? '')
    .trim()
    .replace(/[－–—]/g, '-')
    .toUpperCase()
}

export function parsePageRange(value) {
  const text = String(value ?? '').trim()
  if (!text) return null

  const rangeMatch = text.match(PAGE_RANGE_PATTERN)
  if (rangeMatch) {
    const start = Number(rangeMatch[1])
    const end = Number(rangeMatch[2])
    return { start, end, reversed: start > end, label: `${start}-${end}` }
  }

  if (SINGLE_PAGE_PATTERN.test(text)) {
    const page = Number(text)
    return { start: page, end: page, reversed: false, label: `${page}` }
  }

  return null
}

let rowSequence = 0

function createRow(line) {
  rowSequence += 1
  const row = { id: `row-${rowSequence}`, raw: line, code: '', title: '', pages: '' }
  const tokens = line.trim().split(TOKEN_SPLIT_PATTERN).filter(Boolean)
  if (!tokens.length) return row

  const remaining = [...tokens]
  const codeIndex = remaining.findIndex((token) =>
    BATCH_CODE_PATTERN.test(normalizeBatchCode(token)),
  )
  if (codeIndex >= 0) {
    row.code = normalizeBatchCode(remaining.splice(codeIndex, 1)[0])
  }

  const pageIndex = remaining.findIndex((token) => parsePageRange(token))
  if (pageIndex >= 0) {
    row.pages = parsePageRange(remaining.splice(pageIndex, 1)[0]).label
  }

  row.title = remaining.join('')
  return row
}

export function parseRegistrationText(text) {
  return String(text ?? '')
    .split(/\r?\n/)
    .map((line) => createRow(line))
}

function validateRow(row, archivedCodes, pastedCounts) {
  const code = normalizeBatchCode(row.code)
  const title = String(row.title ?? '').trim()
  const pages = String(row.pages ?? '').trim()

  if (!code && !title && !pages) {
    return { status: 'empty', message: '空记录：请补全批次号、卷名与页别范围，或移除该行。' }
  }
  if (!code) {
    return { status: 'invalid', message: '未识别批次号，格式形如 A-03。' }
  }
  if (!BATCH_CODE_PATTERN.test(code)) {
    return { status: 'invalid', message: `批次号「${row.code}」格式不正确，形如 A-03。` }
  }
  if (!title) {
    return { status: 'invalid', message: '缺少卷名。' }
  }

  const range = parsePageRange(pages)
  if (!range) {
    return { status: 'invalid', message: '未识别页别范围，形如 17-29。' }
  }
  if (range.reversed) {
    return { status: 'reversed', message: `页别反写：${range.label} 起页大于止页，请修正或交换。` }
  }
  if (archivedCodes.has(code)) {
    return { status: 'duplicate', message: `批次号 ${code} 已存在于批次档案。` }
  }
  if ((pastedCounts.get(code) ?? 0) > 1) {
    return { status: 'duplicate', message: `批次号 ${code} 在本次记录中重复。` }
  }
  return { status: 'ready', message: '校验通过，确认后写入档案。' }
}

export function validateRegistrationRows(rows, existingCodes) {
  const archivedCodes = new Set(existingCodes.map(normalizeBatchCode))
  const pastedCounts = new Map()
  rows.forEach((row) => {
    const code = normalizeBatchCode(row.code)
    if (code) pastedCounts.set(code, (pastedCounts.get(code) ?? 0) + 1)
  })

  return rows.map((row) => ({ ...row, ...validateRow(row, archivedCodes, pastedCounts) }))
}
