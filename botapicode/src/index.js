require("dotenv").config();
const serverless = require('serverless-http');
const express = require("express");
const bodyParser = require("body-parser");
const request = require("request");


const app = express();
const port = process.env.PORT || 4000;

app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.send("Welcome to the CRM Chatbot for Zoom!");
});

app.get("/authorize", (req, res) => {
  res.redirect(
    "https://zoom.us/launch/chat?jid=robot_" + process.env.zoom_bot_jid
  );
});

app.get("/support", (req, res) => {
  res.send("Contact us for support.");
});

app.get("/privacy", (req, res) => {
  res.send("The CRM Chatbot for Zoom does not store any user data.");
});

app.get("/terms", (req, res) => {
  res.send(
    "By installing the CRM Chatbot for Zoom, you are accepting and agreeing to these terms..."
  );
});

app.get("/documentation", (req, res) => {
  res.send('Try typing "help" to see a list of commands!');
});

app.get("/zoomverify/verifyzoom.html", (req, res) => {
  res.send(process.env.zoom_verification_code);
});

app.post("/botcrm", (req, res) => {
  console.log(req.body);
  getChatbotToken();

  function getChatbotToken() {
    request(
      {
        url: `https://zoom.us/oauth/token?grant_type=client_credentials`,
        method: "POST",
        headers: {
          Authorization:
            "Basic " +
            Buffer.from(
              process.env.zoom_client_id + ":" + process.env.zoom_client_secret
            ).toString("base64")
        }
      },
      (error, httpResponse, body) => {
        if (error) {
          console.log("Error getting chatbot_token from Zoom.", error);
        } else {
          body = JSON.parse(body);
          
            const bodyCmd = req.body.payload.cmd;
            switch (bodyCmd.toLowerCase()) {
              case "help":
                sendHelpChat(body.access_token);
                break;
              default:
                sendDefaultChat(body.access_token);
            }
        }
      }
    );
  }


  

  

  async function sendDefaultChat(chatbotToken) {
    request(
      {
        url: "https://api.zoom.us/v2/im/chat/messages",
        method: "POST",
        json: true,
        body: {
          robot_jid: process.env.zoom_bot_jid,
          to_jid: req.body.payload.toJid,
          account_id: req.body.payload.accountId,
          content: {
            head: {
              text: "Command not found",
              style: {
                color: "#810000",
                bold: true,
                italic: true
              }
            },
            body: [
              {
                type: "message",
                text: "That didnt work..Please try with a proper command..",
                style: {
                  color: "#41444b",
                  bold: true,
                  italic: true
                }
              }
            ]
          }
        },
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + chatbotToken
        }
      },
      (error, httpResponse, body) => {
        if (error) {
          console.log("Error sending chat.", error);
        } else {
          console.log(body);
        }
      }
    );
  }

  async function sendHelpChat(chatbotToken) {
    request(
      {
        url: "https://api.zoom.us/v2/im/chat/messages",
        method: "POST",
        json: true,
        body: {
          robot_jid: process.env.zoom_bot_jid,
          to_jid: req.body.payload.toJid,
          account_id: req.body.payload.accountId,
          content: {
            head: {
              text: "Command Help",
              style: {
                color: "#005086",
                bold: true,
                italic: true
              }
            },
            body: [
              {
                type: "section",
                sidebar_color: "#799351",
                sections: [
                  {
                    type: "message",
                    text:
                      "These are the commands you can use" +
                      "\n\n" +
                      "connect: Provide CRM crdentials to login",
                    style: {
                      color: "#41444b",
                      bold: true,
                      italic: true
                    }
                  }
                ]
              },
              {
                type: "section",
                sidebar_color: "#799351",
                sections: [
                  {
                    type: "message",
                    text: "get a lead: get your oldest open lead",
                    style: {
                      color: "#41444b",
                      bold: true,
                      italic: true
                    }
                  }
                ]
              },
              {
                type: "section",
                sidebar_color: "#799351",
                sections: [
                  {
                    type: "message",
                    text: "create a lead: Create a lead with minimal details",
                    style: {
                      color: "#41444b",
                      bold: true,
                      italic: true
                    }
                  }
                ]
              },
              {
                type: "section",
                sidebar_color: "#799351",
                sections: [
                  {
                    type: "message",
                    text: "get a task: Get an open task to work ",
                    style: {
                      color: "#41444b",
                      bold: true,
                      italic: true
                    }
                  }
                ]
              },
              {
                type: "section",
                sidebar_color: "#799351",
                sections: [
                  {
                    type: "message",
                    text:
                      "get my top opportunities: Get top 5 Open opportunities based on oldest created date ",
                    style: {
                      color: "#41444b",
                      bold: true,
                      italic: true
                    }
                  }
                ]
              }
            ]
          }
        },
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + chatbotToken
        }
      },
      (error, httpResponse, body) => {
        if (error) {
          console.log("Error sending chat.", error);
        } else {
          console.log(body);
        }
      }
    );
  }

  

app.post("/deauthorize", (req, res) => {
  if (req.headers.authorization === process.env.zoom_verification_token) {
    res.status(200);
    res.send();
    request(
      {
        url: "https://api.zoom.us/oauth/data/compliance",
        method: "POST",
        json: true,
        body: {
          client_id: req.body.payload.client_id,
          user_id: req.body.payload.user_id,
          account_id: req.body.payload.account_id,
          deauthorization_event_received: req.body.payload,
          compliance_completed: true
        },
        headers: {
          "Content-Type": "application/json",
          Authorization:
            "Basic " +
            Buffer.from(
              process.env.zoom_client_id + ":" + process.env.zoom_client_secret
            ).toString("base64"),
          "cache-control": "no-cache"
        }
      },
      (error, httpResponse, body) => {
        if (error) {
          console.log(error);
        } else {
          console.log(body);
        }
      }
    );
  } else {
    res.status(401);
    res.send("Unauthorized request to CRM Chatbot for Zoom.");
  }
});
})

module.exports.handler = serverless(app);
