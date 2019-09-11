const express = require("express");
const upload = require("./upload");
const summarize = require("./summarize");
const cors = require("cors");

const server = express();

var corsOptions = {
  origin: "*",
  optionsSuccessStatus: 200
};
server.use(cors(corsOptions));
server.post("/upload", upload);

server.post("/summarize", summarize);
server.listen(8000, () => {
  console.log("Server started!");
});
