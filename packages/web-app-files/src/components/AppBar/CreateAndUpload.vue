<template>
  <div v-if="showActions" class="create-and-upload-actions oc-flex-inline oc-mr-s">
    <template v-if="createFileActionsAvailable">
      <span v-oc-tooltip="newButtonTooltip">
        <oc-button
          id="new-file-menu-btn"
          key="new-file-menu-btn-enabled"
          v-oc-tooltip="hideButtonLabels ? $gettext('New') : ''"
          :aria-label="newButtonAriaLabel"
          appearance="filled"
          :disabled="uploadOrFileCreationBlocked"
        >
          <oc-icon name="add" />
          <span v-if="!hideButtonLabels" v-text="$gettext('New')" />
        </oc-button>
      </span>
      <oc-drop
        drop-id="new-file-menu-drop"
        toggle="#new-file-menu-btn"
        class="oc-width-auto"
        mode="click"
        close-on-click
        padding-size="small"
      >
        <oc-list id="create-list" :class="areFileExtensionsShown ? 'expanded-list' : null">
          <li class="create-list-folder oc-menu-item-hover">
            <oc-button
              id="new-folder-btn"
              class="oc-width-1-1"
              justify-content="left"
              appearance="raw"
              @click="createNewFolderAction"
            >
              <resource-icon :resource="folderIconResource" size="medium" />
              <span v-text="$gettext('Folder')" />
            </oc-button>
          </li>
        </oc-list>
        <oc-list
          v-for="(group, groupIndex) in createFileActionsGroups"
          :key="`file-creation-group-${groupIndex}`"
        >
          <li
            v-for="(fileAction, fileActionIndex) in group"
            :key="`file-creation-item-${groupIndex}-${fileActionIndex}`"
            class="create-list-file oc-menu-item-hover"
          >
            <oc-button
              appearance="raw"
              class="oc-width-1-1"
              justify-content="left"
              :class="['new-file-btn-' + fileAction.ext]"
              @click="fileAction.handler"
            >
              <resource-icon :resource="getIconResource(fileAction)" size="medium" />
              <span class="create-list-file-item-text">{{ fileAction.label() }}</span>
              <span
                v-if="areFileExtensionsShown && fileAction.ext"
                class="create-list-file-item-extension"
              >
                {{ fileAction.ext }}
              </span>
            </oc-button>
          </li>
        </oc-list>
        <oc-list>
          <li class="create-list-shortcut oc-menu-item-hover">
            <oc-button
              id="new-shortcut-btn"
              class="oc-width-1-1"
              justify-content="left"
              appearance="raw"
              @click="createNewShortcutAction"
            >
              <oc-icon name="external-link" size="medium" />
              <span v-text="$gettext('Shortcut')" />
              <span
                v-if="areFileExtensionsShown"
                class="create-list-file-item-extension"
                v-text="'url'"
              />
            </oc-button>
          </li>
        </oc-list>
      </oc-drop>
    </template>
    <template v-else>
      <span v-oc-tooltip="newButtonTooltip">
        <oc-button
          id="new-folder-btn"
          v-oc-tooltip="hideButtonLabels ? $gettext('New Folder') : ''"
          appearance="filled"
          :aria-label="newButtonAriaLabel"
          :disabled="uploadOrFileCreationBlocked"
          @click="createNewFolderAction"
        >
          <oc-icon name="resource-type-folder" />
          <span v-if="!hideButtonLabels" v-text="$gettext('New Folder')" />
        </oc-button>
      </span>
    </template>
    <span v-oc-tooltip="uploadButtonTooltip">
      <oc-button
        id="upload-menu-btn"
        key="upload-menu-btn-enabled"
        v-oc-tooltip="hideButtonLabels ? $gettext('Upload') : ''"
        :aria-label="uploadButtonAriaLabel"
        :disabled="uploadOrFileCreationBlocked"
        appearance="outline"
      >
        <oc-icon name="upload" fill-type="line" />
        <span v-if="!hideButtonLabels" v-text="$gettext('Upload')" />
      </oc-button>
    </span>
    <oc-drop
      drop-id="upload-menu-drop"
      toggle="#upload-menu-btn"
      mode="click"
      class="oc-width-auto"
      close-on-click
      padding-size="small"
      @show-drop="showDrop"
    >
      <oc-list id="upload-list">
        <li class="oc-menu-item-hover">
          <resource-upload ref="folder-upload" btn-class="oc-width-1-1" />
        </li>
        <li class="oc-menu-item-hover">
          <resource-upload ref="file-upload" btn-class="oc-width-1-1" :is-folder="true" />
        </li>
      </oc-list>
      <oc-list v-if="extensionActions.length" id="extension-list">
        <li
          v-for="(action, key) in extensionActions"
          :key="`${key}-${actionKeySuffix}`"
          v-oc-tooltip="
            isActionDisabled(action) && action.disabledTooltip ? action.disabledTooltip() : null
          "
          class="oc-menu-item-hover"
        >
          <oc-button
            class="oc-width-1-1"
            :class="action.class"
            appearance="raw"
            justify-content="left"
            :disabled="isActionDisabled(action)"
            @click="action.handler"
          >
            <oc-icon :name="action.icon" fill-type="line" />
            <span v-text="action.label()"
          /></oc-button>
        </li>
      </oc-list>
    </oc-drop>
    <div
      v-if="showPasteHereButton"
      id="clipboard-btns"
      v-oc-tooltip="pasteHereButtonTooltip"
      class="oc-button-group"
      :class="{ disabled: isPasteHereButtonDisabled }"
    >
      <oc-button
        :disabled="isPasteHereButtonDisabled"
        class="paste-files-btn"
        @click="pasteFileAction"
      >
        <oc-icon fill-type="line" name="clipboard" />
        <span v-text="$gettext('Paste here')" />
      </oc-button>
      <oc-button
        :disabled="uploadOrFileCreationBlocked"
        class="clear-clipboard-btn"
        @click="clearClipboard"
      >
        <oc-icon fill-type="line" name="close" />
      </oc-button>
    </div>
  </div>
