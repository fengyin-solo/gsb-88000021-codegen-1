import { computed, reactive, watch } from 'vue'

import { restorationBatches, restorationTasks } from '../data/restorationData'

const STORAGE_KEY = 'conservation-desk:restoration:v1'

function seedState() {
  return {
    batches: restorationBatches.map((item) => ({ ...item })),
    tasks: restorationTasks.map((item) => ({ ...item })),
    recentRegistrations: [],
  }
}

function loadState() {
  const fallback = seedState()
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return fallback
    const parsed = JSON.parse(raw)
    return {
      batches: Array.isArray(parsed.batches) ? parsed.batches : fallback.batches,
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : fallback.tasks,
      recentRegistrations: Array.isArray(parsed.recentRegistrations)
        ? parsed.recentRegistrations
        : fallback.recentRegistrations,
    }
  } catch (error) {
    return fallback
  }
}

function persistState(value) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
  } catch (error) {
    // 隐私模式等写入失败场景下降级为仅保留内存状态。
  }
}

const state = reactive(loadState())

watch(state, persistState, { deep: true })

function registerBatches(records) {
  const registeredAt = new Date().toISOString()

  records.forEach((record) => {
    state.batches.push({
      code: record.code,
      title: record.title,
      pages: record.pages,
      risk: 'low',
      status: '登记建档',
      note: '批量登记建档，待拍照标注虫蛀起止页。',
    })
    state.tasks.push({
      title: record.title,
      stage: '拍照建档',
      risk: 'low',
      owner: '待分配',
      note: `批次 ${record.code} 批量登记建档，页码 ${record.pages}。`,
    })
  })

  state.recentRegistrations.unshift(
    ...records.map((record) => ({ ...record, registeredAt })),
  )
}

export function useRestorationStore() {
  return {
    batches: computed(() => state.batches),
    tasks: computed(() => state.tasks),
    recentRegistrations: computed(() => state.recentRegistrations),
    registerBatches,
  }
}
