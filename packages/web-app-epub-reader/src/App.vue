<template>
  <div class="epub-reader oc-flex">
    <oc-list class="epub-reader-chapters-list oc-pl-s oc-visible@l">
      <li
        v-for="chapter in chapters"
        :key="chapter.id"
        class="epub-reader-chapters-list-item oc-py-s"
        :class="{ active: currentChapter.id === chapter.id }"
      >
        <oc-button class="oc-text-truncate" appearance="raw" no-hover @click="showChapter(chapter)">
          <span
            v-oc-tooltip="chapter.label"
            class="oc-text-truncate oc-mr-s"
            v-text="chapter.label"
          />
        </oc-button>
      </li>
    </oc-list>
    <div class="oc-width-1-1 oc-height-1-1">
      <div class="epub-reader-controls oc-flex oc-flex-middle oc-m-s">
        <div class="epub-reader-controls-font-size oc-flex oc-button-group">
          <oc-button
            v-oc-tooltip="`${currentFontSizePercentage - FONT_SIZE_PERCENTAGE_STEP}%`"
            :aria-label="$gettext('Decrease font size')"
            class="epub-reader-controls-font-size-decrease"
            :disabled="decreaseFontSizeDisabled"
            gap-size="none"
            @click="decreaseFontSize"
          >
            <oc-icon name="font-family" fill-type="none" size="small" />
            <oc-icon name="subtract" size="xsmall" />
          </oc-button>
          <oc-button
            v-oc-tooltip="$gettext('Reset font size')"
            class="epub-reader-controls-font-size-reset"
            @click="resetFontSize"
          >
            {{ `${currentFontSizePercentage}%` }}
          </oc-button>
          <oc-button
            v-oc-tooltip="`${currentFontSizePercentage + FONT_SIZE_PERCENTAGE_STEP}%`"
            :aria-label="$gettext('Increase font size')"
            class="epub-reader-controls-font-size-increase"
            :disabled="increaseFontSizeDisabled"
            gap-size="none"
            @click="increaseFontSize"
          >
            <oc-icon name="font-family" fill-type="none" size="small" />
            <oc-icon name="add" size="xsmall" />
          </oc-button>
        </div>
        <oc-select
          v-model="currentChapter"
          class="epub-reader-controls-chapters-select oc-width-1-1 oc-px-s oc-hidden@l"
          :label="$gettext('Chapter')"
          :label-hidden="true"
          :options="chapters"
          :searchable="false"
          @update:model-value="showChapter"
        />
      </div>
      <div class="oc-flex oc-flex-center oc-width-1-1 oc-height-1-1">
        <div class="oc-flex oc-flex-middle oc-mx-l">
          <oc-button
            class="epub-reader-navigate-left"
            :aria-label="$gettext('Navigate to previous page')"
            :disabled="navigateLeftDisabled"
            appearance="raw"
            @click="navigateLeft"
          >
            <oc-icon name="arrow-left-s" fill-type="line" size="xlarge" />
          </oc-button>
        </div>
        <div id="reader" ref="bookContainer" class="oc-flex oc-flex-center" />

        <div class="oc-flex oc-flex-middle oc-mx-l">
          <oc-button
            class="epub-reader-navigate-right"
            :aria-label="$gettext('Navigate to next page')"
            :disabled="navigateRightDisabled"
            appearance="raw"
            @click="navigateRight"
          >
            <oc-icon name="arrow-right-s" fill-type="line" size="xlarge" />
          </oc-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, nextTick, PropType, ref, unref, watch } from 'vue'
import { Resource } from '@opencloud-eu/web-client'
import {
  AppConfigObject,
  Key,
  useKeyboardActions,
  useLocalStorage,
  useThemeStore
} from '@opencloud-eu/web-pkg'
import ePub, { Book, NavItem, Rendition, Location } from 'epubjs'

const DARK_THEME_CONFIG = {
  html: {
    '-webkit-filter': 'invert(1) hue-rotate(180deg)',
    filter: 'invert(1) hue-rotate(180deg)'
  },
  img: {
    '-webkit-filter': 'invert(1) hue-rotate(180deg)',
    filter: 'invert(1) hue-rotate(180deg)'
  }
}
const LIGHT_THEME_CONFIG = {
  html: { background: 'white' }
}
const MAX_FONT_SIZE_PERCENTAGE = 150
const MIN_FONT_SIZE_PERCENTAGE = 50
const FONT_SIZE_PERCENTAGE_STEP = 10

