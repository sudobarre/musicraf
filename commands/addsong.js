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
        const video_finder = async (query) =>{
            const videoResult = await ytSearch(query);
            return (videoResult.videos.length > 1) ? videoResult.videos[0] : null; //gets the first result in the search of that keyword

        };
        
        const video = await video_finder(args.join(' '));
        let song;
        //console.log(video);
        if (video){
            song = video.url
        } else {
            if(!ytdl.validateURL(args[0])) {
                return message.reply('Invalid song! Song needs to be a YouTube URL.');
            } else {
                song = args[0];
            }
        }
        try {
            const id = message.author.id;
            const user = await User.findOne({userId: id});
            if(user.playlists.length === 0){
                return message.reply(`You don't have any playlist saved yet!\nTry "-raf createp (title) (songURL) (public/private)" to create a playlist!\nFor more information, do "-rafi help".`);
            }
            
            //could send a selectmenu here to choose the playlist to add it to.
            let current = user.playlists;
            //current would be my playlists
    
                const row = new MessageActionRow()
                .addComponents(
                    new MessageSelectMenu() 
                    .setCustomId('add-song')
                    .setPlaceholder('Playlist')
                    .addOptions([await Promise.all(current.map(async (playlist, index) => ({
                        label:`${current[index].title}`,
                        value: `${[index, song]}`,
                        })))]),         
                );
                const embed = new MessageEmbed().setTitle('Choose a playlist to add the song to.');
    
            const filter = (interaction) => 
                interaction.isSelectMenu() && 
                interaction.user.id === message.author.id;
    
            const collector = message.channel.createMessageComponentCollector({ filter: ({user}) => user.id === message.author.id, max: 1});
    
            collector.on('collect', async(collected) =>{
                collected.channel.send({
                    content: "Song added!",
                     ephemeral: true,
                });  
            });
           message.channel.send({embeds: [embed], components: [row]});

        } catch (error) {
            console.error(error);
        }
    },
};

    
