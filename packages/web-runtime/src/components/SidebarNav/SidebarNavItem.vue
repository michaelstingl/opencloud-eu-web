<template>
  <li class="oc-sidebar-nav-item oc-pb-xs oc-px-s" :aria-current="active ? 'page' : null">
    <oc-button
      :type="handler ? 'button' : 'router-link'"
      :appearance="active ? 'filled' : 'raw-inverse'"
      :color-role="active ? 'surface' : 'secondaryContainer'"
      :class="['oc-sidebar-nav-item-link', 'oc-oc-width-1-1', { active: active }]"
      :data-nav-id="index"
      :data-nav-name="navName"
      :aria-label="
        collapsed ? $gettext('Navigate to %{ pageName } page', { pageName: name }) : undefined
      "
      v-bind="attrs"
    >
      <span class="oc-flex">
        <oc-icon :name="icon" :fill-type="fillType" />
        <span class="oc-ml-m text" :class="{ 'text-invisible': collapsed }" v-text="name" />
      </span>
    </oc-button>
  </li>
</template>
<script lang="ts">
import { FillType } from '@opencloud-eu/design-system/helpers'
import { useRouter } from '@opencloud-eu/web-pkg'
import { computed, defineComponent, PropType, unref } from 'vue'
import { RouteLocationRaw } from 'vue-router'

export default defineComponent({
  props: {
    name: {
      type: String,
      required: true
    },
    index: {
      type: String,
      required: true
    },
    active: {
      type: Boolean,
      required: false,
      default: false
    },
    target: {
      type: [String, Object] as PropType<RouteLocationRaw>,
      required: false,
      default: null
    },
    icon: {
      type: String,
      required: true
    },
    fillType: {
      type: String as PropType<FillType>,
      required: false,
      default: 'fill'
    },
    collapsed: {
      type: Boolean,
      required: false,
      default: false
    },
    handler: {
      type: Function as PropType<() => void>,
      required: false,
      default: null
    }
  },
  setup(props) {
    const router = useRouter()

    const attrs = computed(() => {
      return {
        ...(props.handler && { onClick: props.handler }),
        ...(props.target && { to: props.target })
      }
    })

    const navName = computed(() => {
      if (props.target) {
        return router?.resolve(props.target, unref(router.currentRoute))?.name || 'route.name'
      }
      return props.name
    })

    return { attrs, navName }
  }
})
</script>

<style lang="scss">
.oc-sidebar-nav-item-link {
  position: relative;
  align-items: center !important;
  display: flex !important;
  justify-content: space-between !important;
  padding: var(--oc-space-small) !important;
  border-radius: 5px;
  white-space: nowrap;
  user-select: none;

  .oc-tag {
    background-color: var(--oc-role-tertiary-container);
    color: var(--oc-role-on-tertiary-container);
    svg {
      fill: var(--oc-role-on-tertiary-container);
    }
  }
  .text {
    opacity: 1;
    transition: all 0.3s;
  }
  .text-invisible {
    opacity: 0 !important;
    transition: 0s;
  }

  &.active {
    overflow: hidden;
  }
  &:focus,
  &:hover {
    text-decoration: none !important;
  }

  &:focus:not(.active),
  &:hover:not(.active) {
    background: var(--oc-role-secondary-container) !important;
  }

  .oc-icon svg {
    transition: all 0.3s;
  }
}
</style>
