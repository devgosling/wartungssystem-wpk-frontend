<template>
  <div class="wartungsberichte">
    <div class="wartungsberichte-header">
      <h1>Wartungsberichte</h1>
      <div class="wartungsberichte-header-btns">
        <Button
          icon="fa-regular fa-plus"
          @click="
            function () {
              if (tabCooldown < Date.now()) {
                tab = 1
                setTabtext()
                tabCooldown = Date.now() + 400
              }
            }
          "
          label="Wartungsbericht"
          severity="contrast"
        />
        <Button
          icon="fa-regular fa-upload"
          label="Hochladen"
          severity="secondary"
          @click="
            function () {
              if (tabCooldown < Date.now()) {
                tab = 2
                setTabtext()
                tabCooldown = Date.now() + 400
              }
            }
          "
        />
      </div>
    </div>
    <transition @before-enter="beforeEnter" @enter="enter" @after-enter="afterEnter">
      <Card v-if="tab == 1 || tab == 2" class="wartungsberichte-uppercard">
        <template #title>
          {{ tabtext }}
        </template>
        <template #content>
          <div
            id="wartungsberichte-uppercard-container"
            style="overflow-x: hidden; position: relative"
          >
            <transition
              @before-enter="beforeEnterCard"
              @enter="enterCard"
              @leave="leaveCard"
              @before-leave="beforeLeaveCard"
            >
              <Stepper v-if="tab == 1" value="1" linear>
                <StepItem value="1">
                  <Step>Wartungsbericht Auswahl</Step>
                  <StepPanel v-slot="{ activateCallback }">
                    <div class="wartungsberichte-create-panel">
                      <!--<Button severity="secondary" label="Zurück" icon="fa-regular fa-arrow-left" />-->
                      <div class="wartungsberichte-create-panel-grid">
                        <div class="wartungsberichte-create-panel-grid-inpt">
                          <label for="wartungsbericht-slct">Wartungsberichtsart</label>
                          <Select
                            id="wartungsbericht-slct"
                            placeholder="Keine Art ausgewählt"
                            :options="berichte"
                            class="wartungsberichte-create-panel-grid-slct-type"
                            v-model="inputValues.berichtType"
                          >
                            <template #value="slotProps">
                              <div
                                v-if="slotProps.value"
                                style="display: flex; align-items: center; gap: 0.4rem"
                              >
                                <i :class="'fa-regular fa-' + slotProps.value.icon" />{{
                                  slotProps.value.name
                                }}
                              </div>
                              <div v-else>
                                {{ slotProps.placeholder }}
                              </div>
                            </template>
                            <template #option="slotProps">
                              <div
                                style="
                                  width: 19rem;
                                  text-wrap: wrap;
                                  word-wrap: normal;
                                  display: grid;
                                  grid-template-columns: 1.2rem auto;
                                  gap: 0.5rem;
                                  align-items: center;
                                "
                              >
                                <i :class="'fa-regular fa-' + slotProps.option.icon" />{{
                                  slotProps.option.name
                                }}
                              </div>
                            </template>
                            <template #header>
                              <div
                                style="
                                  font-weight: 500;
                                  padding: 0.75rem 1rem;
                                  padding-bottom: 0.25rem;
                                "
                              >
                                Verfügbare Wartungsberichte
                              </div>
                            </template>
                          </Select>
                        </div>
                        <div class="wartungsberichte-create-panel-grid-inpt">
                          <label for="wartungsbericht-slct">Bearbeitender Mitarbeiter</label>
                          <InputText
                            id="wartungsbericht-slct"
                            disabled
                            :value="inputValues.employee"
                          />
                        </div>
                        <div class="wartungsberichte-create-panel-grid-inpt">
                          <label for="wartungsbericht-slct">Datum</label>
                          <DatePicker
                            id="wartungsbericht-slct"
                            date-format="dd.mm.yy"
                            showIcon
                            fluid
                            iconDisplay="input"
                            showButtonBar
                            v-model="inputValues.date"
                          />
                        </div>
                        <div class="wartungsberichte-create-panel-grid-inpt">
                          <label for="wartungsbericht-slct">Kunde</label>
                          <Select
                            id="wartungsbericht-slct"
                            placeholder="Kein Kunde Augewählt"
                            :options="kunden"
                            :disabled="kundeLocked"
                            class="wartungsberichte-create-panel-grid-slct-type"
                            filter
                            @change="inputValues.identifier = null"
                            optionLabel="name"
                            v-model="inputValues.customer"
                            :showClear="!kundeLocked"
                          >
                            <template #value="slotProps">
                              <div v-if="slotProps.value">
                                {{ slotProps.value.name }}
                              </div>
                              <div v-else>
                                {{ slotProps.placeholder }}
                              </div>
                            </template>
                            <template #option="slotProps">
                              <div
                                style="
                                  text-wrap: wrap;
                                  word-wrap: normal;
                                  display: grid;
                                  grid-template-columns: 0.9rem auto;
                                  gap: 0.5rem;
                                  align-items: center;
                                "
                              >
                                <i :class="'fa-solid fa-user-tie'" />{{ slotProps.option.name }}
                              </div>
                            </template>
                            <template #header>
                              <div
                                style="
                                  font-weight: 500;
                                  padding: 0.75rem 1rem;
                                  padding-bottom: 0.1rem;
                                "
                              >
                                Verfügbare Kunden
                              </div>
                            </template>
                            <template #footer>
                              <div style="padding: 0.75rem">
                                <Button
                                  label="Kunde hinzufügen"
                                  size="small"
                                  fluid
                                  severity="secondary"
                                  @click="openDialog = true"
                                  text
                                  icon="fa-solid fa-plus"
                                />
                              </div>
                            </template>
                          </Select>
                        </div>
                        <div class="wartungsberichte-create-panel-grid-inpt">
                          <label for="wartungsbericht-slct">Straße und Hausnummer</label>
                          <InputText
                            id="wartungsbericht-slct"
                            disabled
                            placeholder="Kein Kunde ausgewählt"
                            :value="inputValues.customer?.['address.street']"
                          />
                        </div>
                        <div class="wartungsberichte-create-panel-grid-inpt">
                          <label for="wartungsbericht-slct">Postleitzahl</label>
                          <InputText
                            id="wartungsbericht-slct"
                            disabled
                            placeholder="Kein Kunde ausgewählt"
                            :value="inputValues.customer?.['address.zipcode']"
                          />
                        </div>
                        <div class="wartungsberichte-create-panel-grid-inpt">
                          <label for="wartungsbericht-slct">Stadt</label>
                          <InputText
                            id="wartungsbericht-slct"
                            disabled
                            placeholder="Kein Kunde ausgewählt"
                            :value="inputValues.customer?.['address.city']"
                          />
                        </div>
                        <div class="wartungsberichte-create-panel-grid-inpt">
                          <label for="wartungsbericht-slct">Identifikator (Optional)</label>
                          <Select
                            id="wartungsbericht-slct"
                            :placeholder="
                              inputValues.customer
                                ? 'Kein Identifikator ausgewählt'
                                : 'Kein Kunde ausgewählt'
                            "
                            :disabled="!inputValues.customer"
                            :options="inputValues.customer?.identifiers"
                            class="wartungsberichte-create-panel-grid-slct-type"
                            filter
                            optionLabel="name"
                            v-model="inputValues.identifier"
                            showClear
                          >
                            <template #value="slotProps">
                              <div v-if="slotProps.value">
                                <Tag :value="slotProps.value" />
                                <!--{{ slotProps.value }}-->
                              </div>
                              <div v-else>
                                {{ slotProps.placeholder }}
                              </div>
                            </template>
                            <template #option="slotProps">
                              {{ slotProps.option }}
                            </template>
                            <template #header>
                              <div
                                style="
                                  font-weight: 500;
                                  padding: 0.75rem 1rem;
                                  padding-bottom: 0.1rem;
                                "
                              >
                                Verfügbare Identifikatoren
                              </div>
                            </template>
                            <template #footer>
                              <div style="padding: 0.75rem">
                                <Button
                                  label="Identifikator hinzufügen"
                                  size="small"
                                  fluid
                                  severity="secondary"
                                  @click="openIdfDialog = true"
                                  text
                                  icon="fa-solid fa-plus"
                                />
                              </div>
                            </template>
                          </Select>
                        </div>
                      </div>
                      <Button
                        class="wartungsberichte-create-panel-btn"
                        severity="contrast"
                        label="Weiter"
                        icon="fa-regular fa-arrow-right"
                        size="small"
                        iconPos="right"
                        :disabled="
                          !(
                            inputValues.berichtType &&
                            inputValues.customer &&
                            inputValues.date &&
                            inputValues.employee
                          )
                        "
                        @click="proceedToStep2(activateCallback)"
                      />
                    </div>
                  </StepPanel>
                </StepItem>
                <StepItem value="2">
                  <Step>Wartungsbericht Ausfüllen</Step>
                  <StepPanel v-slot="{ activateCallback }">
                    <div class="wartungsberichte-fill-panel">
                      <Button
                        class="wartungsberichte-fill-panel-btn"
                        severity="secondary"
                        label="Zurück"
                        icon="fa-regular fa-arrow-left"
                        size="small"
                        iconPos="left"
                        @click="activateCallback('1')"
                      />
                      <Motor_Filler ref="filler" v-if="inputValues.berichtType.id == 'motor'" />
                      <Muellanlage_Filler
                        ref="filler"
                        v-else-if="inputValues.berichtType.id == 'müllanlage'"
                      />
                      <Pumpe_Filler
                        ref="filler"
                        v-else-if="inputValues.berichtType.id == 'pumpe'"
                      />
                      <Wehrtor_Filler
                        ref="filler"
                        v-else-if="inputValues.berichtType.id == 'wehrtore'"
                      />
                      <Luefter_Filler
                        ref="filler"
                        v-else-if="inputValues.berichtType.id == 'luefter'"
                      />
                      <Schmutzwasser_Filler
                        ref="filler"
                        v-else-if="inputValues.berichtType.id == 'schmutzwasser'"
                      />
                      <Waermetauscher_Filler
                        ref="filler"
                        v-else-if="inputValues.berichtType.id == 'waermetauscher'"
                      />
                      <Enthaertungsanlage_Filler
                        ref="filler"
                        v-else-if="inputValues.berichtType.id == 'enthaertungsanlage'"
                      />
                      <h2 style="margin: 3rem 8rem; text-align: center" v-else>
                        Für diese Art von Wartungsbericht gibt es noch nichts zum ausfüllen... :(
                      </h2>
                      <Button
                        class="wartungsberichte-fill-panel-btn"
                        severity="contrast"
                        label="Weiter"
                        icon="fa-regular fa-arrow-right"
                        size="small"
                        iconPos="right"
                        :disabled="
                          !(
                            inputValues.berichtType &&
                            inputValues.customer &&
                            inputValues.date &&
                            inputValues.employee
                          )
                        "
                        @click="
                          function () {
                            activateCallback('3')
                            activateSignPad()
                          }
                        "
                      />
                    </div>
                  </StepPanel>
                </StepItem>
                <StepItem value="3">
                  <Step>Wartungsbericht Unterschreiben</Step>
                  <StepPanel v-slot="{ activateCallback }" id="step3">
                    <div class="wartungsberichte-sign-panel">
                      <Button
                        class="wartungsberichte-sign-panel-btn"
                        severity="secondary"
                        label="Zurück"
                        icon="fa-regular fa-arrow-left"
                        size="small"
                        iconPos="left"
                        @click="activateCallback('2')"
                        :disabled="generatingPDF"
                      />
                      <div class="wartungsberichte-sign-panel-main">
                        <label for="signpad">Signatur hier Zeichnen</label>
                        <canvas id="signpad" class="wartungsberichte-sign-panel-signpad"></canvas>

                        <div class="wartungsberichte-sign-panel-main-btns">
                          <Button
                            rounded
                            :disabled="isSignpadEmpty"
                            size="small"
                            severity="danger"
                            icon="fa-regular fa-trash"
                            @click="
                              function () {
                                signpad.clear()
                                isSignpadEmpty = true
                              }
                            "
                          />
                          <Button
                            rounded
                            size="small"
                            severity="contrast"
                            icon="fa-regular fa-arrow-down-left-and-arrow-up-right-to-center"
                            @click="
                              function () {
                                if (signpad.minWidth <= 0.1) return
                                signpad.minWidth -= 0.1
                                signpad.maxWidth -= 0.5
                              }
                            "
                          />
                          <Button
                            rounded
                            size="small"
                            severity="contrast"
                            icon="fa-regular fa-arrow-up-right-and-arrow-down-left-from-center"
                            @click="
                              function () {
                                if (signpad.minWidth >= 1) return
                                signpad.minWidth += 0.1
                                signpad.maxWidth += 0.5
                              }
                            "
                          />
                          <Button
                            rounded
                            label="Bestätigen"
                            size="small"
                            severity="success"
                            icon="fa-regular fa-check"
                            :disabled="isSignpadEmpty"
                            @click="submit(activateCallback)"
                            :loading="generatingPDF"
                          />
                        </div>
                      </div>
                      <!--<Button
                        class="wartungsberichte-sign-panel-btn"
                        severity="contrast"
                        label="Weiter"
                        icon="fa-regular fa-arrow-right"
                        size="small"
                        iconPos="right"
                        :disabled="
                          !(
                            inputValues.berichtType &&
                            inputValues.customer &&
                            inputValues.date &&
                            inputValues.employee
                          )
                        "
                        @click="activateCallback('3')"
                      />-->
                    </div>
                  </StepPanel>
                </StepItem>
                <StepItem value="4">
                  <Step>Wartungsbericht Speichern</Step>
                  <StepPanel v-slot="{ activateCallback }">
                    <div class="wartungsberichte-finish-panel">
                      <Button
                        class="wartungsberichte-finish-panel-btn"
                        severity="secondary"
                        label="Zurück"
                        icon="fa-regular fa-arrow-left"
                        size="small"
                        iconPos="left"
                        @click="activateCallback('3')"
                        :disabled="isSending || isSent"
                      />
                      <div class="wartungsberichte-finish-panel-preview">
                        <div class="wartungsberichte-finish-panel-preview-board">
                          <h3>🎉 Der Wartungsbericht ist fertig!</h3>
                          <p>
                            Überprüfe gegebenenfalls nocheinmal alle eingaben und speichere den
                            Wartungsbericht.
                          </p>
                          <Divider />
                          <div>
                            <Button
                              v-if="!isSent"
                              icon="fa-regular fa-eyes"
                              :disabled="isSending"
                              label="Eingaben überprüfen"
                              severity="contrast"
                              @click="activateCallback('2')"
                            ></Button>
                            <Button
                              v-else
                              severity="contrast"
                              label="Weiteren Wartungsbericht"
                              icon="fa-regular fa-plus"
                              @click="resetDataAndCreateNew(activateCallback)"
                            ></Button>
                            <Button
                              id="saveandsendbtn"
                              :icon="isSent ? 'fa-regular fa-check' : 'fa-regular fa-paper-plane'"
                              :loading="isSending"
                              :disabled="isSent"
                              :label="isSent ? 'Erfolgreich versendet' : 'Speichen und versenden'"
                              severity="success"
                              @click="saveAndSend()"
                            ></Button>
                            <Divider />
                            <span>
                              Der Wartungsbericht wird an die E-Mail Adresse(n)
                              <b>{{ inputValues.customer?.emailArray.join(', ') }}</b>
                              versendet.<br /><br />
                              Ist diese E-Mail Adresse richtig?<br />
                            </span>
                            <Button
                              size="small"
                              icon="fa-solid fa-at"
                              :disabled="isSent || isSending"
                              label="E-Mail Adresse ändern"
                              severity="secondary"
                              @click="viewingCustomer = inputValues.customer"
                              rounded
                            />
                          </div>
                        </div>
                        <img :src="pdfImg" alt="" />
                        <img v-if="pdfImg2" style="grid-column: 2" :src="pdfImg2" alt="" />
                      </div>
                    </div>
                  </StepPanel>
                </StepItem>
              </Stepper>
            </transition>
            <transition
              @before-enter="beforeEnterCard"
              @enter="enterCard"
              @leave="leaveCard"
              @before-leave="beforeLeaveCard"
            >
              <div
                v-if="tab == 2"
                style="
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  justify-content: center;
                  text-align: center;
                  height: 10rem;
                  width: 100%;
                "
              >
                <h1>Diese Funktion ist noch nicht für dich verfügbar</h1>
                <span
                  >Wartungsberichte in Form von PDF-Dateien können derzeit noch nicht hochgeladen
                  werden.</span
                >
              </div>
            </transition>
          </div>
        </template>
      </Card>
    </transition>
    <Card>
      <template #content>
        <DataTable
          scrollHeight="74vh"
          scrollable
          v-model:filters="filters"
          :value="wartungsberichte?.documents"
          :loading="!wartungsberichte"
          :globalFilterFields="[
            'erstellungsdatum',
            'mitarbeiter',
            'kunde.name',
            'identifikator',
            '$sequence',
            'type',
          ]"
        >
          <template #header>
            <div style="display: flex; justify-content: space-between; align-items: center">
              <h4 style="margin: 0">{{ wartungsberichte?.total }} Wartungsberichte</h4>
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
          <Column field="erstellungsdatum" header="Erstellungsdatum"> </Column>
          <Column
            field="mitarbeiter"
            header="Mitarbeiter"
            :bodyStyle="{ minWidth: 'max-content', whiteSpace: 'nowrap' }"
          ></Column>
          <Column field="kunde" header="Kunde" style="min-width: 15rem">
            <template #body="slotProps">
              {{ slotProps.data.kunde.name }}
            </template>
          </Column>
          <Column field="type" header="Typ">
            <template #body="slotProps">
              <span style="display: flex; align-items: center; gap: 0.35rem"
                ><i :class="berichte.find((el) => el.filekey == slotProps.data.type).icon"></i
                >{{ slotProps.data.type }}</span
              >
            </template>
          </Column>
          <Column
            field="identifikator"
            header="Identifikator"
            :bodyStyle="{ minWidth: 'max-content', whiteSpace: 'nowrap' }"
          >
            <template #body="slotProps">
              <Tag v-if="slotProps.data.identifikator" :value="slotProps.data.identifikator"></Tag>
              <div v-else>-</div>
            </template>
          </Column>
          <Column field="actions" header="Aktionen" frozen alignFrozen="right">
            <template #body="slotProps">
              <div style="display: flex; gap: 0.2rem">
                <Button
                  icon="fa-regular fa-eye"
                  severity="info"
                  @click="viewBericht(slotProps.data, slotProps.index)"
                  size="small"
                  :loading="viewingBericht.loading == slotProps.index"
                ></Button>
                <Button
                  icon="fa-regular fa-download"
                  :loading="downloadingBericht == slotProps.index"
                  @click="downloadBericht(slotProps.data, slotProps.index)"
                  severity="contrast"
                  size="small"
                ></Button>
                <Button
                  icon="fa-regular fa-trash"
                  :loading="deletingBericht == slotProps.index"
                  @click="deleteBericht($event, slotProps.data, slotProps.index)"
                  severity="danger"
                  size="small"
                ></Button>
              </div>
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>
  </div>
  <Dialog maximizable v-model:visible="viewingBericht.open" style="width: min(50vw, 800px)">
    <template #header>
      <div style="word-break: break-all">
        <i class="fa-regular fa-file-pdf"></i> {{ viewingBericht.name }}
      </div>
    </template>
    <p style="margin-top: 0">
      Dieser Wartungsbericht wurde an die E-Mail Adresse(n)
      <template v-for="(mail, index) of viewingBericht.data.kunde.emailArray">
        <a :href="'mailto:' + mail"
          ><b>{{ mail }}</b></a
        >
        <span v-if="index < viewingBericht.data.kunde.emailArray.length - 1">, </span>
      </template>
      versendet.
    </p>
    <img :src="viewingBericht.img" alt="" style="width: 100%" />
    <img v-if="viewingBericht.img2" :src="viewingBericht.img2" alt="" style="width: 100%" />
  </Dialog>
  <canvas id="pdfCanvas" hidden></canvas>
  <CreateCustomerDialog
    :open="openDialog"
    @close="openDialog = false"
    @createdcustomer="fetchCustomers"
  ></CreateCustomerDialog>
  <ViewCustomerDialog
    :open="viewingCustomer !== null"
    :data="viewingCustomer"
    @close="viewingCustomer = null"
    @editedcustomer="fetchCustomers"
  ></ViewCustomerDialog>
  <CreateIdentifierDialog
    :open="openIdfDialog"
    :customerID="inputValues.customer?.$id"
    @close="openIdfDialog = false"
    @createdidentifiers="fetchCustomers"
  ></CreateIdentifierDialog>
