const User = require("../schema/userSchema");
const {MessageActionRow, MessageButton, MessageEmbed} = require('discord.js');

module.exports = {
	name :'editt',
    aliases: ['edittitle', 'edit', 'editp', 'changetitle'],
	description: 'edits the title of a playlist.',
	once: true,
	async execute(client, message, cmd, args) {
        //format: -rafi editt (index)(title)
        //                       0      1                    
        try {
            if(!args.length) return message.reply('You need to specify the playlist index and a new title!\nFor more information, do -raf help.')
            let index = parseInt(args[0]);
            if(!Number.isInteger(index)) return message.reply("Invalid playlist index!\nDo '-raf listp' to see all your playlists!");
            index--;
            args.shift();
            const id = message.author.id;
            const newTitle = args.join(' ');
            if (newTitle === '') return message.reply('You need to specify a new title!\nFor more information, do -raf help.');
            let user = await User.findOne({userId:id});
            if(!user){
                return message.reply(`You don't have any playlist saved yet!\nTry "-raf createp (public/private) (title)" to create a playlist!\nFor more information, do "-raf help".`);
            }
            if(index >= user.playlists.length || index < 0) return message.reply("Invalid playlist index!\nDo '-raf listp' to see all your playlists!");
            for(let i = 0; i < user.playlists.length; i++){
                if(user.playlists[i].title === newTitle) return message.reply("A playlist with that title already exists. Please choose a different one.");
            }
            user.playlists[index].title = newTitle;
            user.save();
            return message.channel.send(`Edited title to ${newTitle}.`);
        } catch (error) {
            console.error(error);
        }
    },
};
    