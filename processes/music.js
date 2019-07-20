config = require('../config.json')
const {google} = require('googleapis');
const Discord = require('discord.js');
const ytdl = require('ytdl-core');
var yt = google.youtube('v3');
var votedmembers = [];
var voteskip = {};
var servers = {};
var nowplaying = {};
let server;

module.exports = {
    play: async function (bot, message, connection, video, callback) {
        if (!servers[message.guild.id]) {
            servers[message.guild.id] = {
                queue: [],
            };
        }
        var server = servers[message.guild.id]
        async function dispatch(){
            if(!voteskip[message.guild.id]){voteskip[message.guild.id] = 0;}
            dispatcher = connection.playStream(ytdl(server.queue[0].url, {filter: 'audioonly'}), {seek: 0, volume: 1});
            dispatcher.on('end', () => {
                voteskip[message.guild.id] = 0;
                votedmembers.length = 0;
                server.queue.shift()
                if(server.queue.length > 0){
                    var playEmbed = new Discord.RichEmbed()
                        .setAuthor('Music - Now Playing')
                        .addField('Song Name', "```"+server.queue[0].title+"```")
                        .addField('Channel Name', "```"+server.queue[0].channel+"```")
                        .setThumbnail(server.queue[0].thumbnail)
                        .setColor([204, 55, 95])
                    message.channel.send(playEmbed);
                    dispatcher[message.guild.id] = connection.playStream(ytdl(server.queue[0].url, {filter: 'audioonly'}), {seek: 0, volume: 1});
                } else {
                    connection.disconnect()
                    server.queue = [];
                }
            });
        }
        if(server.queue.length > 0){
            server.queue.push(video)
            var playEmbed = new Discord.RichEmbed()
                .setAuthor('Music has been added to queue!')
                .addField('Song Name', "```"+video.title+"```")
                .addField('Channel Name', "```"+video.channel+"```")
                .addField('Position in queue:', "```"+(server.queue.length-1)+"```")
                .setThumbnail(video.thumbnail)
                .setColor([204, 55, 95])
            message.channel.send(playEmbed);
        } else {
            server.queue.push(video)
            var playEmbed = new Discord.RichEmbed()
                .setAuthor('Music - Now playing')
                .addField('Song Name', "```"+video.title+"```")
                .addField('Channel Name', "```"+video.channel+"```")
                .setThumbnail(video.thumbnail)
                .setColor([204, 55, 95])
            message.channel.send(playEmbed);
            dispatch()
        }
    },
    pause: async function (bot, message, memberVoiceChannel, callback) {
        var noMusic = new Discord.RichEmbed()
            .setAuthor('Music - Error')
            .setColor([255, 120, 120])
            .setDescription("There is currently no music playing!");
        if(!message.guild.voiceConnection) return message.channel.send(noMusic)
        let dispatcher = message.guild.voiceConnection.player.dispatcher
        if(memberVoiceChannel !== message.guild.voiceConnection.channel) return message.channel.send("You have to be in the same channel as me to use this command!")
        var pauseFailedEmbed = new Discord.RichEmbed()
            .setAuthor('Music - Error')
            .setColor([255, 120, 120])
            .setDescription("Music is already paused!");
        if(dispatcher.paused) return message.channel.send(pauseFailedEmbed)
        else {
            var pauseEmbed = new Discord.RichEmbed()
                .setAuthor('Music')
                .setColor([204, 55, 95])
                .setDescription("Music has been paused ⏸");
            message.guild.voiceConnection.player.dispatcher.pause()
            message.channel.send(pauseEmbed)
        }
    },
    resume: async function (bot, message, memberVoiceChannel, callback) {
        var noMusic = new Discord.RichEmbed()
            .setAuthor('Music - Error')
            .setColor([255, 120, 120])
            .setDescription("There is currently no music playing!");
        if(!message.guild.voiceConnection) return message.channel.send(noMusic)
        if(memberVoiceChannel !== message.guild.voiceConnection.channel) return message.channel.send("You have to be in the same channel as me to use this command!")
        let dispatcher = message.guild.voiceConnection.player.dispatcher
        var resumeFailedEmbed = new Discord.RichEmbed()
            .setAuthor('Music - Error')
            .setColor([255, 120, 120])
            .setDescription("Music is already playing!");
        if(!dispatcher.paused) return message.channel.send(resumeFailedEmbed)
        else {
            var resumeEmbed = new Discord.RichEmbed()
                .setAuthor('Music')
                .setColor([204, 55, 95])
                .setDescription("Music has been resumed ▶");
            message.guild.voiceConnection.player.dispatcher.resume()
            message.channel.send(resumeEmbed)
        }
    },
    stop: async function (bot, message, memberVoiceChannel) {
        var server = servers[message.guild.id]
        if(!server){
            var errorEmbed = new Discord.RichEmbed()
                .setAuthor('Music - Error')
                .setColor([255, 120, 120])
                .setDescription("There is no music playing");
            return message.channel.send(errorEmbed)
        } else if (server && !server.queue[0]){
            var errorEmbed = new Discord.RichEmbed()
                .setAuthor('Music - Error')
                .setColor([255, 120, 120])
                .setDescription("There is no music playing");
            return message.channel.send(errorEmbed)
        }
        let dispatcher = message.guild.voiceConnection.player.dispatcher
        if(memberVoiceChannel !== message.guild.voiceConnection.channel) return message.channel.send("You have to be in the same channel as me to use this command!")
        server.queue = [];
        setTimeout(function() {
            if (dispatcher) dispatcher.end();
            var stopEmbed = new Discord.RichEmbed()
                .setAuthor('Music')
                .setColor([255, 120, 120])
                .setDescription("Music has been stopped ⏹");
            message.channel.send(stopEmbed)
        }, 1000)
    },
    skip: async function (bot, message, memberVoiceChannel) {
        var server = servers[message.guild.id]
        if(!server){
            var errorEmbed = new Discord.RichEmbed()
                .setAuthor('Music - Error')
                .setColor([255, 120, 120])
                .setDescription("There is no music playing");
            return message.channel.send(errorEmbed)
        } else if (server && !server.queue[0]){
            var errorEmbed = new Discord.RichEmbed()
                .setAuthor('Music - Error')
                .setColor([255, 120, 120])
                .setDescription("There is no music playing");
            return message.channel.send(errorEmbed)
        }
        let dispatcher = message.guild.voiceConnection.player.dispatcher
        if(memberVoiceChannel !== message.guild.voiceConnection.channel) return message.channel.send("You have to be in the same channel as me to use this command!")
        if(server.queue.length == 1){
            if (dispatcher) dispatcher.end();
            message.channel.send("There was no more music left in queue so I disonnected!")
        } else {
            if (dispatcher) dispatcher.end();
        }
    },
    voteskip: async function (bot, message, memberVoiceChannel) {
        var server = servers[message.guild.id]
        if(!server){
            var errorEmbed = new Discord.RichEmbed()
                .setAuthor('Music - Error')
                .setColor([255, 120, 120])
                .setDescription("There is no music playing");
            return message.channel.send(errorEmbed)
        } else if (server && !server.queue[0]){
            var errorEmbed = new Discord.RichEmbed()
                .setAuthor('Music - Error')
                .setColor([255, 120, 120])
                .setDescription("There is no music playing");
            return message.channel.send(errorEmbed)
        }
        let dispatcher = message.guild.voiceConnection.player.dispatcher
        let votedflag = false;
        let listening = message.member.voiceChannel.members.map(r => r.user.username).length;
        for (var i = 0; i < votedmembers.length; i++) {
            if (votedmembers[i] === message.author.id) {
                message.channel.send('You have already voted to skip the song!');
                votedflag = true;
                return;
            }
        }
        voteskip[message.guild.id]++;
        votedmembers.push(message.author.id);
        if (voteskip[message.guild.id] >= Math.round(listening * 0.5) && votedflag === false) {
            if(server.queue.length == 1){
                if (dispatcher) dispatcher.end();
                message.channel.send("There was no more music left in queue so I disonnected!")
            } else {
                if (dispatcher) dispatcher.end();
            }
        } else {
            var sk = new Discord.RichEmbed()
                .setAuthor(`Vote skip for ${server.queue[0].title}`)
                .setColor([204, 55, 95])
                .addField('**Current Votes:**', voteskip[message.guild.id], true)
                .addField('**Votes Required:**', Math.round(listening * 0.5), true)
                .addField('**Additional Votes Needed:**', Math.round(listening * 0.5) - voteskip[message.guild.id], true)
                .setThumbnail(server.queue[0].thumbnail);
            message.channel.send(sk);
        }
    },
    queue: async function (bot, message, memberVoiceChannel) {
        return new Promise(result => {
            var server = servers[message.guild.id]
            if(!server){
                var errorEmbed = new Discord.RichEmbed()
                    .setAuthor('Music - Error')
                    .setColor([255, 120, 120])
                    .setDescription("There is no music playing");
                return message.channel.send(errorEmbed)
            } else if (server && !server.queue[0]){
                var errorEmbed = new Discord.RichEmbed()
                    .setAuthor('Music - Error')
                    .setColor([255, 120, 120])
                    .setDescription("There is no music playing");
                return message.channel.send(errorEmbed)
            }
            result(server.queue)
        })
    },
    queryData: async function(query) {
        return new Promise(result => {
            yt.search.list({
                auth: config.YTkey,
                part: 'id,snippet',
                type: `video`,
                q: query,
            }, (err, response) => {
                if (err) {
                    throw err;
                } else {
                    result(response.data.items)
                }
            })
        })
    },
    parseData: async function(videos, item) {
        if (videos.length === 0) return message.channel.send("No video found.")
        else {
            return new Promise(result => {
                var video = {
                    title: videos[item].snippet.title,
                    url: `https://www.youtube.com/watch?v=${videos[0].id.videoId}`,
                    thumbnail: videos[item].snippet.thumbnails.high.url,
                    description: videos[item].snippet.description,
                    publishedDate: videos[item].snippet.publishedAt,
                    channel: videos[item].snippet.channelTitle,
                }
                result(video);
            })
        }
    },
}