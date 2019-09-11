const IncomingForm = require("formidable").IncomingForm;
const fs = require("fs");
const axios = require("axios");
const pdfUtil = require("pdf-to-text");
const path = require("path");
const textract = require("textract");

module.exports = function upload(req, res) {
  console.log("request recieved for summarise");
  const form = new IncomingForm();

  form.on("fileBegin", function(name, file) {
    file.path = __dirname + "/public/" + file.name;
  });

  form.on("file", (field, file) => {
    if (path.extname(file.path) === ".pdf")
      convertPdfToText(file, extractEnities);
    if (path.extname(file.path) === ".txt") readTextFile(file, extractEnities);
    if (path.extname(file.path) === ".docx")
      convertDocxToText(file, extractEnities);

    function convertDocxToText(file, extractEnities) {
      textract.fromFileWithPath(file.path, function(err, text) {
        if (err) throw err;
        console.log(typeof text);
        extractEnities(text);
      });
    }

    function convertPdfToText(file, extractEnities) {
      pdfUtil.pdfToText(file.path, function(err, data) {
        if (err) throw err;
        extractEnities(data);
      });
    }

    function readTextFile(file, extractEnities) {
      const data = fs.readFileSync(file.path).toString();
      extractEnities(data);
    }

    function extractEnities(query) {
      //console.log("I am query", query);
      //console.log("-----------------------------------------------");
      axios
        .post("http://localhost:5001/summary", query, {
          headers: { "Content-Type": "text/plain" }
        })
        .then(response => {
          //console.log(response.data);

          res.json(response.data);
        })
        .catch(function(error) {
          console.log(error);
        });
    }
  });

  form.parse(req);
};
