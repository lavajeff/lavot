const Discord = require("discord.io");
const logger = require("winston");
const { Map } = require("immutable");
const fs = require("fs");
const auth = require("./auth.json");
const data = require("./data.json");

let USER_DATA = Map(data);
const HELP_MESSAGE =
  "Command list\n`x!user` - Setup and update basic user info\n`x!info` - Show your own info\n`x!list` - List all members' names\n`x!list <name>` - List specific member's info";
const START_MESSAGE =
  "Enter user command with required arguments:\n`name` - your name/alias (no space)\n`email` - your Lava email or primary email\n`phone` - your current phone number\n\ne.g. `x!user lavabot lavot@lavax.co 012-3456789`";

// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console(), {
  colorize: true
});
logger.level = "debug";

// Initialize Lava Bot
const bot = new Discord.Client({
  token: auth.token,
  autorun: true
});
bot.on("ready", evt => {
  logger.info("Connected");
  logger.info("Logged in as: ");
  logger.info(bot.username + " - (" + bot.id + ")");
});

send = (channelID, message) => {
  bot.sendMessage({
    to: channelID,
    message
  });
};

deleteMsg = (channelID, messageID) => {
  bot.deleteMessage({ channelID, messageID }, function(err) {
    if (err) throw err;
  });
};

write = data => {
  fs.writeFile("data.json", JSON.stringify(data), function(err) {
    if (err) throw err;
  });
};

bot.on("message", (user, userID, channelID, message, evt) => {
  // Our bot needs to know if it will execute a command
  // It will listen for messages that will start with `x!`
  const messageData = evt.d;
  if (message.substring(0, 2) == "x!") {
    let args = message.substring(2).split(" ");
    const cmd = args[0];
    args = args.splice(1);
    switch (cmd) {
      // case "ping": {
      //   if (!messageData.author.bot) {
      //     deleteMsg(channelID, messageData.id);
      //   }
      //   send(channelID, "Pong!");
      //   break;
      // }
      case "user": {
        if (args.length === 0) {
          send(channelID, START_MESSAGE);
        } else if (args.length === 3) {
          USER_DATA = USER_DATA.set(userID, {
            name: args[0],
            email: args[1],
            phone: args[2]
          });
          write(USER_DATA);
          send(channelID, "Saved");
        } else {
          send(channelID, "Parameters not match. Try again.");
        }
        break;
      }
      case "list": {
        /**
         * TODO: Add more parameters for enhancement
         */
        const userArray = USER_DATA.toArray();
        if (args.length >= 1) {
          const foundUser = userArray.find(item => item.name === args[0]);
          if (foundUser) {
            const name = foundUser.name;
            const email = foundUser.email;
            const phone = foundUser.phone;
            send(
              channelID,
              `\`name:\` ${name}\n\`email:\` ${email}\n\`phone:\` ${phone}`
            );
          } else {
            send(channelID, "Name not found. Try again.");
          }
        } else {
          let temp = "";
          userArray.forEach((item, index) => {
            temp += index + 1 + ". " + item.name + "\n";
          });
          temp += "Use `x!list <name>` for more member info.";
          send(channelID, temp);
        }
        break;
      }
      case "info": {
        const info = USER_DATA.get(userID);
        const name = info.name;
        const email = info.email;
        const phone = info.phone;
        send(
          channelID,
          `\`name:\` ${name}\n\`email:\` ${email}\n\`phone:\` ${phone}`
        );
        break;
      }
      case "help": {
        // List of commands
        if (!messageData.author.bot) {
          deleteMsg(channelID, messageData.id);
        }
        send(userID, HELP_MESSAGE);
        break;
      }
      default: {
        send(
          channelID,
          "Opps. Try `x!start` if you haven't setup your info or `x!help` for other options."
        );
      }
    }
  }
});