</template>

<script lang="ts">
import {
  FileAction,
  isLocationPublicActive,
  isLocationSpacesActive,
  useClipboardStore,
  useFileActions,
  useFileActionsCreateNewShortcut,
  useMessages,
  useResourcesStore,
  useRoute,
  useSharesStore,
  useSpacesStore,
  useUserStore
} from '@opencloud-eu/web-pkg'
import { useActiveLocation } from '@opencloud-eu/web-pkg'
import {
  useFileActionsCreateNewFile,
  useFileActionsCreateNewFolder,
  useFileActionsPaste,
  useRequest,
  useClientService
} from '@opencloud-eu/web-pkg'

import ResourceUpload from './Upload/ResourceUpload.vue'

import {
  computed,
  defineComponent,
  onMounted,
  onBeforeUnmount,
  PropType,
  unref,
  watch,
  ref
} from 'vue'
import { eventBus } from '@opencloud-eu/web-pkg'
import {
  Resource,
  SpaceResource,
  isPublicSpaceResource,
  isShareSpaceResource
} from '@opencloud-eu/web-client'
import { useService, useUpload, UppyService, UploadResult } from '@opencloud-eu/web-pkg'
import { HandleUpload } from '../../HandleUpload'
import { useGettext } from 'vue3-gettext'
import { useExtensionRegistry } from '@opencloud-eu/web-pkg'
import { Action, ResourceIcon } from '@opencloud-eu/web-pkg'
import { v4 as uuidV4 } from 'uuid'
import { storeToRefs } from 'pinia'
import { uploadMenuExtensionPoint } from '../../extensionPoints'

