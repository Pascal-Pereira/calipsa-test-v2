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
          <div class="login-google">
            <a class="gg-login" title="" :href="getGoogleOAuthURL()"
              ><i class="fa fa-google" /> Login Google</a
            >
          </div>
        </form>
      </div>
    </div>
  </main>
</template>

<script>
import axios from "axios";
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
  mounted() {
    if (!window.gapi) {
      throw new Error(
        '"https://apis.google.com/js/api:client.js" needs to be included as a <script>.'
      );
    }
    //if (window.gapi && this.config.features.googleAuth) {
    if (window.gapi) {
      window.gapi.load("auth2", () => {
        window.gapi.auth2.init({
          client_id:
            "505828133465-1rg5jnm6n1qq3p718l2hocfn365qhipd.apps.googleusercontent.com",
          scope: "profile email openid",
        });
      });
    }
  },
  computed: {
    displayFacebookButton() {
      return this.config.features.facebookLogin;
    },
  },
  methods: {
    getGoogleOAuthURL() {
      const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth";
      const options = {
        redirect_uri:  'http://localhost:3000/auth/google/callback',
        client_id:  '505828133465-1rg5jnm6n1qq3p718l2hocfn365qhipd.apps.googleusercontent.com',
        access_type: "offline",
        response_type: "code",
        prompt: "consent",
        scope: [
          "https://www.googleapis.com/auth/userinfo.profile",
          "https://www.googleapis.com/auth/userinfo.email",
        ].join(" "),
      };

      const qs = new URLSearchParams(options);

      console.log('qs.toString() ', qs.toString());

      return `${rootUrl}?${qs.toString()}`;
    },

    loginGoogle() {
      console.log("this.onSignIn this.onSignIn", this.onSignIn);
      try {
        return window.gapi.auth2.getAuthInstance().signIn().then(this.onSignIn);
      } catch (err) {
        console.error("____err loginGoogle", err);
      }
      // return
      // this.$http.get('/api/auth/google').then(res => {
      //   window.location.href = res.data.body;
      // });
    },
    async onSignIn(googleUser) {
      // Useful data for your client-side scripts:
      this.isRequestInProgress = true;
      axios
        .post(
          "http://localhost:3000/auth/gmail?redirectUrl=http://localhost:3000/auth/google/callback",
          {
            ...googleUser.getAuthResponse(true),
          }
        )
        .then(() => {
          console.log("succccccccccessssssssss");
        })
        .catch((err) => console.log(err))
        .finally(() => {
          console.log("finallllllllllllllyyyyyyyy");
        });
    },
  },
};
</script>

<style>
.signin-popup {
  display: flex;
  justify-content: center;
}
.login-google {
  background-color: white;
  cursor: pointer;
}
@media (min-width: 1024px) {
  .login {
    min-height: auto;
    display: flex;
    justify-content: center;
    align-items: inherit;
  }
}
</style>
