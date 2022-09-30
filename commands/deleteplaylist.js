const { Client, Message, MessageEmbed } = require('discord.js');
const { MessageActionRow, MessageSelectMenu } = require('discord.js');
const User = require("../schema/userSchema");

module.exports = {
	name :'deleteplaylist',
    aliases: ['removeplaylist', 'deletep', 'removep'],
	description: 'deletes a playlist.',
	once: true,
	async execute(client, message, cmd, args) {
        //format: -rafi removeplaylist
        const id = message.author.id;
        const user = await User.findOne({userId: id});
        if(user.playlists.length === 0){
            return message.reply(`You don't have any playlist saved yet!\nTry "-raf createp (public/private) (title)" to create a playlist!\nFor more information, do "-raf help".`);
        }

        let current = user.playlists;
        //current would be my playlists

            const row = new MessageActionRow()
            .addComponents(
                new MessageSelectMenu() 
                .setCustomId('delete-playlist')
                .setPlaceholder('Choose playlist')
                .addOptions([await Promise.all(current.map(async (playlist, index) => ({
                    label:`${current[index].title}`,
                    value: `${[index]}`,
                    })))]),         
            );
            const embed = new MessageEmbed().setTitle('Choose a playlist to delete.\nThis will delete the playlist as well as all its songs.');

       
       message.channel.send({embeds: [embed], components: [row]});
       const collector = message.channel.createMessageComponentCollector({
        filter: ({user}) => user.id === message.author.id,
        max: 1,
        time: 15000,
    });

       collector.on('collect', async(collected) =>{
           collected.reply({
               content: "Deleted successfully.",
               ephemeral: true,
           });
           collector.stop();
       });
    },
}; 
