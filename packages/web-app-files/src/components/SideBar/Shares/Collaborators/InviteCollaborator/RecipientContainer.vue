<template>
  <oc-recipient
    :data-testid="`recipient-container-${formattedRecipient.name}`"
    class="files-share-invite-recipient"
    :recipient="formattedRecipient"
  >
    <template #append>
      <oc-button
        class="files-share-invite-recipient-btn-remove raw-hover-surface"
        appearance="raw"
        :aria-label="btnDeselectRecipientLabel"
        @click.stop="deselect(recipient)"
      >
        <oc-icon name="close" size="small" />
      </oc-button>
    </template>
  </oc-recipient>
</template>

<script lang="ts">
import { avatarUrl } from '../../../../../helpers/user'
import { CollaboratorAutoCompleteItem, ShareTypes } from '@opencloud-eu/web-client'
import { computed, defineComponent, PropType } from 'vue'
import { Recipient } from '@opencloud-eu/design-system/helpers'
import { useCapabilityStore, useConfigStore } from '@opencloud-eu/web-pkg'
import { storeToRefs } from 'pinia'

export default defineComponent({
  props: {
    recipient: {
      type: Object as PropType<CollaboratorAutoCompleteItem>,
      required: true
    },
    deselect: {
      type: Function,
      required: false,
      default: null
    }
  },
  setup(props) {
    const capabilityStore = useCapabilityStore()
    const capabilityRefs = storeToRefs(capabilityStore)

    const configStore = useConfigStore()
    const { serverUrl } = storeToRefs(configStore)

    const externalIssuer = computed(() => {
      if (props.recipient.shareType === ShareTypes.remote.value) {
        return props.recipient.identities?.[0]?.issuer
      }
      return ''
    })

    return {
      serverUrl,
      userProfilePicture: capabilityRefs.sharingUserProfilePicture,
      externalIssuer
    }
  },
  data(): { formattedRecipient: Recipient } {
    let name = this.recipient.displayName
    if (this.externalIssuer) {
      name += ` (${this.externalIssuer})`
    }

    return {
      formattedRecipient: {
        name,
        icon: this.getRecipientIcon(),
        hasAvatar: this.recipient.shareType === ShareTypes.user.value,
        isLoadingAvatar: true
      }
    }
  },

  computed: {
    btnDeselectRecipientLabel() {
      return this.$gettext('Deselect %{name}', { name: this.recipient.displayName })
    }
  },

  async created() {
    if (this.userProfilePicture && this.formattedRecipient.hasAvatar) {
      try {
        this.formattedRecipient.avatar = await avatarUrl({
          clientService: this.$clientService,
          server: this.serverUrl,
          username: this.recipient.displayName
        })
      } catch (error) {
        console.error(error)
      }
    }

    this.formattedRecipient.isLoadingAvatar = false
  },

  methods: {
    getRecipientIcon() {
      switch (this.recipient.shareType) {
        case ShareTypes.group.value:
          return {
            name: ShareTypes.group.icon,
            label: this.$gettext('Group')
          }

        case ShareTypes.guest.value:
          return {
            name: ShareTypes.guest.icon,
            label: this.$gettext('Guest user')
          }

        case ShareTypes.remote.value:
          return {
            name: ShareTypes.remote.icon,
            label: this.$gettext('External user')
          }

        default:
          return {
            name: ShareTypes.user.icon,
            label: this.$gettext('User')
          }
      }
    }
  }
})
</script>

<style lang="scss">
.files-share-invite-recipient {
  margin: 4px 2px 0;
  padding: 0 0.25em;
  overflow-wrap: anywhere;

  .oc-recipient-avatar {
    min-width: 16.8px;
  }
}
</style>
