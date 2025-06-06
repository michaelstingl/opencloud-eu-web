<template>
  <div ref="rootElement">
    <app-loading-spinner v-if="isLoading" />
    <template v-else>
      <p v-if="!activities.length" v-text="$gettext('No activities')" />
      <div v-else class="oc-ml-s">
        <oc-list class="oc-timeline">
          <li v-for="activity in activities" :key="activity.id">
            <span v-html="getHtmlFromActivity(activity)" />
            <span
              class="oc-text-muted oc-text-small oc-mt-s"
              v-text="getTimeFromActivity(activity)"
            />
          </li>
        </oc-list>
        <p class="oc-text-muted oc-text-small" v-text="activitiesFooterText" />
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  inject,
  onBeforeUnmount,
  onMounted,
  Ref,
  ref,
  unref,
  watch
} from 'vue'
import { useGettext } from 'vue3-gettext'
import {
  AppLoadingSpinner,
  formatDateFromDateTime,
  useClientService,
  VisibilityObserver
} from '@opencloud-eu/web-pkg'
import { useTask } from 'vue-concurrency'
import { call, Resource } from '@opencloud-eu/web-client'
import { DateTime } from 'luxon'
import { Activity } from '@opencloud-eu/web-client/graph/generated'
import escape from 'lodash-es/escape'

const visibilityObserver = new VisibilityObserver()
export default defineComponent({
  name: 'ActivitiesPanel',
  components: { AppLoadingSpinner },
  setup() {
    const rootElement = ref<HTMLElement>()
    const { $ngettext, current: currentLanguage } = useGettext()
    const clientService = useClientService()
    const resource = inject<Ref<Resource>>('resource')
    const activities = ref<Activity[]>([])
    const activitiesLimit = 200

    const activitiesFooterText = computed(() => {
      return $ngettext(
        'Showing %{activitiesCount} activity',
        'Showing %{activitiesCount} activities',
        unref(activities).length,
        {
          activitiesCount: unref(activities).length.toString()
        }
      )
    })

    const loadActivitiesTask = useTask(function* (signal) {
      activities.value = yield* call(
        clientService.graphAuthenticated.activities.listActivities(
          `itemid:${unref(resource).fileId} AND limit:${activitiesLimit} AND sort:desc`,
          { signal }
        )
      )
    }).restartable()

    const isLoading = computed(() => {
      return loadActivitiesTask.isRunning || !loadActivitiesTask.last
    })

    const getHtmlFromActivity = (activity: Activity) => {
      let message = activity.template.message
      for (const [key, value] of Object.entries(activity.template.variables)) {
        const escapedValue = escape(value.displayName || value.name)

        message = message.replace(`{${key}}`, `<strong>${escapedValue}</strong>`)
      }
      return message
    }

    const getTimeFromActivity = (activity: Activity) => {
      const dateTime = DateTime.fromISO(activity.times.recordedTime)
      return formatDateFromDateTime(dateTime, currentLanguage)
    }

    const isVisible = ref(false)
    watch(
      [resource, isVisible],
      () => {
        if (!unref(isVisible)) {
          return
        }
        loadActivitiesTask.perform()
      },
      {
        immediate: true,
        deep: true
      }
    )

    onMounted(() => {
      visibilityObserver.observe(unref(rootElement), {
        onEnter: () => {
          isVisible.value = true
        },
        onExit: () => {
          isVisible.value = false
        }
      })
    })

    onBeforeUnmount(() => {
      visibilityObserver.disconnect()
    })

    return {
      rootElement,
      activities,
      activitiesLimit,
      activitiesFooterText,
      isLoading,
      isVisible,
      loadActivitiesTask,
      getHtmlFromActivity,
      getTimeFromActivity
    }
  }
})
</script>
