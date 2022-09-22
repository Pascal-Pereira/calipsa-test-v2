<!-- eslint-disable prettier/prettier -->
<template>
  <main class="app">
    <section class="dashboard-title">
      <h2 class="title">Email Dashboard, please enter an email address</h2>
    </section>

    <section class="create-email">
      <form id="new-mail-form" @submit.prevent="addEmail">
        <input
          id="email-input"
          type="email"
          name="email"
          placeholder="roger.federer@goat.com"
          v-model="currentEmailInput.email"
          @change="
            () => setInfoToLocalStorage('currentEmail', currentEmailInput.email)
          "
        />

        <div class="options"></div>

        <input type="submit" value="Add email" />
      </form>
    </section>

    <section class="email-list">
      <div class="list" id="email-list">
        <div class="todo-item" v-for="item of emailList" :key="item.id">
          <div class="todo-content">
            <input
              :id="item.id"
              type="email"
              v-model="item.email"
              @change="(event) => handleUpdateEmail(event, item.id)"
            />
          </div>

          <div class="actions">
            <button class="send-email" @click="openEmailModal(item)">
              Send email
            </button>
          </div>

          <div class="actions">
            <button class="delete" @click="removeEmail(item.id)">Delete</button>
          </div>
          <!-- <EmailForm>
          </EmailForm> -->
        </div>
      </div>
    </section>
  </main>
  <ModalEmailForm
    v-if="modalOpened"
    :modalOpened="modalOpened"
    :emailInModal="emailInModal"
    @onCloseModal="closeModal"
  >
  </ModalEmailForm>
</template>

<script>
import ModalEmailForm from "../components/modalEmailForm.vue";
import axios from "axios";

export default {
  components: {
    ModalEmailForm: ModalEmailForm,
  },
  data() {
    return {
      modalOpened: false,
      emailInModal: {
        id: null,
        recipient: "",
        subject: "",
        message: "",
      },
      emailList: [],
      currentEmailInput: {
        email: "",
      },
    };
  },
  computed: {},
  mounted() {
    this.modalOpened = false;
    this.currentEmailInput.email = localStorage.getItem("currentEmail");
    const url = "http://localhost:3000/email";
    // const url = `${process.env.BASEURL}/email`;
    axios
      .get(url)
      .then((res) => {
        if (res && res.data && res.data.data) {
          this.emailList = res.data.data || [];
        }
      })
      .catch((err) => {
        console.error(err.message);
      });
  },
  methods: {
    setInfoToLocalStorage(prop, value) {
      localStorage.setItem(prop, value);
    },
    sendEmail() {
      const url = "http://localhost:3000/email/email-sent";
      axios
        .post(url, this.emailInModal)
        .then((res) => {
          if (res && res.data) {
            this.emailInModal = {};
            this.modalOpened = false;
          }
        })
        .catch((err) => {
          console.error(err.message);
        });
    },
    openEmailModal(emailObj) {
      this.modalOpened = true;
      this.emailInModal = {
        id: emailObj.id,
        recipient: emailObj.email,
      };
    },
    closeModal() {
      this.modalOpened = false;
    },
    handleUpdateEmail(id) {},
    addEmail() {
      const url = "http://localhost:3000/email";
      axios
        .post(url, this.currentEmailInput)
        .then((res) => {
          if (res && res.data && res.data) {
            this.emailList.push(res.data);
            this.currentEmailInput.email = "";
          }
        })
        .catch((err) => {
          console.error(err.message);
        });
    },
    removeEmail(id) {
      const url = `http://localhost:3000/email/${id}`;
      // const url = `${process.env.BASEURL}/email`;
      axios
        .delete(url)
        .then((res) => {
          if (res && res.data) {
            this.emailList = this.emailList.filter((item) => !(item.id === id));
          }
        })
        .catch((err) => {
          console.error(err.message);
        });
    },
  },
};
</script>

<style>
.dashboard-title {
  display: flex;
  justify-content: center;
}
.create-email {
  min-width: 30vw;
  display: flex;
  justify-content: center;
}
#email-input {
  border: 2px solid blue;
  height: 50px;
  width: 300px;
}
.dashboard {
  display: flex;
  border: 1px solid red;
  justify-content: space-around;
}
.input-email {
  border: 1px solid green;
}
.email-list {
  display: block;
}

.email-item {
  width: 30vw;
}

@media (min-width: 1024px) {
  .about {
    display: flex;
    align-items: center;
  }
}
</style>
