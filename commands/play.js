const ytdl = require('ytdl-core');
const ytSearch = require('yt-search');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, StreamType, AudioPlayerStatus, NoSubscriberBehavior } = require('@discordjs/voice');
const {MessageActionRow, MessageButton, MessageEmbed} = require('discord.js');
const User = require("../schema/userSchema");

let connection;
const queue = new Map();
const silence = 'https://www.youtube.com/watch?v=r6-cbMQALcE';

function shuffleArray(array) { //usage: arr = shuffleArray(arr); to use with flagint == 1
    let curId = array.length;
    // There remain elements to shuffle
    while (curId!==0) {
      // Pick a remaining element
      const randId = Math.floor(Math.random() * curId);
      curId -= 1;
      // Swap it with the current element.
      const tmp = array[curId];
      array[curId] = array[randId];
      array[randId] = tmp;
    }
    return array;
  }
// queue (message.guild.id, queue_constructor object { voice channel, text channel, connection, song[]});

//for the interaction a shuffled array containing the songs should be passed through the args arr and all the songs should be queued up at once.
//If there is an existing queue it should clear it up first; by deleting every song except the last one and start queuing up the playlist.
//Afterwards the skip promise is executed so all gucci 

module.exports = {
    name: 'play',
    aliases: ['p', 'skip', 'stop', 'queue'], //add pause, unpause
    description: 'plays music',
    //                    interac       index
    async execute(client, message, cmd, args, Discord, flagint){
        if(!flagint){ //Used with interactions
            var voice_channel = message.member.voice.channel;
            if (!voice_channel) return message.channel.send('You need to be in a voice channel to execute this command.');
            const permissions = voice_channel.permissionsFor(message.client.user);
            if (!permissions.has('CONNECT')) return message.channel.send('You dont have permission to do that');
            if (!permissions.has('SPEAK')) return message.channel.send('You dont have permission to do that');
        }
        //                                                  true                        false
        const server_queue = (!flagint) ? queue.get(message.guild.id) : queue.get(message.guildId); //AFTER INTERACTION

        //if bot is already playing then the silence shouldnt queue up.
        if (cmd === 'play' || cmd === 'p'){
            if (!flagint){
                if(!args.length) return message.reply('You need to send the title or a url as an argument!');
                }
            let song = {};
            if(flagint){ 
                const n = server_queue.songs.length;                
                for(let i = 0; i < n-1; i++){
                    server_queue.songs.shift();
                }
                
                const user = await User.findOne({userId:args.id});
                const plist = user.playlists[args.index].songs;
                shuffleArray(plist);

                //if there is already a queue with >1 songs then free up the queue and push the new selection.


                for(let i = 0; i < plist.length; i++){
                    song = { title: plist[i][0].songTitle, url: plist[i][0].url };
                    server_queue.songs.push(song);
                } 
            }else{

                if (ytdl.validateURL(args[0])){
                    const song_info = await ytdl.getInfo(args[0]);
                    song = { title: song_info.videoDetails.title, url: song_info.videoDetails.video_url };

                } else {
                    //If the video is not a URL then use keywords to find that video.
                    const video_finder = async (query) =>{
                        const videoResult = await ytSearch(query);
                        return (videoResult.videos.length > 1) ? videoResult.videos[0] : null; //gets the first result in the search of that keyword

                    };

                    const video = await video_finder(args.join(' '));
                    if (video){
                        song = { title: video.title, url: video.url };
                    } else {
                        message.reply('Error finding your video.');
                        return;
                    }
                }


                if (!server_queue){ // interaction already has one, goes to else
                    
                    const queue_constructor = {
                        voice_channel: voice_channel,
                        text_channel: message.channel,
                        connection: null,
                        songs: [],
                    };
        
                    queue.set(message.guild.id, queue_constructor);
                    queue_constructor.songs.push(song);
        
                    try {
                            connection = await joinVoiceChannel({
                            channelId: message.member.voice.channel.id,
                            guildId: message.guild.id,
                            adapterCreator: message.guild.voiceAdapterCreator,
                        });
                        queue_constructor.connection = connection;
                        video_player(message.guild, queue_constructor.songs[0]);
                    } catch (err) {
                        queue.delete(message.guild.id);
                        message.reply('There was an error connecting.');
                        throw err;
                    }
                } else{ //there is a server queue, interaction would enter here.
                    if(args[0] === silence) return; //if songs is invoked while there is music playing ignore the silence.

                    server_queue.songs.push(song);
                    return (!flagint) ? message.reply(`**${song.title}** Added to queue!\n${song.url}`) : console.log('added to queue');
                }
            }
        }
        else if (cmd === 'skip'){skip_song(message, server_queue, flagint);}
        else if (cmd === 'stop'){stop_song(message, server_queue);}
        else if (cmd === 'queue'){print_queue(message, server_queue, 0);}

    },

    
};



