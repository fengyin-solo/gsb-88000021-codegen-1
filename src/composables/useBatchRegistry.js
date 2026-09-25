import { computed, reactive, watch } from 'vue'

import { restorationBatches, restorationTasks } from '../data/restorationData'
import { normalizeBatchCode, parsePageRange } from '../utils/batchRegistration'

const STORAGE_KEY = 'conservation-desk.registry.v1'

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function loadState() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed?.batches) || !Array.isArray(parsed?.tasks)) return null
    return {
      batches: parsed.batches,
      tasks: parsed.tasks,
      registrations: Array.isArray(parsed.registrations) ? parsed.registrations : [],
    }
  } catch {
    return null
  }
}

function persistState(state) {
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        batches: state.batches,
        tasks: state.tasks,
        registrations: state.registrations,
      }),
    )
  } catch {
    // 存储不可用时静默降级，页面内状态仍然有效。
  }
}

const state = reactive(
  loadState() ?? {
    batches: clone(restorationBatches),
    tasks: clone(restorationTasks),
    registrations: [],
  },
)

watch(state, persistState, { deep: true })

export function useBatchRegistry() {
  const existingCodes = computed(() =>
    state.batches.map((batch) => normalizeBatchCode(batch.code)),
  )

  function registerBatches(readyRows) {
    const writtenAt = new Date().toISOString()

    readyRows.forEach((row, index) => {
      const range = parsePageRange(row.pages)
      const batch = {
        code: normalizeBatchCode(row.code),
        title: String(row.title).trim(),
        pages: range.label,
        risk: 'low',
        status: '已建档',
        note: '批量登记建档，待评估虫蛀等级。',
      }

      state.batches.push(batch)
      state.tasks.push({
        title: batch.title,
        stage: '已建档',
        risk: 'low',
        owner: '待分配',
        note: `批次 ${batch.code} 建档，等待评估与派工。`,
      })
      state.registrations.unshift({
        id: `registration-${Date.now()}-${index}`,
        code: batch.code,
        title: batch.title,
        pages: batch.pages,
        message: '建档成功，已同步任务清单。',
        time: writtenAt,
      })
    })
  }

  return {
    batches: state.batches,
    tasks: state.tasks,
    registrations: state.registrations,
    existingCodes,
    registerBatches,
  }
}