export default defineComponent({
  components: {
    ResourceIcon,
    ResourceUpload
  },
  props: {
    space: {
      type: Object as PropType<SpaceResource>,
      required: true
    },
    item: {
      type: String,
      required: false,
      default: null
    },
    limitedScreenSpace: {
      type: Boolean,
      default: false,
      required: false
    },
    itemId: {
      type: [String, Number],
      required: false,
      default: null
    }
  },
  setup(props) {
    const uppyService = useService<UppyService>('$uppyService')
    const clientService = useClientService()
    const userStore = useUserStore()
    const spacesStore = useSpacesStore()
    const messageStore = useMessages()
    const sharesStore = useSharesStore()
    const route = useRoute()
    const language = useGettext()
    const { $gettext } = language

    const clipboardStore = useClipboardStore()
    const { clearClipboard } = clipboardStore
    const { resources: clipboardResources } = storeToRefs(clipboardStore)

    const resourcesStore = useResourcesStore()
    const { currentFolder } = storeToRefs(resourcesStore)

    const areFileExtensionsShown = computed(() => unref(resourcesStore.areFileExtensionsShown))

    const space = computed(() => props.space)

    useUpload({ uppyService })

    if (!uppyService.getPlugin('HandleUpload')) {
      uppyService.addPlugin(HandleUpload, {
        clientService,
        language,
        route,
        space,
        userStore,
        spacesStore,
        messageStore,
        resourcesStore,
        uppyService
      })
    }

    let uploadCompletedSub: string

    const { actions: pasteFileActions } = useFileActionsPaste()
    const pasteFileAction = () => {
      return unref(pasteFileActions)[0].handler({ space: unref(space) })
    }

    const { actions: createNewFolder } = useFileActionsCreateNewFolder({ space })
    const createNewFolderAction = computed(() => unref(createNewFolder)[0].handler)

    const { actions: createNewShortcut } = useFileActionsCreateNewShortcut({ space })
    const createNewShortcutAction = computed(() => unref(createNewShortcut)[0].handler)

    const { actions: createNewFileActions } = useFileActionsCreateNewFile({ space })

    const createFileActionsGroups = computed(() => {
      const result = []
      const externalFileActions = unref(createNewFileActions).filter(({ isExternal }) => isExternal)
      if (externalFileActions.length) {
        result.push(externalFileActions)
      }
      const appFileActions = unref(createNewFileActions).filter(({ isExternal }) => !isExternal)
      if (appFileActions.length) {
        result.push(appFileActions)
      }
      return result
    })
    const createFileActionsAvailable = computed(() => {
      return unref(createFileActionsGroups).some((group) => group.length > 0)
    })

    const extensionRegistry = useExtensionRegistry()
    const extensionActions = computed(() => {
      return [
        ...extensionRegistry.requestExtensions(uploadMenuExtensionPoint).map((e) => e.action)
      ].filter((e) => e.isVisible())
    })

    const canUpload = computed(() => {
      return unref(currentFolder)?.canUpload({ user: userStore.user })
    })

    const actionKeySuffix = ref(uuidV4())
    const showDrop = () => {
      // force actions to be re-rendered when the drop is being opened
      actionKeySuffix.value = uuidV4()
    }
    const isActionDisabled = (action: Action) => {
      return action.isDisabled ? action.isDisabled() : false
    }

    const handlePasteFileEvent = (event: ClipboardEvent) => {
      // Ignore file in clipboard if there are already files from OpenCloud in the clipboard
      if (unref(clipboardResources).length || !unref(canUpload)) {
        return
      }
      // Browsers only allow single files to be pasted for security reasons
      const items = event.clipboardData.items
      const fileItem = [...items].find((i) => i.kind === 'file')
      if (!fileItem) {
        return
      }
      const file = fileItem.getAsFile()
      uppyService.addFiles([file])
      event.preventDefault()
    }

    const onUploadComplete = async (result: UploadResult) => {
      if (result.successful) {
        const file = result.successful[0]

        if (!file) {
          return
        }

        const { spaceId, currentFolder, currentFolderId, driveType } = file.meta
        if (!isPublicSpaceResource(unref(space))) {
          const isOwnSpace = spacesStore.spaces
            .find(({ id }) => id === spaceId)
            ?.isOwner(userStore.user)

          if (driveType === 'project' || isOwnSpace) {
            const client = clientService.graphAuthenticated
            const updatedSpace = await client.drives.getDrive(spaceId, sharesStore.graphRoles)
            spacesStore.updateSpaceField({
              id: updatedSpace.id,
              field: 'spaceQuota',
              value: updatedSpace.spaceQuota
            })
          }
        }

        const sameFolder =
          props.itemId && !isShareSpaceResource(unref(space))
            ? props.itemId.toString().startsWith(currentFolderId.toString())
            : currentFolder === props.item
        const fileIsInCurrentPath = spaceId === unref(space).id && sameFolder
        if (fileIsInCurrentPath) {
          eventBus.publish('app.files.list.load')
        }
      }
    }

    const uploadOrFileCreationBlocked = computed(() => {
      return !unref(canUpload)
    })

    const isPastingIntoSameFolder = computed(() => {
      if (!unref(clipboardResources) || unref(clipboardResources).length < 1) {
        return false
      }

      return !unref(clipboardResources).some(
        (resource) => resource.parentFolderId !== unref(currentFolder).id
      )
    })

    const isPasteHereButtonDisabled = computed(() => {
      return unref(uploadOrFileCreationBlocked) || unref(isPastingIntoSameFolder)
    })

    const pasteHereButtonTooltip = computed(() => {
      if (unref(uploadOrFileCreationBlocked)) {
        return $gettext('You have no permission to paste files here.')
      }

      if (unref(isPastingIntoSameFolder)) {
        return $gettext('You cannot paste resources into the same folder.')
      }

      return ''
    })

    onMounted(() => {
      uploadCompletedSub = uppyService.subscribe('uploadCompleted', onUploadComplete)
      document.addEventListener('paste', handlePasteFileEvent)
    })

    onBeforeUnmount(() => {
      uppyService.removePlugin(uppyService.getPlugin('HandleUpload'))
      uppyService.unsubscribe('uploadCompleted', uploadCompletedSub)
      uppyService.removeDropTarget()
      document.removeEventListener('paste', handlePasteFileEvent)
    })

    watch(
      canUpload,
      () => {
        const targetSelector = '#files-view'
        const target = document.querySelector(targetSelector)

        if (target && unref(canUpload)) {
          uppyService.useDropTarget({ targetSelector })
        } else {
          uppyService.removeDropTarget()
        }
      },
      { immediate: true }
    )

    return {
      ...useFileActions(),
      ...useRequest(),
      clientService,
      isPublicLocation: useActiveLocation(isLocationPublicActive, 'files-public-link'),
      isSpacesGenericLocation: useActiveLocation(isLocationSpacesActive, 'files-spaces-generic'),
      canUpload,
      currentFolder,
      createNewFolder,
      createFileActionsGroups,
      createFileActionsAvailable,
      createNewFolderAction,
      createNewShortcutAction,
      extensionActions,
      pasteFileAction,
      isActionDisabled,
      actionKeySuffix,
      showDrop,
      areFileExtensionsShown,
      clearClipboard,
      clipboardResources,
      uploadOrFileCreationBlocked,
      isPasteHereButtonDisabled,
      pasteHereButtonTooltip,

      // HACK: exported for unit tests:
      onUploadComplete
    }
  },
  computed: {
    showPasteHereButton() {
      return this.clipboardResources && this.clipboardResources.length !== 0
    },
    hideButtonLabels() {
      return this.limitedScreenSpace
    },

    showActions() {
      return !(this.uploadOrFileCreationBlocked && this.isPublicLocation)
    },

    newButtonTooltip() {
      if (!this.canUpload) {
        return this.$gettext('You have no permission to create new files!')
      }
      return null
    },
    newButtonAriaLabel() {
      const tooltip = this.newButtonTooltip
      if (tooltip) {
        return tooltip
      }
      if (!this.createFileActionsAvailable) {
        return this.$gettext('New folder')
      }
      return this.$gettext('Create new files or folders')
    },
    uploadButtonTooltip() {
      if (!this.canUpload) {
        return this.$gettext('You have no permission to upload!')
      }
      return null
    },
    uploadButtonAriaLabel() {
      const tooltip = this.uploadButtonTooltip
      if (tooltip) {
        return tooltip
      }
      return this.$gettext('Upload files or folders')
    },

    folderIconResource() {
      return { isFolder: true, extension: '' } as Resource
    }
  },
  methods: {
    getIconResource(fileHandler: FileAction) {
      return { type: 'file', extension: fileHandler.ext } as Resource
    }
  }
})
</script>
<style lang="scss">
#upload-menu-drop,
#new-file-menu-drop {
  min-width: 230px;

  ul:not(:first-child) {
    border-top: 0.5px solid var(--oc-role-outline-variant);
    padding-top: var(--oc-space-small);
  }

  ul:not(:last-child) {
    padding-bottom: var(--oc-space-small);
  }
}

.create-list-file-item-extension {
  font-weight: 400 !important;
  font-size: var(--oc-font-size-small);
  margin-left: auto;
}

.expanded-list {
  min-width: 280px !important;
}

#create-list,
#upload-list,
#new-file-menu-drop {
  .oc-icon-m svg {
    height: 100% !important;
  }
}

#clipboard-btns {
  flex-flow: inherit;

  :nth-child(1) {
    border-right: 0px !important;
    white-space: nowrap;
  }

  :nth-child(2) {
    border-left: 0px !important;
  }
}

#clipboard-btns.disabled {
  opacity: 0.6;

  button {
    opacity: 1;
  }
}

.create-and-upload-actions {
  gap: var(--oc-space-small);
}
</style>
