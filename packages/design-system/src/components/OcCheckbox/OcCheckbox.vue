<template>
  <span @click="$emit('click', $event)">
    <input
      :id="id"
      v-model="model"
      type="checkbox"
      name="checkbox"
      :class="classes"
      :value="option"
      :disabled="disabled"
      :aria-label="labelHidden ? label : null"
      @keydown.enter="keydownEnter"
    />
    <label v-if="!labelHidden" :for="id" :class="labelClasses" v-text="label" />
  </span>
</template>

<script setup lang="ts">
import { computed, unref } from 'vue'
import { isEqual } from 'lodash-es'
import { getSizeClass, uniqueId } from '../../helpers'

export interface Props {
  /**
   * @docs The label of the checkbox element.
   */
  label: string
  /**
   * @docs Determines if the checkbox is disabled.
   *
   */
  disabled?: boolean
  /**
   * @docs The element ID of the checkbox.
   */
  id?: string
  /**
   * @docs Determines if the label is hidden visually. Note that the label will still be read by screen readers.
   * @default false
   */
  labelHidden?: boolean
  /**
   * @docs The option value of the checkbox.
   */
  option?: unknown
  /**
   * @docs The size of the checkbox.
   * @default medium
   */
  size?: 'small' | 'medium' | 'large'
}

export interface Emits {
  /**
   * @docs Emitted when the checkbox has been clicked.
   */
  (e: 'click', event: MouseEvent | KeyboardEvent): void
}

const {
  label,
  disabled = false,
  id = uniqueId('oc-checkbox-'),
  option,
  labelHidden = false,
  size = 'medium'
} = defineProps<Props>()

const emit = defineEmits<Emits>()

const model = defineModel<boolean | unknown[]>()

const classes = computed(() => [
  'oc-checkbox',
  'oc-rounded',
  'oc-checkbox-' + getSizeClass(size),
  { 'oc-checkbox-checked': isChecked.value }
])

const labelClasses = computed(() => ({
  'oc-cursor-pointer': !disabled
}))

const isChecked = computed(() => {
  const val = unref(model)
  if (Array.isArray(val)) {
    return val.some((m) => isEqual(m, option))
  }
  return val
})

const keydownEnter = (event: KeyboardEvent) => {
  model.value = !model.value
  emit('click', event)
}
</script>

<style lang="scss">
@mixin oc-form-check-size($factor) {
  height: $oc-size-form-check-default * $factor;
  width: $oc-size-form-check-default * $factor;
}

.oc-checkbox {
  @include oc-form-check-size(1);
  -webkit-appearance: none;
  -moz-appearance: none;

  background-position: 50% 50% !important;
  background-repeat: no-repeat !important;
  border: 2px solid var(--oc-role-outline);
  display: inline-block;
  overflow: hidden;
  vertical-align: middle;
  background-color: transparent;
  outline: none;

  &-s {
    @include oc-form-check-size(0.7);
  }

  &-m {
    @include oc-form-check-size(1);
  }

  &-l {
    @include oc-form-check-size(1.5);
  }

  &:hover {
    cursor: pointer;
  }

  &:focus-visible {
    outline: var(--oc-role-secondary) auto 1px;
  }

  &-checked,
  :checked,
  &:indeterminate {
    background-color: white;
  }

  &-checked,
  :checked {
    @include svg-fill($internal-form-checkbox-image, '#000', '#000');
  }

  &:indeterminate {
    @include svg-fill($internal-form-checkbox-indeterminate-image, '#000', '#000');
  }

  &:disabled {
    background-color: $form-radio-disabled-background;
    cursor: default;
    opacity: 0.4;
  }

  &:disabled:checked {
    @include svg-fill($internal-form-checkbox-image, '#000', $form-radio-disabled-icon-color);
  }

  &:disabled:indeterminate {
    @include svg-fill(
      $internal-form-checkbox-indeterminate-image,
      '#000',
      $form-radio-disabled-icon-color
    );
  }
}

label > .oc-checkbox + span {
  margin-left: var(--oc-space-xsmall);
}
</style>
