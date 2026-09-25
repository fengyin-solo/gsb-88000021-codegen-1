import { computed } from 'vue'

import { restorationEnvironment } from '../data/restorationData'
import { useBatchRegistry } from './useBatchRegistry'

export function useRestorationOverview() {
  const { batches, tasks } = useBatchRegistry()

  const batchCount = computed(() => batches.length)
  const highRiskCount = computed(
    () => tasks.filter((item) => item.risk === 'high').length,
  )
  const environmentCount = computed(() => restorationEnvironment.length)
  const ownerCount = computed(() => new Set(tasks.map((item) => item.owner)).size)

  return {
    batchCount,
    highRiskCount,
    environmentCount,
    ownerCount,
  }
}
