<script setup>
import PanelSection from '../components/common/PanelSection.vue'
import BatchGrid from '../components/restoration/BatchGrid.vue'
import BatchRegistrationPanel from '../components/restoration/BatchRegistrationPanel.vue'
import RecentRegistrations from '../components/restoration/RecentRegistrations.vue'
import { useBatchRegistry } from '../composables/useBatchRegistry'

const { batches, registrations } = useBatchRegistry()
</script>

<template>
  <div class="view-stack">
    <PanelSection title="批量登记" badge="粘贴识别">
      <BatchRegistrationPanel />
    </PanelSection>

    <PanelSection title="批次档案" badge="修复对象">
      <BatchGrid :items="batches" />
    </PanelSection>

    <PanelSection title="最近登记" badge="建档结果">
      <RecentRegistrations :items="registrations" />
    </PanelSection>
  </div>
</template>

<style scoped>
.view-stack {
  display: grid;
  gap: 24px;
}
</style>
