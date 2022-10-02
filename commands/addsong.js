const { Client, Message, MessageEmbed } = require('discord.js');
const { MessageActionRow, MessageSelectMenu } = require('discord.js');
const User = require("../schema/userSchema");
const ytdl = require('ytdl-core');
const ytSearch = require('yt-search');

module.exports = {
	name :'addsong',
    aliases: ['adds', 'addsongs'],
	description: 'adds a song to a playlist.',
	once: true,
	async execute(client, message, cmd, args) {
        //format: -rafi addsong (url)
        //                        0          
        if(args.length === 0) return message.reply("You need to send a youtube link or the name of the song you want to add!");
        const video_finder = async (query) =>{
            const videoResult = await ytSearch(query);
            return (videoResult.videos.length > 1) ? videoResult.videos[0] : null;
        };

        let url;
        if(!ytdl.validateURL(args[0])) {
            const video = await video_finder(args.join(' '));
            if (video){
                url = video.url
            } else {
                return message.reply('Invalid link! Needs to be a YouTube URL.');
            }
        } else {
            url = args[0]; 
        }
        try {
            const id = message.author.id;
            let user = await User.findOne({userId: id});
            if(!user){
                user = new User({
                    userId: id,
                    playlists: [],
                    quotes: [],
                });
            }
            if(user.playlists.length === 0){
                return message.reply(`You don't have any playlist saved yet!\nTry "-raf createp (public/private) (title)" to create a playlist!\nFor more information, do "-rafi help".`);
            }
            
            
            //selectmenu here to choose the playlist to add it to.
            let current = user.playlists;
            const row = new MessageActionRow()
            .addComponents(
                new MessageSelectMenu()
                    .setCustomId('add-song')
                    .setPlaceholder('Playlist')
                    .addOptions([await Promise.all(current.map(async (playlist, index) => ({
                        label:`${current[index].title}`,
                        value: `${[index, url]}`,
                        ephemeral: true, //CHECK INTERACTIONCREATE
                        })))]),         
                );
            const embed = new MessageEmbed().setTitle('Choose a playlist to add the song to. May take a bit to add the song.');
            const filter = (user) => {
                return user.user.id === message.author.id;
            }
            const collector = message.channel.createMessageComponentCollector({
                filter, 
                max: 1,
                });
    
            collector.on('collect', async(collected) =>{
                collected.channel.send({
                    content:`Added ${url}!`,
                });
                collected.message.delete();
            });
            message.channel.send({embeds: [embed], components: [row], ephemeral: true});
        } catch (error) {
            console.error(error);
        }
    },
};

    
