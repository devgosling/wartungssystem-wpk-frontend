<template>
  <Dialog
    :visible="open"
    :closable="false"
    modal
    header="Neuen Kunde anlegen"
    :style="{ width: '35rem' }"
  >
    <p class="createcustomerdialog-desc">Erstelle einen neuen Kunde</p>
    <div class="createcustomerdialog-inputgroup">
      <label for="business">Unternehmensname</label>
      <InputText
        fluid
        v-model="dialogValues.businessname"
        id="business"
        placeholder="WPK Prozesstechnik"
      ></InputText>
    </div>
    <div class="createcustomerdialog-inputgroup">
      <label for="street">Straße + Hausnr.</label>
      <InputText
        fluid
        v-model="dialogValues.street"
        id="street"
        placeholder="Am Werrtor 12a"
      ></InputText>
    </div>
    <div class="createcustomerdialog-inputgroup">
      <label for="zipcode">Postleitzahl</label>
      <InputNumber
        fluid
        :useGrouping="false"
        v-model="dialogValues.zipcode"
        id="zipcode"
        placeholder="68647"
      ></InputNumber>
    </div>
    <div class="createcustomerdialog-inputgroup">
      <label for="city">Stadt / Ort</label>
      <InputText
        fluid
        v-model="dialogValues.city"
        id="city"
        disabled
        placeholder="Biblis"
      ></InputText>
    </div>
    <div class="createcustomerdialog-inputchips">
      <label for="email">E-Mail Adresse(n)</label>
      <AutoComplete
        class="createcustomerdialog-inputchips-input"
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
    <div class="createcustomerdialog-inputchips">
      <label for="identifiers">Identifikatoren einrichten (Optional)</label>
      <AutoComplete
        class="createcustomerdialog-inputchips-input"
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
    <div class="createcustomerdialog-btns">
      <Button severity="secondary" size="medium" @click="$emit('close')" label="Abbrechen"></Button>
      <Button
        severity="contrast"
        size="medium"
        :disabled="
          !(
            dialogValues.businessname &&
            dialogValues.street &&
            dialogValues.zipcode &&
            dialogValues.city &&
            dialogValues.emailArray
          )
        "
        label="Kunde erstellen"
        :loading="creatingCustomer"
        @click="createCustomer"
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

      creatingCustomer: false,
      dialogValues: {
        businessname: null,
        street: null,
        zipcode: null,
        city: null,
        email: null,
        identifiers: [],
        emailArray: [],
      },
    }
  },

  props: {
    open: Boolean,
  },

  watch: {
    async 'dialogValues.zipcode'(newVal) {
      let res = await fetch('https://openplzapi.org/de/Localities?postalCode=' + newVal)
      let json = await res.json()
      this.dialogValues.city = json[0].name
    },
  },

  methods: {
    keydown(event) {
      this.suggestions = [event.target.value]
    },
    async createCustomer() {
      this.creatingCustomer = true
      for (const email of this.dialogValues.emailArray) {
        if (!validate(email)) {
          this.$toast.add({
            severity: 'error',
            summary: 'Üngültige E-Mail Adresse',
            detail: `Die angegebene E-Mail (${email}) ist ungültig`,
            life: 5000,
          })
          this.invalidEmail = true
          this.creatingCustomer = false
          return
        }
      }

      await databases.createDocument('wartungssystem', 'customer', ID.unique(), {
        name: this.dialogValues.businessname,
        'address.street': this.dialogValues.street,
        'address.zipcode': this.dialogValues.zipcode.toString(),
        'address.city': this.dialogValues.city,
        emailArray: this.dialogValues.emailArray,
        identifiers: this.dialogValues.identifiers,
      })

      this.$emit('close')
      this.$emit('createdcustomer')
      this.creatingCustomer = false

      setTimeout(() => {
        this.dialogValues = {
          businessname: null,
          street: null,
          zipcode: null,
          city: null,
          email: null,
          identifiers: [],
          emailArray: [],
        }
      }, 100)
    },
  },
}
</script>
<style lang="scss">
.createcustomerdialog {
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
