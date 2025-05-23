<template>
  <div id="oc-file-details-sidebar" class="oc-rounded">
    <div v-if="hasContent">
      <div
        v-if="isPreviewLoading || preview"
        key="file-thumbnail"
        :style="{
          'background-image': isPreviewLoading ? 'none' : `url(${preview})`
        }"
        class="details-preview oc-flex oc-flex-middle oc-flex-center oc-mb"
        data-testid="preview"
      >
        <oc-spinner v-if="isPreviewLoading" />
      </div>
      <div
        v-else
        class="details-icon-wrapper oc-width-1-1 oc-flex oc-flex-middle oc-flex-center oc-mb"
      >
        <resource-icon class="details-icon" :resource="resource" size="xxxlarge" />
      </div>
      <div
        v-if="!publicLinkContextReady && shareIndicators.length"
        key="file-shares"
        data-testid="sharingInfo"
        class="oc-flex oc-flex-middle oc-my-m"
      >
        <oc-status-indicators :resource="resource" :indicators="shareIndicators" />
        <p class="oc-my-rm oc-mx-s" v-text="detailSharingInformation" />
      </div>
      <dl
        class="details-list oc-m-rm"
        :aria-label="$gettext('Overview of the information about the selected file')"
      >
        <template v-if="hasDeletionDate">
          <dt>{{ $gettext('Deleted at') }}</dt>
          <dd data-testid="delete-timestamp">{{ capitalizedTimestamp }}</dd>
        </template>
        <template v-if="hasTimestamp">
          <dt>{{ $gettext('Last modified') }}</dt>
          <dd data-testid="timestamp">
            <oc-button
              v-if="showVersions"
              v-oc-tooltip="seeVersionsLabel"
              appearance="raw"
              :aria-label="seeVersionsLabel"
              no-hover
              @click="expandVersionsPanel"
            >
              {{ capitalizedTimestamp }}
            </oc-button>
            <span v-else v-text="capitalizedTimestamp" />
          </dd>
        </template>
        <template v-if="resource.locked">
          <dt>{{ $gettext('Locked via') }}</dt>
          <dd data-testid="locked-by">
            <span>{{ resource.lockOwner }}</span>
            <span v-if="resource.lockTime">({{ formatDateRelative(resource.lockTime) }})</span>
          </dd>
        </template>
        <template v-if="showSharedVia">
          <dt>{{ $gettext('Shared via') }}</dt>
          <dd data-testid="shared-via">
            <router-link :to="sharedAncestorRoute">
              <span v-oc-tooltip="sharedViaTooltip" v-text="sharedAncestor.path" />
            </router-link>
          </dd>
        </template>
        <template v-if="showSharedBy">
          <dt>{{ $gettext('Shared by') }}</dt>
          <dd data-testid="shared-by">{{ sharedByDisplayNames }}</dd>
        </template>
        <template v-if="ownerDisplayName && ownerDisplayName !== sharedByDisplayNames">
          <dt>{{ $gettext('Owner') }}</dt>
          <dd data-testid="ownerDisplayName">
            <p class="oc-m-rm">
              {{ ownerDisplayName }}
              <span v-if="ownedByCurrentUser" v-translate>(me)</span>
            </p>
          </dd>
        </template>
        <template v-if="showSize">
          <dt>{{ $gettext('Size') }}</dt>
          <dd data-testid="sizeInfo">{{ resourceSize }}</dd>
        </template>
        <web-dav-details v-if="showWebDavDetails" :space="space" />
        <template v-if="showVersions">
          <dt>{{ $gettext('Version') }}</dt>
          <dd data-testid="versionsInfo">
            <oc-button
              v-oc-tooltip="seeVersionsLabel"
              appearance="raw"
              :aria-label="seeVersionsLabel"
              no-hover
              @click="expandVersionsPanel"
            >
              {{ versions.length }}
            </oc-button>
          </dd>
        </template>
        <portal-target
          name="app.files.sidebar.file.details.table"
          :slot-props="{ space, resource }"
          :multiple="true"
        />
        <template v-if="hasTags">
          <dt>
            {{ $gettext('Tags') }}
            <oc-contextual-helper
              v-if="contextualHelper?.isEnabled"
              v-bind="contextualHelper?.data"
              class="oc-pl-xs"
            ></oc-contextual-helper>
          </dt>
          <dd data-testid="tags">
            <tags-select :resource="resource" class="oc-width-1"></tags-select>
          </dd>
        </template>
      </dl>
    </div>
    <p v-else data-testid="noContentText" v-text="$gettext('No information to display')" />
  </div>
