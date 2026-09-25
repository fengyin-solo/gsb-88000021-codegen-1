<script setup>
import { computed, ref } from 'vue'

import { useBatchRegistry } from '../../composables/useBatchRegistry'
import {
  ROW_STATUS_META,
  parsePageRange,
  parseRegistrationText,
  validateRegistrationRows,
} from '../../utils/batchRegistration'

const { existingCodes, registerBatches } = useBatchRegistry()

const rawText = ref('')
const rows = ref([])

const validatedRows = computed(() =>
  validateRegistrationRows(rows.value, existingCodes.value),
)
const validationById = computed(() => {
  const map = new Map()
  validatedRows.value.forEach((row) => map.set(row.id, row))
  return map
})
const readyCount = computed(
  () => validatedRows.value.filter((row) => row.status === 'ready').length,
)
const pendingCount = computed(() => rows.value.length - readyCount.value)

function statusOf(row) {
  return validationById.value.get(row.id) ?? { status: 'empty', message: '' }
}

function statusMeta(row) {
  return ROW_STATUS_META[statusOf(row).status]
}

function parsePreview() {
  if (!rawText.value.trim()) return
  rows.value = parseRegistrationText(rawText.value)
}

function resetDraft() {
  rawText.value = ''
  rows.value = []
}

function removeRow(id) {
  rows.value = rows.value.filter((row) => row.id !== id)
}

function swapPages(row) {
  const range = parsePageRange(row.pages)
  if (!range || !range.reversed) return
  row.pages = `${range.end}-${range.start}`
}

function confirmWrite() {
  const readyRows = validatedRows.value.filter((row) => row.status === 'ready')
  if (!readyRows.length) return

  registerBatches(readyRows)

  const writtenIds = new Set(readyRows.map((row) => row.id))
  rows.value = rows.value.filter((row) => !writtenIds.has(row.id))
  if (!rows.value.length) {
    rawText.value = ''
  }
}
</script>

<template>
  <div class="registration">
    <p class="hint">
      每行一条记录，依次识别批次号、卷名、页别范围，字段间可用逗号、空格或制表符分隔。
    </p>
    <textarea
      v-model="rawText"
      rows="5"
      placeholder="D-05，清稿本诗集，3-12&#10;E-01 民国方志抄稿 22-31"
    ></textarea>
    <div class="actions">
      <button type="button" class="primary" @click="parsePreview">解析预览</button>
      <button v-if="rows.length" type="button" class="ghost" @click="resetDraft">
        清空草稿
      </button>
    </div>

    <div v-if="rows.length" class="preview">
      <div class="preview-row preview-head">
        <span>批次号</span>
        <span>卷名</span>
        <span>页别范围</span>
        <span>逐条结果</span>
        <span>操作</span>
      </div>
      <div
        v-for="row in rows"
        :key="row.id"
        :class="['preview-row', `is-${statusOf(row).status}`]"
      >
        <input v-model="row.code" placeholder="A-03" />
        <input v-model="row.title" placeholder="卷名" />
        <input v-model="row.pages" placeholder="17-29" />
        <span class="row-result">
          <span :class="['status-pill', `status-pill--${statusMeta(row).tone}`]">
            {{ statusMeta(row).label }}
          </span>
          <small>{{ statusOf(row).message }}</small>
        </span>
        <span class="row-actions">
          <button
            v-if="statusOf(row).status === 'reversed'"
            type="button"
            class="ghost"
            @click="swapPages(row)"
          >
            交换页码
          </button>
          <button type="button" class="ghost" @click="removeRow(row.id)">移除</button>
        </span>
      </div>
      <div class="confirm-bar">
        <span>可写入 {{ readyCount }} 条，待修正 {{ pendingCount }} 条。</span>
        <button
          type="button"
          class="primary"
          :disabled="readyCount === 0"
          @click="confirmWrite"
        >
          确认写入
        </button>
      </div>
    </div>
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
  font-size: 0.9rem;
}

textarea {
  width: 100%;
  padding: 14px;
  border-radius: 14px;
  border: 1px solid rgba(79, 57, 32, 0.18);
  background: rgba(255, 255, 255, 0.82);
  font: inherit;
  resize: vertical;
}

.actions {
  display: flex;
  gap: 10px;
}

button {
  font: inherit;
  cursor: pointer;
  border-radius: 999px;
  border: 1px solid transparent;
  padding: 9px 18px;
}

button.primary {
  background: #5d4322;
  color: #fff8eb;
}

button.primary:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

button.ghost {
  background: rgba(255, 255, 255, 0.72);
  border-color: rgba(79, 57, 32, 0.18);
  color: #6a5439;
  padding: 6px 12px;
  font-size: 0.84rem;
}

.preview {
  display: grid;
  border: 1px solid rgba(79, 57, 32, 0.1);
  border-radius: 18px;
  overflow: hidden;
}

.preview-row {
  display: grid;
  grid-template-columns: 0.7fr 1.2fr 0.7fr 1.6fr 0.9fr;
  gap: 12px;
  align-items: center;
  padding: 12px 14px;
  background: rgba(255, 255, 255, 0.72);
}

.preview-row + .preview-row {
  border-top: 1px solid rgba(79, 57, 32, 0.08);
}

.preview-head {
  background: #efe1c6;
  color: #775936;
  font-size: 0.76rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.preview-row.is-duplicate,
.preview-row.is-reversed {
  background: rgba(246, 229, 185, 0.35);
}

.preview-row.is-invalid,
.preview-row.is-empty {
  background: rgba(239, 208, 201, 0.28);
}

input {
  width: 100%;
  font: inherit;
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid rgba(79, 57, 32, 0.18);
  background: rgba(255, 255, 255, 0.9);
}

.row-result {
  display: grid;
  gap: 4px;
}

.row-result small {
  color: #6a5439;
}

.status-pill {
  width: fit-content;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.76rem;
}

.status-pill--ready {
  background: #d9ead9;
  color: #366338;
}

.status-pill--empty {
  background: #e7e0d4;
  color: #6f6353;
}

.status-pill--invalid {
  background: #efd0c9;
  color: #913d2f;
}

.status-pill--duplicate,
.status-pill--reversed {
  background: #f6e5b9;
  color: #8b6314;
}

.row-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.confirm-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-top: 1px solid rgba(79, 57, 32, 0.08);
  background: rgba(255, 251, 245, 0.9);
  color: #6a5439;
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
