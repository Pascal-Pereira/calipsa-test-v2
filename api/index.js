/* eslint-disable prettier/prettier */
const express = require('express');
const emailRouter = require('./routes/index');
const cors = require('cors')
const bodyParser = require('body-parser');
const dotenv = require("dotenv");
dotenv.config();
const app = express();
const PORT = 3000;
const db = require('./db');

// Not safe, be more specific in the origin, since it s only a test, I ll keep it that way
app.use(cors({ origin: '*' }))

db.init();

app.use(bodyParser.json({ limit: '512mb' }));
app.use(bodyParser.urlencoded({ limit: '512mb', extended: true }));

app.use('/email',emailRouter);



app.listen(PORT, (error) => {
  if (!error)
    console.log(`Server is Successfully Running,;
				and App is listening on port + ${PORT}`)
  else {
    console.log("Error occurred, server can't start", error);
  }
}
);
