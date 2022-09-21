<!-- eslint-disable prettier/prettier -->
<template>
  <main class="app">
    <section class="greeting">
      <h2 class="title">Email Dashboard</h2>
    </section>

    <section class="create-todo">
      <h3>Please, enter an email</h3>

      <form id="new-todo-form" @submit.prevent="addEmail">
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

    <section class="todo-list">
      <h3>Email List</h3>
      <div class="list" id="todo-list">
        <div class="todo-item" v-for="item of emailList" :key="item.id">
          <div class="todo-content">
            <input
              :id="item.id"
              type="email"
              v-model="item.email"
              @change="(event) => handleEmail(event, item.id)"
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
  <div v-show="modalOpened" class="container">
    <form @submit.prevent="sendEmail">
      <label>Email</label>
      <input
        type="email"
        v-model="emailInModal.recipient"
        name="email"
        placeholder="Your Email"
        @change="
          () => setInfoToLocalStorage('recipient', emailInModal.recipient)
        "
      />
      <label>Subject</label>
      <input
        type="text"
        v-model="emailInModal.subject"
        name="subject"
        placeholder="Your subject"
        @change="() => setInfoToLocalStorage('subject', emailInModal.subject)"
      />
      <label>Message</label>
      <textarea
        name="message"
        v-model="emailInModal.message"
        cols="30"
        rows="5"
        placeholder="Please write your Message"
        @change="() => setInfoToLocalStorage('message', emailInModal.message)"
      >
      </textarea>

      <input type="submit" value="Send" />

      <div class="actions">
        <button class="delete" @click="closeModal()">Close</button>
      </div>
    </form>
  </div>
</template>

<script>
import axios from "axios";
//import EmailForm from "../components/EmailForm";

export default {
  // components: { EmailForm },
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
  computed: {
    displayFacebookButton() {
      return this.config.features.facebookLogin;
    },
  },
  mounted() {
    this.currentEmailInput.email = localStorage.getItem("currentEmail");
    this.emailInModal.recipient = localStorage.getItem("recipient");
    this.emailInModal.subject = localStorage.getItem("subject");
    this.emailInModal.message = localStorage.getItem("message");
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
    handleEmailToAddInput(email) {
      localStorage.setItem("currentEmail", email);
    },
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
      this.setInfoToLocalStorage("recipient", emailObj.email);
      this.modalOpened = true;
      this.emailInModal = {
        id: emailObj.id,
        recipient: emailObj.email,
        subject: emailObj.subject,
      };
    },
    closeModal() {
      this.modalOpened = false;
    },
    handleEmail(id) {
      console.log("innnnnnnnnnnnnnnnn", id);
    },
    addEmail() {
      const url = "http://localhost:3000/email";
      axios
        .post(url, this.currentEmailInput)
        .then((res) => {
          if (res && res.data && res.data) {
            this.emailList.push(res.data);
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
  border: 1px solid blueviolet;
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
* {
  box-sizing: border-box;
}

label {
  float: left;
}
input[type="text"],
[type="email"],
textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
  margin-top: 6px;
  margin-bottom: 16px;
  resize: vertical;
}

input[type="submit"] {
  background-color: #4caf50;
  color: white;
  padding: 12px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

input[type="submit"]:hover {
  background-color: #b8c7b9;
}

.container {
  display: block;
  margin: auto;
  text-align: center;
  border-radius: 5px;
  background-color: #f2f2f2;
  padding: 20px;
  width: 50%;
  top: -53vh;
  position: relative;
}
</style>
