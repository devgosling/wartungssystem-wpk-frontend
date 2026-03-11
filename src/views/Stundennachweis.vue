<template>
  <div class="stundennachweise">
    <div class="stundennachweise-header">
      <h1>Stundennachweise</h1>
      <div class="stundennachweise-header-btns">
        <Button
          icon="fa-regular fa-plus"
          @click="tab = 1"
          label="Stundennachweis erstellen"
          severity="contrast"
        />
      </div>
    </div>
    <transition @before-enter="beforeEnter" @enter="enter" @after-enter="afterEnter">
      <Card v-if="tab == 1" class="stundennachweise-uppercard">
        <template #title> Stundennachweis erstellen</template>
        <template #content>
          <div
            id="stundennachweise-uppercard-container"
            style="overflow-x: hidden; position: relative"
          >
            <Stepper v-if="tab == 1" value="1" linear>
              <StepItem value="1">
                <Step>Anfangsdaten</Step>
                <StepPanel v-slot="{ activateCallback }">
                  <div class="stundennachweise-create-panel">
                    <div class="stundennachweise-create-panel-grid-inpt">
                      <label for="stundennachweis-kunde">Kunde</label>
                      <Select
                        id="stundennachweis-kunde"
                        placeholder="Kein Kunde Augewählt"
                        :options="kunden"
                        :disabled="kundeLocked"
                        class="stundennachweise-create-panel-grid-slct-type"
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
                            style="font-weight: 500; padding: 0.75rem 1rem; padding-bottom: 0.1rem"
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
                    <div class="stundennachweise-create-panel-grid-inpt">
                      <label for="stundennachweis-strasse">Straße und Hausnummer</label>
                      <InputText
                        id="stundennachweis-strasse"
                        disabled
                        placeholder="Kein Kunde ausgewählt"
                        :value="inputValues.customer?.['address.street']"
                      />
                    </div>
                    <div class="stundennachweise-create-panel-grid-inpt">
                      <label for="stundennachweis-plz">Postleitzahl</label>
                      <InputText
                        id="stundennachweis-plz"
                        disabled
                        placeholder="Kein Kunde ausgewählt"
                        :value="inputValues.customer?.['address.zipcode']"
                      />
                    </div>
                    <div class="stundennachweise-create-panel-grid-inpt">
                      <label for="stundennachweis-stadt">Stadt</label>
                      <InputText
                        id="stundennachweis-stadt"
                        disabled
                        placeholder="Kein Kunde ausgewählt"
                        :value="inputValues.customer?.['address.city']"
                      />
                    </div>
                    <div class="stundennachweise-create-panel-grid-inpt">
                      <label for="stundennachweis-kunde">Weitere Mitarbeiter</label>
                      <MultiSelect
                        id="stundennachweis-employees"
                        placeholder="Keine weiteren Mitarbeiter ausgewählt"
                        :options="mitarbeiter.slice().sort((a, b) => a.localeCompare(b))"
                        class="stundennachweise-create-panel-grid-slct-type"
                        filter
                        multiple
                        optionLabel="name"
                        v-model="inputValues.employees"
                        :showClear="!kundeLocked"
                      >
                        <template #value="slotProps">
                          <div v-if="slotProps.value">
                            {{ slotProps.value.join(', ') }}
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
                            <i :class="'fa-solid fa-user'" />{{ slotProps.option }}
                          </div>
                        </template>
                        <template #header>
                          <div
                            style="font-weight: 500; padding: 0.75rem 1rem; padding-bottom: 0.1rem"
                          >
                            Verfügbare Mitarbeiter
                          </div>
                        </template>
                      </MultiSelect>
                    </div>
                    <div class="stundennachweise-create-panel-grid-inpt">
                      <label for="stundennachweis-objekt">Objekt</label>
                      <InputText
                        id="stundennachweis-objekt"
                        placeholder="Objekt eingeben"
                        v-model="inputValues.objekt"
                      />
                    </div>
                    <div class="stundennachweise-create-panel-grid-inpt">
                      <label for="stundennachweis-bestellnr">Bestell Nr.</label>
                      <InputText
                        id="stundennachweis-bestellnr"
                        placeholder="Bestell Nr. eingeben"
                        v-model="inputValues.bestellNr"
                      />
                    </div>
                    <div class="stundennachweise-create-panel-grid-inpt">
                      <label for="stundennachweis-auftragsnr">Auftrags-Nr.</label>
                      <InputText
                        id="stundennachweis-auftragsnr"
                        placeholder="Auftrags-Nr. eingeben"
                        v-model="inputValues.auftragsNr"
                      />
                    </div>
                    <Button
                      class="stundennachweise-create-panel-btn"
                      severity="contrast"
                      label="Weiter"
                      icon="fa-regular fa-arrow-right"
                      size="small"
                      iconPos="right"
                      :disabled="!inputValues.customer"
                      @click="proceedToStep2(activateCallback)"
                    />
                  </div>
                </StepPanel>
              </StepItem>
              <StepItem value="2">
                <Step>Stundenzettel ausfüllen</Step>
                <StepPanel v-slot="{ activateCallback }">
                  <div class="stundennachweise-fill-panel">
                    <Button
                      class="stundennachweise-fill-panel-btn"
                      severity="secondary"
                      label="Zurück"
                      icon="fa-regular fa-arrow-left"
                      size="small"
                      iconPos="left"
                      @click="activateCallback('1')"
                    />
                    <div class="stundenfiller">
                      <!-- Hour Table Grid -->
                      <div class="stundenfiller-table">
                        <div class="stundenfiller-table-header">
                          <span>Datum</span>
                          <span style="grid-column: 2 / 4">Arbeitszeit</span>
                          <span>Pause</span>
                          <span>Std.</span>
                          <span style="grid-column: 6 / 8">Überstunden</span>
                          <span>Std.</span>
                          <span style="grid-column: 9 / 11">Anfahrt</span>
                          <span>Std.</span>
                          <span style="grid-column: 12 / 14">Abfahrt</span>
                          <span>KM</span>
                          <span>Total Std.</span>
                        </div>
                        <div v-for="row in 8" :key="row" class="stundenfiller-table-row">
                          <DatePicker
                            v-model="stundenData.rows[row - 1].datum"
                            dateFormat="dd.mm.yy"
                            showIcon
                            iconDisplay="input"
                            class="stundenfiller-datepicker"
                          />
                          <InputText
                            size="small"
                            v-model="stundenData.rows[row - 1].arbeitszeit1"
                          />
                          <InputText
                            size="small"
                            v-model="stundenData.rows[row - 1].arbeitszeit2"
                          />
                          <InputText size="small" v-model="stundenData.rows[row - 1].pause" />
                          <InputText size="small" v-model="stundenData.rows[row - 1].pauseStd" />
                          <InputText
                            size="small"
                            v-model="stundenData.rows[row - 1].ueberstunden1"
                          />
                          <InputText
                            size="small"
                            v-model="stundenData.rows[row - 1].ueberstunden2"
                          />
                          <InputText
                            size="small"
                            v-model="stundenData.rows[row - 1].ueberstundenStd"
                          />
                          <InputText size="small" v-model="stundenData.rows[row - 1].anfahrt1" />
                          <InputText size="small" v-model="stundenData.rows[row - 1].anfahrt2" />
                          <InputText size="small" v-model="stundenData.rows[row - 1].anfahrtStd" />
                          <InputText size="small" v-model="stundenData.rows[row - 1].abfahrt1" />
                          <InputText size="small" v-model="stundenData.rows[row - 1].abfahrt2" />
                          <InputText size="small" v-model="stundenData.rows[row - 1].km" />
                          <InputText size="small" v-model="stundenData.rows[row - 1].totalStd" />
                        </div>
                        <div class="stundenfiller-table-totals">
                          <span style="grid-column: 1 / 5" class="total-label">TOTAL</span>
                          <InputText size="small" v-model="stundenData.totalPause" />
                          <span style="grid-column: 6 / 8" class="total-label">TOTAL</span>
                          <InputText size="small" v-model="stundenData.totalUeberstunden" />
                          <span style="grid-column: 9 / 11" class="total-label">TOTAL</span>
                          <InputText size="small" v-model="stundenData.totalAnfahrt" />
                          <span style="grid-column: 12 / 14" class="total-label">TOTAL</span>
                          <InputText size="small" v-model="stundenData.totalAbfahrt" />
                          <InputText size="small" v-model="stundenData.totalStd" />
                        </div>
                      </div>

                      <!-- Ausgeführte Arbeiten -->
                      <div class="stundenfiller-section">
                        <label for="ausgefuehrte-arbeiten" class="stundenfiller-section-label"
                          >Ausgeführte Arbeiten</label
                        >
                        <Textarea
                          id="ausgefuehrte-arbeiten"
                          v-model="stundenData.ausgefuehrteArbeiten"
                          rows="8"
                          class="stundenfiller-section-textarea"
                        />
                      </div>

                      <!-- Besonderheiten -->
                      <div class="stundenfiller-section">
                        <label class="stundenfiller-section-label">Besonderheiten</label>
                        <div class="stundenfiller-checkboxes">
                          <div class="stundenfiller-checkbox">
                            <Checkbox
                              inputId="notdienst"
                              v-model="stundenData.notdienst"
                              :binary="true"
                            />
                            <label for="notdienst">Notdienst</label>
                          </div>
                          <div class="stundenfiller-checkbox">
                            <Checkbox
                              inputId="kundendienst"
                              v-model="stundenData.kundendienst"
                              :binary="true"
                            />
                            <label for="kundendienst">Kundendienst</label>
                          </div>
                          <div class="stundenfiller-checkbox">
                            <Checkbox
                              inputId="wartung"
                              v-model="stundenData.wartung"
                              :binary="true"
                            />
                            <label for="wartung">Wartung</label>
                          </div>
                        </div>
                      </div>

                      <!-- Material -->
                      <div class="stundenfiller-section">
                        <label for="material" class="stundenfiller-section-label">Material</label>
                        <Textarea
                          id="material"
                          v-model="stundenData.material"
                          rows="8"
                          class="stundenfiller-section-textarea"
                        />
                      </div>
                    </div>
                    <Button
                      class="stundennachweise-fill-panel-btn"
                      severity="contrast"
                      label="Weiter"
                      icon="fa-regular fa-arrow-right"
                      size="small"
                      iconPos="right"
                      :disabled="!inputValues.employee"
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
                <Step>Monteur Unterschrift</Step>
                <StepPanel v-slot="{ activateCallback }" id="step3">
                  <div class="stundennachweise-sign-panel">
                    <Button
                      class="stundennachweise-sign-panel-btn"
                      severity="secondary"
                      label="Zurück"
                      icon="fa-regular fa-arrow-left"
                      size="small"
                      iconPos="left"
                      @click="activateCallback('2')"
                      :disabled="generatingPDF"
                    />
                    <div class="stundennachweise-sign-panel-main">
                      <label for="signpad">Monteur Signatur hier Zeichnen</label>
                      <canvas id="signpad" class="stundennachweise-sign-panel-signpad"></canvas>

                      <div class="stundennachweise-sign-panel-main-btns">
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
                          label="Weiter"
                          size="small"
                          severity="success"
                          icon="fa-regular fa-arrow-right"
                          iconPos="right"
                          :disabled="isSignpadEmpty"
                          @click="
                            function () {
                              activateCallback('4')
                              activateSignPad2()
                            }
                          "
                        />
                      </div>
                    </div>
                  </div>
                </StepPanel>
              </StepItem>
              <StepItem value="4">
                <Step>Kundenkontrolle</Step>
                <StepPanel v-slot="{ activateCallback }" id="step4">
                  <div class="stundennachweise-sign-panel">
                    <Button
                      class="stundennachweise-sign-panel-btn"
                      severity="secondary"
                      label="Zurück"
                      icon="fa-regular fa-arrow-left"
                      size="small"
                      iconPos="left"
                      @click="activateCallback('3')"
                      :disabled="generatingPDF"
                    />
                    <div class="stundennachweise-sign-panel-main">
                      <label for="signpad2">Kunden Signatur hier Zeichnen</label>
                      <canvas id="signpad2" class="stundennachweise-sign-panel-signpad"></canvas>

                      <div class="stundennachweise-sign-panel-main-btns">
                        <Button
                          rounded
                          :disabled="isSignpadEmpty2"
                          size="small"
                          severity="danger"
                          icon="fa-regular fa-trash"
                          @click="
                            function () {
                              signpad2.clear()
                              isSignpadEmpty2 = true
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
                              if (signpad2.minWidth <= 0.1) return
                              signpad2.minWidth -= 0.1
                              signpad2.maxWidth -= 0.5
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
                              if (signpad2.minWidth >= 1) return
                              signpad2.minWidth += 0.1
                              signpad2.maxWidth += 0.5
                            }
                          "
                        />
                        <Button
                          rounded
                          label="Überspringen"
                          size="small"
                          severity="secondary"
                          icon="fa-regular fa-forward"
                          @click="submitWithoutCustomerSignature(activateCallback)"
                          :loading="generatingPDF"
                          :disabled="!isSignpadEmpty2"
                        />
                        <Button
                          rounded
                          label="Bestätigen"
                          size="small"
                          severity="success"
                          icon="fa-regular fa-check"
                          :disabled="isSignpadEmpty2"
                          @click="submitWithCustomerSignature(activateCallback)"
                          :loading="generatingPDF"
                        />
                      </div>
                    </div>
                  </div>
                </StepPanel>
              </StepItem>
              <StepItem value="5">
                <Step>Stundennachweis speichern</Step>
                <StepPanel v-slot="{ activateCallback }">
                  <div class="stundennachweise-finish-panel">
                    <Button
                      class="stundennachweise-finish-panel-btn"
                      severity="secondary"
                      label="Zurück"
                      icon="fa-regular fa-arrow-left"
                      size="small"
                      iconPos="left"
                      @click="activateCallback('4')"
                      :disabled="isSending || isSent"
                    />
                    <div class="stundennachweise-finish-panel-preview">
                      <div class="stundennachweise-finish-panel-preview-board">
                        <h3>🎉 Der Stundennachweis ist fertig!</h3>
                        <p>
                          Überprüfe gegebenenfalls nocheinmal alle eingaben und speichere den
                          Stundennachweis.
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
                            label="Weiteren Stundennachweis"
                            icon="fa-regular fa-plus"
                            @click="resetDataAndCreateNew(activateCallback)"
                          ></Button>
                          <Button
                            id="saveandsendbtn"
                            :icon="isSent ? 'fa-regular fa-check' : 'fa-regular fa-paper-plane'"
                            :loading="isSending"
                            :disabled="isSent"
                            :label="isSent ? 'Erfolgreich versendet' : 'Speichern'"
                            severity="success"
                            @click="saveAndSend()"
                          ></Button>
                        </div>
                      </div>
                      <img :src="pdfImg" alt="" />
                      <img v-if="pdfImg2" style="grid-column: 2" :src="pdfImg2" alt="" />
                    </div>
                  </div>
                </StepPanel>
              </StepItem>
            </Stepper>
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
          :value="stundennachweise?.documents"
          :loading="!stundennachweise"
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
              <h4 style="margin: 0">{{ stundennachweise?.total }} Stundennachweise</h4>
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
          <Column field="unterschrieben_kund" header="Kunde signiert">
            <template #body="slotProps">
              <Tag
                v-if="slotProps.data.unterschrieben_kunde"
                severity="success"
                icon="fa-regular fa-check"
                value="Signiert"
              />
              <Tag v-else severity="warn" icon="fa-regular fa-xmark" value="Nein" />
            </template>
          </Column>
          <Column field="ueberprueft" header="Überprüft">
            <template #body="slotProps">
              <Tag
                v-if="slotProps.data.ueberprueft"
                severity="success"
                icon="fa-regular fa-check"
                value="Überprüft"
              />
              <Tag v-else severity="secondary" icon="fa-regular fa-clock" value="Ausstehend" />
            </template>
          </Column>
          <Column field="actions" header="Aktionen" frozen alignFrozen="right">
            <template #body="slotProps">
              <div style="display: flex; gap: 0.2rem">
                <Button
                  v-if="!slotProps.data.unterschrieben_kunde"
                  icon="fa-regular fa-signature"
                  severity="warn"
                  v-tooltip.top="'Als Kunde unterschreiben'"
                  @click="openCustomerSignDialog(slotProps.data, slotProps.index)"
                  size="small"
                  :loading="signingAsCustomer == slotProps.index"
                ></Button>
                <Button
                  v-if="!slotProps.data.ueberprueft && isAdmin"
                  icon="fa-regular fa-clipboard-check"
                  severity="secondary"
                  v-tooltip.top="'Als überprüft markieren'"
                  @click="openControlSignDialog(slotProps.data, slotProps.index)"
                  size="small"
                  :loading="markingAsVerified == slotProps.index"
                ></Button>
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

  <!-- Customer Signature Dialog -->
  <Dialog
    v-model:visible="customerSignDialog.open"
    header="Kundenunterschrift nachträglich hinzufügen"
    :style="{ width: 'min(90vw, 600px)' }"
    modal
  >
    <div class="customer-sign-dialog">
      <p>Bitte lassen Sie den Kunden hier unterschreiben:</p>
      <canvas id="customerSignpadDialog" class="stundennachweise-sign-panel-signpad"></canvas>
      <div style="display: flex; gap: 0.5rem; margin-top: 1rem; justify-content: flex-end">
        <Button
          label="Löschen"
          severity="danger"
          icon="fa-regular fa-trash"
          size="small"
          :disabled="isCustomerSignDialogEmpty"
          @click="clearCustomerSignDialog"
        />
        <Button
          label="Abbrechen"
          severity="secondary"
          icon="fa-regular fa-xmark"
          size="small"
          @click="closeCustomerSignDialog"
        />
        <Button
          label="Unterschrift speichern"
          severity="success"
          icon="fa-regular fa-check"
          size="small"
          :disabled="isCustomerSignDialogEmpty"
          :loading="signingAsCustomer !== null"
          @click="saveCustomerSignature"
        />
      </div>
    </div>
  </Dialog>

  <!-- Control Signature Dialog -->
  <Dialog
    v-model:visible="controlSignDialog.open"
    header="Kontrolle unterschreiben"
    :style="{ width: 'min(90vw, 600px)' }"
    modal
  >
    <div class="control-sign-dialog">
      <p>Bitte unterschreiben Sie hier, um den Stundennachweis als überprüft zu markieren:</p>
      <canvas id="controlSignpadDialog" class="stundennachweise-sign-panel-signpad"></canvas>
      <div style="display: flex; gap: 0.5rem; margin-top: 1rem; justify-content: flex-end">
        <Button
          label="Löschen"
          severity="danger"
          icon="fa-regular fa-trash"
          size="small"
          :disabled="isControlSignDialogEmpty"
          @click="clearControlSignDialog"
        />
        <Button
          label="Abbrechen"
          severity="secondary"
          icon="fa-regular fa-xmark"
          size="small"
          @click="closeControlSignDialog"
        />
        <Button
          label="Überprüft & Unterschrieben"
          severity="success"
          icon="fa-regular fa-check"
          size="small"
          :disabled="isControlSignDialogEmpty"
          :loading="markingAsVerified !== null"
          @click="saveControlSignature"
        />
      </div>
    </div>
  </Dialog>
