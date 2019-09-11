import React, { Component } from "react";
import "bootstrap/dist/css/bootstrap.css";
import axios from "axios";
import Upload from "../upload/Upload";
import {
  Widget,
  addResponseMessage,
  addLinkSnippet,
  addUserMessage,
  renderCustomComponent
} from "react-chat-widget";

class Chip extends Component {
  state = {};

  handleEvent = value => {
    console.log(value);
    let newMessage = value;
    addUserMessage(newMessage);
    axios
      .all([
        axios.post("http://localhost:5005/webhooks/rest/webhook", {
          message: newMessage
        }),
        axios.post("http://localhost:5000/parse", {
          query: newMessage,
          project: "current",
          model: "nlu"
        })
      ])
      .then(
        axios.spread(function(
          coreResponseAboutResponse,
          nluResponseAboutIntent
        ) {
          console.log(coreResponseAboutResponse.data[0].text);
          coreResponseAboutResponse.data[0].text == undefined
            ? addResponseMessage("Alright")
            : addResponseMessage(coreResponseAboutResponse.data[0].text);
          console.log(nluResponseAboutIntent.data.intent.name);
          if (nluResponseAboutIntent.data.intent.name === "upload") {
            renderCustomComponent(Upload, {});
          }
        })
      )
      //.then(response => this.setState({ vehicles: response.data }))
      .catch(error => renderCustomComponent(Upload, {}));
  };

  render() {
    return (
      <div className="list-group">
        <a href="#" className="list-group-item list-group-item-action active">
          Here are the list of things to get started
        </a>
        <a
          href="#"
          className="list-group-item list-group-item-action"
          onClick={() => this.handleEvent("I want to train the bot")}
        >
          <i className="fas fa-chevron-right" />
          <span className="glyphicon glyphicon-menu-right m-2" />
          Train the Bot
        </a>
        <a
          href="#"
          className="list-group-item list-group-item-action"
          onClick={() => this.handleEvent("I want to analyse a contract")}
        >
          <i className="fas fa-chevron-right" />
          <span className="glyphicon glyphicon-menu-right m-2" /> Analyse a
          contract
        </a>

        <a
          href="#"
          className="list-group-item list-group-item-action"
          onClick={() => this.handleEvent("tell me a joke")}
        >
          <i className="fas fa-chevron-right" />
          <span className="glyphicon glyphicon-menu-right m-2" /> Count of
          contract expiring in upcoming months
        </a>
      </div>
    );
  }
}

export default Chip;
