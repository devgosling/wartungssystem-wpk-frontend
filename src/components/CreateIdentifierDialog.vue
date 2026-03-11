<template>
  <Dialog
    :visible="open"
    :closable="false"
    modal
    header="Neuen Identifikator anlegen"
    :style="{ width: '30rem' }"
  >
    <p class="createidentifierdialog-desc">
      Erstelle einen neuen Identifikator für den Kunden {{ $parent.inputValues.customer.name }}
    </p>
    <div class="createidentifierdialog-inputgroup">
      <label for="business">Unternehmensname</label>
      <InputText
        fluid
        v-model="$parent.inputValues.customer.name"
        id="business"
        disabled
        placeholder="Kromholz Wassertechnik"
      ></InputText>
    </div>
    <div class="createidentifierdialog-inputchips">
      <label for="identifiers">Neue Identifikatoren hinzufügen</label>
      <AutoComplete
        class="createidentifierdialog-inputchips-input"
        v-model="dialogValues.identifiers"
        multiple
        fluid
        :typeahead="true"
        id="indentifiers"
        :suggestions="suggestions"
        @input="keydown($event)"
      ></AutoComplete>
      <span>Benutze Enter um einen Identifikater hinzuzufügen.</span>
    </div>
    <div class="createidentifierdialog-btns">
      <Button severity="secondary" size="medium" @click="$emit('close')" label="Abbrechen"></Button>
      <Button
        severity="contrast"
        size="medium"
        :disabled="dialogValues.identifiers.length == 0"
        label="Hinzufügen"
        :loading="addingIdentifiers"
        @click="addIdentifiers"
      ></Button>
    </div>
  </Dialog>
</template>
<script>
import { ID, databases } from '@/lib/appwrite'
import { validate } from 'email-validator'
import { AutoComplete, Button, Dialog, InputNumber, InputText } from 'primevue'

export default {
  components: {
    Dialog,
    Button,
    InputText,
    InputNumber,
    AutoComplete,
  },

  data() {
    return {
      invalidEmail: false,

      suggestions: [],

      addingIdentifiers: false,
      dialogValues: {
        identifiers: [],
      },
    }
  },

  props: {
    open: Boolean,
    customerID: String,
  },

  methods: {
    keydown(event) {
      this.suggestions = [event.target.value]
    },
    async addIdentifiers() {
      this.addingIdentifiers = true

      let customerData = await databases.getDocument(
        'wartungssystem',
        'customer',
        this.customerID,
      )

      customerData.identifiers.push(...this.dialogValues.identifiers)

      await databases.updateDocument(
        'wartungssystem',
        'customer',
        this.customerID,
        {
          identifiers: customerData.identifiers,
        },
      )

      this.$emit('close')
      this.$emit('createdidentifiers')
      this.addIdentifiers = false

      setTimeout(() => {
        this.dialogValues = {
          identifiers: [],
        }
      }, 100)
    },
  },
}
</script>
<style lang="scss">
.createidentifierdialog {
  &-desc {
    margin-top: 0;
    color: var(--p-surface-500);
  }
  &-inputchips {
    margin-top: 1rem;

    &-input {
      margin-top: 0.2rem;
    }

    span {
      font-size: 0.85rem;
      color: var(--p-surface-400);
    }

    label {
      font-weight: 600;
    }
  }
  &-inputgroup {
    display: flex;
    gap: 1rem;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.3rem;

    .p-inputnumber,
    > .p-inputtext {
      max-width: 65%;
    }

    label {
      min-width: max-content;
      font-weight: 600;
    }
  }
  &-btns {
    display: flex;
    gap: 0.5rem;
    justify-content: end;
    margin-top: 0.6rem;
  }
}
</style>
