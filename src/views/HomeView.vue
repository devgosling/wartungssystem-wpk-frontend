<template>
  <h1>Dashboard</h1>
  <div class="dashboard">
    <div class="dashboard-cards">
      <Card
        class="dashboard-cards-card"
        v-for="item in dashboardItems"
        @click="router.push({ path: item.redirectTo })"
        v-ripple
      >
        <template #content>
          <div class="dashboard-cards-card-content">
            <div>
              <span>{{ item.label }}</span>
              <span>{{ values[item.value].val.toFixed() }}</span>
            </div>
            <span :style="{ backgroundColor: item.color }">
              <i :class="item.icon"></i>
            </span>
          </div>
        </template>
      </Card>
    </div>
    <Card class="dashboard-chart">
      <template #title>
        <div class="dashboard-chart-title">
          <span>Wartungsberichte</span>
          <SelectButton
            v-model="rangeDays"
            optionLabel="name"
            optionValue="value"
            :options="[
              { name: '7 Tage', value: 7 },
              { name: '30 Tage', value: 30 },
              { name: '90 Tage', value: 90 },
            ]"
          ></SelectButton>
        </div>
      </template>
      <template #content>
        <Chart
          type="line"
          class="dashboard-chart-chart"
          :data="chartDataObj"
          :options="chartOptions()"
          style="height: 20rem; width: 100%"
        />
      </template>
    </Card>
  </div>
</template>
<script>
import { account, databases, functions } from '@/lib/appwrite'
import { Card, SelectButton } from 'primevue'
import gsap from 'gsap'
import router from '@/router'
import { subDays, format, parseISO } from 'date-fns'
import Chart from 'primevue/chart'
import { ExecutionMethod, Query } from 'appwrite'

export default {
  components: {
    Card,
    SelectButton,
    Chart,
  },

  data() {
    return {
      rangeDays: 7,
      files: [],
      chartDataObj: null,

      router: router,
      values: {
        wartungsberichte: { val: 0 },
        mitarbeiter: { val: 0 },
        customers: { val: 0 },
      },
      dashboardItems: [
        {
          label: 'Wartungsberichte',
          icon: 'fa-regular fa-file',
          color: 'rgb(96, 165, 250)',
          value: 'wartungsberichte',
          table: 'wartungsbericht',
          redirectTo: '/wartungsberichte',
        },
        {
          label: 'Mitarbeiter',
          icon: 'fa-regular fa-user',
          color: 'rgb(192, 132, 252)',
          value: 'mitarbeiter',
          table: 'none',
          redirectTo: '/employees',
        },
        {
          label: 'Eingetragene Kunden',
          icon: 'fa-solid fa-user-tie',
          color: 'rgb(251, 191, 36)',
          value: 'customers',
          table: 'customer',
          redirectTo: '/customers',
        },
      ],
    }
  },

  watch: {
    rangeDays(newVal) {
      this.updateChartData()
    },
  },

  async mounted() {
    this.loadFiles()
    const counts = await Promise.all(
      this.dashboardItems.map((item) => this.getEntryCount(item.table)),
    )

    this.dashboardItems.forEach((item, i) => {
      const count = counts[i]
      gsap.to(this.values[item.value], {
        val: count,
        duration: 1.5,
        ease: 'power2.out',
      })
    })
  },

  methods: {
    async loadFiles() {
      let page = 1
      const perPage = 25
      let fetchedFiles = []
      do {
        const response = await databases.listDocuments(
          'wartungssystem',
          'wartungsbericht',
          [Query.limit(perPage), Query.offset((page - 1) * perPage)],
        )
        fetchedFiles = response.documents
        this.files.push(...fetchedFiles)
        page++
      } while (fetchedFiles.length === perPage)

      this.files = this.files.sort((a, b) => (a.$createdAt < b.$createdAt ? 1 : -1))

      this.updateChartData()
    },

    updateChartData() {
      const counts = this.getCounts(this.files, this.rangeDays)
      this.chartDataObj = {
        labels: counts.map((c) => c.date),
        datasets: [
          {
            label: 'Wartungsberichte erstellt',
            data: counts.map((c) => c.count), // remove *2 unless needed
            fill: true,
            borderColor: '#42A5F5',
            tension: 0.4,
          },
        ],
      }
    },
    chartOptions() {
      return {
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'none',
          },
        },
        scales: {
          x: {},
          y: {
            beginAtZero: true,
            ticks: {
              callback: function (label) {
                // show only whole numbers
                if (Number.isInteger(label)) {
                  return label
                }
                return null // hide non-integer tick
              },
            },
          },
        },
      }
    },

    async getEntryCount(tableID) {
      if (tableID == 'none') {
        let userList = await this.getUserList()
        return userList.total
      }

      try {
        const customerList = await databases.listDocuments('wartungssystem', tableID)

        return customerList.total
      } catch (error) {
        this.$toast.add({
          severity: 'error',
          summary: 'Es ist ein Fehler beim Laden aufgetreten aufgetreten',
          life: 5000,
        })
        throw error
      }
    },

    getCounts(files, days) {
      const today = new Date()
      const counts = Array.from({ length: days }, (_, i) => {
        const date = subDays(today, days - 1 - i)
        const dateStr = format(date, 'dd.MM.yyy')
        const count = files.filter(
          (f) => format(parseISO(f.$createdAt), 'dd.MM.yyyy') === dateStr,
        ).length
        return { date: dateStr, count }
      })
      return counts
    },
    async getUserList() {
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

      return userList
    },
  },
}
</script>
<style lang="scss">
.dashboard {
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;

  &-chart {
    &-title {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    &-chart canvas {
      width: max-content !important;
    }
  }

  &-cards {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;

    &-card {
      flex: 1 1 0%;
      border-width: 1px;
      border-color: var(--p-content-border-color);
      border-style: solid;
      min-width: max-content;

      cursor: pointer;

      &-content {
        display: flex;
        justify-content: space-between;
        gap: 2rem;

        > :first-child {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;

          :first-child {
            color: var(--p-surface-500);
            font-weight: 500;
            font-size: 0.875rem;
          }

          :last-child {
            font-weight: 600;
            font-size: 1.125rem;
          }
        }

        > :last-child {
          color: white;
          width: 2rem;
          height: 2rem;
          border-radius: 9999px;
          display: inline-flex;
          text-align: center;
          justify-content: center;
          align-items: center;
        }
      }
    }
  }
}
</style>
