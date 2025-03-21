<template>
  <div>
    <oc-select
      :model-value="currentThemeOrAuto"
      :label="$gettext('Theme')"
      :label-hidden="true"
      :clearable="false"
      :options="availableThemesAndAuto"
      option-label="label"
      @update:model-value="updateTheme"
    />
  </div>
</template>
<script lang="ts">
import { computed, defineComponent, ref, unref } from 'vue'
import { useMessages, useThemeStore, WebThemeType } from '@opencloud-eu/web-pkg'
import { storeToRefs } from 'pinia'
import { useGettext } from 'vue3-gettext'

export default defineComponent({
  setup() {
    const themeStore = useThemeStore()
    const { showMessage } = useMessages()
    const { $gettext } = useGettext()
    const autoTheme = computed(() => ({ label: $gettext('Auto (same as system)') }))
    const { availableThemes, currentTheme } = storeToRefs(themeStore)
    const currentThemeSelection = ref(null)

    const { setAndApplyTheme, setAutoSystemTheme, isCurrentThemeAutoSystem } = themeStore

    const updateTheme = (newTheme: WebThemeType) => {
      currentThemeSelection.value = newTheme
      showMessage({ title: $gettext('Preference saved.') })
      if (newTheme == unref(autoTheme)) {
        return setAutoSystemTheme()
      }
      setAndApplyTheme(newTheme)
    }

    const currentThemeOrAuto = computed(() => {
      if (unref(currentThemeSelection)) {
        return unref(currentThemeSelection)
      }
      if (unref(isCurrentThemeAutoSystem)) {
        return unref(autoTheme)
      }
      return unref(currentTheme)
    })
    const availableThemesAndAuto = computed(() => [unref(autoTheme), ...unref(availableThemes)])

    return {
      availableThemesAndAuto,
      currentThemeOrAuto,
      updateTheme
    }
  }
})
</script>