</template>
<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, inject, Ref, ref, unref, watch } from 'vue'
import {
  ImageDimension,
  useAuthStore,
  useUserStore,
  useCapabilityStore,
  useConfigStore,
  useResourcesStore,
  formatDateFromJSDate,
  useResourceContents,
  useLoadPreview
} from '@opencloud-eu/web-pkg'
import upperFirst from 'lodash-es/upperFirst'
import {
  isShareResource,
  isShareSpaceResource,
  isTrashResource,
  ShareTypes
} from '@opencloud-eu/web-client'
import { useGetMatchingSpace } from '@opencloud-eu/web-pkg'
import { getIndicators } from '@opencloud-eu/web-pkg'
import { formatFileSize, formatRelativeDateFromJSDate } from '@opencloud-eu/web-pkg'
import { eventBus } from '@opencloud-eu/web-pkg'
import { SideBarEventTopics } from '@opencloud-eu/web-pkg'
import { Resource, SpaceResource } from '@opencloud-eu/web-client'
import { useGettext } from 'vue3-gettext'
import { getSharedAncestorRoute } from '@opencloud-eu/web-pkg'
import { ResourceIcon } from '@opencloud-eu/web-pkg'
import { tagsHelper } from '../../../helpers/contextualHelpers'
import { ContextualHelper } from '@opencloud-eu/design-system/helpers'
import TagsSelect from './TagsSelect.vue'
import { WebDavDetails } from '@opencloud-eu/web-pkg'

const { previewEnabled = true, tagsEnabled = true } = defineProps<{
  previewEnabled?: boolean
  tagsEnabled?: boolean
}>()

const configStore = useConfigStore()
const userStore = useUserStore()
const capabilityStore = useCapabilityStore()
const { getMatchingSpace } = useGetMatchingSpace()
const { resourceContentsText } = useResourceContents({ showSizeInformation: false })
const { loadPreview, previewsLoading } = useLoadPreview()

const language = useGettext()
const { $gettext, current: currentLanguage } = language

const resourcesStore = useResourcesStore()
const { ancestorMetaData, currentFolder } = storeToRefs(resourcesStore)

const { user } = storeToRefs(userStore)

const resource = inject<Ref<Resource>>('resource')
const versions = inject<Ref<Resource[]>>('versions')
const space = inject<Ref<SpaceResource>>('space')

const preview = ref<string>(undefined)

const authStore = useAuthStore()
const { publicLinkContextReady } = storeToRefs(authStore)

const isPreviewLoading = computed(() => previewEnabled && unref(previewsLoading))

const sharedAncestor = computed(() => {
  return Object.values(unref(ancestorMetaData)).find(
    (a) =>
      a.path !== unref(resource).path &&
      ShareTypes.containsAnyValue(ShareTypes.authenticated, a.shareTypes)
  )
})
const sharedAncestorRoute = computed(() => {
  return getSharedAncestorRoute({
    sharedAncestor: unref(sharedAncestor),
    matchingSpace: unref(space) || getMatchingSpace(unref(resource))
  })
})
const showWebDavDetails = computed(() => {
  /**
   * webDavPath might not be set when user is navigating on public link,
   * even if the user is authenticated and the file owner.
   */
  return resourcesStore.areWebDavDetailsShown && unref(resource).webDavPath
})
const formatDateRelative = (date: string) => {
  return formatRelativeDateFromJSDate(new Date(date), language.current)
}

const contextualHelper = {
  isEnabled: configStore.options.contextHelpers,
  data: tagsHelper({ configStore })
} as ContextualHelper

