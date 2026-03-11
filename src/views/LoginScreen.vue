<template>
  <div class="login">
    <div>
      <div class="login-arrow"><i class="fa-regular fa-arrow-right-to-bracket"></i></div>
    </div>
    <span class="login-header">Melde dich im System an</span>
    <span class="login-desc"
      >Gebe deine E-Mail Adresse und dein Passwort ein um dich im Wartungssystem einzuloggen</span
    >
    <div class="login-inputs">
      <FloatLabel variant="on">
        <IconField>
          <InputText
          v-model="email"
          class="login-inputs-ip"
          id="email"
          type="text"
          :invalid="emailInvalid"
          ></InputText>
          <InputIcon class="fa-light fa-at"></InputIcon>
        </IconField>
        <label for="email">E-Mail Adresse</label>
      </FloatLabel>
      <FloatLabel variant="on">
        <Password
          :invalid="passwordInvalid"
          v-model="password"
          class="login-inputs-ip"
          id="password"
          toggleMask
          :feedback="false"
          type="text"
        ></Password>
        <label for="password">Passwort</label>
      </FloatLabel>
    </div>
    <Button
      :loading="loading"
      @click="loginWithUsernameAndPassword"
      class="login-btn"
      label="Anmelden"
    />
    <div class="login-lwr">
      <Divider class="login-lwr-dvdr" type="dashed"></Divider>
      <div class="login-lwr-creds">
        <img src="../assets/Wassertechnik_Schrift.png" alt="" draggable="false" />
        <span>2026 © WPK Prozesstechnik </span>
      </div>
    </div>
  </div>
</template>
<script>
import InputText from 'primevue/inputtext'
import FloatLabel from 'primevue/floatlabel'
import Password from 'primevue/password'
import Button from 'primevue/button'
import Divider from 'primevue/divider'
import { account } from '@/lib/appwrite'
import { validate } from 'email-validator'
import router from '@/router'
import { AppwriteException } from 'appwrite'
import { IconField, InputIcon } from 'primevue'

export default {
  components: {
    InputText,
    FloatLabel,
    Password,
    Button,
    Divider,
    IconField,
    InputIcon
  },

  data() {
    return {
      email: '',
      password: '',
      loading: false,
      emailInvalid: false,
      passwordInvalid: false,
    }
  },

  methods: {
    async loginWithUsernameAndPassword() {
      this.loading = true
      if (this.email.length == 0) {
        this.emailInvalid = true
        this.$toast.add({
          severity: 'error',
          summary: 'Ungültige E-Mail',
          detail: 'Du hast keine E-Mail Adresse angegeben.',
          life: 5000,
        })

        this.loading = false
        return
      }

      if (!validate(this.email)) {
        this.emailInvalid = true
        this.$toast.add({
          severity: 'error',
          summary: 'Ungültige E-Mail',
          detail: 'Die Angegebene E-Mail Adresse ist ungültig.',
          life: 5000,
        })

        this.loading = false
        return
      }

      if (this.password.length == 0) {
        this.passwordInvalid = true
        this.$toast.add({
          severity: 'error',
          summary: 'Kein Passwort',
          detail: 'Du hast kein Passwort für das Konto angegeben.',
          life: 5000,
        })

        this.loading = false
        return
      }

      try {
        await account.createEmailPasswordSession(this.email, this.password)
        let prefs = await account.getPrefs()
        console.log(prefs);
        router.push('/')
      } catch (e) {
        if (e instanceof AppwriteException) {
          switch (e.code) {
            case 400:
              this.$toast.add({
                severity: 'error',
                summary: 'Falsches Passwort',
                detail:
                  'Das Passwort stimmt nicht mit der angegebenen E-Mail Adresse überein. Ist die E-Mail richtig?',
                life: 5000,
              })
              this.emailInvalid = true
              this.passwordInvalid = true
              break
            case 429:
              this.$toast.add({
                severity: 'error',
                summary: 'Zu schnell!',
                detail: 'Du versucht zu oft hintereinander dich anzumelden, warte einen Moment.',
                life: 5000,
              })
              break
            default:
              break
          }
        }
        this.loading = false
      }
    },
  },

  mounted() {
    document.onkeydown = (ev) => {
      if (ev.key == 'Enter' && !this.loading) {
        this.loginWithUsernameAndPassword()
      }
    }
  },
}
</script>
<style lang="scss">
.login {
  background: linear-gradient(0deg, rgba(251, 254, 255, 1) 54%, rgb(218, 241, 255) 100%);
  box-shadow: 0px 0px 5px 0px rgba(0, 0, 0, 0.25);
  width: 28rem;
  border-radius: 1.5rem;
  aspect-ratio: 1 / 1.2;

  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);

  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 2rem 3rem;

  &-arrow {
    position: relative;
    transform: translateX(-50%);
    left: 50%;
    font-size: 1.55rem;
    background-color: white;
    padding: 1rem;
    width: 4.1rem;
    aspect-ratio: 1 / 1;

    display: flex;
    text-align: center;
    align-items: center;
    justify-content: center;

    border-radius: 1.5rem;

    box-shadow: 0px 2px 5px 0px rgba(0, 0, 0, 0.25);
  }

  &-header {
    padding-top: 1.8rem;
    text-align: center;
    font-weight: 600;
    font-size: 1.5rem;
  }

  &-desc {
    text-align: center;
    font-size: 0.92rem;
    color: rgb(115, 115, 115);
  }

  &-inputs {
    display: flex;
    flex-direction: column;

    padding-top: 2rem;
    gap: 1rem;

    &-ip {
      width: 100%;

      input {
        width: 100%;
      }
    }
  }

  &-btn {
    margin-top: 2rem;
  }

  &-lwr {
    margin-top: 0.5rem;
    justify-content: center;
    &-creds {
      padding-top: 0.5rem;
      display: grid;
      text-align: center;
      gap: 0.4rem;
      img {
        height: 2.5rem;
        justify-self: center;
      }
      span {
        color: gray;
        font-size: 0.8rem;
      }
    }
  }
}
</style>
