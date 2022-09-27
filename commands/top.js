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
                      
              const generateEmbed = async ()=> {
                let current = top.mostPlayed;
                // You can of course customise this embed however you want
                return new MessageEmbed({   
                title: `Showing top ${top.mostPlayed.length} most played playlists:`,
                fields: await Promise.all(
                    current.map(async (playlist, index) => ({
                    name:`${index+1}: ${current[index].title} `,//by ${current[index].owner.ownerId}`, //add the tag here so others can play from it.
                    value: `Played ${current[index].count} times.`,
                    }))
                )
                })
            }
            
            const embedMessage = await channel.send({
                embeds: [await generateEmbed()],
            })
            return;

        } catch (error) {
            console.error(error);
        }
       
    },
};


