#!flask/bin/python
#!/usr/bin/python
# -*- coding: utf-8 -*-

from __future__ import unicode_literals
import sys
from importlib import reload
reload(sys)
#sys.setdefaultencoding('utf8')
from os import walk
######apt-get install python3-pypdf2
import PyPDF2
from PyPDF2 import PdfFileReader, PdfFileWriter
import cgi, os
import cgitb; cgitb.enable()
import cgi
from flask import request
from flask import Flask, session
from flask import Flask, request, redirect, url_for
from werkzeug.utils import secure_filename
from flask import flash
from flask import send_from_directory

# **************** Training Data Libs ****************
import plac
from pathlib import Path
import json
import random
import docx
from tqdm import tqdm
import re
# Import for NLTK Tokenization
# !pip3 install nltk
import nltk
import ssl
    #try:
# _create_unverified_https_context = ssl._create_unverified_context
#except AttributeError:
#pass
#else:
#ssl._create_default_https_context = _create_unverified_https_context


#nltk.download()
nltk.download('stopwords')
import heapq
from nltk.tokenize import regexp_tokenize
from flask import jsonify

app = Flask(__name__)
app.config['SESSION_TYPE'] = 'memcached'
app.config['SECRET_KEY'] = 'super secret key'


UPLOAD_FOLDER = '/Users/aiuser/rasa/rasa-webChat&Server/server/public'
ALLOWED_EXTENSIONS = set(['txt', 'pdf', 'csv', 'doc', 'docx'])
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def writeTextToFile(filePath,fileName, text):
    response = True
    try:
        file1 = open(filePath+'/'+fileName,"w") 
        file1.write(text) 
        file1.close()
    except:
        return sys.exc_info()
    return response


def readTextFile(filePath,fileName):
    response = ""
    try:
        fileToRead=open(filePath+'/'+fileName, "r")
        response =  fileToRead.read()
        fileToRead.close()
    except:
        return sys.exc_info()

    return response

def readCSVFile(filePath,fileName):
    response = ""
    try:
        fileToRead=open(filePath+'/'+fileName, "r")
        response = fileToRead.read()
    except:
        return sys.exc_info()

    return response

def readPDFFile(filePath,fileName):
    response = ""
    try:
        pdfFileObj = open(filePath+'/'+fileName, 'rb') 

        pdfReader = PyPDF2.PdfFileReader(pdfFileObj) 

        for index in range(pdfReader.numPages):
            pageObj = pdfReader.getPage(index) 
            response = response + " " + pageObj.extractText()

        pdfFileObj.close() 

    except:
        return sys.exc_info()

    return response

def readDocsFile(filePath,fileName):
    doc= docx.Document(filePath+'/'+fileName)
    wholedoc=""
    for para in doc.paragraphs:
        wholedoc += para.text
    return wholedoc


def getFileData(file):
    fileText = ""
    dirPath = app.config['UPLOAD_FOLDER']
    fileExtension = file.filename.split('.')
    fileExtension = fileExtension[1]
    if os.path.isfile(dirPath+"/"+file.filename):
        if fileExtension.lower() == 'csv':
            fileText = readCSVFile(dirPath,file.filename)
        elif fileExtension.lower() == 'txt':
            fileText = readTextFile(dirPath,file.filename)
        elif fileExtension.lower() == 'pdf':
            fileText = readPDFFile(dirPath,file.filename)
        elif fileExtension.lower() == 'docx':
            fileText = readDocsFile(dirPath,file.filename)

    if not str(fileText).strip():
        message = '["ERROR", "Unable to read uploaded files Content or File is Empty."]'
        return message
    return fileText

def getRegexBasedContractType(textString):
    defaultContractType = ""
    arrayTextString = str(textString).split('\\n')
    #print(arrayTextString)
    for textLine in arrayTextString:
        if textLine.strip() != "":
            defaultContractType = textLine.replace("b'","")
            break
    regex = "This.\w{0,25}.\-{0,1}\w{0,25}.\-{0,1}\w{0,25}\-{0,1}\w{4,25}.Agreement"
    contractType = ''
    print("****************************")
    print(defaultContractType)
    try:
        entity = re.search(regex, str(textString), re.IGNORECASE)
        print(entity)
        if not entity:
            return defaultContractType
        else:
            contractType = entity.group(0)
        return contractType.replace("This","").replace("this","").strip()
    except:
        return sys.exc_info()

