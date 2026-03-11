<template>
  <Dialog
    :visible="open"
    :closable="false"
    modal
    header="Kunden bearbeiten"
    :style="{ width: '35rem' }"
  >
    <p class="viewcustomerdialog-desc">Bearbeite einen existierenden Kunden</p>
    <div class="viewcustomerdialog-inputgroup">
      <label for="business">Unternehmensname</label>
      <InputText
        fluid
        v-model="dialogValues['name']"
        id="business"
        placeholder="WPK Prozesstechnik"
      ></InputText>
    </div>
    <div class="viewcustomerdialog-inputgroup">
      <label for="street">Straße + Hausnr.</label>
      <InputText
        fluid
        v-model="dialogValues['address.street']"
        id="street"
        placeholder="Am Werrtor 12a"
      ></InputText>
    </div>
    <div class="viewcustomerdialog-inputgroup">
      <label for="zipcode">Postleitzahl</label>
      <InputNumber
        class="viewcustomerdialog-inputgroup-numinp"
        fluid
        :useGrouping="false"
        v-model="dialogValues['address.zipcode']"
        id="zipcode"
        placeholder="68647"
      ></InputNumber>
    </div>
    <div class="viewcustomerdialog-inputgroup">
      <label for="city">Stadt / Ort</label>
      <InputText
        fluid
        v-model="dialogValues['address.city']"
        id="city"
        disabled
        placeholder="Biblis"
      ></InputText>
    </div>
    <div class="viewcustomerdialog-inputchips">
      <label for="email">E-Mail Adresse(n)</label>
      <AutoComplete
        class="viewcustomerdialog-inputchips-input"
        multiple
        fluid
        :invalid="invalidEmail"
        v-model="dialogValues.emailArray"
        :suggestions="suggestions"
        :typeahead="true"
        @input="keydown($event)"
        id="email"
      ></AutoComplete>
    </div>
    <div class="viewcustomerdialog-inputchips">
      <label for="identifiers">Identifikatoren bearbeiten</label>
      <AutoComplete
        class="viewcustomerdialog-inputchips-input"
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
    <div class="viewcustomerdialog-btns">
      <Button severity="secondary" size="medium" @click="$emit('close')" label="Abbrechen"></Button>
      <Button
        severity="contrast"
        size="medium"
        :disabled="
          !(
            dialogValues.name &&
            dialogValues['address.street'] &&
            dialogValues['address.zipcode'] &&
            dialogValues['address.city'] &&
            dialogValues.emailArray
          ) || isEqual(dialogValues, data)
        "
        label="Änderungen Speichern"
        :loading="editingCustomer"
        @click="editCustomer"
      ></Button>
    </div>
  </Dialog>
</template>
<script>
import { ID, databases } from '@/lib/appwrite'
import { validate } from 'email-validator'
import { AutoComplete, Button, Dialog, InputNumber, InputText } from 'primevue'
import { isEqual } from 'lodash'

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
      isEqual: isEqual,

      invalidEmail: false,

      suggestions: [],

      editingCustomer: false,
      dialogValues: {
        name: null,
        'address.street': null,
        'address.zipcode': null,
        'address.city': null,
        email: null,
        identifiers: [],
        emailArray: [],
      },
    }
  },

  props: {
    open: Boolean,
    data: Object,
  },

  watch: {
    async open(newVal) {
      if (newVal) {
        this.dialogValues = JSON.parse(JSON.stringify(this.data))
      }
    },
  },

  created() {
    // watch the computed accessor for the dotted-key path
    this.$watch(
      () => this.dialogValues['address.zipcode'],
      async (newVal) => {
        if (!newVal) return
        try {
          const res = await fetch(
            `https://openplzapi.org/de/Localities?postalCode=${encodeURIComponent(newVal)}`,
          )
          const json = await res.json()
          if (json && json[0]) {
            // update dotted-key field
            this.dialogValues['address.city'] = json[0].name
          }
        } catch (err) {
          console.error(err)
        }
      },
    )
  },

  methods: {
    keydown(event) {
      this.suggestions = [event.target.value]
    },
    async editCustomer() {
      this.editingCustomer = true
      for (const email of this.dialogValues.emailArray) {
        if (!validate(email)) {
          this.$toast.add({
            severity: 'error',
            summary: 'Üngültige E-Mail Adresse',
            detail: `Die angegebene E-Mail (${email}) ist ungültig`,
            life: 5000,
          })
          this.invalidEmail = true
          this.editingCustomer = false
          return
        }
      }

      await databases.updateDocument(
        'wartungssystem',
        'customer',
        this.data.$id,
        {
          name: this.dialogValues.name,
          'address.street': this.dialogValues['address.street'],
          'address.zipcode': this.dialogValues['address.zipcode'].toString(),
          'address.city': this.dialogValues['address.city'],
          emailArray: this.dialogValues.emailArray,
          identifiers: this.dialogValues.identifiers,
        },
      )

      this.$emit('close')
      this.$emit('editedcustomer')
      this.editingCustomer = false

      setTimeout(() => {
        this.dialogValues = {
          name: null,
          'address.street': null,
          'address.zipcode': null,
          'address.city': null,
          email: null,
          emailArray: [],
          identifiers: [],
        }
      }, 100)
    },
  },
}
</script>
<style lang="scss">
.viewcustomerdialog {
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