const video_player = async (guild, song, flagint) => {
    const song_queue = (!flagint) ? queue.get(guild.id) : queue.get(guild);
    
    if(!song) {
        connection.disconnect();
        (!flagint) ? queue.delete(guild.id) : queue.delete(guild); //if called by interaction then the guild id is in guild itself.
        return;
    }
    const stream = ytdl(song.url, {
        filter: "audioonly",
        fmt: "mp3",
        highWaterMark: 1 << 62,
        liveBuffer: 1 << 62,
        dlChunkSize: 0, //disabling chunking is recommended in discord bot
        bitrate: 128,
        quality: "lowestaudio",
   });

    
    const player = createAudioPlayer();

    const resource = createAudioResource(stream, {inputType:StreamType.Arbitrary});
    song_queue.connection.subscribe(player);
    player.play(resource, { seek: 0, volume: 0.5 }); //maybe unsubscribe here with flagint? idk
    player.on('idle', () => {
        song_queue.songs.shift();
        video_player(guild, song_queue.songs[0], flagint); //is it flagint?
    });
    if(song.url !== silence){ 
        await song_queue.text_channel.send(`Now Playing: **${song.title}**`);
        //send the button to skip here.
        const server_queue = (!flagint) ? queue.get(guild.id) : queue.get(guild);
        const forwardId = 'forward'
        const forwardButton = new MessageButton({
            style: 'SECONDARY',
            label: '',
            emoji: '⏭️',
            customId: forwardId
            });
            const queueId = 'queue'
        const queueButton = new MessageButton({
            style: 'SECONDARY',
            label: '',
            emoji: '🇶',
            customId: queueId
            });

            const stopId = 'stop'
        const stopButton = new MessageButton({
            style: 'DANGER',
            label: '',
            emoji: '⏹️',
            customId: stopId
            });

            //TODO stop button
            const embedMessage = await song_queue.text_channel.send({
                components: [new MessageActionRow({components: [forwardButton, queueButton, stopButton],})]
            })
            const collector = embedMessage.createMessageComponentCollector({

            })

            collector.on('collect', async interaction => {
                // Increase/decrease index
                switch(interaction.customId){
                    case forwardId:
                        //delete button
                        skip_song(interaction, server_queue, 1);
                        interaction.update({components: [
                            new MessageActionRow({
                            components: [new MessageButton({
                                style: 'SECONDARY',
                                customId:'skipped',
                                label:'Skipped'
                                })]
                        })
                    ]})
                    collector.stop();;
                    break;
                    case queueId:
                        print_queue(interaction, server_queue, 1);
                        break;
                    case stopId:
                        stop_song(interaction, server_queue);
                        collector.stop();
                    default:
                        break;
                }  
            })
    }
};

const skip_song = (message, server_queue, flagint) => {
    if(flagint !== 0){ //if called by interaction then there is a song queued up already.
        server_queue.songs.shift();
        return video_player(message.guildId, server_queue.songs[0], 1);
    }else{
        if(!message.member.voice.channel) return message.reply('You need to be in a channel to execute this command.');
        if(!server_queue || server_queue.songs.length === 1){
            message.reply('There are no songs left in queue. Leaving voice channel...');
            queue.delete(message.guild.id);
            connection.disconnect();
            return;
        }
    }
    server_queue.songs.shift();
    video_player(message.guild, server_queue.songs[0]);
   };

   const stop_song = (message, server_queue) => {
   if(!message.member.voice.channel) return message.reply('You need to be in a channel to execute this command.');
   server_queue.songs = [];
   queue.delete(message.guild.id);
   connection.disconnect();
   return message.reply('Player has been stopped and queue has been cleared. Leaving voice channel...');
};

//🇶 for the queue emoji
const print_queue = (message, server_queue, flagint) => { //paginated embed here, if only silence, send sth like "please choose a playlist first"
    if(!server_queue) return message.reply('There are no songs remaining in the queue.');
    const songs = server_queue.songs;
    if(songs[0].url === silence) return message.reply('Please choose a playlist first!');
    return (flagint) ? buttonEmbedSender(message, songs) : embedSender(message, songs); //return embed
    
};
async function embedSender(message, songs) {
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
        let titles = songs;

        //* Creates an embed with guilds starting from an index.
        ///* @param {number} start The index to start from.
        //* @returns {Promise<MessageEmbed>}
        
        const generateEmbed = async start => {
            let current = [];
                  for(let i = start; i < start+5; i++){
                    if(i === titles.length-1){ 
                        current.push(songs[i]);
                        i = start + 5; //shitty way in case its not multiple of ten, could use modulo later idk too braindead rn lol.
                    } else {
                      current.push(songs[i]);
                    }
                  }
            //current = array of plist of 5 elements max, cycles with forward/back buttons.

            
            return new MessageEmbed({   
            title: `Showing songs ${start + 1}-${start + current.length} out of ${
                titles.length}`,
            fields: await Promise.all(
                current.map(async (playlist, index) => ({
                name:`${index+1+start}: ${current[index].title}`,
                value: `${current[index].url}`,
                }))
            )
            })
        }
        
        // Send the embed with the first 10 playlist
        const canFitOnOnePage = titles.length <= 5
        const embedMessage = await message.reply({
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
                    ...(currentIndex + 5 < songs.length ? [forwardButton] : [])
                ]
                })
            ]
            })
        })
    } catch (error) {
        console.error(error);
    }
};
async function buttonEmbedSender(message, songs) {
    let titles = songs;
    const generateEmbed = async start => {
        let current = [];
              for(let i = start; i < start+5; i++){
                if(i === titles.length-1){ 
                    current.push(songs[i]);
                    i = start + 5; //shitty way in case its not multiple of ten, could use modulo later idk too braindead rn lol.
                } else {
                  current.push(songs[i]);
                }
              }
        //current = array of plist of 5 elements max, cycles with forward/back buttons.

        
        return new MessageEmbed({   
        title: `Showing first ${start + current.length} songs out of ${
            titles.length}`,
        fields: await Promise.all(
            current.map(async (playlist, index) => ({
            name:`${index+1+start}: ${current[index].title}`,
            value: `${current[index].url}`,
            }))
        )
        })
    }
    const embedMessage = await message.reply({
        embeds: [await generateEmbed(0)],
        components: []});
};


