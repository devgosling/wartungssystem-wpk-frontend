import { createRouter, createWebHistory } from 'vue-router'
import { account, teams } from '@/lib/appwrite'
import HomeView from '../views/HomeView.vue'
import LoginScreen from '../views/LoginScreen.vue'
import FourOFourPage from '../views/404.vue'
import FourOOnePage from '../views/401.vue'
import WartungsberichteView from '@/views/Wartungsberichte.vue'
import MitarbeiterView from '@/views/Mitarbeiter.vue'
import CustomersView from '@/views/Kunden.vue'
import { AppwriteException } from 'appwrite'
import { isUserLoggedIn } from '@/lib/utils'
import { useInputStore } from '@/stores/inputStore'
import Stundennachweis from '@/views/Stundennachweis.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: {
        requiresAuth: true,
        title: 'Home',
      },
    },
    {
      path: '/wartungsberichte',
      name: 'wartungsberichte',
      component: WartungsberichteView,
      meta: {
        requiresAuth: true,
        title: 'Wartungsberichte',
      },
    },
    {
      path: '/employees',
      name: 'employees',
      component: MitarbeiterView,
      meta: {
        requiresAuth: true,
        requiresTeam: 'administration',
        title: 'Mitarbeiter',
      },
    },
    {
      path: '/customers',
      name: 'customer',
      component: CustomersView,
      meta: {
        requiresAuth: true,
        title: 'Kunden',
      },
    },
    {
      path: '/stundennachweis',
      name: 'stundennachweis',
      component: Stundennachweis,
      meta: {
        requiresAuth: true,
        title: 'Stundennachweis',
      },
    },
    {
      path: '/login',
      name: 'login',
      meta: {
        requiresUnauth: true,
        hideSidebar: true,
        title: 'Anmelden',
      },
      component: LoginScreen,
    },
    {
      path: '/:pathMatch(.*)*',
      name: '404',
      component: FourOFourPage,
      meta: {
        title: '404',
        requiresAuth: true,
      },
    },
    {
      path: '/401',
      name: '401',
      component: FourOOnePage,
      meta: {
        title: '401',
        requiresAuth: true,
      },
    },
  ],
})

router.beforeEach(guard)

async function guard(to, from, next) {
  const isAuth = await isUserLoggedIn()
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)
  const requiresUnauth = to.matched.some((record) => record.meta.requiresUnauth)
  const requiresTeam = to.matched.some((record) => record.meta.requiresTeam)

  if (requiresAuth && !isAuth) next('/login')
  else if (requiresUnauth && isAuth) next('/')
  else if (requiresTeam) {
    var hasAccess = false
    var user = await account.get()
    switch (to.meta.requiresTeam) {
      case 'administration':
        try {
          const adminTeamMemberships = await teams.listMemberships('68866cde003207e2fbab')
          var members = []
          adminTeamMemberships.memberships.forEach((membership) => {
            members.push(membership.userId)
          })
          if (members.indexOf(user.$id) !== -1) hasAccess = true
        } catch (err) {
          hasAccess = false
        }
        break

      default:
        break
    }
    if (!hasAccess) next('/401')
    else next()
  } else next()

  document.title = 'WPK | ' + to.meta?.title ?? 'Panel'
  if (useInputStore().isEditingSomething) {
    useInputStore().setIsEditingSomething(false)
  }
}

export default router
