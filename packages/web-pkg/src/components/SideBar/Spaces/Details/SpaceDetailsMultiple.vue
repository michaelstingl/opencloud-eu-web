<template>
  <div id="oc-spaces-details-multiple-sidebar">
    <div class="spaces-preview oc-mb-l">
      <div class="spaces-preview-body">
        <oc-icon class="preview-icon" size="xxlarge" name="layout-grid" />
        <p class="preview-text" v-text="selectedSpacesString" />
      </div>
    </div>
    <oc-definition-list :aria-label="detailsTableLabel" :items="items" />
  </div>
</template>
<script lang="ts">
import { formatFileSize } from '../../../../helpers'
import { computed, defineComponent, PropType, unref } from 'vue'
import { SpaceResource } from '@opencloud-eu/web-client'
import { useGettext } from 'vue3-gettext'

export default defineComponent({
  name: 'SpaceDetailsMultiple',
  props: {
    selectedSpaces: {
      type: Array as PropType<Array<SpaceResource>>,
      required: true
    }
  },
  setup(props) {
    const language = useGettext()
    const { $gettext, $ngettext } = language
    const totalSelectedSpaceQuotaTotal = computed(() => {
      let total = 0
      props.selectedSpaces.forEach((space) => {
        total += space.spaceQuota.total
      })
      return formatFileSize(total, language.current)
    })
    const totalSelectedSpaceQuotaRemaining = computed(() => {
      let remaining = 0
      props.selectedSpaces.forEach((space) => {
        if (space.disabled) {
          return
        }
        remaining += space.spaceQuota.remaining
      })
      return formatFileSize(remaining, language.current)
    })
    const totalSelectedSpaceQuotaUsed = computed(() => {
      let used = 0
      props.selectedSpaces.forEach((space) => {
        if (space.disabled) {
          return
        }
        used += space.spaceQuota.used
      })
      return formatFileSize(used, language.current)
    })
    const totalEnabledSpaces = computed(() => {
      return props.selectedSpaces.filter((s) => !s.disabled).length
    })
    const totalDisabledSpaces = computed(() => {
      return props.selectedSpaces.filter((s) => s.disabled).length
    })
    const detailsTableLabel = computed(() => {
      return $gettext('Overview of the information about the selected spaces')
    })
    const selectedSpacesString = computed(() => {
      return $ngettext(
        '%{ itemCount } space selected',
        '%{ itemCount } spaces selected',
        props.selectedSpaces.length,
        {
          itemCount: props.selectedSpaces.length.toString()
        }
      )
    })

    const items = [
      { term: $gettext('Total quota:'), definition: unref(totalSelectedSpaceQuotaTotal) },
      { term: $gettext('Remaining quota:'), definition: unref(totalSelectedSpaceQuotaRemaining) },
      { term: $gettext('Used quota:'), definition: unref(totalSelectedSpaceQuotaUsed) },
      { term: $gettext('Enabled:'), definition: unref(totalEnabledSpaces) },
      { term: $gettext('Disabled:'), definition: unref(totalDisabledSpaces) }
    ]

    return {
      detailsTableLabel,
      items,
      selectedSpacesString
    }
  }
})
</script>
<style lang="scss" scoped>
#oc-spaces-details-multiple-sidebar {
  background-color: var(--oc-role-surface-container);
  border-radius: 5px;
  padding: var(--oc-space-medium);
}

.details-list {
  margin: 0;
}

.spaces-preview {
  text-align: center;
  border-radius: 5px;
}
</style>
