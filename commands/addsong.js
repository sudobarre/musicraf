const User = require("../schema/userSchema");
const ytdl = require('ytdl-core');
const ytSearch = require('yt-search');


module.exports = {
	name :'addsong',
    aliases: ['adds', 'addsongs'],
	description: 'adds a song to a playlist.',
	once: true,
	async execute(client, message, cmd, args) {
        //format: -rafi addsong (playlistIndex) (url)
        //                            0           1  
        const video_finder = async (query) =>{
            const videoResult = await ytSearch(query);
            return (videoResult.videos.length > 1) ? videoResult.videos[0] : null; //gets the first result in the search of that keyword

        };
        
        let index = parseInt(args[0]);
        args.shift();
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
            
            if((!Number.isInteger(index)) || index > user.playlists.length || index <= 0) return message.reply("Invalid index!\nTry '-raf listp' to see all your available playlists!");
            index--;
            const plist = user.playlists[index];
            plist.songs.push([song]);
            user.playlists[index] = plist;
            user.save();
            return message.reply('Song added successfully!');
        } catch (error) {
            console.error(error);
        }
    },
};

    