const hasTags = computed(() => {
  return tagsEnabled && capabilityStore.filesTags
})

const hasDeletionDate = computed(() => {
  return isTrashResource(unref(resource))
})

const shareIndicators = computed(() => {
  return getIndicators({
    space: unref(space),
    resource: unref(resource),
    ancestorMetaData: unref(ancestorMetaData),
    user: unref(user)
  }).filter(({ category }) => category === 'sharing')
})

const hasAnyShares = computed(() => {
  return unref(resource).shareTypes?.length > 0 || unref(sharedAncestor)
})
const sharedViaTooltip = computed(() => {
  return $gettext("Navigate to '%{folder}'", { folder: unref(sharedAncestor).path || '' }, true)
})
const showSharedBy = computed(() => {
  return unref(showShares) && !unref(ownedByCurrentUser) && unref(sharedByDisplayNames)
})
const showSharedVia = computed(() => {
  return unref(showShares) && unref(sharedAncestor) && !isShareSpaceResource(unref(space))
})
const showShares = computed(() => {
  if (unref(publicLinkContextReady)) {
    return false
  }
  return unref(hasAnyShares)
})
const ownedByCurrentUser = computed(() => {
  return unref(resource).owner?.id === unref(user)?.id
})
const sharedByDisplayNames = computed(() => {
  const res = unref(resource)
  if (!isShareResource(res)) {
    return ''
  }
  return res.sharedBy?.map(({ displayName }) => displayName).join(', ')
})
const hasContent = computed(() => {
  return (
    unref(hasTimestamp) ||
    unref(ownerDisplayName) ||
    unref(showSize) ||
    unref(showShares) ||
    unref(showVersions) ||
    unref(hasDeletionDate)
  )
})
const detailSharingInformation = computed(() => {
  if (unref(resource).type === 'folder') {
    return $gettext('This folder has been shared.')
  }
  return $gettext('This file has been shared.')
})
const hasTimestamp = computed(() => {
  return unref(resource).mdate?.length > 0
})
const ownerDisplayName = computed(() => {
  return unref(resource).owner?.displayName
})
const resourceSize = computed(() => {
  if (unref(resource).id === unref(currentFolder)?.id) {
    return `${formatFileSize(unref(resource).size, currentLanguage)}, ${unref(
      resourceContentsText
    )}`
  }

  return formatFileSize(unref(resource).size, currentLanguage)
})
const showSize = computed(() => {
  return formatFileSize(unref(resource).size, currentLanguage) !== '?'
})
const showVersions = computed(() => {
  if (unref(resource).type === 'folder' || unref(publicLinkContextReady)) {
    return
  }
  return unref(versions).length > 0
})
const seeVersionsLabel = computed(() => {
  return $gettext('See all versions')
})
const capitalizedTimestamp = computed(() => {
  const item = unref(resource)
  const date = isTrashResource(item) ? item.ddate : item.mdate
  const displayDate = formatDateFromJSDate(new Date(date), currentLanguage)
  return upperFirst(displayDate)
})

const expandVersionsPanel = () => {
  eventBus.publish(SideBarEventTopics.setActivePanel, 'versions')
}

watch(
  () => unref(resource).id,
  async () => {
    if (unref(resource)) {
      preview.value = await loadPreview({
        space: unref(space),
        resource: unref(resource),
        dimensions: ImageDimension.Preview,
        cancelRunning: true,
        updateStore: false
      })
    }
  },
  { immediate: true }
)
</script>
<style lang="scss" scoped>
#oc-file-details-sidebar {
  background-color: var(--oc-role-surface-container);
  padding: var(--oc-space-medium);
}

.details-preview,
.details-icon-wrapper {
  padding: 10px;

  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
}

.details-preview {
  height: 230px;
}

.details-icon > svg {
  height: 192px !important;
  max-height: 192px !important;
  max-width: 192px !important;
  width: 192px !important;
}

.details-list {
  dd:last-of-type,
  dt:last-of-type {
    margin-bottom: 0 !important;
  }
}
</style>
