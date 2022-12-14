const { Client, Message, MessageEmbed } = require('discord.js');
const { MessageActionRow, MessageSelectMenu } = require('discord.js');
const User = require("../schema/userSchema");
const Global = require("../schema/globalSchema");


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
        let user = await User.findOne({userId: id});
        if(!user){
            user = new User({
                userId: id,
                playlists: [],
                quotes: [],
            });
            await user.save();
        }
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
                .setCustomId('choose-playlist')
                .setPlaceholder('Choose a playlist.')
                .addOptions([await Promise.all(current.map(async (playlist, index) => ({
                    label:`${current[index].title}`,
                    value: `${[index, id]}`,
                    })))]),         
            );
            const embed = new MessageEmbed().setTitle('Hi! What playlist do you want to listen from?');

        const filter = (interaction) => 
            interaction.isSelectMenu() && 
            interaction.user.id === message.author.id;

        const collector = message.channel.createMessageComponentCollector({ filter: ({user}) => user.id === message.author.id, max: 1});

        collector.on('collect', async(collected) =>{
            
            id = parseInt(collected.values[0].substring(2)); //id
            idx = parseInt(collected.values[0]); //index
            const plist = user.playlists[idx];
            if(!plist.songs.length){
                collected.deferUpdate();
                collected.channel.send({
                    content: "This playlist has no songs.",
                    ephemeral: true,
                });
            } else {
                //if playing from other user
                if(id != message.author.id && !plist.visibility ){
                    collected.deferUpdate();
                    collected.channel.send({
                        content: "This playlist is set to private.",
                        ephemeral: true,
                    });
                } else {
                collected.deferUpdate();
                //update global count if its bigger than the last one idk lol

                //
                user.playlists[idx].count++;
                await user.save();
                if(plist.visibility){ //to update the most played playlists.
                    let top = await Global.findOne({id: 0});
                    if(!top.mostPlayed.length) {
                        top.mostPlayed.push(user.playlists[idx]); 
                    } else {
                        if(top.mostPlayed.length < 10){
                            const size = top.mostPlayed.length;
                            let flag = true;
                            for(let i = 0; (i < size) && flag; i++){
                                if((top.mostPlayed[i].title === user.playlists[idx].title)){ //find() method didnt work
                                    flag = false;
                                    top.mostPlayed[i].count++;
                                }
                            }
                            if(flag) top.mostPlayed.push(user.playlists[idx]);
                            top.mostPlayed.sort(function(a, b){return b.count - a.count}); 
                        } else {
                            if(top.mostPlayed[mostPlayed.length-1].count < user.playlists[idx].count){
                                top.mostPlayed[mostPlayed.length-1] = user.playlists[idx];
                            }
                        }
                        //top.mostPlayed = [];
                    }
                    await top.save();
                }
                collected.channel.send({
                    content: "Enjoy!",
                    ephemeral: true,
                });
                }
            }    
            
        });
       message.channel.send({embeds: [embed], components: [row]});

       function getUserFromMention(mention) {
        if (!mention) return 0;
    
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
          