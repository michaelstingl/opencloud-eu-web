<template>
  <oc-table :fields="fields" :data="data">
    <template #fileName="{ item }">
      <span>{{ item.fileName }}</span>
    </template>
    <template #size="{ item }">
      <span>{{ item.size }}</span>
    </template>
    <template #footer> Total: {{ data.length }} resources </template>
  </oc-table>
</template>

<script setup lang="ts">
import { FieldType } from '@opencloud-eu/design-system/helpers'

const fields: FieldType[] = [
  {
    name: 'fileName',
    title: 'Filename',
    type: 'slot',
    alignH: 'left'
  },
  {
    name: 'size',
    title: 'Size',
    type: 'slot',
    alignH: 'right'
  }
]

const data = [
  {
    id: '83558362-3fc6-4b96-a2e5-dba7435c4fae',
    fileName: 'textfile.txt',
    size: 50
  },
  {
    id: 'fbd793d3-c36c-4f92-bff6-dfeebaec8248',
    fileName: 'Some Folder',
    size: 9482
  },
  {
    id: '0e77c768-7ce9-4afe-a3e7-c9a1b0b42c94',
    fileName: 'image.png',
    size: 754
  }
]
</script>
