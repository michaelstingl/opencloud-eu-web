<template>
  <div class="item-filter oc-flex" :class="`item-filter-${filterName}`">
    <oc-filter-chip
      :filter-label="filterLabel"
      :selected-item-names="selectedItems.map((i) => i[displayNameAttribute])"
      :close-on-click="closeOnClick"
      @clear-filter="clearFilter"
      @show-drop="showDrop"
    >
      <template #default>
        <oc-text-input
          v-if="showOptionFilter && filterableAttributes.length"
          ref="filterInputRef"
          v-model="filterTerm"
          class="item-filter-input oc-mb-m oc-mt-s"
          autocomplete="off"
          :label="optionFilterLabel === '' ? $gettext('Filter list') : optionFilterLabel"
        />
        <div ref="itemFilterListRef">
          <oc-list class="item-filter-list">
            <li v-for="(item, index) in displayedItems" :key="index" class="oc-my-xs">
              <oc-button
                class="item-filter-list-item oc-flex oc-flex-middle oc-width-1-1 oc-p-s"
                :class="{
                  'item-filter-list-item-active': !allowMultiple && isItemSelected(item),
                  'oc-flex-left': allowMultiple,
                  'oc-flex-between': !allowMultiple
                }"
                justify-content="space-between"
                appearance="raw"
                :data-test-value="item[displayNameAttribute as keyof Item]"
                @click="toggleItemSelection(item)"
              >
                <div class="oc-flex oc-flex-middle oc-text-truncate">
                  <oc-checkbox
                    v-if="allowMultiple"
                    size="large"
                    class="item-filter-checkbox oc-mr-s"
                    :label="$gettext('Toggle selection')"
                    :model-value="isItemSelected(item)"
                    :label-hidden="true"
                    @update:model-value="toggleItemSelection(item)"
                    @click.stop
                  />
                  <div>
                    <slot name="image" :item="item" />
                  </div>
                  <div class="oc-text-truncate oc-ml-s">
                    <slot name="item" :item="item" />
                  </div>
                </div>
                <div class="oc-flex">
                  <oc-icon v-if="!allowMultiple && isItemSelected(item)" name="check" />
                </div>
              </oc-button>
            </li>
          </oc-list>
        </div>
      </template>
    </oc-filter-chip>
  </div>
</template>

<script lang="ts">
import { PropType, defineComponent, nextTick, onMounted, ref, unref, watch } from 'vue'
import Fuse, { FuseOptionKey } from 'fuse.js'
import Mark from 'mark.js'
import omit from 'lodash-es/omit'
import { useRoute, useRouteQuery, useRouter } from '../composables'
import { defaultFuseOptions } from '../helpers'
import { queryItemAsString } from '../composables/appDefaults'

type Item = unknown

export default defineComponent({
  name: 'ItemFilter',
  props: {
    filterLabel: {
      type: String,
      required: true
    },
    filterName: {
      type: String,
      required: true
    },
    optionFilterLabel: {
      type: String,
      required: false,
      default: ''
    },
    showOptionFilter: {
      type: Boolean,
      required: false,
      default: false
    },
    items: {
      type: Array as PropType<Item[]>,
      required: true
    },
    allowMultiple: {
      type: Boolean,
      required: false,
      default: false
    },
    idAttribute: {
      type: String,
      required: false,
      default: 'id'
    },
    displayNameAttribute: {
      type: String,
      required: false,
      default: 'name'
    },
    filterableAttributes: {
      type: Array as PropType<FuseOptionKey<Item>[]>,
      required: false,
      default: (): FuseOptionKey<Item>[] => []
    },
    closeOnClick: {
      type: Boolean,
      default: false
    }
  },
  emits: ['selectionChange'],
  setup: function (props, { emit, expose }) {
    const router = useRouter()
    const currentRoute = useRoute()
    const filterInputRef = ref()
    const selectedItems = ref([])
    const displayedItems = ref(props.items)
    const markInstance = ref(null)
    const itemFilterListRef = ref(null)

    const queryParam = `q_${props.filterName}`
    const currentRouteQuery = useRouteQuery(queryParam)

    const getId = (item: Item) => {
      return item[props.idAttribute as keyof Item]
    }

    const setRouteQuery = () => {
      return router.push({
        query: {
          ...omit(unref(currentRoute).query, [queryParam]),
          ...(!!unref(selectedItems).length && {
            [queryParam]: unref(selectedItems)
              .reduce((acc, item) => {
                acc += `${getId(item)}+`
                return acc
              }, '')
              .slice(0, -1)
          })
        }
      })
    }

    const isItemSelected = (item: Item) => {
      return !!unref(selectedItems).find((s) => getId(s) === getId(item))
    }

    const toggleItemSelection = async (item: Item) => {
      if (isItemSelected(item)) {
        selectedItems.value = unref(selectedItems).filter((s) => getId(s) !== getId(item))
      } else {
        if (!props.allowMultiple) {
          selectedItems.value = []
        }
        selectedItems.value.push(item)
      }
      await setRouteQuery()
      emit('selectionChange', unref(selectedItems))
    }

    const filterTerm = ref()
    const filter = (items: Item[], filterTerm: string) => {
      if (!(filterTerm || '').trim()) {
        return items
      }
      const fuse = new Fuse(items, {
        ...defaultFuseOptions,
        keys: props.filterableAttributes
      })

      const results = fuse.search(filterTerm).map((r) => r.item)
      return items.filter((item) => results.includes(item))
    }
    const clearFilter = () => {
      selectedItems.value = []
      emit('selectionChange', unref(selectedItems))
      setRouteQuery()
    }

    const setDisplayedItems = (items: Item[]) => {
      displayedItems.value = items
    }

    const showDrop = async () => {
      setDisplayedItems(props.items)
      await nextTick()
      unref(filterInputRef)?.focus()
    }

    watch(filterTerm, () => {
      setDisplayedItems(filter(props.items, unref(filterTerm)))
      if (unref(itemFilterListRef)) {
        markInstance.value = new Mark(unref(itemFilterListRef))
        unref(markInstance).unmark()
        unref(markInstance).mark(unref(filterTerm), {
          element: 'span',
          className: 'mark-highlight'
        })
      }
    })

    const setSelectedItemsBasedOnQuery = () => {
      const queryStr = queryItemAsString(unref(currentRouteQuery))
      if (queryStr) {
        const ids = queryStr.split('+')
        selectedItems.value = props.items.filter((s) => ids.includes(getId(s)))
      }
    }

    expose({ setSelectedItemsBasedOnQuery })

    onMounted(() => {
      setSelectedItemsBasedOnQuery()
    })

    return {
      clearFilter,
      displayedItems,
      filterInputRef,
      filterTerm,
      isItemSelected,
      itemFilterListRef,
      queryParam,
      selectedItems,
      setDisplayedItems,
      showDrop,
      toggleItemSelection,
      // expose to type
      setSelectedItemsBasedOnQuery
    }
  }
})
</script>

<style lang="scss">
.item-filter {
  &-list {
    li {
      &:first-child {
        margin-top: 0 !important;
      }
      &:last-child {
        margin-bottom: 0 !important;
      }
    }

    &-item {
      line-height: 1.5;
      gap: 8px;
    }
  }
}
</style>
