const User = require("../schema/userSchema");
const Playlist = require("../schema/playlistSchema");
const ytdl = require('ytdl-core');

module.exports = {
	name :'createplaylist',
    aliases: ['createp', 'addp', 'addplaylist', 'newp', 'newplaylist'],
	description: 'creates a playlist.',
	once: true,
	async execute(client, message, cmd, args) {
        //format: -rafi createp (visib) (title)
        //                         0       1           
        //function to validate regex, yt validate from ytdl
        
        if(!(args[0] === 'public' || args[0] === 'private')) return message.reply("You need to specify the playlist visibility!\nFor more information, do '-raf help'.");
        
        try {
            const id = message.author.id;
            function visib(arg){
                return  arg === "public" ? true : false;
            };

            const v = visib(args[0]);
            args.shift(); //byebye visibility
            
            const plistTitle = args.join(' ').toString();
            if (plistTitle === '') return message.reply('You need to specify a title after the visibility!\nFor more information, do -raf help.')
            let user = await User.findOne({userId:id});
            if(!user){
                user = new User({
                    userId: id,
                    playlists: [],
                    quotes: [],
                });
            }
            if(user.playlists.length >= 10) return message.reply("Limit of 10 playlists reached! Please delete a playlist, or add songs to an existing one.");
            for(let i = 0; i < user.playlists.length; i++){
                if(user.playlists[i].title === plistTitle) return message.reply("A playlist with that title already exists!");
            }
            const newPlaylist = new Playlist({
                title: plistTitle,
                visibility: v,
                count: 0,
                owner: user,
            });
            newPlaylist.save();
            user.playlists.push(newPlaylist);         
            user.save();
            return message.channel.send('Playlist created successfully!');
        } catch (error) {
            console.error(error);
        }
    },
};
    