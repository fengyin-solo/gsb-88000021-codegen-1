<script setup>
defineProps({
  items: {
    type: Array,
    required: true,
  },
})

function formatTime(iso) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString('zh-CN', { hour12: false })
}
</script>

<template>
  <p v-if="!items.length" class="empty">
    暂无登记记录，粘贴多条记录并确认写入后会在此呈现建档结果。
  </p>
  <ul v-else class="registration-list">
    <li v-for="item in items" :key="item.id">
      <div class="summary">
        <strong>批次 {{ item.code }}</strong>
        <span>{{ item.title }}</span>
        <small>页码：{{ item.pages }}</small>
      </div>
      <div class="meta">
        <span class="result-pill">{{ item.message }}</span>
        <time>{{ formatTime(item.time) }}</time>
      </div>
    </li>
  </ul>
</template>

<style scoped>
.empty {
  margin: 0;
  color: #6a5439;
}

.registration-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 12px;
}

li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 14px 16px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(79, 57, 32, 0.08);
}

.summary {
  display: grid;
  gap: 4px;
}

.summary span,
.summary small,
time {
  color: #6a5439;
}

.meta {
  display: grid;
  gap: 6px;
  justify-items: end;
  white-space: nowrap;
}

.result-pill {
  padding: 6px 10px;
  border-radius: 999px;
  background: #d9ead9;
  color: #366338;
  font-size: 0.78rem;
}

time {
  font-size: 0.8rem;
}

@media (max-width: 680px) {
  li {
    flex-direction: column;
    align-items: flex-start;
  }

  .meta {
    justify-items: start;
  }
}
</style>
