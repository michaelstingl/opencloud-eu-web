<template>
  <div v-if="isLoading" id="oc-loading-indicator" class="oc-width-1-1">
    <oc-progress
      :max="100"
      :indeterminate="currentProgress === null"
      :value="currentProgress"
      size="small"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, onBeforeUnmount, onMounted, ref } from 'vue'
import { eventBus, LoadingEventTopics } from '../services'
import { useLoadingService } from '../composables'

export default defineComponent({
  name: 'LoadingIndicator',
  setup() {
    const loadingService = useLoadingService()
    let addLoadingEventToken: string
    let removeLoadingEventToken: string
    let setProgressToken: string

    const isLoading = ref(loadingService.isLoading)
    const currentProgress = ref(loadingService.currentProgress)

    const updateLoadingState = () => {
      currentProgress.value = loadingService.currentProgress
      isLoading.value = loadingService.isLoading
    }
    const setProgress = () => {
      currentProgress.value = loadingService.currentProgress
    }

    onMounted(() => {
      addLoadingEventToken = eventBus.subscribe(LoadingEventTopics.add, updateLoadingState)
      removeLoadingEventToken = eventBus.subscribe(LoadingEventTopics.remove, updateLoadingState)
      setProgressToken = eventBus.subscribe(LoadingEventTopics.setProgress, setProgress)
    })

    onBeforeUnmount(() => {
      eventBus.unsubscribe(LoadingEventTopics.add, addLoadingEventToken)
      eventBus.unsubscribe(LoadingEventTopics.remove, removeLoadingEventToken)
      eventBus.unsubscribe(LoadingEventTopics.setProgress, setProgressToken)
    })

    return { isLoading, currentProgress }
  }
})
</script>
<style lang="scss">
#oc-loading-indicator {
  .oc-progress {
    background-color: transparent;
    height: 2px;

    &-indeterminate-first {
      animation-duration: 4s;
    }

    &-indeterminate-second {
      animation-duration: 4s;
      animation-delay: 1s;
    }
  }
}
</style>