def getTextSummery(text):
    sentence_list = nltk.sent_tokenize(str(text))
    stopwords = nltk.corpus.stopwords.words('english')
    
    formatted_article_text = re.sub('[^a-zA-Z]', ' ', str(text) )
    formatted_article_text = re.sub(r'\s+', ' ', formatted_article_text)
    word_frequencies = {}
    for word in nltk.word_tokenize(formatted_article_text):
        if word not in stopwords:
            if word not in word_frequencies.keys():
                word_frequencies[word] = 1
            else:
                word_frequencies[word] += 1
    #print(sentence_list)
    
    maximum_frequncy = max(word_frequencies.values())
    for word in word_frequencies.keys():
        word_frequencies[word] = (word_frequencies[word]/maximum_frequncy)
    sentence_scores = {}
    for sent in sentence_list:
        for word in nltk.word_tokenize(sent.lower()):
            if word in word_frequencies.keys():
                if len(sent.split(' ')) < 30:
                    if sent not in sentence_scores.keys():
                        sentence_scores[sent] = word_frequencies[word]
                    else:
                        sentence_scores[sent] += word_frequencies[word]
    summary_sentences = heapq.nlargest(7, sentence_scores, key=sentence_scores.get)
    summary = ' '.join(summary_sentences)
    return '{"Summary" : "'+summary+'", "ContractType":"'+getRegexBasedContractType(text)+'"}'

# WebService request for Tokenization
@app.route('/summary', methods=['POST'])
def getTextSummaryAndContractType():
    data = request.data
    return getTextSummery(data)

@app.route('/filesUpload', methods=['GET','POST'])
def saveFile():
    if request.method == 'POST':
        if 'file' not in request.files:
            return '["ERROR" , "No File Found."]'
        file = request.files['file']
        if file.filename == '':
            return '["ERROR" , "Unable to get attached filename."]'
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            file.filename = filename
            file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
            return getFileData(file)
        else:
            filename = secure_filename(file.filename)
            allowedExtString = ""
            isFirstExt = True
            for ext in ALLOWED_EXTENSIONS:
                if isFirstExt:
                    allowedExtString = ext
                    isFirstExt = False
                else:
                    allowedExtString = allowedExtString + ", "+ ext

            message = '["ERROR" , "given file Extension: '+ filename.rsplit('.', 1)[1].lower() + ' not allowed, ALLOWED_EXTENSIONS: '+allowedExtString+'"]'
            return message
    return '["ERROR" , "Bad Request!"]'

# Text to Paragraphs Using NLTK API
def getTokenizedParagraphsFromText(text):
    try:
        # tokenizer = nltk.data.load('tokenizers/punkt/english.pickle')
        # return tokenizer.tokenize(text.decode('utf-8'))
        return regexp_tokenize(text, pattern=r'$\n\n', gaps=True)
    except:
        return sys.exc_info()

# WebService request for Tokenization    
@app.route('/tokenizer', methods=['POST'])
def nltkTokenizer():
    data = request.data
    return jsonify(getTokenizedParagraphsFromText(data.decode('utf-8')))

# Upload file and get file data
def returnFileData(file):
    fileText = ""
    dirPath = app.config['UPLOAD_FOLDER']
    fileExtension = file.filename.rsplit('.', 1)
    fileExtension = fileExtension[1]
    if os.path.isfile(dirPath+"/"+file.filename):
        if fileExtension.lower() == 'csv':
            fileText = readCSVFile(dirPath,file.filename)
        elif fileExtension.lower() == 'txt':
            fileText = readTextFile(dirPath,file.filename)
        elif fileExtension.lower() == 'pdf':
            fileText = readPDFFile(dirPath,file.filename)
        elif fileExtension.lower() == 'docx':
            fileText = readDocsFile(dirPath,file.filename)
    return fileText


@app.route('/readFile', methods=['GET','POST'])
def readFileData(): 
    if request.method == 'POST':
        # check if the post request has the file part
        if 'file' not in request.files:
            print('No files availabe')
            return redirect(request.url)
        file = request.files['file']
        if file.filename == '':
            return 'No selected file'
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            file.filename = filename
            file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
            return returnFileData(file)
        else:
            filename = secure_filename(file.filename)
            allowedExtString = ""
            isFirstExt = True
            for ext in ALLOWED_EXTENSIONS:
                if isFirstExt:
                    allowedExtString = ext
                    isFirstExt = False
                else:
                    allowedExtString = allowedExtString + ", "+ ext
                    
            message = '["ERROR" , "given file Extension: '+ filename.rsplit('.', 1)[1].lower() + ' not allowed, ALLOWED_EXTENSIONS: '+allowedExtString+'"]';
            return message 



@app.route('/')
def index():
    return "Hello, World!"

if __name__ == '__main__':
#    app.run(debug=True)
    app.run(host="127.0.0.1", port="5001")




