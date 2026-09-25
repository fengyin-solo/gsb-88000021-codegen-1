import { computed } from 'vue'

import { restorationEnvironment } from '../data/restorationData'
import { useRestorationStore } from '../stores/restorationStore'

const UNASSIGNED_OWNER = '待分配'

export function useRestorationOverview() {
  const { batches, tasks } = useRestorationStore()

  const batchCount = computed(() => batches.value.length)
  const highRiskCount = computed(
    () => tasks.value.filter((item) => item.risk === 'high').length,
  )
  const environmentCount = computed(() => restorationEnvironment.length)
  const ownerCount = computed(
    () =>
      new Set(
        tasks.value
          .map((item) => item.owner)
          .filter((owner) => owner && owner !== UNASSIGNED_OWNER),
      ).size,
  )

  return {
    batchCount,
    highRiskCount,
    environmentCount,
    ownerCount,
  }
}
