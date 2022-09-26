const Global = require("../schema/globalSchema");
const {MessageActionRow, MessageButton, MessageEmbed} = require('discord.js');


module.exports = {
	name :'top',
    aliases: ['mostp', 'mostplayed'],
	description: 'lists the top 10 most played playlists.',
	once: true,
	async execute(client, message, cmd, args) {
        try {
          const {author, channel} = message;
            const top = await Global.findOne({id: 0});
            //change it to array of playlist titles
              let titles = [];
              for(let i = 0; i < top.mostPlayed.length; i++){
                titles.push(top.mostPlayed[i]);
              }
              const generateEmbed = async start => {
                let current = [];
                    if(titles.length <= 10){
                        current = titles;
                    } else {
                      for(let i = 0; i < 10; i++){
                        if(i === titles.length-1){ //shitty way in case its not multiple of ten, could use modulo later idk too braindead rn lol.
                            current.push(top.mostPlayed[i]);
                            i = 10;
                        } else {
                          current.push(top.mostPlayed[i]);
                        }
                      }
                    }
            
                // You can of course customise this embed however you want
                return new MessageEmbed({   
                title: `Showing most played playlists:`,
                fields: await Promise.all(
                    current.map(async (playlist, index) => ({
                    name:`${index+1}: ${current[index].title}`,
                    value: `Played ${current[index].count} times.`,
                    }))
                )
                })
            }
            
            // Send the embed with the first 10 playlist
            const embedMessage = await channel.send({
                embeds: [await generateEmbed(0)],
            })
            return;

        } catch (error) {
            console.error(error);
        }
       
    },
};


