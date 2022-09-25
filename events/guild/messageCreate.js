require("dotenv").config();
const User = require("../../schema/userSchema");

module.exports = (client, Discord, message) => {
  const prefix = process.env.PREFIX;
  if (message.author.bot) return;
  if(!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).split(/ +/);
  const cmd = args.shift().toLowerCase();
  const command =
    client.commands.get(cmd) ||
    client.commands.find((a) => a.aliases && a.aliases.includes(cmd));
  try {
    const id = message.author.id;
    checkUser(id);
    const flagint = 0; //ugly way to work with interactions in some commands.
    command.execute(client, message, cmd, args, Discord, flagint);
  } catch (err) {
    message.reply("There was an error trying to execute this command. Make sure to type the command correctly!");
    console.log(err);
  }
  
  
};
async function checkUser(id){
  const user = await User.findOne({userId:id});
  if(!user){
    const newUser = new User({
      userId: id,
      playlists: [],
      quotes: [],
    })
    await newUser.save();
  }
};