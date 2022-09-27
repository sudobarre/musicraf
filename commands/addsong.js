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
        const video = await video_finder(args.join(' '));
        let song = new Object();
        if (video){
            song.url = video.url
        } else {
            if(!ytdl.validateURL(args[0])) {
                return message.reply('Invalid link! Needs to be a YouTube URL.');
            } else {
                song.url = args[0];
            }
        }
        const song_info = await ytdl.getInfo(song.url);
        song.songTitle = song_info.videoDetails.title;
        if(song.url.length + song.songTitle.length >= 72){
            while(72 - (song.url.length + song.songTitle.length) <= 0){
                song.songTitle = song.songTitle.slice(0, -1); 
            }
        }
        try {
            const id = message.author.id;
            const user = await User.findOne({userId: id});
            if(user.playlists.length === 0){
                return message.reply(`You don't have any playlist saved yet!\nTry "-raf createp (title) (songURL) (public/private)" to create a playlist!\nFor more information, do "-rafi help".`);
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
                        value: `${[index, JSON.stringify(song)]}`, //CHECK INTERACTIONCREATE
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
                return;  
            });
           message.channel.send({embeds: [embed], components: [row]});
        } catch (error) {
            console.error(error);
        }
    },
};

    