</template>
<script>
import { ID, account, client, databases, functions, storage } from '@/lib/appwrite'
import {
  Toolbar,
  Button,
  DataTable,
  Card,
  StepPanels,
  Select,
  InputText,
  DatePicker,
  Splitter,
  SplitterPanel,
  Divider,
  Column,
  IconField,
  InputIcon,
  Dialog,
  Tag,
} from 'primevue'
import StepPanel from 'primevue/steppanel'
import StepItem from 'primevue/stepitem'
import Stepper from 'primevue/stepper'
import Step from 'primevue/step'
import Motor_Filler from '@/components/Motor_Filler.vue'
import SignaturePad from 'signature_pad'
import {
  fillEnthärtungsanlagePDF,
  fillLüfterPDF,
  fillMotorPDF,
  fillMüllanlagePDF,
  fillPumpePDF,
  fillSchmutzwasserPDF,
  fillWehrtorePDF,
  fillWärmetauscherPDF,
  getAmountOfPagesInPDF,
} from '@/lib/pdf-lib'
import * as pdfjsLib from 'pdfjs-dist'
import axios from 'axios'
import { useInputStore } from '@/stores/inputStore'
import ConfettiExplosion from 'vue-confetti-explosion'
import { AppwriteException, Query } from 'appwrite'
import { FilterMatchMode } from '@primevue/core'
import CreateCustomerDialog from '@/components/CreateCustomerDialog.vue'
import CreateIdentifierDialog from '@/components/CreateIdentifierDialog.vue'
import Muellanlage_Filler from '@/components/Muellanlage_Filler.vue'
import Pumpe_Filler from '@/components/Pumpe_Filler.vue'
import Wehrtor_Filler from '@/components/Wehrtor_Filler.vue'
import Luefter_Filler from '@/components/Luefter_Filler.vue'
import Schmutzwasser_Filler from '@/components/Schmutzwasser_Filler.vue'
import Waermetauscher_Filler from '@/components/Waermetauscher_Filler.vue'
import Enthaertungsanlage_Filler from '@/components/Enthaertungsanlage_Filler.vue'
import ViewCustomerDialog from '@/components/ViewCustomerDialog.vue'
import { update } from 'lodash'
import { enqueueJob } from '@/lib/offlineQueue'
import { executeJob } from '@/lib/executeJob'
import { toRaw } from 'vue'
import { canCreateReport } from '@/lib/cacheUtils'

