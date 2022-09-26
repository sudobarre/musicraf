const User = require("../schema/userSchema");
const {MessageActionRow, MessageButton, MessageEmbed} = require('discord.js');


module.exports = {
	name :'listplaylist',
    aliases: ['listp', 'listplaylists'],
	description: 'lists all the playlists available.',
	once: true,
	async execute(client, message, cmd, args) {
        //format: -rafi list (optional tag), check args length, if it is more than 1 then it means theres a tag.
        try {
            let id;
            if(args.length != 0){ //check if a tag was passed to play someone else's songs.
                id = getUserFromMention(args[0]);
                if(!id) return message.reply('Invalid mention! Make sure the member you tagged is in the server!');
                id = id.id; //dont try this at home.
            }else{
                id = message.author.id;
            }
            const user = await User.findOne({userId: id});
            const plists = user.playlists;
            if(plists.length === 0){
                return message.reply(`You don't have any playlist saved yet!\nTry "-raf createp (title) (songURL) (public/private)" to create a playlist!\nFor more information, do "-raf help".`);
            }
            // Put the following code wherever you want to send the embed pages:

            const {author, channel} = message;
            
            //* Creates an embed with guilds starting from an index.
            ///* @param {number} start The index to start from.
            //* @returns {Promise<MessageEmbed>}
            
            const generateEmbed = async () => {
                let current = plists;
                // You can of course customise this embed however you want
                return new MessageEmbed({   
                title: `Showing playlists:`,
                fields: await Promise.all(
                    current.map(async (playlist, index) => ({
                    name:`${index+1}: ${current[index].title}`,
                    value: `Played ${current[index].count} times.`
                    }))
                )
                })
            }
            
            // Send the embed with the first 10 playlist
            const embedMessage = await channel.send({
                embeds: [await generateEmbed()],
            })
            // Exit if there is only one page of guilds (no need for all of this)
            return;
            
           
        } catch (error) {
            console.error(error);
        }
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
    