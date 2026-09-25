<script setup>
defineProps({
  items: {
    type: Array,
    required: true,
  },
})

function formatRegisteredAt(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('zh-CN', { hour12: false })
}
</script>

<template>
  <p v-if="!items.length" class="empty">
    暂无批量登记记录。在「批量登记」中粘贴记录并确认写入后，建档结果会保留在这里。
  </p>
  <ul v-else class="log-list">
    <li
      v-for="item in items"
      :key="`${item.code}-${item.registeredAt}`"
      class="log-item"
    >
      <div class="log-main">
        <strong>批次 {{ item.code }}</strong>
        <span>{{ item.title }}</span>
      </div>
      <div class="log-meta">
        <span>页码 {{ item.pages }}</span>
        <time>{{ formatRegisteredAt(item.registeredAt) }}</time>
      </div>
    </li>
  </ul>
</template>

<style scoped>
.empty {
  margin: 0;
  color: #6a5439;
}

.log-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 10px;
}

.log-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border: 1px solid rgba(79, 57, 32, 0.08);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.72);
}

.log-main {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.log-meta {
  display: flex;
  gap: 12px;
  color: #6a5439;
  font-size: 0.82rem;
  white-space: nowrap;
}

@media (max-width: 720px) {
  .log-item {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