export default {
  components: {
    Toolbar,
    Button,
    DataTable,
    Card,
    Stepper,
    StepItem,
    Step,
    StepPanel,
    StepPanels,
    Select,
    InputText,
    DatePicker,
    Motor_Filler,
    Muellanlage_Filler,
    Pumpe_Filler,
    Wehrtor_Filler,
    Luefter_Filler,
    Schmutzwasser_Filler,
    Waermetauscher_Filler,
    Enthaertungsanlage_Filler,
    Splitter,
    SplitterPanel,
    Divider,
    ConfettiExplosion,
    Column,
    IconField,
    InputIcon,
    Dialog,
    CreateCustomerDialog,
    CreateIdentifierDialog,
    Tag,
    ViewCustomerDialog,
  },

  data() {
    return {
      username: null,
      viewingCustomer: null,

      openDialog: false,
      openIdfDialog: false,

      kundeLocked: false,

      wartungsberichte: null,
      filters: {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
      },

      pdfsCached: true,
      checkingPDFCache: false,

      inputValues: {
        berichtType: '',
        employee: '',
        date: '',
        identifier: null,
        customer: null,
      },
      tabCooldown: -1,
      tab: 0, // 0 = Nothing, 1 = Create, 2 = Upload
      tabtext: '',
      berichte: [
        { name: 'Lüfter', id: 'luefter', icon: 'fa-regular fa-fan', filekey: 'Lüfter' },
        { name: 'Motor', id: 'motor', icon: 'fa-regular fa-engine', filekey: 'Motor' },
        {
          name: 'Schmutzwasser-/Fäkalienhebeanlagen, Tauchmotorpumpenschmutzwasser',
          id: 'schmutzwasser',
          icon: 'fa-regular fa-manhole',
          filekey: 'Schmutzwasser',
        },
        {
          name: 'Müllanlage',
          id: 'müllanlage',
          icon: 'fa-regular fa-trash',
          filekey: 'Müllanlage',
        },
        { name: 'Pumpe', id: 'pumpe', icon: 'fa-regular fa-pump', filekey: 'Pumpe' },
        {
          name: 'Wärmetauscher',
          id: 'waermetauscher',
          icon: 'fa-regular fa-heat',
          filekey: 'Wärmetauscher',
        },
        {
          name: 'Wehrtore',
          id: 'wehrtore',
          icon: 'fa-regular fa-bridge-water',
          filekey: 'Wehrtore',
        },
        {
          name: 'Überprüfung | Enthärtungsanlage',
          id: 'enthaertungsanlage',
          icon: 'fa-solid fa-water-arrow-down',
          filekey: 'Enthärtungsanlage',
        },
      ],
      /*mitarbeiter: [ <----------- OLD
        'Steven Kukla',
        'Steffen Volkmer',
        'Kevin Kromholz',
        'Lee Daniel Hertel',
        'Joshi Enrage',
        'Max Enrage',
        'Max Ziegelstein',
        'Taylor Ziegelstein',
        'Max Mustermann',
        'Lena Hoxjai',
        'Blauer Hai',
        'Mark Forster',
        'Mark Rene Frank',
      ],*/
      mitarbeiter: [],

      kunden: [],
      /**
       * @returns SignaturePad
       */
      signpad: null,
      signature: null,
      isSignpadEmpty: true,
      generatingPDF: false,

      pdfBytes: null,
      pdfImg: null,
      pdfImg2: null,
      isSending: false,
      isSent: false,

      viewingBericht: {
        data: null,
        name: null,
        img: null,
        img2: null,
        open: false,
        loading: null,
      },

      deletingBericht: null,
      downloadingBericht: null,

      // CONFETTI
      confetti: {
        emmitterSize: 100,
        dotQuantity: 250,
        dotSizeMin: 6,
        dotSizeMax: 8,
        speed: 4.4,
        gravity: 0.5,
        explosionQuantity: 1,
        emitter: null,
        explosions: [],
        currentExplosion: 0,
        container: null,
        i: null,
        move: null,
      },

      signpadResizeHandler: null,
    }
  },

  beforeUnmount() {
    if (this.signpadResizeHandler) {
      window.removeEventListener('resize', this.signpadResizeHandler)
    }
  },

  watch: {
    inputValues: {
      handler(newVal) {
        if (!useInputStore().isEditingSomething) {
          useInputStore().setIsEditingSomething(true)
        }
      },
      deep: true,
    },
    'inputValues.berichtType'(newVal) {
      this.kundeLocked = newVal.id == 'enthaertungsanlage'
      if (this.kundeLocked) {
        this.inputValues.customer = this.kunden.find((v, i) => v.$id == '68cd4804000d225bc05c')
      }
    },
  },

  async mounted() {
    this.fetchWartungsberichte()
    this.confetti_setup()
    this.fetchEmployees()
    this.fetchCustomers()

    this.inputValues.employee = (await account.get()).name

    // Check if PDFs are cached
    this.checkPDFCache()
  },

  methods: {
    // #region Confetti Effect Logic
    confetti_createExplosion(container) {
      var tl = new TimelineLite({ paused: true }),
        dots = [],
        angle,
        duration,
        length,
        dot,
        i,
        size,
        r,
        g,
        b
      for (i = 0; i < this.confetti.dotQuantity; i++) {
        dot = document.createElement('div')
        dots.push(dot)
        dot.className = 'dot'
        r = this.confetti_getRandom(30, 255)
        g = this.confetti_getRandom(30, 230)
        b = this.confetti_getRandom(30, 230)
        TweenLite.set(dot, {
          backgroundColor: 'rgb(' + r + ',' + g + ',' + b + ')',
          visibility: 'hidden',
        })
        size = this.confetti_getRandom(this.confetti.dotSizeMin, this.confetti.dotSizeMax)
        container.appendChild(dot)
        angle = this.confetti_getRandom(0.65, 0.85) * Math.PI * 2 // a vector pointed up
        // get maximum distance from the center, factoring in size of dot, and then pick a random spot along that vector to plot a point
        length = Math.random() * (this.confetti.emitterSize / 2 - size / 2)
        duration = 3 + Math.random()
        // place the dot at a random spot within the emitter, and set its size
        TweenLite.set(dot, {
          x: Math.cos(angle) * length,
          y: Math.sin(angle) * length,
          width: size,
          height: size,
          xPercent: -50,
          yPercent: -50,
          visibility: 'hidden',
          force3D: true,
        })
        tl.to(
          dot,
          duration / 2,
          {
            opacity: 0,
            ease: RoughEase.ease.config({
              points: 20,
              strength: 1.75,
              clamp: true,
            }),
          },
          0,
        )
          .to(
            dot,
            duration,
            {
              visibility: 'visible',
              rotationX: '-=' + this.confetti_getRandom(720, 1440),
              rotationZ: '+=' + this.confetti_getRandom(720, 1440),
              physics2D: {
                angle: (angle * 180) / Math.PI, // translate radians to degrees
                velocity: (100 + Math.random() * 250) * this.confetti.speed, // initial velocity
                gravity: 700 * this.confetti.gravity,
                friction: this.confetti_getRandom(0.1, 0.15),
              },
            },
            0,
          )
          .to(
            dot,
            1.25 + Math.random(),
            {
              opacity: 0,
            },
            duration / 2,
          )
      }
      // hide the dots at the end for improved performance (better than opacity: 0 because the browser can ignore the elements)
      // tl.set(dots, {visibility: 'hidden'});
      return tl
    },
    confetti_explode(element) {
      var bounds = element.getBoundingClientRect(),
        explosion
      if (++this.confetti.currentExplosion === this.confetti.explosions.length) {
        this.confetti.currentExplosion = 0
      }
      explosion = this.confetti.explosions[this.confetti.currentExplosion]
      TweenLite.set(explosion.container, {
        x: bounds.left + bounds.width / 2,
        y: bounds.top + bounds.height / 2,
      })
      explosion.animation.restart()
    },
    confetti_setup() {
      this.confetti.container = document.createElement('div')
      this.confetti.container.className = 'dot-container'
      document.body.appendChild(this.confetti.container)
      this.confetti.explosions.push({
        container: this.confetti.container,
        animation: this.confetti_createExplosion(this.confetti.container),
      })
    },
    async checkPDFCache() {
      this.checkingPDFCache = true
      try {
        this.pdfsCached = await canCreateReport()
      } finally {
        this.checkingPDFCache = false
      }
    },
    proceedToStep2(activateCallback) {
      if (!this.pdfsCached) {
        this.$toast.add({
          severity: 'warn',
          summary: 'PDF-Vorlagen nicht verfügbar',
          detail:
            'Bitte stellen Sie eine Internetverbindung her und laden Sie die Seite neu, um die PDF-Vorlagen zwischenzuspeichern.',
          life: 10000,
        })
        return
      }
      activateCallback('2')
    },
    confetti_getRandom(min, max) {
      var rand = min + Math.random() * (max - min)
      return rand
    },
    confetti_play() {
      this.confetti.emitter = document.getElementById('saveandsendbtn')
      this.confetti_explode(this.confetti.emitter)
    },
    // #endregion

    // #region Fadein & -out animations
    async setTabtext() {
      let tabTexts = {
        1: 'Wartungsbericht erstellen',
        2: 'Wartungsbericht hochladen',
      }
      if (this.tabtext == '') {
        this.tabtext = this.tab == 1 ? tabTexts['1'] : tabTexts['2']
        return
      } else if (
        (this.tab == 1 && this.tabtext == tabTexts['1']) ||
        (this.tab == 2 && this.tabtext == tabTexts['2'])
      )
        return

      // Remove chars after "Wartungsbericht"
      let text = this.tabtext
      await new Promise((resolve, reject) => {
        let removerInterval = setInterval(() => {
          text = text.substring(0, text.length - 1)
          this.tabtext = text
          if (text == 'Wartungsbericht ') {
            resolve()
            clearInterval(removerInterval)
          }
        }, 10) // 15ms
      })

      let lettersToAdd = this.tab == 1 ? 'erstellen' : 'hochladen'
      let letterString = lettersToAdd.split('')

      letterString.forEach(async (ltr, index) => {
        setTimeout(
          () => {
            text += ltr
            this.tabtext = text
          },
          (index + 1) * 10,
        )
      })
    },
    modifyCardHeight(height) {
      let cardContainer = document.getElementById('wartungsberichte-uppercard-container')
      cardContainer.style.overflowY = 'hidden'
      cardContainer.style.transition = 'height 0.4s ease-out'
      requestAnimationFrame(() => {
        cardContainer.style.height = height + 'px'
      })
    },
    beforeLeaveCard(el) {
      el.style.position = 'absolute'
      el.style.width = '100%'
      el.style.top = '0'
      el.style.left = '0'

      let cardContainer = document.getElementById('wartungsberichte-uppercard-container')
      cardContainer.style.height = el.scrollHeight + 'px'
    },
    leaveCard(el) {
      el.style.transition = 'transform 0.4s ease'
      requestAnimationFrame(() => {
        el.style.transform = 'translateX(100%)'
      })

      let cardContainer = document.getElementById('wartungsberichte-uppercard-container')
      cardContainer.style.overflowY = ''
      setTimeout(() => {
        cardContainer.style.height = ''
      }, 400)
    },
    beforeEnterCard(el) {
      el.style.transform = 'translateX(-100%)'
    },
    enterCard(el) {
      el.style.transition = 'transform 0.4s ease'
      this.modifyCardHeight(el.scrollHeight)
      requestAnimationFrame(() => {
        el.style.transform = 'translateX(0%)'
      })
    },
    beforeEnter(el) {
      el.style.height = '0'
      el.style.opacity = '0'
      el.style.overflow = 'hidden'
    },
    enter(el) {
      const height = el.scrollHeight + 'px'
      el.style.transition = 'height 0.4s ease, opacity 0.4s ease'
      requestAnimationFrame(() => {
        el.style.height = height
        el.style.opacity = '1'
      })
    },
    afterEnter(el) {
      el.style.height = 'auto'
      el.style.overflow = ''
    },
    // #endregion

    async fetchEmployees() {
      const mitarbeiterList = await databases.listDocuments(
        'wartungssystem',
        'mitarbeiter',
        [Query.orderAsc('$sequence')],
      )

      mitarbeiterList.documents.forEach((doc) => {
        this.mitarbeiter.push(doc.name)
      })
    },
    async fetchCustomers() {
      this.kunden = []

      const customerList = await databases.listDocuments(
        'wartungssystem',
        'customer',
        [Query.orderAsc('$sequence')],
      )

      customerList.documents.forEach((doc) => {
        this.kunden.push(doc)

        if (this.inputValues.customer?.name == doc.name) this.inputValues.customer = doc
      })
    },
    async fetchWartungsberichte() {
      let page = 1
      const perPage = 25
      let documentList = []
      let fetchedFiles = []
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

      documentList.forEach(function (doc, index, theArray) {
        doc.kunde = JSON.parse(doc.kunde)
        doc.erstellungsdatum = new Date(doc.erstellungsdatum).toLocaleString('de-DE', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          minute: '2-digit',
          hour: '2-digit',
        })
      })

      console.log(documentList)

      const sortedDocuments = documentList.sort(
        (a, b) => new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime(),
      )

      // DataTable expects an object with `documents`; previously we set an array so nothing rendered.
      this.wartungsberichte = {
        documents: sortedDocuments,
        total: sortedDocuments.length,
      }
    },

    async resetDataAndCreateNew(callback) {
      this.inputValues = {
        berichtType: '',
        employee: '',
        date: '',
        customer: null,
      }

      this.inputValues.employee = (await account.get()).name

      await callback('1')

      useInputStore().resetInputData()

      this.signpad = null
      this.signature = null
      this.isSignpadEmpty = true
      this.generatingPDF = false

      this.pdfBytes = null
      this.pdfImg = null
      this.isSending = false
      this.isSent = false
    },
    async viewBericht(data, berichtIndex) {
      this.viewingBericht.loading = berichtIndex
      try {
        let fileDownload = await storage.getFileDownload(
          'storage',
          data.wartungsberichtid,
        )
        let fileData = await storage.getFile('storage', data.wartungsberichtid)
        let jwtObject = await account.createJWT()
        let fileResponse = await fetch(fileDownload, {
          headers: { 'x-appwrite-jwt': jwtObject.jwt },
        })
        let blob = await fileResponse.blob()
        let buffer = await blob.arrayBuffer()
        let buffer2 = await blob.arrayBuffer()
        let fileBytes2 = new Uint8Array(buffer2)
        let fileBytes = new Uint8Array(buffer)

        let pages = await getAmountOfPagesInPDF(buffer)

        this.viewingBericht.name = fileData.name
        this.viewingBericht.data = data
        if (pages > 1) this.viewingBericht.img2 = await this.turnPDFToPNG(fileBytes2, 2)
        else this.viewingBericht.img2 = null
        this.viewingBericht.img = await this.turnPDFToPNG(fileBytes)
        this.viewingBericht.open = true
      } catch (err) {
        if (err instanceof AppwriteException) {
          switch (err.code) {
            case 404:
              this.$toast.add({
                severity: 'error',
                summary: 'Datei nicht gefunden',
                detail: 'Die Datei wurde nicht gefunden',
                life: 5000,
              })
              break
            default:
              break
          }
        } else {
          throw err
        }
      }
      this.viewingBericht.loading = null
    },
    async downloadBericht(data, berichtIndex) {
      this.downloadingBericht = berichtIndex
      try {
        let fileDownload = await storage.getFileDownload(
          'storage',
          data.wartungsberichtid,
        )

        let fileData = await storage.getFile('storage', data.wartungsberichtid)
        let jwtObject = await account.createJWT()
        let fileResponse = await fetch(fileDownload, {
          headers: { 'x-appwrite-jwt': jwtObject.jwt },
        })
        let blob = await fileResponse.blob()
        let blobURL = URL.createObjectURL(blob)

        const a = document.createElement('a')
        a.setAttribute('href', blobURL)
        a.setAttribute('download', fileData.name)
        a.style.display = 'none'
        document.body.appendChild(a)

        a.click()

        document.body.removeChild(a)
        URL.revokeObjectURL(blobURL)

        this.$toast.add({
          severity: 'success',
          summary: 'Bericht heruntergeladen',
          detail: 'Der Download für die Datei des PDFs hat begonnen',
          life: 5000,
        })
      } catch (err) {
        if (err instanceof AppwriteException) {
          switch (err.code) {
            case 404:
              this.$toast.add({
                severity: 'error',
                summary: 'Datei nicht gefunden',
                detail: 'Die Datei wurde nicht gefunden',
                life: 5000,
              })
              break
            default:
              break
          }
        }
      }

      this.downloadingBericht = null
    },
    async deleteBericht(event, data, berichtIndex) {
      this.$confirm.require({
        target: event.currentTarget,
        message: 'Bist du dir sicher, dass du diesen Wartungsbericht löschen willst?',
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
          this.deletingBericht = berichtIndex

          try {
            await storage.deleteFile('storage', data.wartungsberichtid)
            await databases.deleteDocument('wartungssystem', 'wartungsbericht', data.$id)
          } catch (err) {
            if (err instanceof AppwriteException) {
              switch (err.code) {
                case 404:
                  this.$toast.add({
                    severity: 'error',
                    summary: 'Datei nicht gefunden',
                    detail: 'Die Datei wurde nicht gefunden',
                    life: 5000,
                  })
                  break
                case 401:
                  this.$toast.add({
                    severity: 'error',
                    summary: 'Keine Berechtigungen',
                    detail:
                      'Du bist nicht dazu berichtigt Wartungsberichte zu löschen, bist du auf dem richtigen Konto angemeldet?',
                    life: 5000,
                  })
                  break
                default:
                  break
              }
            }
            this.deletingBericht = null
            return
          }

          this.$toast.add({
            severity: 'success',
            summary: 'Bericht gelöscht',
            detail: 'Wartungsbericht #' + data.$sequence + ' wurde erfolgreich gelöscht.',
            life: 5000,
          })

          this.fetchWartungsberichte()

          this.deletingBericht = null
        },
      })
    },
    activateSignPad() {
      if (this.signpad) return

      let canvas = document.getElementById('signpad')

      // Function to resize canvas properly
      const resizeCanvas = () => {
        const ratio = Math.max(window.devicePixelRatio || 1, 1)

        // Get actual display size from CSS
        const rect = canvas.getBoundingClientRect()

        // Set canvas internal size (accounting for device pixel ratio)
        canvas.width = rect.width * ratio
        canvas.height = rect.height * ratio

        // Scale context to match device pixel ratio
        const ctx = canvas.getContext('2d')
        ctx.scale(ratio, ratio)

        // If signature pad exists, restore the signature data
        if (this.signpad && this.signature) {
          this.signpad.fromDataURL(this.signature)
        }
      }

      // Initial resize
      resizeCanvas()

      // Initialize SignaturePad
      this.signpad = new SignaturePad(canvas, {
        backgroundColor: 'rgb(255, 255, 255)',
      })

      // Handle signature events
      this.signpad.addEventListener('beginStroke', () => {
        this.isSignpadEmpty = false
      })

      this.signpad.addEventListener('endStroke', () => {
        this.signature = this.signpad.toDataURL()
      })

      // Handle window resize
      const handleResize = () => {
        if (!this.signpad) return
        const data = this.signpad.toData()
        resizeCanvas()
        this.signpad.clear()
        if (data && data.length > 0) {
          this.signpad.fromData(data)
        }
      }

      this.$nextTick(() => {
        handleResize()
      })

      window.addEventListener('resize', handleResize)

      // Store the event listener so we can remove it later
      this.signpadResizeHandler = handleResize
    },
    async submit(stepCallback) {
      try {
        this.signpad.toDataURL()
        this.generatingPDF = true
        let signature = this.signpad.toDataURL()
        let pdf
        let has2Pages = false
        this.$refs.filler.broadcastInputsToStore()

        switch (this.inputValues.berichtType.id) {
          case 'motor':
            pdf = await fillMotorPDF(this.inputValues, signature)
            break
          case 'pumpe':
            pdf = await fillPumpePDF(this.inputValues, signature)
            break
          case 'wehrtore':
            pdf = await fillWehrtorePDF(this.inputValues, signature)
            break
          case 'luefter':
            pdf = await fillLüfterPDF(this.inputValues, signature)
            break
          case 'schmutzwasser':
            pdf = await fillSchmutzwasserPDF(this.inputValues, signature)
            break
          case 'waermetauscher':
            pdf = await fillWärmetauscherPDF(this.inputValues, signature)
            break
          case 'müllanlage':
            pdf = await fillMüllanlagePDF(this.inputValues, signature)
            has2Pages = true
            break
          case 'enthaertungsanlage':
            pdf = await fillEnthärtungsanlagePDF(this.inputValues, signature)
            break
          default:
            break
        }

        let pdfBufferClone = pdf[0]
        let pdfBufferCopy = new Uint8Array(pdfBufferClone)
        if (has2Pages) this.pdfImg2 = await this.turnPDFToPNG(pdfBufferCopy, 2)
        this.pdfImg = await this.turnPDFToPNG(pdf[0])
        this.pdfBytes = pdf

        stepCallback('4')
        this.generatingPDF = false
      } catch (err) {
        this.generatingPDF = false

        // Check if error is network-related (offline)
        const isNetworkError =
          err.message.includes('fetch') ||
          err.message.includes('network') ||
          (err.name === 'TypeError' && !navigator.onLine)

        if (isNetworkError && !navigator.onLine) {
          this.$toast.add({
            severity: 'warn',
            summary: 'Offline - PDF kann nicht erstellt werden',
            detail:
              'Die PDF-Vorlagen müssen zuerst geladen werden. Bitte stellen Sie eine Internetverbindung her und laden Sie die Seite neu, damit die Vorlagen zwischengespeichert werden können.',
            life: 15000,
          })

        } else {
          this.$toast.add({
            severity: 'error',
            summary: 'Fehler beim Erstellen des PDFs',
            detail: err.message,
            life: 10000,
          })
        }
      }
    },
    async turnPDFToPNG(pdfBuffer, pageNumber = 1) {
      let pdf = await pdfjsLib.getDocument(pdfBuffer).promise
      let page = await pdf.getPage(pageNumber)
      let canvas = document.getElementById('pdfCanvas')

      const viewport = page.getViewport({ scale: 3.0 })
      const height = viewport.height
      const width = viewport.width
      canvas.height = height
      canvas.width = width

      const renderContext = {
        canvasContext: canvas.getContext('2d'),
        viewport: viewport,
      }

      await page.render(renderContext).promise
      return canvas.toDataURL('image/png')
    },
    normalizeInputValues(inputValues) {
      const raw = toRaw(inputValues)

      return {
        ...raw,
        date: raw.date instanceof Date ? raw.date.toISOString() : raw.date,
        customer: structuredClone(raw.customer),
        berichtType: structuredClone(raw.berichtType),
      }
    },
    async saveAndSend() {
      this.isSending = true

      try {
        if (!navigator.onLine) throw new Error('Offline')
        await executeJob({
          id: crypto.randomUUID(),
          pdfBase64: this.pdfBytes[1],
          inputValues: this.normalizeInputValues(this.inputValues),
          createdAt: Date.now(),
        })
        console.log('Job sent successfully')
        this.fetchWartungsberichte()
      } catch (err) {
        console.warn('Offline – queued for later', err)

        await enqueueJob({
          type: 'wartungsbericht',
          id: crypto.randomUUID(),
          pdfBase64: this.pdfBytes[1],
          inputValues: this.normalizeInputValues(this.inputValues),
          createdAt: Date.now(),
        })

        this.$toast.add({
          severity: 'info',
          summary: 'Offline Modus',
          detail:
            'Der Wartungsbericht wurde zum späteren Senden in die Warteschlange gestellt, da keine Internetverbindung besteht.',
          life: 15000,
        })
      }

      await this.confetti_play()

      this.isSending = false
      this.isSent = true
      useInputStore().setIsEditingSomething(false)
    },
  },
}
</script>
<style lang="scss">
.p-datatable-frozen-column {
  inset-inline-end: 1px !important;
  border-left: 1px solid var(--p-surface-200) !important;
}

