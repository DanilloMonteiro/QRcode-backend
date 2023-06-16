const express = require("express");
const morgan = require("morgan");
const mongoose = require("mongoose");
const cors = require("cors");
const app = express();

// mongodb+srv://Danillo:danillo324@cluster0.kwdapfr.mongodb.net/?retryWrites=true&w=majority

mongoose
  .connect(
    "mongodb+srv://Danillo:danillo324@cluster0.kwdapfr.mongodb.net/?retryWrites=true&w=majority",
    {
      useNewUrlParser: true,
    }
  )
  .then(() => console.log("Connection succesful"))
  .catch((err) => console.log(err));

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

app.use(require("./routes"));

app.listen(process.env.PORT || 3001);
