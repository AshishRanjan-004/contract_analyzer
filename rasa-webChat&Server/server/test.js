var textract = require('textract');


textract.fromFileWithPath(__dirname+'/public/Untitled document.docx', function( error, text ) {
  console.log(text)
})