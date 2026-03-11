<template>
  <div class="customers">
    <div class="customers-header">
      <h1>Kundenverwaltung</h1>
      <div>
        <Button
          icon="fa-regular fa-plus"
          @click="openDialog = true"
          label="Neuen Kunde anlegen"
          severity="contrast"
        />
      </div>
    </div>
    <Card>
      <template #content>
        <DataTable v-model:filters="filters" :value="customers?.documents" :loading="!customers">
          <template #header>
            <div style="display: flex; justify-content: space-between; align-items: center">
              <h4 style="margin: 0">{{ customers?.total }} Kunden</h4>
              <IconField>
                <InputIcon>
                  <i class="fa-regular fa-search" />
                </InputIcon>
                <InputText v-model="filters['global'].value" placeholder="Suchen..." />
              </IconField>
            </div>
          </template>
          <Column field="" header="#">
            <template #body="slotProps">
              {{ slotProps.data.$sequence }}
            </template>
          </Column>
          <Column field="name" header="Name"> </Column>
          <Column field="emailArray" header="Buchaltungs Email-Addresse(n)">
            <template #body="slotProps">
              {{ slotProps.data.emailArray.join(', ') }}
            </template></Column
          >
          <Column field="wartungsberichte" header="Wartungen">
            <template #body="slotProps">
              {{
                slotProps.data.wartungsberichte +
                ' Bericht' +
                (slotProps.data.wartungsberichte > 1
                  ? 'e'
                  : slotProps.data.wartungsberichte == 0
                    ? 'e'
                    : '')
              }}
            </template>
          </Column>
          <Column field="" header="Aktionen">
            <template #body="slotProps">
              <div style="display: flex; gap: 0.2rem">
                <Button
                  icon="fa-regular fa-eye"
                  @click="viewCustomer($event, slotProps.data, slotProps.index)"
                  severity="info"
                  size="small"
                ></Button
                ><Button
                  icon="fa-regular fa-trash"
                  :loading="deletingCustomer == slotProps.index"
                  @click="deleteCustomer($event, slotProps.data, slotProps.index)"
                  severity="danger"
                  label="Löschen"
                  size="small"
                ></Button>
              </div>
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>
  </div>
  <CreateCustomerDialog
    :open="openDialog"
    @close="openDialog = false"
    @createdcustomer="retrieveCustomers"
  ></CreateCustomerDialog>
  <ViewCustomerDialog
    :open="viewingCustomer !== null"
    :data="viewingCustomer"
    @close="viewingCustomer = null"
    @editedcustomer="retrieveCustomers"
  ></ViewCustomerDialog>
</template>
<script>
import CreateCustomerDialog from '@/components/CreateCustomerDialog.vue'
import ViewCustomerDialog from '@/components/ViewCustomerDialog.vue'
import { databases } from '@/lib/appwrite'
import { FilterMatchMode } from '@primevue/core'
import { AppwriteException, ID, Query } from 'appwrite'
import { Button, Card, Column, DataTable, Dialog, IconField, InputIcon, InputText } from 'primevue'

export default {
  components: {
    Button,
    Card,
    DataTable,
    IconField,
    InputIcon,
    InputText,
    Column,
    Dialog,
    CreateCustomerDialog,
    ViewCustomerDialog,
  },

  data() {
    return {
      filters: {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
      },

      customers: null,
      openDialog: false,
      creatingUser: false,
      dialogValues: {
        firstname: null,
        lastname: null,
      },

      deletingCustomer: -1,

      viewingCustomer: null,
    }
  },

  methods: {
    async viewCustomer(event, data, customerIndex) {
      this.viewingCustomer = data
    },
    async deleteCustomer(event, data, customerIndex) {
      this.$confirm.require({
        target: event.currentTarget,
        message: 'Bist du dir sicher, dass du diesen Kunden löschen willst?',
        icon: 'fa-regular fa-exclamation-triangle',
        rejectProps: {
          label: 'Abbrechen',
          severity: 'secondary',
          outlined: true,
        },
        acceptProps: {
          label: 'Löschen',
          severity: 'danger',
        },
        accept: async () => {
          this.deletingCustomer = customerIndex

          try {
            await databases.deleteDocument('wartungssystem', 'customer', data.$id)
          } catch (err) {
            if (err instanceof AppwriteException) {
              switch (err.code) {
                case 404:
                  this.$toast.add({
                    severity: 'error',
                    summary: 'Kunde nicht gefunden',
                    detail: 'Der Kunde wurde nicht gefunden',
                    life: 5000,
                  })
                  break
                case 401:
                  this.$toast.add({
                    severity: 'error',
                    summary: 'Keine Berechtigungen',
                    detail:
                      'Du bist nicht dazu berichtigt Kunden zu löschen, bist du auf dem richtigen Konto angemeldet?',
                    life: 5000,
                  })
                  break
                default:
                  break
              }
            }
            this.deletingCustomer = -1
            return
          }

          this.$toast.add({
            severity: 'success',
            summary: 'Kunde gelöscht',
            detail: 'Kunde ' + data.name + ' wurde erfolgreich gelöscht.',
            life: 5000,
          })

          this.retrieveCustomers()

          this.deletingBericht = null
        },
      })
    },
    async retrieveCustomers() {
      try {
        const customerList = await databases.listDocuments(
          'wartungssystem',
          'customer',
          [Query.orderAsc('$sequence')],
        )

        let page = 1
        const perPage = 25
        let fetchedFiles = []
        let documentList = []
        do {
          const response = await databases.listDocuments(
            'wartungssystem',
            'wartungsbericht',
            [Query.limit(perPage), Query.offset((page - 1) * perPage)],
          )
          fetchedFiles = response.documents
          documentList.push(...fetchedFiles)
          page++
        } while (fetchedFiles.length === perPage)

        let berichtCountRegistry = {}

        documentList.forEach((doc) => {
          var kundeJSON = JSON.parse(doc.kunde)
          if (berichtCountRegistry[kundeJSON.name]) {
            berichtCountRegistry[kundeJSON.name] += 1
          } else {
            berichtCountRegistry[kundeJSON.name] = 1
          }
        })

        customerList.documents.forEach((doc) => {
          if (berichtCountRegistry[doc.name]) {
            doc.wartungsberichte = berichtCountRegistry[doc.name]
          } else {
            doc.wartungsberichte = 0
          }
        })

        this.customers = customerList
      } catch (error) {
        if (error instanceof AppwriteException) {
          if (error.code == 401) {
            this.permission = false
          }
        }
      }
    },
  },

  mounted() {
    this.retrieveCustomers()
  },
}
</script>
<style lang="scss">
.customers {
  display: flex;
  flex-direction: column;
  gap: 1rem;

  &-header {
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
  }
}
</style>