export default defineComponent({
  name: 'EpubReader',
  props: {
    applicationConfig: { type: Object as PropType<AppConfigObject>, required: true },
    currentContent: {
      type: String,
      required: true
    },
    isReadOnly: { type: Boolean, required: false },
    resource: { type: Object as PropType<Resource>, required: true }
  },
  emits: ['close'],
  setup(props) {
    const keyboardActions = useKeyboardActions()
    const bookContainer = ref<Element>()
    const chapters = ref<NavItem[]>([])
    const currentChapter = ref<NavItem>()
    const navigateLeftDisabled = ref(false)
    const navigateRightDisabled = ref(false)
    const localStorageData = useLocalStorage<{ fontSizePercentage?: number }>(`oc_epubReader`, {})
    const currentFontSizePercentage = ref(unref(localStorageData).fontSizePercentage || 100)
    const themeStore = useThemeStore()
    const book = ref<Book>()
    const rendition = ref<Rendition>()

    const navigateLeft = () => {
      unref(rendition).prev()
    }

    const navigateRight = () => {
      unref(rendition).next()
    }

    const showChapter = (chapter: NavItem) => {
      unref(rendition).display(chapter.href)
    }

    const increaseFontSize = () => {
      currentFontSizePercentage.value = Math.min(
        unref(currentFontSizePercentage) + FONT_SIZE_PERCENTAGE_STEP,
        MAX_FONT_SIZE_PERCENTAGE
      )
    }

    const resetFontSize = () => {
      currentFontSizePercentage.value = 100
    }

    const decreaseFontSize = () => {
      currentFontSizePercentage.value = Math.max(
        unref(currentFontSizePercentage) - FONT_SIZE_PERCENTAGE_STEP,
        MIN_FONT_SIZE_PERCENTAGE
      )
    }

    const increaseFontSizeDisabled = computed(() => {
      return unref(currentFontSizePercentage) >= MAX_FONT_SIZE_PERCENTAGE
    })

    const decreaseFontSizeDisabled = computed(() => {
      return unref(currentFontSizePercentage) <= MIN_FONT_SIZE_PERCENTAGE
    })

    keyboardActions.bindKeyAction({ primary: Key.ArrowLeft }, () => navigateLeft())
    keyboardActions.bindKeyAction({ primary: Key.ArrowRight }, () => navigateRight())

    watch(
      () => props.currentContent,
      async () => {
        await nextTick()

        if (unref(book)) {
          unref(book).destroy()
        }

        const localStorageResourceData = useLocalStorage<{ currentLocation?: Location }>(
          `oc_epubReader_resource_${props.resource.id}`,
          {}
        )

        book.value = ePub(props.currentContent)

        unref(book).loaded.navigation.then(({ toc }) => {
          chapters.value = toc
          currentChapter.value = toc?.[0]
        })

        rendition.value = unref(book).renderTo(unref(bookContainer), {
          flow: 'paginated',
          width: 650,
          height: '90%' // Don't use full height to avoid cut-off text
        })

        unref(rendition).themes.register('dark', DARK_THEME_CONFIG)
        unref(rendition).themes.register('light', LIGHT_THEME_CONFIG)
        unref(rendition).themes.select(themeStore.currentTheme.isDark ? 'dark' : 'light')
        unref(rendition).themes.fontSize(`${unref(currentFontSizePercentage)}%`)
        unref(rendition).display(unref(localStorageResourceData)?.currentLocation?.start?.cfi)

        unref(rendition).on('keydown', (event: KeyboardEvent) => {
          if (event.key === Key.ArrowLeft) {
            navigateLeft()
          }
          if (event.key === Key.ArrowRight) {
            navigateRight()
          }
        })

        unref(rendition).on('relocated', () => {
          const currentLocation = unref(rendition).currentLocation() as any & Location
          localStorageResourceData.value = { currentLocation }
          navigateLeftDisabled.value = currentLocation.atStart === true
          navigateRightDisabled.value = currentLocation.atEnd === true

          const locationCfi = currentLocation.start.cfi
          const spineItem = unref(book).spine.get(locationCfi)
          const navItem = unref(book).navigation.get(spineItem.href)
          // Might be sub nav item and therefore undefined
          if (navItem) {
            currentChapter.value = navItem
          }
        })
      },
      {
        immediate: true
      }
    )

    watch(currentFontSizePercentage, () => {
      unref(rendition).themes.fontSize(`${unref(currentFontSizePercentage)}%`)
      localStorageData.value = {
        ...unref(localStorageData),
        fontSizePercentage: unref(currentFontSizePercentage)
      }
    })

    return {
      bookContainer,
      navigateLeft,
      navigateLeftDisabled,
      navigateRight,
      navigateRightDisabled,
      currentChapter,
      chapters,
      showChapter,
      resetFontSize,
      increaseFontSize,
      decreaseFontSize,
      increaseFontSizeDisabled,
      decreaseFontSizeDisabled,
      currentFontSizePercentage,
      FONT_SIZE_PERCENTAGE_STEP,
      rendition,
      book
    }
  }
})
</script>
<style lang="scss">
.epub-reader {
  &-chapters-list {
    background: var(--oc-role-surface-container);
    border-right: 0.5px solid var(--oc-role-outline-variant);
    width: 240px;
    overflow-y: auto;

    &-item:not(:last-child) {
      border-bottom: 0.5px solid var(--oc-role-outline-variant);
    }

    &-item.active {
      .oc-button {
        font-weight: var(--oc-font-weight-semibold);
      }
    }
  }

  &-controls-font-size {
    flex-wrap: nowrap;

    &-reset {
      width: 58px; //prevent jumpy behaviour
    }
  }
}
</style>