.p-datatable {
  &::after {
    content: '';
    display: block;
    width: 1px;
    pointer-events: none;
    height: 100%;
    background-color: white;
    position: absolute;
    right: 0;
    top: 0;
    z-index: 3;
  }
}

.wartungsberichte {
  display: flex;
  flex-direction: column;
  gap: 1rem;

  &-uppercard {
    overflow-x: hidden;
  }

  &-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    flex-wrap: wrap;
    gap: 0.5rem;

    h1 {
      font-size: 2rem;

      @media (max-width: 768px) {
        font-size: 1.5rem;
      }
    }

    &-btns {
      display: flex;
      gap: 0.3rem;
      flex-wrap: wrap;

      @media (max-width: 768px) {
        width: 100%;

        .p-button {
          flex: 1;
          min-width: 0;
        }
      }
    }
  }

  .p-step-title {
    font-size: 1rem;
    font-weight: 500;
    font-family: 'Inter', sans-serif;

    @media (max-width: 768px) {
      font-size: 0.9rem;
    }
  }

  &-create-panel {
    display: flex;
    flex-direction: column;
    gap: 1rem;

    &-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;

      @media (max-width: 768px) {
        grid-template-columns: 1fr;
        gap: 0.75rem;
      }

      &-inpt {
        display: flex;
        flex-direction: column;
        min-width: 0;

        label {
          font-weight: 600;
          font-size: 1rem;
          padding-bottom: 0.3rem;

          @media (max-width: 768px) {
            font-size: 0.9rem;
          }
        }

        .p-select,
        .p-inputtext,
        .p-datepicker {
          min-width: 0;
        }
      }

      &-slct-type {
        width: 100%;
        min-width: 0;
      }
    }

    &-btn {
      width: fit-content;

      @media (max-width: 768px) {
        width: 100%;
      }
    }
  }

  &-fill-panel {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding-right: 3rem;

    &-btn {
      width: fit-content;

      @media (max-width: 768px) {
        width: 100%;
      }
    }
  }

  &-sign-panel {
    display: flex;
    flex-direction: column;
    gap: 1rem;

    &-main {
      display: flex;
      flex-direction: column;

      &-btns {
        margin-top: 0.5rem;
        display: flex;
        gap: 0.3rem;
        flex-wrap: wrap;

        @media (max-width: 768px) {
          .p-button:not(.p-button-icon-only) {
            flex: 1;
          }
        }
      }
    }

    &-btn {
      width: fit-content;

      @media (max-width: 768px) {
        width: 100%;
      }
    }

    label {
      font-weight: 600;
      font-size: 1rem;
      padding-bottom: 0.3rem;

      @media (max-width: 768px) {
        font-size: 0.9rem;
      }
    }

    &-signpad {
      width: 100%;
      max-width: 30rem;
      aspect-ratio: 4 / 1;
      border-radius: 0.5rem;
      border: 1px solid var(--p-surface-300);
      touch-action: none;
      display: block;

      @media (max-width: 768px) {
        max-width: 100%;
      }
    }
  }

  &-finish-panel {
    display: flex;
    flex-direction: column;
    gap: 1rem;

    &-preview {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.3rem;

      @media (max-width: 768px) {
        grid-template-columns: 1fr;
        gap: 1rem;
      }

      &-board {
        display: flex;
        flex-direction: column;

        div {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;

          @media (max-width: 768px) {
            .p-button {
              flex: 1;
              min-width: 0;
            }
          }
        }

        p {
          margin-bottom: 0;

          @media (max-width: 768px) {
            font-size: 0.9rem;
          }
        }

        h3 {
          margin-top: 0;
          margin-bottom: 0;

          @media (max-width: 768px) {
            font-size: 1.25rem;
          }
        }

        span {
          @media (max-width: 768px) {
            font-size: 0.9rem;
          }
        }
      }

      img {
        justify-self: end;
        width: 100%;
        max-width: 40rem;
        border-radius: 0.5rem;
        border: 1px solid var(--p-surface-300);

        @media (max-width: 768px) {
          justify-self: center;
          max-width: 100%;
        }
      }
    }

    &-btn {
      width: fit-content;

      @media (max-width: 768px) {
        width: 100%;
      }
    }
  }
}

