import React, { Component } from "react";
import axios from "axios";
//import Upload from "./components/uploadComponent";
import Upload from "./upload/Upload";
import Chip from "./chips/Chip";
import {
  Widget,
  addResponseMessage,
  addLinkSnippet,
  addUserMessage,
  renderCustomComponent
} from "react-chat-widget";

import "react-chat-widget/lib/styles.css";

import logo from "./logo.svg";

// const Button = ({ color, handleClick }) => (
//   <button type="button" className={`${color}`} onClick={handleClick}>
//     This is a button!
//   </button>
// );

class App extends Component {
  componentDidMount() {
    //addResponseMessage("Hello");
    renderCustomComponent(Chip, {});

    // renderCustomComponent(Upload, {
    //   color: "primary",
    //   handleClick: this.handleClick
    // });
  }

  handleNewUserMessage = newMessage => {
    console.log(`New message incoming! ${newMessage}`);

    // let headers = {
    //   "Content-Type": "text/plain"
    // };
    // axios
    //   .post("http://54.173.74.33:5000/ner/date", newMessage, {
    //     headers: headers
    //   })
    //   .then(function(response) {
    //     console.log();
    //     let dates = "";
    //     response.data.forEach(element => {
    //       dates = dates + element[1] + " , ";
    //     });
    //     if (response.data.length) {
    //       addResponseMessage(`Here are the dates: ` + dates);
    //     } else {
    //       addResponseMessage(`no dates found my dear!`);
    //     }
    //   })
    //   .catch(function(error) {
    //     console.log(error);
    //   });

    // Now send the message throught the backend API
    // axios
    //   .post("http://localhost:5005/webhooks/rest/webhook", {
    //     message: newMessage
    //   })
    //   .then(function(response) {
    //     let responseByBot = response.data[0]["text"];
    //     addResponseMessage(responseByBot);
    //   })
    //   .catch(function(error) {
    //     console.log(error);
    //   });
    // //-----------------------------------
    // axios
    //   .post("http://localhost:5000/parse", {
    //     q: newMessage
    //   })
    //   .then(function(response) {
    //     // let responseByBot = response.data[0]["text"];
    //     // addResponseMessage(responseByBot);
    //     console.log(response.data.intent.name);
    //   })
    //   .catch(function(error) {
    //     console.log(error);
    //   });

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
      <div className="App">
        <Widget
          handleNewUserMessage={this.handleNewUserMessage}
          profileAvatar={logo}
          title="Contract Analyser"
          subtitle="I can analyse your contract in seconds!"
        />
      </div>
    );
  }
}

export default App;
