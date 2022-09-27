const User = require("../../schema/userSchema");
const ytdl = require('ytdl-core');

async function playSongs(index, interaction, client, Discord){//index = {id, index}
  try {
    const commandPlay = client.commands.get('play');
    commandPlay
      .execute(client, interaction, 'play', index, Discord, 1) //queue up all the songs then once its done skip the silence.
      .then(
        () => {
          return commandPlay.execute(
            client, interaction, "skip", [], Discord);
        },
        () => {
          return console.log("Oopsie Woopsie, thewe was an ewwoww while queueing songs. So sowwy senpai!!! uwu");
        },
      );
      await interaction.deleteReply();
      return;
    //await interaction.deferReply();
  } catch (error) {
    console.error(error);
    await interaction.reply({
      content: "There was an error while executing play on interactionCreate.",
      ephemeral: true,
    });
  }
}


module.exports = (client, Discord, interaction) => {
  async function handleCommand() {
    if (interaction.isCommand()) {
      return;
    } else if (interaction.isSelectMenu()){
        let user;
        let idx;
        let id;
        let plist;
      switch (interaction.customId){
        case "delete-playlist": //interaction.values is an arr of 1 elem for the index to delete
          id = interaction.user.id;
          user = await User.findOne({userId:id});
          idx = parseInt(interaction.values[0]);
          const plists = user.playlists;
          //remove the song from the plist
          plists.splice(idx, 1);
          user.playlists = plists;
          user.save();
        break;
        case "choose-playlist": //interaction.values is an arr of 1 element consisting of [index, id]. Ugly af.
          id = parseInt(interaction.values[0].substring(2)); //id
          user = await User.findOne({userId:id});
          idx = parseInt(interaction.values[0]); //index
          plist = user.playlists[idx];
          const index = {
            id: id,
            index: idx,
          }
          //check for visibility here
          if(!(id != interaction.user.id && !plist.visibility)){
            playSongs(index, interaction, client, Discord);
          } else {
            interaction.deleteReply();
          }
          break;
        case "add-song": //interaction.values is an arr of 1 element consisting of [index, id]. Ugly af.
          
          //could pass just the url and then do the video finder here
          let song = new Object();
          song.url = interaction.values[0].substring(2); //song
          const song_info = await ytdl.getInfo(song.url);
          song.songTitle = song_info.videoDetails.title;          
          user = await User.findOne({userId:interaction.user.id});
          idx = parseInt(interaction.values[0]); //index
          plist = user.playlists[idx];
          plist.songs.unshift([song]);
          user.save();
          //await interaction.deleteReply();
          return;
          break;
        default:
          break;
      }      
    }
  }
  handleCommand();
  return;
};
