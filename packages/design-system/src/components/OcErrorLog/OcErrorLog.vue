<template>
  <div class="oc-error-log">
    <oc-textarea
      class="oc-error-log-textarea oc-mt-s oc-text-small"
      :label="contentLabel"
      :model-value="content"
      rows="4"
      readonly
    />
    <div class="oc-flex oc-flex-between oc-mt-s">
      <div class="oc-flex">
        <div v-if="showCopied" class="oc-flex oc-flex-middle">
          <oc-icon name="checkbox-circle" />
          <p class="oc-error-log-content-copied oc-ml-s oc-my-rm" v-text="$gettext('Copied')" />
        </div>
      </div>
      <oc-button size="small" appearance="filled" @click="copyContentToClipboard">
        {{ $gettext('Copy') }}
      </oc-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useGettext } from 'vue3-gettext'

export interface Props {
  /**
   * @docs The content to be displayed in the error log.
   */
  content: string
}

const { content } = defineProps<Props>()

const { $gettext } = useGettext()
const showCopied = ref(false)

const contentLabel = computed(() => {
  return $gettext(
    'Copy the following information and pass them to technical support to troubleshoot the problem:'
  )
})

const copyContentToClipboard = () => {
  navigator.clipboard.writeText(content)
  showCopied.value = true
  setTimeout(() => (showCopied.value = false), 1500)
}
</script>

<style lang="scss">
.oc-error-log {
  &-textarea {
    resize: none;
  }
}
</style>
