const {MessageActionRow, MessageButton, MessageEmbed} = require('discord.js');
const User = require("../schema/userSchema");
const Global = require("../schema/globalSchema");

module.exports = {
	name :'editv',
    aliases: ['editvisibility', 'changev'],
	description: 'edits the visibility of a playlist.',
	once: true,
	async execute(client, message, cmd, args) {
        //format: -rafi editv (index)
        //                       0   
        try {
            let index = parseInt(args[0]);
            if(!Number.isInteger(index)) return message.reply("Invalid playlist index!\nDo '-raf listp' to see all your playlists!");
            index--;
            const id = message.author.id;
            let user = await User.findOne({userId:id});
            if(!user){
                return message.reply(`You don't have any playlist saved yet!\nTry "-raf createp (public/private) (title)" to create a playlist!\nFor more information, do "-raf help".`);
            }
            if(index >= user.playlists.length || index < 0) return message.reply("Invalid playlist index!\nDo '-raf listp' to see all your playlists!");
            
            const yesId = 'yes'
            const yesButton = new MessageButton({
                style: 'SECONDARY',
                label: '',
                emoji: '✅',
                customId: yesId
                });
            const noId = 'no'
            const noButton = new MessageButton({
                style: 'SECONDARY',
                label: '',
                emoji: '❌',
                customId: noId
                });
            const titleEmbed = new MessageEmbed({
                title: `Are you sure you want to change ${user.playlists[index].title}'s visibility from ${nameVisibility(user.playlists[index].visibility)} to ${nameVisibility(!user.playlists[index].visibility)}?`
            })
            const embedMessage = await message.channel.send({
                embeds: [titleEmbed],
                components: [new MessageActionRow({components: [yesButton, noButton],})]
            })
            const collector = embedMessage.createMessageComponentCollector({
                filter: ({user}) => user.id === message.author.id,
                max: 1,
                time: 30000
            })
            
            collector.on('collect', async interaction => {
                // Increase/decrease index
                if(interaction.customId === yesId){
                    user.playlists[index].visibility = !user.playlists[index].visibility;
                    await user.save();
                    let top = await Global.findOne({id: 0});
                    if(user.playlists[index].visibility){ //to update the most played playlists.
                        if(!top.mostPlayed.length) {
                            top.mostPlayed.push(user.playlists[index]); 
                        } else {
                            if(top.mostPlayed.length < 10){
                                const size = top.mostPlayed.length;
                                let flag = true;
                                for(let i = 0; (i < size) && flag; i++){
                                    if((top.mostPlayed[i].title === user.playlists[index].title)){ //find() method didnt work
                                        flag = false;
                                    }
                                }
                                if(flag) top.mostPlayed.push(user.playlists[index]);
                                top.mostPlayed.sort(function(a, b){return b.count - a.count}); 
                            } else {
                                if(top.mostPlayed[mostPlayed.length-1].count < user.playlists[index].count){
                                    top.mostPlayed[mostPlayed.length-1] = user.playlists[index];
                                }
                            }
                            //top.mostPlayed = [];
                        }
                    } else { //went from public to private, find if its in the highscores and delete it.
                        for(let j = 0; j < top.mostPlayed.length; j++){
                            if((top.mostPlayed[j].title === user.playlists[index].title)){
                                top.mostPlayed.splice(j, 1);
                                break;
                            }
                        }
                    }
                    await top.save();
                    interaction.reply({
                        content: "Visibility changed.",
                    }); 
                }
                await interaction.message.delete(); 
            });

        } catch (error) {
            console.error(error);
        }
        function nameVisibility(v){
            if(v){
                return "Public";
            } else {
                return "Private";
            }
        }
    },
};