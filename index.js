// Require the necessary discord.js classes
//const fetch = require('node-fetch');
//const fs = require('node:fs');


const Discord = require("discord.js");
const { Intents } = require('discord.js');
//const { Player } = require("discord-player");

//node index.js load

require('dotenv').config();

// Create a new client instance
const client = new Discord.Client({ partials: ["MESSAGE", "CHANNEL", "REACTION"], intents:[Intents.FLAGS.GUILD_PRESENCES, Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_VOICE_STATES,Intents.FLAGS.GUILD_MESSAGE_REACTIONS] });
const mongoose = require('mongoose');
//const { DisTubeStream } = require("distube");

client.commands = new Discord.Collection();
client.events = new Discord.Collection();

const handlers = ['command_handler', 'event_handler'];

for(const handler of handlers){
    try{
        require(`./handlers/${handler}`)(client, Discord);
    }catch(e){
        console.warn(e);
    }
}

/*
//make sure to check out play command to ignore the playing msg
client.on("ready", async ()=>{
    const guild = await client.guilds.cache.get("915210119904657428");
    const channel = await guild.channels.cache.get("933423366822588487"); //the channel where the msg is
    const msg = await channel.messages.fetch("1016448062744440893");
    const song = ["https://www.youtube.com/watch?v=A3ytTKZf344"];
    const commandPlay = client.commands.get("play");
    commandPlay.execute(client, msg, "play", song, Discord);

}); */

client.login(process.env.TOKENTEST);
mongoose.connect(process.env.db, {
    useNewUrlParser:true,
    useUnifiedTopology:true
}).then(()=>{
    console.log("Connected to database.");
}).catch((err) => {
    console.error(err);
});
