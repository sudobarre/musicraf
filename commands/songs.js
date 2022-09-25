const { Client, Message, MessageEmbed } = require('discord.js');
const { MessageActionRow, MessageSelectMenu } = require('discord.js');
const User = require("../schema/userSchema");


module.exports = {
    name: 'songs',
    async execute(client, message, cmd, args, Discord){ //play-dl as alternative
        let id;
        if(args.length != 0){ //check if a tag was passed to play someone else's songs.
            id = getUserFromMention(args[0]);
            if(!id) return message.reply('Invalid mention! Make sure the member you tagged is in the server!');
            id = id.id; //dont try this at home.
        }else{
            id = message.author.id;
        }
        const user = await User.findOne({userId: id});
        if(user.playlists.length === 0){
            return message.reply(`You don't have any playlist saved yet!\nTry "-raf createp (public/private) (title) (songURL)" to create a playlist!\nFor more information, do "-rafi help".`);
        }
        const command = client.commands.get('play');
        const song = ['https://www.youtube.com/watch?v=r6-cbMQALcE']; //15 mins of silence lol
        command.execute(client, message, 'play', song , Discord);
         if(!message.member.voice.channel) return;

        let current = user.playlists;
        //current would be my playlists

            const row = new MessageActionRow()
            .addComponents(
                new MessageSelectMenu() 
                .setCustomId('choose-song')
                .setPlaceholder('Choose a playlist.')
                .addOptions([await Promise.all(current.map(async (playlist, index) => ({
                    label:`${current[index].title}`,
                    value: `${[index, id]}`,
                    })))]),         
            );
            const embed = new MessageEmbed().setTitle('Hi! What type of music do you wanna listen to?');

        const filter = (interaction) => 
            interaction.isSelectMenu() && 
            interaction.user.id === message.author.id;

        const collector = message.channel.createMessageComponentCollector({ filter: ({user}) => user.id === message.author.id, max: 1});

        collector.on('collect', async(collected) =>{
            const value = collected.values[0];
            id = parseInt(collected.values[0].substring(2)); //id
            idx = parseInt(collected.values[0]); //index
            const plist = user.playlists[idx];
            //check for visibility here
            if(id != message.author.id && !plist.visibility ){
                collected.deferUpdate();
                collected.channel.send({
                    content: "This playlist is set to private.",
                    ephemeral: true,
                });
            } else {
                collected.deferUpdate();
                collected.channel.send({
                    content: "Enjoy!",
                    ephemeral: true,
                });
            }
            
            
        });
       message.channel.send({embeds: [embed], components: [row]});

       function getUserFromMention(mention) {
        if (!mention) return;
    
        if (mention.startsWith('<@') && mention.endsWith('>')) {
            mention = mention.slice(2, -1);
    
            if (mention.startsWith('!')) {
                mention = mention.slice(1);
            }
    
            return client.users.cache.get(mention);
        }
        return 0;
    }
    },
}; 
          