</template>
<script>
import { account, databases, functions, storage } from '@/lib/appwrite'
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
  Textarea,
  Checkbox,
  MultiSelect,
} from 'primevue'
import StepPanel from 'primevue/steppanel'
import StepItem from 'primevue/stepitem'
import Stepper from 'primevue/stepper'
import Step from 'primevue/step'
import SignaturePad from 'signature_pad'
import {
  fillStundenzettelPDF,
  getAmountOfPagesInPDF,
  addCustomerSignatureToPDF,
  addControlSignatureToPDF,
} from '@/lib/pdf-lib'
import * as pdfjsLib from 'pdfjs-dist'
import { useInputStore } from '@/stores/inputStore'
import { AppwriteException, ExecutionMethod, Query } from 'appwrite'
import { FilterMatchMode } from '@primevue/core'
import CreateCustomerDialog from '@/components/CreateCustomerDialog.vue'
import ViewCustomerDialog from '@/components/ViewCustomerDialog.vue'
import { enqueueJob } from '@/lib/offlineQueue'
import { executeStundenzettelJob } from '@/lib/executeStundenzettelJob'
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
    Splitter,
    SplitterPanel,
    Divider,
    Column,
    IconField,
    InputIcon,
    Dialog,
    CreateCustomerDialog,
    Tag,
    ViewCustomerDialog,
    Textarea,
    Checkbox,
    MultiSelect,
  },

  data() {
    return {
      username: null,
      viewingCustomer: null,

      openDialog: false,
      openIdfDialog: false,

      stundennachweise: null,
      filters: {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
      },

      pdfsCached: true,
      checkingPDFCache: false,

      inputValues: {
        customer: null,
        objekt: '',
        bestellNr: '',
        auftragsNr: '',
      },
      stundenData: {
        rows: Array.from({ length: 8 }, () => ({
          datum: null,
          arbeitszeit1: '',
          arbeitszeit2: '',
          pause: '',
          pauseStd: '',
          ueberstunden1: '',
          ueberstunden2: '',
          ueberstundenStd: '',
          anfahrt1: '',
          anfahrt2: '',
          anfahrtStd: '',
          abfahrt1: '',
          abfahrt2: '',
          km: '',
          totalStd: '',
        })),
        employees: [],
        totalPause: '',
        totalUeberstunden: '',
        totalAnfahrt: '',
        totalAbfahrt: '',
        totalStd: '',
        ausgefuehrteArbeiten: '',
        notdienst: false,
        kundendienst: false,
        wartung: false,
        material: '',
      },
      tabCooldown: -1,
      tab: 0, // DO NOT CHANGE
      tabtext: '',

      mitarbeiter: [],

      kunden: [],

      signpad: null,
      signature: null,
      isSignpadEmpty: true,

      signpad2: null,
      signature2: null,
      isSignpadEmpty2: true,
      unterschriebenKunde: false,

      generatingPDF: false,

      pdfBytes: null,
      pdfImg: null,
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

      signpadResizeHandler: null,
      signpadResizeHandler2: null,

      // Customer signature dialog
      customerSignDialog: {
        open: false,
        data: null,
        index: null,
        signpad: null,
      },
      isCustomerSignDialogEmpty: true,
      signingAsCustomer: null,

      // Control signature dialog
      controlSignDialog: {
        open: false,
        data: null,
        index: null,
        signpad: null,
      },
      isControlSignDialogEmpty: true,
      markingAsVerified: null,

      isAdmin: false,
    }
  },

  beforeUnmount() {
    if (this.signpadResizeHandler) {
      window.removeEventListener('resize', this.signpadResizeHandler)
    }
    if (this.signpadResizeHandler2) {
      window.removeEventListener('resize', this.signpadResizeHandler2)
    }
  },

  async mounted() {
    this.fetchStundenzettel()
    this.fetchCustomers()
    this.fetchEmployees()

    const currentUser = await account.get()
    this.inputValues.employee = currentUser.name
    this.isAdmin = currentUser.name === 'Administrator' || currentUser.name === 'Kevin Kromholz'

    // Check if PDFs are cached
    this.checkPDFCache()
  },

  methods: {
    // #region Fadein & -out animations
    async setTabtext() {
      let tabTexts = {
        1: 'Stundennachweis erstellen',
        2: 'Stundennachweis hochladen',
      }
      if (this.tabtext == '') {
        this.tabtext = this.tab == 1 ? tabTexts['1'] : tabTexts['2']
        return
      } else if (
        (this.tab == 1 && this.tabtext == tabTexts['1']) ||
        (this.tab == 2 && this.tabtext == tabTexts['2'])
      )
        return

      // Remove chars after "Stundennachweis"
      let text = this.tabtext
      await new Promise((resolve, reject) => {
        let removerInterval = setInterval(() => {
          text = text.substring(0, text.length - 1)
          this.tabtext = text
          if (text == 'Stundennachweis ') {
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
      let cardContainer = document.getElementById('stundennachweise-uppercard-container')
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

      let cardContainer = document.getElementById('stundennachweise-uppercard-container')
      cardContainer.style.height = el.scrollHeight + 'px'
    },
    leaveCard(el) {
      el.style.transition = 'transform 0.4s ease'
      requestAnimationFrame(() => {
        el.style.transform = 'translateX(100%)'
      })

      let cardContainer = document.getElementById('stundennachweise-uppercard-container')
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
    async fetchEmployees() {
      let userList = JSON.parse(
        (
          await functions.createExecution(
            '68f3d2b9001562f115c8',
            '{}',
            false,
            '/listusers',
            ExecutionMethod.GET,
          )
        ).responseBody,
      )

      this.mitarbeiter = userList.users.map((user) => user.name)
    },
    async fetchCustomers() {
      this.kunden = []

      try {
        const customerList = await databases.listDocuments(
          'wartungssystem',
          'customer',
          [Query.orderAsc('$sequence')],
        )

        customerList.documents.forEach((doc) => {
          this.kunden.push(doc)

          if (this.inputValues.customer?.name == doc.name) this.inputValues.customer = doc
        })
      } catch (err) {
        if (!navigator.onLine) {
          console.warn('Offline - Kunden konnten nicht geladen werden')
        } else {
          console.error('Fehler beim Laden der Kunden:', err)
        }
      }
    },
    async fetchStundenzettel() {
      try {
        const currentUser = await account.get()
        const userName = currentUser.name
        const isAdmin = userName === 'Administrator' || userName === 'Kevin Kromholz'

        let page = 1
        const perPage = 25
        let documentList = []
        let fetchedFiles = []

        // Build query - filter by mitarbeiter unless admin
        const baseQueries = [Query.limit(perPage)]
        if (!isAdmin) {
          baseQueries.push(Query.equal('mitarbeiter', userName))
        }

        do {
          const response = await databases.listDocuments('wartungssystem', 'stundenzettel', [
            ...baseQueries,
            Query.offset((page - 1) * perPage),
          ])
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
        this.stundennachweise = {
          documents: sortedDocuments,
          total: sortedDocuments.length,
        }
      } catch (err) {
        if (!navigator.onLine) {
          console.warn('Offline - Stundennachweise konnten nicht geladen werden')
          this.stundennachweise = { documents: [], total: 0 }
        } else {
          console.error('Fehler beim Laden der Stundennachweise:', err)
        }
      }
    },

    async resetDataAndCreateNew(callback) {
      this.inputValues = {
        customer: null,
        objekt: '',
        bestellNr: '',
        auftragsNr: '',
      }

      this.inputValues.employee = (await account.get()).name

      // Reset stundenData
      this.stundenData = {
        rows: Array.from({ length: 8 }, () => ({
          datum: null,
          arbeitszeit1: '',
          arbeitszeit2: '',
          pause: '',
          pauseStd: '',
          ueberstunden1: '',
          ueberstunden2: '',
          ueberstundenStd: '',
          anfahrt1: '',
          anfahrt2: '',
          anfahrtStd: '',
          abfahrt1: '',
          abfahrt2: '',
          km: '',
          totalStd: '',
        })),
        totalPause: '',
        totalUeberstunden: '',
        totalAnfahrt: '',
        totalAbfahrt: '',
        totalStd: '',
        ausgefuehrteArbeiten: '',
        employees: [],
        notdienst: false,
        kundendienst: false,
        wartung: false,
        material: '',
      }

      await callback('1')

      useInputStore().resetInputData()

      this.signpad = null
      this.signature = null
      this.isSignpadEmpty = true

      this.signpad2 = null
      this.signature2 = null
      this.isSignpadEmpty2 = true
      this.unterschriebenKunde = false

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
          data.stundenzettelId,
        )
        let fileData = await storage.getFile('storage', data.stundenzettelId)
        let jwtObject = await account.createJWT()
        // Add cache-busting and no-store to prevent showing old cached version
        const cacheBuster = `${fileDownload}${fileDownload.includes('?') ? '&' : '?'}_t=${Date.now()}`
        let fileResponse = await fetch(cacheBuster, {
          headers: { 'x-appwrite-jwt': jwtObject.jwt },
          cache: 'no-store',
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
        if (!navigator.onLine) {
          this.$toast.add({
            severity: 'warn',
            summary: 'Offline',
            detail: 'Der Bericht kann nicht angezeigt werden, da keine Internetverbindung besteht.',
            life: 5000,
          })
        } else if (err instanceof AppwriteException) {
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
          data.stundenzettelId,
        )

        let fileData = await storage.getFile('storage', data.stundenzettelId)
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
        if (!navigator.onLine) {
          this.$toast.add({
            severity: 'warn',
            summary: 'Offline',
            detail:
              'Der Bericht kann nicht heruntergeladen werden, da keine Internetverbindung besteht.',
            life: 5000,
          })
        } else if (err instanceof AppwriteException) {
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
        message: 'Bist du dir sicher, dass du diesen Stundennachweis löschen willst?',
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
            if (!navigator.onLine) throw new Error('Offline')
            await storage.deleteFile('storage', data.stundenzettelId)
            await databases.deleteDocument('wartungssystem', 'stundenzettel', data.$id)

            this.$toast.add({
              severity: 'success',
              summary: 'Stundenzettel gelöscht',
              detail: 'Stundenzettel #' + data.$sequence + ' wurde erfolgreich gelöscht.',
              life: 5000,
            })

            this.fetchStundenzettel()
          } catch (err) {
            if (!navigator.onLine) {
              // Queue for later deletion
              await enqueueJob({
                id: crypto.randomUUID(),
                type: 'delete-stundenzettel',
                stundenzettelId: data.stundenzettelId,
                documentId: data.$id,
                createdAt: Date.now(),
              })

              // Remove from local list immediately
              this.stundennachweise.documents = this.stundennachweise.documents.filter(
                (doc) => doc.$id !== data.$id,
              )
              this.stundennachweise.total = this.stundennachweise.documents.length

              this.$toast.add({
                severity: 'info',
                summary: 'Offline Modus',
                detail:
                  'Der Stundennachweis wird gelöscht, sobald eine Internetverbindung besteht.',
                life: 5000,
              })
            } else if (err instanceof AppwriteException) {
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
                      'Du bist nicht dazu berichtigt Stundennachweise zu löschen, bist du auf dem richtigen Konto angemeldet?',
                    life: 5000,
                  })
                  break
                default:
                  break
              }
            }
          }

          this.deletingBericht = null
        },
      })
    },

    // Customer signature dialog methods
    openCustomerSignDialog(data, index) {
      this.customerSignDialog.data = data
      this.customerSignDialog.index = index
      this.customerSignDialog.open = true
      this.isCustomerSignDialogEmpty = true

      // Use setTimeout to ensure dialog is fully rendered before initializing signpad
      setTimeout(() => {
        this.initCustomerSignpad()
      }, 100)
    },
    initCustomerSignpad() {
      if (this.customerSignDialog.signpad) return

      let canvas = document.getElementById('customerSignpadDialog')
      if (!canvas) return

      // Function to resize canvas properly
      const resizeCanvas = () => {
        const ratio = Math.max(window.devicePixelRatio || 1, 1)

        // Use clientWidth/clientHeight to exclude border from size calculation
        const width = canvas.clientWidth
        const height = canvas.clientHeight

        // Set canvas internal size (accounting for device pixel ratio)
        canvas.width = width * ratio
        canvas.height = height * ratio

        // Scale context to match device pixel ratio
        const ctx = canvas.getContext('2d')
        ctx.scale(ratio, ratio)
      }

      // Initial resize
      resizeCanvas()

      // Initialize SignaturePad
      this.customerSignDialog.signpad = new SignaturePad(canvas, {
        backgroundColor: 'rgb(255, 255, 255)',
      })

      // Handle signature events
      this.customerSignDialog.signpad.addEventListener('beginStroke', () => {
        this.isCustomerSignDialogEmpty = false
      })

      // Handle resize
      const handleResize = () => {
        if (!this.customerSignDialog.signpad) return
        const data = this.customerSignDialog.signpad.toData()
        resizeCanvas()
        this.customerSignDialog.signpad.clear()
        if (data && data.length > 0) {
          this.customerSignDialog.signpad.fromData(data)
        }
      }

      this.$nextTick(() => {
        handleResize()
      })
    },
    clearCustomerSignDialog() {
      if (this.customerSignDialog.signpad) {
        this.customerSignDialog.signpad.clear()
        this.isCustomerSignDialogEmpty = true
      }
    },
    closeCustomerSignDialog() {
      this.customerSignDialog.open = false
      this.customerSignDialog.data = null
      this.customerSignDialog.index = null
      if (this.customerSignDialog.signpad) {
        this.customerSignDialog.signpad.clear()
        this.customerSignDialog.signpad = null
      }
      this.isCustomerSignDialogEmpty = true
    },
    async saveCustomerSignature() {
      if (!this.customerSignDialog.signpad || this.isCustomerSignDialogEmpty) return

      // Check if offline - signature requires downloading PDF from server
      if (!navigator.onLine) {
        this.$toast.add({
          severity: 'warn',
          summary: 'Offline',
          detail:
            'Die Kundenunterschrift kann nicht gespeichert werden, da keine Internetverbindung besteht.',
          life: 5000,
        })
        return
      }

      this.signingAsCustomer = this.customerSignDialog.index
      const data = this.customerSignDialog.data

      try {
        // Get the signature as base64
        const signatureBase64 = this.customerSignDialog.signpad.toDataURL()

        // Download the existing PDF
        const fileDownload = await storage.getFileDownload(
          'storage',
          data.stundenzettelId,
        )
        const fileData = await storage.getFile('storage', data.stundenzettelId)
        const jwtObject = await account.createJWT()
        const fileResponse = await fetch(
          `${fileDownload}${fileDownload.includes('?') ? '&' : '?'}_t=${Date.now()}`,
          {
            headers: { 'x-appwrite-jwt': jwtObject.jwt },
            cache: 'no-store',
          },
        )
        const blob = await fileResponse.blob()
        const pdfBuffer = await blob.arrayBuffer()

        // Add customer signature to PDF
        const [newPdfBytes] = await addCustomerSignatureToPDF(pdfBuffer, signatureBase64)

        // Delete old file and upload new one with same ID and same name
        await storage.deleteFile('storage', data.stundenzettelId)

        const newFile = new File([newPdfBytes], fileData.name, {
          type: 'application/pdf',
        })
        await storage.createFile('storage', data.stundenzettelId, newFile)

        // Update the document in the database
        await databases.updateDocument('wartungssystem', 'stundenzettel', data.$id, {
          unterschrieben_kunde: true,
        })

        this.$toast.add({
          severity: 'success',
          summary: 'Kundenunterschrift gespeichert',
          detail: 'Die Kundenunterschrift wurde erfolgreich zum PDF hinzugefügt.',
          life: 5000,
        })

        this.closeCustomerSignDialog()
        this.fetchStundenzettel()
      } catch (err) {
        this.$toast.add({
          severity: 'error',
          summary: 'Fehler',
          detail: 'Die Kundenunterschrift konnte nicht gespeichert werden: ' + err.message,
          life: 5000,
        })
      }

      this.signingAsCustomer = null
    },

    // Control signature dialog methods
    openControlSignDialog(data, index) {
      this.controlSignDialog.data = data
      this.controlSignDialog.index = index
      this.controlSignDialog.open = true
      this.isControlSignDialogEmpty = true

      // Use setTimeout to ensure dialog is fully rendered before initializing signpad
      setTimeout(() => {
        this.initControlSignpad()
      }, 100)
    },
    initControlSignpad() {
      if (this.controlSignDialog.signpad) return

      let canvas = document.getElementById('controlSignpadDialog')
      if (!canvas) return

      // Function to resize canvas properly
      const resizeCanvas = () => {
        const ratio = Math.max(window.devicePixelRatio || 1, 1)

        // Use clientWidth/clientHeight to exclude border from size calculation
        const width = canvas.clientWidth
        const height = canvas.clientHeight

        // Set canvas internal size (accounting for device pixel ratio)
        canvas.width = width * ratio
        canvas.height = height * ratio

        // Scale context to match device pixel ratio
        const ctx = canvas.getContext('2d')
        ctx.scale(ratio, ratio)
      }

      // Initial resize
      resizeCanvas()

      // Initialize SignaturePad
      this.controlSignDialog.signpad = new SignaturePad(canvas, {
        backgroundColor: 'rgb(255, 255, 255)',
      })

      // Handle signature events
      this.controlSignDialog.signpad.addEventListener('beginStroke', () => {
        this.isControlSignDialogEmpty = false
      })

      // Handle resize
      const handleResize = () => {
        if (!this.controlSignDialog.signpad) return
        const data = this.controlSignDialog.signpad.toData()
        resizeCanvas()
        this.controlSignDialog.signpad.clear()
        if (data && data.length > 0) {
          this.controlSignDialog.signpad.fromData(data)
        }
      }

      this.$nextTick(() => {
        handleResize()
      })
    },
    clearControlSignDialog() {
      if (this.controlSignDialog.signpad) {
        this.controlSignDialog.signpad.clear()
        this.isControlSignDialogEmpty = true
      }
    },
    closeControlSignDialog() {
      this.controlSignDialog.open = false
      this.controlSignDialog.data = null
      this.controlSignDialog.index = null
      if (this.controlSignDialog.signpad) {
        this.controlSignDialog.signpad.clear()
        this.controlSignDialog.signpad = null
      }
      this.isControlSignDialogEmpty = true
    },
    async saveControlSignature() {
      if (!this.controlSignDialog.signpad || this.isControlSignDialogEmpty) return

      // Check if offline - signature requires downloading PDF from server
      if (!navigator.onLine) {
        this.$toast.add({
          severity: 'warn',
          summary: 'Offline',
          detail:
            'Die Überprüfung kann nicht gespeichert werden, da keine Internetverbindung besteht.',
          life: 5000,
        })
        return
      }

      this.markingAsVerified = this.controlSignDialog.index
      const data = this.controlSignDialog.data

      try {
        // Get the signature as base64
        const signatureBase64 = this.controlSignDialog.signpad.toDataURL()

        // Download the existing PDF
        const fileDownload = await storage.getFileDownload(
          'storage',
          data.stundenzettelId,
        )
        const fileData = await storage.getFile('storage', data.stundenzettelId)
        const jwtObject = await account.createJWT()
        const fileResponse = await fetch(
          `${fileDownload}${fileDownload.includes('?') ? '&' : '?'}_t=${Date.now()}`,
          {
            headers: { 'x-appwrite-jwt': jwtObject.jwt },
            cache: 'no-store',
          },
        )
        const blob = await fileResponse.blob()
        const pdfBuffer = await blob.arrayBuffer()

        // Add control signature to PDF
        const [newPdfBytes] = await addControlSignatureToPDF(pdfBuffer, signatureBase64)

        // Delete old file and upload new one with same ID and same name
        await storage.deleteFile('storage', data.stundenzettelId)

        const newFile = new File([newPdfBytes], fileData.name, {
          type: 'application/pdf',
        })
        await storage.createFile('storage', data.stundenzettelId, newFile)

        // Update the document in the database
        await databases.updateDocument('wartungssystem', 'stundenzettel', data.$id, {
          ueberprueft: true,
        })

        this.$toast.add({
          severity: 'success',
          summary: 'Als überprüft markiert',
          detail:
            'Der Stundennachweis wurde erfolgreich als überprüft markiert und unterschrieben.',
          life: 5000,
        })

        this.closeControlSignDialog()
        this.fetchStundenzettel()
      } catch (err) {
        this.$toast.add({
          severity: 'error',
          summary: 'Fehler',
          detail: 'Der Stundennachweis konnte nicht als überprüft markiert werden: ' + err.message,
          life: 5000,
        })
      }

      this.markingAsVerified = null
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
    activateSignPad2() {
      if (this.signpad2) return

      let canvas = document.getElementById('signpad2')

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
        if (this.signpad2 && this.signature2) {
          this.signpad2.fromDataURL(this.signature2)
        }
      }

      // Initial resize
      resizeCanvas()

      // Initialize SignaturePad
      this.signpad2 = new SignaturePad(canvas, {
        backgroundColor: 'rgb(255, 255, 255)',
      })

      // Handle signature events
      this.signpad2.addEventListener('beginStroke', () => {
        this.isSignpadEmpty2 = false
      })

      this.signpad2.addEventListener('endStroke', () => {
        this.signature2 = this.signpad2.toDataURL()
      })

      // Handle window resize
      const handleResize = () => {
        if (!this.signpad2) return
        const data = this.signpad2.toData()
        resizeCanvas()
        this.signpad2.clear()
        if (data && data.length > 0) {
          this.signpad2.fromData(data)
        }
      }

      this.$nextTick(() => {
        handleResize()
      })

      window.addEventListener('resize', handleResize)

      // Store the event listener so we can remove it later
      this.signpadResizeHandler2 = handleResize
    },
    async submitWithCustomerSignature(stepCallback) {
      this.unterschriebenKunde = true
      await this.submit(stepCallback)
    },
    async submitWithoutCustomerSignature(stepCallback) {
      this.unterschriebenKunde = false
      await this.submit(stepCallback)
    },
    async submit(stepCallback) {
      try {
        this.generatingPDF = true
        let signatureMonteur = this.signpad.toDataURL()
        let signatureKunde = this.unterschriebenKunde ? this.signpad2.toDataURL() : null
        let pdf

        pdf = await fillStundenzettelPDF(
          this.inputValues,
          this.stundenData,
          signatureMonteur,
          signatureKunde,
        )

        this.pdfImg = await this.turnPDFToPNG(pdf[0])
        this.pdfBytes = pdf

        stepCallback('5')
        this.generatingPDF = false
      } catch (err) {
        this.generatingPDF = false
        console.error('PDF generation error:', err)

        // Check if error is network-related (offline)
        const isNetworkError =
          err.message?.toLowerCase().includes('failed to fetch') ||
          err.message?.toLowerCase().includes('network') ||
          (err.name === 'TypeError' && !navigator.onLine)

        if (isNetworkError) {
          this.$toast.add({
            severity: 'warn',
            summary: 'Offline - PDF kann nicht erstellt werden',
            detail:
              'Die PDF-Vorlage für Stundennachweise muss zuerst geladen werden. Bitte stellen Sie eine Internetverbindung her und laden Sie die Seite neu.',
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
        unterschriebenKunde: this.unterschriebenKunde,
      }
    },
    normalizeStundenData(stundenData) {
      const raw = toRaw(stundenData)
      return {
        ...raw,
        rows: raw.rows.map((row) => ({
          ...row,
          datum: row.datum instanceof Date ? row.datum.toISOString() : row.datum,
        })),
      }
    },
    async saveAndSend() {
      this.isSending = true

      try {
        if (!navigator.onLine) throw new Error('Offline')
        await executeStundenzettelJob({
          id: crypto.randomUUID(),
          pdfBase64: this.pdfBytes[1],
          inputValues: this.normalizeInputValues(this.inputValues),
          stundenData: this.normalizeStundenData(this.stundenData),
          createdAt: Date.now(),
        })
        console.log('Stundenzettel job sent successfully')
        this.fetchStundenzettel()
      } catch (err) {
        console.warn('Offline – queued for later', err)

        await enqueueJob({
          id: crypto.randomUUID(),
          type: 'stundenzettel',
          pdfBase64: this.pdfBytes[1],
          inputValues: this.normalizeInputValues(this.inputValues),
          stundenData: this.normalizeStundenData(this.stundenData),
          createdAt: Date.now(),
        })

        this.$toast.add({
          severity: 'info',
          summary: 'Offline Modus',
          detail:
            'Der Stundennachweis wurde zum späteren Senden in die Warteschlange gestellt, da keine Internetverbindung besteht.',
          life: 15000,
        })
      }

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

.stundennachweise {
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

/* Stundenfiller Styles */
.stundenfiller {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  margin: 1.5rem 0;
  padding-right: 3rem;
  overflow-x: scroll;

  @media (max-width: 768px) {
    padding-right: 0;
    gap: 1.5rem;
  }

  &-table {
    display: flex;
    flex-direction: column;
    border-radius: 12px;
    overflow: hidden;
    min-width: fit-content;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    border: 1px solid #e5e7eb;

    &-header {
      display: grid;
      grid-template-columns:
        minmax(150px, 1fr) /* Datum */
        minmax(75px, 0.75fr) /* Arbeitszeit 1 */
        minmax(75px, 0.75fr) /* Arbeitszeit 2 */
        minmax(75px, 0.75fr) /* Pause */
        minmax(75px, 0.75fr) /* Pause Std. */
        minmax(75px, 0.75fr) /* Überstunden 1 */
        minmax(75px, 0.75fr) /* Überstunden 2 */
        minmax(75px, 0.75fr) /* Überstunden Std. */
        minmax(75px, 0.75fr) /* Anfahrt 1 */
        minmax(75px, 0.75fr) /* Anfahrt 2 */
        minmax(75px, 0.75fr) /* Anfahrt Std. */
        minmax(75px, 0.75fr) /* Abfahrt 1 */
        minmax(75px, 0.75fr) /* Abfahrt 2 */
        minmax(75px, 0.75fr) /* KM */
        minmax(75px, 0.75fr); /* Total Std. */
      background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
      color: #fff;

      span {
        padding: 0.75rem 0.5rem;
        font-weight: 600;
        font-size: 0.8rem;
        text-align: center;
        text-transform: uppercase;
        letter-spacing: 0.025em;
        border-right: 1px solid rgba(255, 255, 255, 0.1);

        &:last-child {
          border-right: none;
        }
      }
    }

    &-row {
      display: grid;
      grid-template-columns:
        minmax(150px, 1fr) /* Datum */
        minmax(75px, 0.75fr) /* Arbeitszeit 1 */
        minmax(75px, 0.75fr) /* Arbeitszeit 2 */
        minmax(75px, 0.75fr) /* Pause */
        minmax(75px, 0.75fr) /* Pause Std. */
        minmax(75px, 0.75fr) /* Überstunden 1 */
        minmax(75px, 0.75fr) /* Überstunden 2 */
        minmax(75px, 0.75fr) /* Überstunden Std. */
        minmax(75px, 0.75fr) /* Anfahrt 1 */
        minmax(75px, 0.75fr) /* Anfahrt 2 */
        minmax(75px, 0.75fr) /* Anfahrt Std. */
        minmax(75px, 0.75fr) /* Abfahrt 1 */
        minmax(75px, 0.75fr) /* Abfahrt 2 */
        minmax(75px, 0.75fr) /* KM */
        minmax(75px, 0.75fr); /* Total Std. */
      border-bottom: 1px solid #e5e7eb;
      background-color: #fff;
      transition: background-color 0.15s ease;

      &:hover {
        background-color: #f9fafb;
      }

      &:nth-child(even) {
        background-color: #fafafa;

        &:hover {
          background-color: #f3f4f6;
        }
      }

      &:last-child {
        border-bottom: none;
      }

      .p-inputtext {
        border-radius: 0;
        border: none;
        border-right: 1px solid #e5e7eb;
        text-align: center;
        font-size: 0.875rem;
        padding: 0.625rem 0.4rem;
        background: transparent;
        transition: all 0.15s ease;

        &:last-child {
          border-right: none;
        }

        &:focus {
          box-shadow: inset 0 0 0 2px #3b82f6;
          background-color: #eff6ff;
          z-index: 1;
        }

        &::placeholder {
          color: #9ca3af;
        }
      }

      .stundenfiller-datepicker {
        border-right: 1px solid #e5e7eb;

        .p-datepicker-input {
          border: none;
          border-radius: 0;
          font-size: 0.875rem;
          padding: 0.5rem 0.4rem;
          background: transparent;
          text-align: center;

          &:focus {
            box-shadow: inset 0 0 0 2px #3b82f6;
            background-color: #eff6ff;
          }
        }

        .p-datepicker-input-icon-container {
          right: 0.5rem;

          .p-datepicker-input-icon {
            font-size: 0.85rem;
            color: #6b7280;
          }
        }
      }
    }

    &-totals {
      display: grid;
      grid-template-columns:
        minmax(150px, 1fr) /* Datum */
        minmax(75px, 0.75fr) /* Arbeitszeit 1 */
        minmax(75px, 0.75fr) /* Arbeitszeit 2 */
        minmax(75px, 0.75fr) /* Pause */
        minmax(75px, 0.75fr) /* Pause Std. */
        minmax(75px, 0.75fr) /* Überstunden 1 */
        minmax(75px, 0.75fr) /* Überstunden 2 */
        minmax(75px, 0.75fr) /* Überstunden Std. */
        minmax(75px, 0.75fr) /* Anfahrt 1 */
        minmax(75px, 0.75fr) /* Anfahrt 2 */
        minmax(75px, 0.75fr) /* Anfahrt Std. */
        minmax(75px, 0.75fr) /* Abfahrt 1 */
        minmax(75px, 0.75fr) /* Abfahrt 2 */
        minmax(75px, 0.75fr) /* KM */
        minmax(75px, 0.75fr); /* Total Std. */
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      border-top: 2px solid #e5e7eb;

      span {
        padding: 0.75rem 0.5rem;
        display: flex;
        align-items: center;
        justify-content: center;
        border-right: 1px solid #e5e7eb;

        &.total-label {
          font-weight: 700;
          font-size: 0.8rem;
          color: #374151;
          text-transform: uppercase;
          letter-spacing: 0.025em;
          border-right: none;
          justify-self: flex-end;

          + span {
            border-right: none;
          }
        }

        &:has(+ .total-label) {
          border-right: none;
        }

        &:last-child {
          border-right: none;
        }
      }

      .p-inputtext {
        border-radius: 0;
        border: none;
        border-right: 1px solid #e5e7eb;
        text-align: center;
        font-size: 0.875rem;
        font-weight: 700;
        padding: 0.625rem 0.4rem;
        background-color: #fff;
        color: #1f2937;
        transition: all 0.15s ease;

        &:last-child {
          border-right: none;
        }

        &:focus {
          box-shadow: inset 0 0 0 2px #3b82f6;
          background-color: #eff6ff;
          z-index: 1;
        }
      }
    }
  }

  &-section {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;

    &-label {
      font-weight: 600;
      font-size: 0.95rem;
      color: #374151;
      display: flex;
      align-items: center;
      gap: 0.5rem;

      &::before {
        content: '';
        width: 4px;
        height: 1.1em;
        background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
        border-radius: 2px;
      }
    }

    &-textarea {
      width: 100%;
      min-height: 150px;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      padding: 1rem;
      font-size: 0.925rem;
      line-height: 1.6;
      transition: all 0.2s ease;
      background-color: #fff;
      resize: vertical;

      &:hover {
        border-color: #d1d5db;
      }

      &:focus {
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
        border-color: #3b82f6;
        outline: none;
      }

      &::placeholder {
        color: #9ca3af;
      }
    }
  }
}

/* Dialog signpad specific styles - ensure no offset */
.customer-sign-dialog,
.control-sign-dialog {
  .stundennachweise-sign-panel-signpad {
    max-width: 100%;
    box-sizing: border-box;
  }
}

/* Checkbox styles for Besonderheiten */
.stundenfiller-checkboxes {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
  margin-top: 0.5rem;
}

.stundenfiller-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;

  label {
    cursor: pointer;
    user-select: none;
  }
}
</style>
