<template>
  <div
    v-if="option.hasSwitch"
    class="action-menu-item item-has-switch oc-p-s oc-flex oc-flex-center"
  >
    <oc-icon :name="option.icon" fill-type="line" size="medium" />
    <oc-switch
      class="oc-ml-s oc-flex oc-width-1-1"
      :checked="option.isChecked.value"
      :class="option.class"
      :label="option.title"
      @update:checked="option.method"
    />
  </div>
  <oc-button
    v-else
    appearance="raw"
    class="oc-p-s action-menu-item"
    :class="option.class"
    :type="option.to ? 'router-link' : 'button'"
    :to="option.to"
    v-bind="option.additionalAttributes || {}"
    @click="option.method"
  >
    <oc-icon :name="option.icon" fill-type="line" size="medium" />
    <span v-text="option.title" />
  </oc-button>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { EditOption } from './EditDropdown.vue'

export default defineComponent({
  name: 'ContextMenuItem',
  props: {
    option: {
      type: Object as PropType<EditOption>,
      required: true
    }
  }
})
</script>
