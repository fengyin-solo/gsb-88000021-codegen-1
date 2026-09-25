<script setup>
import { computed, ref } from 'vue'

import { useRestorationStore } from '../../stores/restorationStore'
import {
  parseBatchRecords,
  parsePageRange,
  registrationStatusMeta,
  validateBatchRows,
} from '../../utils/batchRegistration'

const { batches, registerBatches } = useRestorationStore()

const sourceText = ref('')
const rows = ref([])
const feedback = ref('')

const rowResults = computed(() =>
  validateBatchRows(rows.value, batches.value.map((item) => item.code)),
)

const resultById = computed(() => {
  const map = new Map()
  rowResults.value.forEach((result) => map.set(result.id, result))
  return map
})

const readyCount = computed(
  () => rowResults.value.filter((result) => result.status === 'ok').length,
)

function statusMeta(rowId) {
  const result = resultById.value.get(rowId)
  return registrationStatusMeta[result?.status] ?? registrationStatusMeta.incomplete
}

function messagesFor(rowId) {
  return resultById.value.get(rowId)?.messages ?? []
}

function handleParse() {
  if (!sourceText.value.trim()) {
    rows.value = []
    feedback.value = '请先粘贴需要登记的多条记录。'
    return
  }
  rows.value = parseBatchRecords(sourceText.value)
  feedback.value = ''
}

function removeRow(rowId) {
  rows.value = rows.value.filter((row) => row.id !== rowId)
}

function handleConfirm() {
  if (!readyCount.value) return

  const readyIds = new Set(
    rowResults.value
      .filter((result) => result.status === 'ok')
      .map((result) => result.id),
  )
  const records = rows.value
    .filter((row) => readyIds.has(row.id))
    .map((row) => {
      const range = parsePageRange(row.pages)
      return {
        code: row.code.trim(),
        title: row.title.trim(),
        pages: `${range.start}-${range.end}`,
      }
    })

  registerBatches(records)
  rows.value = rows.value.filter((row) => !readyIds.has(row.id))
  if (!rows.value.length) sourceText.value = ''
  feedback.value = `已写入 ${records.length} 条批次建档记录，任务清单与修复总览已同步。`
}
</script>

<template>
  <div class="registration">
    <p class="hint">
      每行粘贴一条记录，依次包含批次号、卷名、页别范围，字段间可用空格、逗号或制表符分隔；页别写作「起页-止页」。示例：<code>D-01 明刻本南华经残卷 3-12</code>
    </p>
    <textarea
      v-model="sourceText"
      rows="5"
      placeholder="D-01 明刻本南华经残卷 3-12&#10;D-02，清抄本曲谱，7-9&#10;D-03 民国印本画谱 15-8"
    ></textarea>
    <div class="toolbar">
      <button type="button" class="btn" @click="handleParse">解析预览</button>
      <span v-if="rows.length" class="summary">
        共 {{ rows.length }} 条，{{ readyCount }} 条可入库
      </span>
    </div>

    <div v-if="rows.length" class="preview">
      <div class="preview-row preview-head">
        <span>行号</span>
        <span>批次号</span>
        <span>卷名</span>
        <span>页别范围</span>
        <span>校验结果</span>
        <span>操作</span>
      </div>
      <div
        v-for="row in rows"
        :key="row.id"
        :class="['preview-row', `preview-row--${statusMeta(row.id).tone}`]"
      >
        <span class="line-no">{{ row.lineNo }}</span>
        <input v-model="row.code" type="text" placeholder="批次号" />
        <input v-model="row.title" type="text" placeholder="卷名" />
        <input v-model="row.pages" type="text" placeholder="如 17-29" />
        <div class="result">
          <span :class="['pill', `pill--${statusMeta(row.id).tone}`]">
            {{ statusMeta(row.id).label }}
          </span>
          <ul v-if="messagesFor(row.id).length">
            <li v-for="message in messagesFor(row.id)" :key="message">{{ message }}</li>
          </ul>
        </div>
        <button type="button" class="btn btn--ghost" @click="removeRow(row.id)">删除</button>
      </div>
    </div>

    <div v-if="rows.length" class="toolbar">
      <button
        type="button"
        class="btn btn--primary"
        :disabled="!readyCount"
        @click="handleConfirm"
      >
        确认写入 {{ readyCount }} 条
      </button>
      <span class="summary">存在问题的记录会留在列表中，可继续修改后再次写入。</span>
    </div>
    <p v-if="feedback" class="feedback">{{ feedback }}</p>
  </div>
</template>

<style scoped>
.registration {
  display: grid;
  gap: 14px;
}

.hint {
  margin: 0;
  color: #6a5439;
  font-size: 0.88rem;
}

.hint code {
  padding: 2px 8px;
  border-radius: 8px;
  background: #efe2ca;
  color: #775936;
}

textarea {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid rgba(79, 57, 32, 0.16);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.85);
  font: inherit;
  color: inherit;
  resize: vertical;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}

.summary {
  color: #6a5439;
  font-size: 0.86rem;
}

.btn {
  padding: 9px 18px;
  border: 1px solid rgba(109, 80, 40, 0.35);
  border-radius: 999px;
  background: #f4ebda;
  color: #5c4a33;
  font: inherit;
  cursor: pointer;
}

.btn--primary {
  background: #6d5028;
  border-color: transparent;
  color: #f8f1e4;
}

.btn--ghost {
  padding: 6px 12px;
  background: transparent;
}

.btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.preview {
  overflow: hidden;
  border: 1px solid rgba(79, 57, 32, 0.1);
  border-radius: 18px;
}

.preview-row {
  display: grid;
  grid-template-columns: 44px 0.9fr 1.4fr 0.9fr 1.6fr 64px;
  gap: 10px;
  align-items: start;
  padding: 12px 14px;
  background: rgba(255, 255, 255, 0.72);
}

.preview-row + .preview-row {
  border-top: 1px solid rgba(79, 57, 32, 0.08);
}

.preview-head {
  background: #efe1c6;
  color: #775936;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.76rem;
  align-items: center;
}

.preview-row--warn {
  background: rgba(246, 229, 185, 0.35);
}

.preview-row--error {
  background: rgba(239, 208, 201, 0.35);
}

.line-no {
  padding-top: 8px;
  color: #6a5439;
  font-size: 0.84rem;
}

input {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid rgba(79, 57, 32, 0.18);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.9);
  font: inherit;
  color: inherit;
}

.result {
  display: grid;
  gap: 6px;
  justify-items: start;
}

.result ul {
  margin: 0;
  padding-left: 18px;
  color: #6a5439;
  font-size: 0.8rem;
}

.pill {
  padding: 5px 10px;
  border-radius: 999px;
  font-size: 0.76rem;
}

.pill--ok {
  background: #d9ead9;
  color: #366338;
}

.pill--warn {
  background: #f6e5b9;
  color: #8b6314;
}

.pill--error {
  background: #efd0c9;
  color: #913d2f;
}

.feedback {
  margin: 0;
  color: #366338;
}

@media (max-width: 900px) {
  .preview {
    overflow-x: auto;
  }

  .preview-row {
    min-width: 860px;
  }
}
</style>
