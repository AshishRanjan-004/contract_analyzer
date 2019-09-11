import React, { Component } from "react";
import Dropzone from "../dropzone/Dropzone";
import "./Upload.css";
import Progress from "../progress/Progress";
import {
  Widget,
  addResponseMessage,
  addLinkSnippet,
  addUserMessage,
  renderCustomComponent
} from "react-chat-widget";

class Upload extends Component {
  constructor(props) {
    super(props);
    this.state = {
      files: [],
      uploading: false,
      uploadProgress: {},
      successfullUploaded: false
    };

    this.onFilesAdded = this.onFilesAdded.bind(this);
    this.uploadFiles = this.uploadFiles.bind(this);
    this.sendRequest = this.sendRequest.bind(this);
    this.renderActions = this.renderActions.bind(this);
  }

  onFilesAdded(files) {
    this.setState(prevState => ({
      files: prevState.files.concat(files)
    }));
  }

  async uploadFiles() {
    this.setState({ uploadProgress: {}, uploading: true });
    const promises = [];
    this.state.files.forEach(file => {
      promises.push(this.sendRequest(file));
    });
    try {
      await Promise.all(promises);

      this.setState({ successfullUploaded: true, uploading: false });
    } catch (e) {
      // Not Production ready! Do some error handling here instead...
      this.setState({ successfullUploaded: true, uploading: false });
    }
  }

  sendRequest(file) {
    return new Promise((resolve, reject) => {
      const req = new XMLHttpRequest();

      req.upload.addEventListener("progress", event => {
        if (event.lengthComputable) {
          const copy = { ...this.state.uploadProgress };
          copy[file.name] = {
            state: "pending",
            percentage: (event.loaded / event.total) * 100
          };
          this.setState({ uploadProgress: copy });
        }
      });

      req.upload.addEventListener("load", event => {
        const copy = { ...this.state.uploadProgress };
        copy[file.name] = { state: "done", percentage: 100 };
        this.setState({ uploadProgress: copy });
        resolve(req.response);
      });

      req.upload.addEventListener("error", event => {
        const copy = { ...this.state.uploadProgress };
        copy[file.name] = { state: "error", percentage: 0 };
        this.setState({ uploadProgress: copy });
        reject(req.response);
      });

      const formData = new FormData();
      formData.append("file", file, file.name);
      req.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
          let data = JSON.parse(req.responseText);
          //console.log(dates.entities);
          //addResponseMessage("I am able to extract only this much info");
          data.entities.forEach(entity => {
            console.log(entity.entity + " " + entity.value);

            if (entity.entity == "effectiveDate") {
              addResponseMessage(
                "The " +
                  "effective date is" +
                  " is :" +
                  entity.value.replace(/\n|\r/g, "")
              );
            }
            if (entity.entity == "firstParty") {
              addResponseMessage(
                "The " +
                  "first party" +
                  " is :" +
                  entity.value.replace(/\n|\r/g, "")
              );
            }
            if (entity.entity == "secondParty") {
              addResponseMessage(
                "The " +
                  "second party" +
                  " is :" +
                  entity.value.replace(/\n|\r/g, "")
              );
            }
            if (entity.entity == "firstPartyAddress") {
              addResponseMessage(
                "The " +
                  "first party address" +
                  " is :" +
                  entity.value.replace(/\n|\r/g, "")
              );
            }
            if (entity.entity == "secondPartyAddress") {
              addResponseMessage(
                "The " +
                  "second party address" +
                  " is :" +
                  entity.value.replace(/\n|\r/g, "")
              );
            }
            if (entity.entity == "validity") {
              addResponseMessage(
                "The " +
                  "validity of this contract is" +
                  " is :" +
                  entity.value.replace(/\n|\r/g, "")
              );
            }
            // addResponseMessage(
            //   "The " +
            //     entity.entity +
            //     " is :" +
            //     entity.value.replace(/\n|\r/g, "")
            // );
          });

          //console.log(req.responseText.length);
          // let data = "";
          // dates.forEach(element => {
          //   data = data + element[1] + " ";
          // });
          //addResponseMessage("Here are the dates: " + dates);
        }
      };

      req.open("POST", "http://localhost:8000/upload");
      //addResponseMessage("Watch vote counting till I analyse...");

      req.send(formData);
    });
  }

  renderProgress(file) {
    const uploadProgress = this.state.uploadProgress[file.name];
    if (this.state.uploading || this.state.successfullUploaded) {
      return (
        <div className="ProgressWrapper">
          <Progress progress={uploadProgress ? uploadProgress.percentage : 0} />
          <img
            className="CheckIcon"
            alt="done"
            src="baseline-check_circle_outline-24px.svg"
            style={{
              opacity:
                uploadProgress && uploadProgress.state === "done" ? 0.5 : 0
            }}
          />
        </div>
      );
    }
  }

  renderActions() {
    if (this.state.successfullUploaded) {
      return (
        <button
          onClick={() =>
            this.setState({ files: [], successfullUploaded: false })
          }
        >
          Clear
        </button>
      );
    } else {
      return (
        <button
          disabled={this.state.files.length < 0 || this.state.uploading}
          onClick={this.uploadFiles}
        >
          Upload
        </button>
      );
    }
  }

  render() {
    return (
      <div className="Upload">
        {/* <span className="Title">Upload Files</span> */}
        <div className="Content">
          <div>
            <Dropzone
              onFilesAdded={this.onFilesAdded}
              disabled={this.state.uploading || this.state.successfullUploaded}
            />
          </div>
          <div className="Files">
            {this.state.files.map(file => {
              return (
                <div key={file.name} className="Row">
                  <span className="Filename">{file.name}</span>
                  {this.renderProgress(file)}
                </div>
              );
            })}
          </div>
        </div>
        <div className="Actions">{this.renderActions()}</div>
      </div>
    );
  }
}

export default Upload;
