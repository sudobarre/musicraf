const User = require("../schema/userSchema");
const {MessageActionRow, MessageButton, MessageEmbed} = require('discord.js');
const ytdl = require('ytdl-core');

module.exports = {
	name :'listsong',
    aliases: ['lists', 'listsongs'],
	description: 'lists the songs of a given playlsit.',
	once: true,
	async execute(client, message, cmd, args) {
        //format: -rafi listsong (playlistIndex) (optional tag)
        // could use ytdl to find the title of the video            

        try {
            let id;
            if(args.length > 1){
                id = getUserFromMention(args[1]);
                if(!id) return message.reply('Invalid mention! Make sure the member you tagged is in the server!');
                id = id.id; //dont try this at home.
            }else{
                id = message.author.id;
            }           
            const user = await User.findOne({userId: id});
            if(user.playlists.length === 0){
                return message.reply(`You don't have any playlist saved yet!\nTry "-raf createp (title) (songURL) (public/private)" to create a playlist!\nFor more information, do "-rafi help".`);
            }
            let index = parseInt(args[0]);
            if((!Number.isInteger(index)) || index > user.playlists.length || index <= 0) return message.reply("Invalid index!\nTry '-rafi listp' to see all your available playlists!");
            index--;
            if(id != message.author.id && !user.playlists[index].visibility) return message.reply("The playlist you are trying to see is set to private.");
            const plist = user.playlists[index].songs;

            const embed = new MessageEmbed()
            .setTitle(`From playlist "${user.playlists[index].title}":`)
            .setFooter(`Played ${user.playlists[index].count} times.`);
            message.channel.send({embeds: [embed]});
            return this.embedSender(client, message, plist); //return embed
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
    async embedSender(client, message, plist, args) {
        //plist: only the array of arrays of one song each.
        try {
   
            const backId = 'back'
            const forwardId = 'forward'
            const backButton = new MessageButton({
            style: 'SECONDARY',
            label: 'Back',
            emoji: '⬅️',
            customId: backId
            })
            const forwardButton = new MessageButton({
            style: 'SECONDARY',
            label: 'Forward',
            emoji: '➡️',
            customId: forwardId
            })
    
            // Put the following code wherever you want to send the embed pages:
    
            const {author, channel} = message;
            //change it to array of playlist titles
            let titles = plist;
    
            //* Creates an embed with guilds starting from an index.
            ///* @param {number} start The index to start from.
            //* @returns {Promise<MessageEmbed>}
            
            const generateEmbed = async start => {
                let current = [];
                      for(let i = start; i < start+5; i++){
                        if(i === titles.length-1){ 
                            current.push(plist[i]);
                            i = start + 5; //shitty way in case its not multiple of ten, could use modulo later idk too braindead rn lol.
                        } else {
                          current.push(plist[i]);
                        }
                      }
                //current = array of plist of 5 elements max, cycles with forward/back buttons.

                
                return new MessageEmbed({   
                title: `Showing songs ${start + 1}-${start + current.length} out of ${
                    titles.length}`,
                fields: await Promise.all(
                    current.map(async (playlist, index) => ({
                    name:`${index+1+start}: ${await this.details(current, index)}`,
                    value: `${current[index]}`,
                    }))
                )
                })
            }
            
            // Send the embed with the first 10 playlist
            const canFitOnOnePage = titles.length <= 5
            const embedMessage = await channel.send({
                embeds: [await generateEmbed(0)],
                components: canFitOnOnePage
                ? []
                : [new MessageActionRow({components: [forwardButton]})]
            })
            // Exit if there is only one page of guilds (no need for all of this)
            if (canFitOnOnePage) return;
            
            // Collect button interactions (when a user clicks a button),
            // but only when the button as clicked by the original message author
            const collector = embedMessage.createMessageComponentCollector({
                filter: ({user}) => user.id === author.id
            })
            
            //doesnt show the next page
            let currentIndex = 0
            collector.on('collect', async interaction => {
                // Increase/decrease index
                interaction.customId === backId ? (currentIndex -= 5) : (currentIndex += 5)
                // Respond to interaction by updating message with new embed
                await interaction.update({
                embeds: [await generateEmbed(currentIndex)],
                components: [
                    new MessageActionRow({
                    components: [
                        // back button if it isn't the start
                        ...(currentIndex ? [backButton] : []),
                        // forward button if it isn't the end
                        ...(currentIndex + 5 < plist.length ? [forwardButton] : [])
                    ]
                    })
                ]
                })
            })
        } catch (error) {
            console.error(error);
        }
    },
    async details(current, i){
        let temp = await ytdl.getInfo(current[i].toString());
        return temp.videoDetails.title;
    } 
};



