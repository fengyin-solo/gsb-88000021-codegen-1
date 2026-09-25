const PAGE_RANGE_PATTERN = /(\d{1,4})\s*[-–—~～]\s*(\d{1,4})/
const PAGE_RANGE_STRICT = /^(\d{1,4})\s*[-–—~～]\s*(\d{1,4})$/
const FIELD_SEPARATOR = /[\s,，、;；|]+/

let rowSequence = 0

function nextRowId() {
  rowSequence += 1
  return `registration-row-${rowSequence}`
}

export function parsePageRange(pages) {
  const match = String(pages ?? '').trim().match(PAGE_RANGE_STRICT)
  if (!match) return null
  return { start: Number(match[1]), end: Number(match[2]) }
}

export function normalizeBatchCode(code) {
  return String(code ?? '').trim().toUpperCase()
}

export function parseBatchRecords(text) {
  return String(text ?? '')
    .split(/\r?\n/)
    .map((line, index) => {
      const row = { id: nextRowId(), lineNo: index + 1, code: '', title: '', pages: '' }
      const trimmed = line.trim()
      if (!trimmed) return row

      let rest = trimmed
      const pageMatch = trimmed.match(PAGE_RANGE_PATTERN)
      if (pageMatch) {
        row.pages = `${pageMatch[1]}-${pageMatch[2]}`
        rest = `${trimmed.slice(0, pageMatch.index)} ${trimmed.slice(pageMatch.index + pageMatch[0].length)}`
      }

      const tokens = rest.split(FIELD_SEPARATOR).filter(Boolean)
      row.code = tokens.shift() ?? ''
      row.title = tokens.join(' ')
      return row
    })
}

export const registrationStatusMeta = {
  ok: { label: '可入库', tone: 'ok' },
  empty: { label: '空记录', tone: 'warn' },
  incomplete: { label: '字段待补', tone: 'warn' },
  reversed: { label: '页别反写', tone: 'error' },
  duplicate: { label: '批次号重复', tone: 'error' },
}

export function validateBatchRows(rows, existingCodes) {
  const archived = new Set(existingCodes.map(normalizeBatchCode))
  const seen = new Set()

  return rows.map((row) => {
    const code = String(row.code ?? '').trim()
    const title = String(row.title ?? '').trim()
    const pages = String(row.pages ?? '').trim()

    if (!code && !title && !pages) {
      return {
        id: row.id,
        status: 'empty',
        messages: ['空记录：请补充批次号、卷名与页别范围，或删除该行。'],
      }
    }

    const messages = []
    if (!code) messages.push('缺少批次号。')
    if (!title) messages.push('缺少卷名。')

    let reversed = false
    if (!pages) {
      messages.push('缺少页别范围。')
    } else {
      const range = parsePageRange(pages)
      if (!range) {
        messages.push('页别范围格式应为「起页-止页」，例如 17-29。')
      } else if (range.start > range.end) {
        reversed = true
        messages.push(`页别反写：起始页 ${range.start} 大于结束页 ${range.end}，请调换后再写入。`)
      }
    }

    let duplicate = false
    if (code) {
      const key = normalizeBatchCode(code)
      if (archived.has(key)) {
        duplicate = true
        messages.push(`批次号 ${code} 已存在于批次档案。`)
      } else if (seen.has(key)) {
        duplicate = true
        messages.push(`批次号 ${code} 在本次登记内容中重复。`)
      }
      seen.add(key)
    }

    let status = 'ok'
    if (messages.length) {
      status = 'incomplete'
      if (reversed) status = 'reversed'
      if (duplicate) status = 'duplicate'
    }

    return { id: row.id, status, messages }
  })
}
