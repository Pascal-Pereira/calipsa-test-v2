<template>
  <div v-show="modalOpened" class="modal-container">
    <form @submit.prevent="sendEmail">
      <label>Email</label>
      <span v-if="!isEmailValid" class="invalid-email">Email invalid</span>
      <input
        type="email"
        v-model="modalInfos.recipient"
        name="email"
        placeholder="Your Email"
      />
      <label>Subject</label>
      <input
        type="text"
        v-model="modalInfos.subject"
        name="subject"
        placeholder="Your subject"
        required
      />
      <label>Message</label>
      <textarea
        name="message"
        v-model="modalInfos.message"
        cols="30"
        rows="5"
        placeholder="Please write your Message"
        required
      >
      </textarea>

      <div class="modal-buttons">
        <input type="submit" value="Send" />
        <button type="button" class="close-modal" @click="closeModal">
          Close
        </button>
      </div>
    </form>
  </div>
</template>

<script>
import axios from "axios";
export default {
  props: {
    emailInModal: {
      type: Object,
    },
  },
  data() {
    return {
      isEmailValid: true,
      modalInfos: {
        id: null,
        recipient: "",
        subject: "",
        message: "",
      },
    };
  },
  mounted() {
    this.modalInfos.id = this.emailInModal.id;
    this.modalInfos.recipient = this.emailInModal.recipient;
  },
  methods: {
    validateEmail(email) {
      return email && /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(email);
    },
    sendEmail() {
      if (!this.validateEmail(this.modalInfos)) {
        this.isEmailValid = false;
        return;
      }
      const url = "http://localhost:3000/email/email-sent";
      axios
        .post(url, this.modalInfos)
        .then((res) => {
          if (res && res.data) {
            this.modalInfos = {};
            this.$emit("onCloseModal");
          }
        })
        .catch((err) => {
          console.error(err.message);
          throw err;
        });
    },
    closeModal() {
      this.$emit("onCloseModal");
    },
  },
};
</script>

<style scoped>
.modal-buttons {
  display: flex;
  justify-content: center;
}
.invalid-email {
  color: red;
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

.modal-container {
  display: block !important;
  margin: auto;
  text-align: center;
  border-radius: 5px;
  background-color: #f2f2f2;
  padding: 20px;
  width: 50%;
  top: 300px;
  position: absolute;
}
</style>
