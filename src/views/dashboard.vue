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
        />

        <div class="options"></div>

        <input type="submit" value="Add todo" />
      </form>
    </section>

    <section class="todo-list">
      <h3>Email List</h3>
      <div class="list" id="todo-list">
        <div class="todo-item" v-for="item of emailList" :key="item.id">
          <div class="todo-content">
            <p>
              {{ item.email }}
            </p>
          </div>

          <div class="actions">
            <button class="delete" @click="removeEmail(item.id)">Delete</button>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>

<script>
import axios from "axios";
export default {
  components: {},
  data() {
    return {
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
</style>