/* DataTable Mobile Responsiveness */
.p-datatable {
  @media (max-width: 768px) {
    font-size: 0.875rem;

    .p-datatable-thead > tr > th {
      padding: 0.5rem;
      font-size: 0.8rem;
    }

    .p-datatable-tbody > tr > td {
      padding: 0.5rem;
    }

    .p-button {
      padding: 0.4rem 0.6rem;
      font-size: 0.875rem;
    }

    .p-datatable-header {
      padding: 0.75rem !important;

      > div {
        flex-direction: column;
        align-items: flex-start !important;
        gap: 0.5rem;

        h4 {
          font-size: 0.9rem;
        }

        .p-iconfield {
          width: 100%;

          .p-inputtext {
            width: 100%;
          }
        }
      }
    }
  }
}

/* DataTable Scroll Height Fix for Mobile */
@media (max-width: 768px) {
  .p-datatable-wrapper {
    max-height: calc(100vh - 22rem) !important;
  }

  .p-datatable[scrollable='true'] {
    .p-datatable-wrapper {
      max-height: calc(100vh - 22rem) !important;
    }
  }
}

/* Card Mobile Spacing */
.p-card {
  @media (max-width: 768px) {
    .p-card-content {
      padding: 0.75rem;
    }
  }
}

/* Stepper Mobile Adjustments */
.p-stepper {
  @media (max-width: 768px) {
    .p-stepper-header {
      padding: 0.5rem;
    }

    .p-steppanel-content {
      padding: 0.75rem;
    }
  }
}

/* Dialog Mobile Responsiveness */
.p-dialog {
  @media (max-width: 768px) {
    width: 95vw !important;
    max-width: 95vw !important;
    margin: 0.5rem;

    .p-dialog-content {
      padding: 1rem;
    }
  }
}

/* Confetti */
.dot-container {
  position: absolute;
  left: 0;
  top: 0;
  overflow: visible;
  z-index: 5000;
  pointer-events: none;
}

.dot {
  position: absolute;
  pointer-events: none;
}
</style>
