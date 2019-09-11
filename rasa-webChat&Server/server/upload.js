const IncomingForm = require("formidable").IncomingForm;
const fs = require("fs");
const axios = require("axios");
const pdfUtil = require("pdf-to-text");
const path = require("path");
const textract = require("textract");

module.exports = function upload(req, res) {
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
      axios
        .post("http://localhost:5000/parse", {
          query: query,
          project: "current",
          model: "nlu"
        })
        .then(function(response) {
          let arr = response.data.entities;
          arr.sort((a, b) => {
            return b.confidence - a.confidence;
          });
          let noOfEntity = 0;
          let dataToUi = {};
          arr.forEach(element => {
            if (noOfEntity === 0) {
              dataToUi[element.entity] = element.value;
              noOfEntity += 1;
            } else if (noOfEntity > 0 && noOfEntity < 6) {
              if (!Object.keys(dataToUi).includes(element.entity)) {
                dataToUi[element.entity] = element.value;
                noOfEntity += 1;
              }
            }
            dataToUi.fileName = file.name;
            dataToUi.text = response.data.text;
          });
          //console.log(dataToUi);
          res.json(dataToUi);
        })
        .catch(function(error) {
          //console.log(error);
        });
    }
  });

  form.parse(req);
};
