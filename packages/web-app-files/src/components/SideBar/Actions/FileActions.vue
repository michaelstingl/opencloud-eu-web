<template>
  <oc-list id="oc-files-actions-sidebar" class="oc-mt-s">
    <action-menu-item
      v-for="(action, index) in actions"
      :key="`action-${index}`"
      :action="action"
      :action-options="{ space, resources }"
      class="oc-rounded"
    />
  </oc-list>
</template>

<script lang="ts">
import { ActionMenuItem } from '@opencloud-eu/web-pkg'
import { useFileActions } from '@opencloud-eu/web-pkg'
import { computed, defineComponent, inject, Ref, unref } from 'vue'
import { Resource, SpaceResource } from '@opencloud-eu/web-client'

export default defineComponent({
  name: 'FileActions',
  components: {
    ActionMenuItem
  },
  setup() {
    const resource = inject<Ref<Resource>>('resource')
    const space = inject<Ref<SpaceResource>>('space')
    const resources = computed(() => {
      return [unref(resource)]
    })
    const { getAllAvailableActions } = useFileActions()
    const actions = computed(() => {
      return getAllAvailableActions({
        space: unref(space),
        resources: unref(resources)
      })
    })

    return {
      space,
      resources,
      actions
    }
  }
})
</script>

<style lang="scss">
#oc-files-actions-sidebar {
  > li a,
  > li a:hover {
    display: inline-flex;
    gap: 10px;
    vertical-align: top;
    text-decoration: none;
  }
}
</style>
