const express = require('express');
const connexionRouter = require('./routes/loginRouter');

const app = express();
const PORT = 3000;

app.use('/connexion', connexionRouter)

app.get('/', (req, res) => {
    res.send('eeeeeeeeeeeeeeeeeeeeeeeeeee')
})
app.listen(PORT, (error) => {
    if (!error)
        console.log(`Server is Successfully Running,
				and App is listening on port + ${PORT}`)
    else {
        console.log("Error occurred, server can't start", error);
    }
}
);
