<template>
  <main class="login">
    <div class="account-popup-area signin-popup-box fade">
      <div id="signin-popup" class="account-popup">
        <span class="close-popup" @click="closeModal"
          ><i class="fa fa-close"
        /></span>
        <h3>Login</h3>
        <form @submit.prevent="handleUserLogin">
          <div class="cfield">
            <input
              v-model="email"
              :class="{
                invalid: loginFormSubmitted && !loginData.email,
              }"
              type="email"
              placeholder="Email"
            />
            <i class="fa fa-envelope-o" />
          </div>
          <div
            v-show="loginFormSubmitted && !loginData.email"
            class="form-error floating text-danger"
          >
            Email
          </div>
          <div class="cfield">
            <input
              v-model="loginData.password"
              :class="{
                invalid: loginFormSubmitted && !loginData.password,
              }"
              type="password"
              placeholder="********"
            />
            <i class="fa fa-key" />
          </div>
          <div
            v-show="loginFormSubmitted && !loginData.password"
            class="form-error floating text-danger"
          >
            pwd
          </div>
          <button type="submit" class="btn btn-secondary">
            log
            <i v-if="isSendingRequest" class="fa fa-circle-o-notch fa-spin" />
          </button>
        </form>
        <a class="text-primary" @click="showSignUp()"> not registered F</a>
      </div>
    </div>
  </main>
</template>

<script>
export default {
  components: {},
  data() {
    return {
      loginData: {},
      registrationData: { accountType: "", firstName: "", lastName: "" },
      forgotPwdData: {},
      passwordResetData: {},
      selectAccountData: { accountType: "" },
      isSendingRequest: false,
      isMenuOpened: false,
      loginFormSubmitted: false,
      signupFormSubmitted: false,
      forgotPasswordFormSubmitted: false,
      passwordResetFormSubmitted: false,
      accountTypeFormSubmitted: false,
    };
  },
  computed: {
    displayFacebookButton() {
      return this.config.features.facebookLogin;
    },
  },
  methods: {},
};
</script>

<style>
@media (min-width: 1024px) {
  .login {
    min-height: auto;
    display: flex;
    justify-content: center;
    align-items: inherit;
    border: 1px solid red;
  }
}
</style>
