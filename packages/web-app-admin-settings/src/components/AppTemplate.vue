<template>
  <main class="oc-flex oc-height-1-1 app-content oc-width-1-1">
    <div
      class="admin-settings-wrapper oc-flex oc-width-1-1 oc-width-expand oc-height-1-1 oc-flex-wrap"
    >
      <app-loading-spinner v-if="loading" />
      <template v-else>
        <div
          id="admin-settings-view-wrapper"
          class="oc-width-expand oc-width-1-1 oc-height-1-1 oc-flex-wrap"
        >
          <div
            id="admin-settings-app-bar"
            ref="appBarRef"
            class="oc-app-bar oc-py-s"
            :class="{ 'admin-settings-app-bar-sticky': isSticky }"
          >
            <div class="admin-settings-app-bar-controls oc-flex oc-flex-between oc-flex-middle">
              <oc-breadcrumb
                v-if="!isMobileWidth"
                id="admin-settings-breadcrumb"
                :items="breadcrumbs"
              />
              <portal-target name="app.runtime.mobile.nav" />
              <div class="oc-flex">
                <view-options
                  v-if="showViewOptions"
                  :has-hidden-files="false"
                  :has-file-extensions="false"
                  :has-pagination="true"
                  :pagination-options="paginationOptions"
                  :per-page-default="perPageDefault"
                  per-page-storage-prefix="admin-settings"
                />
              </div>
            </div>
            <div
              v-if="showAppBar"
              class="admin-settings-app-bar-actions oc-flex oc-flex-middle oc-mt-xs"
            >
              <slot
                name="topbarActions"
                :limited-screen-space="limitedScreenSpace"
                class="oc-flex-1 oc-flex oc-flex-start"
              />
              <batch-actions
                v-if="showBatchActions"
                :actions="batchActions"
                :action-options="{ resources: batchActionItems }"
                :limited-screen-space="limitedScreenSpace"
              />
            </div>
          </div>
          <slot name="mainContent" />
        </div>
        <side-bar
          v-if="isSideBarOpen"
          :active-panel="sideBarActivePanel"
          :available-panels="sideBarAvailablePanels"
          :panel-context="sideBarPanelContext"
          :loading="sideBarLoading"
          :is-open="isSideBarOpen"
          @select-panel="selectPanel"
          @close="closeSideBar"
        >
          <template #header>
            <slot name="sideBarHeader" />
          </template>
        </side-bar>
      </template>
    </div>
  </main>
</template>

<script lang="ts">
import { perPageDefault, paginationOptions } from '../defaults'
import {
  AppLoadingSpinner,
  SideBar,
  BatchActions,
  SideBarPanelContext,
  Action,
  useIsTopBarSticky
} from '@opencloud-eu/web-pkg'
import {
  defineComponent,
  inject,
  onBeforeUnmount,
  PropType,
  Ref,
  ref,
  unref,
  VNodeRef,
  watch
} from 'vue'
import { eventBus, useAppDefaults } from '@opencloud-eu/web-pkg'
import { SideBarEventTopics } from '@opencloud-eu/web-pkg'
import { SideBarPanel } from '@opencloud-eu/web-pkg'
import { BreadcrumbItem } from '@opencloud-eu/design-system/helpers'
import { ViewOptions } from '@opencloud-eu/web-pkg'
import { Item } from '@opencloud-eu/web-client'

export default defineComponent({
  components: {
    SideBar,
    AppLoadingSpinner,
    BatchActions,
    ViewOptions
  },
  props: {
    breadcrumbs: {
      required: true,
      type: Array as PropType<BreadcrumbItem[]>
    },
    isSideBarOpen: {
      required: false,
      type: Boolean,
      default: false
    },
    sideBarAvailablePanels: {
      required: false,
      type: Array as PropType<SideBarPanel<unknown, unknown, unknown>[]>,
      default: (): SideBarPanel<unknown, unknown, unknown>[] => []
    },
    sideBarPanelContext: {
      required: false,
      type: Object as PropType<SideBarPanelContext<unknown, unknown, unknown>>,
      default: (): SideBarPanelContext<unknown, unknown, unknown> => ({})
    },
    sideBarActivePanel: {
      required: false,
      type: [String, null],
      default: null
    },
    loading: {
      required: false,
      type: Boolean,
      default: false
    },
    sideBarLoading: {
      required: false,
      type: Boolean,
      default: false
    },
    showViewOptions: {
      type: Boolean,
      required: false,
      default: false
    },
    showBatchActions: {
      type: Boolean,
      required: false,
      default: false
    },
    batchActionItems: {
      type: Array as PropType<Item[]>,
      required: false,
      default: (): Item[] => []
    },
    batchActions: {
      type: Array as PropType<Action[]>,
      required: false,
      default: (): Action[] => []
    },
    showAppBar: {
      type: Boolean,
      required: false,
      default: true
    }
  },
  setup(props) {
    const appBarRef = ref<VNodeRef>()
    const limitedScreenSpace = ref(false)
    const { isSticky } = useIsTopBarSticky()

    const onResize = () => {
      limitedScreenSpace.value = props.isSideBarOpen
        ? window.innerWidth <= 1600
        : window.innerWidth <= 1200
    }
    const resizeObserver = new ResizeObserver(onResize)

    const closeSideBar = () => {
      eventBus.publish(SideBarEventTopics.close)
    }
    const selectPanel = (panel: string) => {
      eventBus.publish(SideBarEventTopics.setActivePanel, panel)
    }

    watch(
      appBarRef,
      (ref) => {
        if (ref) {
          resizeObserver.observe(unref(appBarRef) as unknown as HTMLElement)
        }
      },
      { immediate: true }
    )

    onBeforeUnmount(() => {
      if (unref(appBarRef)) {
        resizeObserver.unobserve(unref(appBarRef) as unknown as HTMLElement)
      }
    })

    return {
      isMobileWidth: inject<Ref<boolean>>('isMobileWidth'),
      appBarRef,
      limitedScreenSpace,
      closeSideBar,
      selectPanel,
      ...useAppDefaults({
        applicationId: 'admin-settings'
      }),
      perPageDefault,
      paginationOptions,
      isSticky
    }
  }
})
</script>

<style lang="scss">
#admin-settings-view-wrapper {
  overflow-y: auto;
}

#admin-settings-app-bar {
  background-color: var(--oc-role-surface);
  border-top-right-radius: 15px;
  box-sizing: border-box;
  z-index: 2;
  position: inherit;
  padding: 0 var(--oc-space-medium);
  top: 0;

  &.admin-settings-app-bar-sticky {
    position: sticky;
  }
}

.admin-settings-app-bar-controls {
  height: 52px;

  @media (max-width: $oc-breakpoint-xsmall-max) {
    justify-content: space-between;
  }
}

.admin-settings-app-bar-actions {
  align-items: center;
  display: flex;
  min-height: 3rem;
}

@media only screen and (max-width: $oc-breakpoint-small-default) {
  .admin-settings-wrapper {
    flex-wrap: nowrap !important;
  }
}
</style>
