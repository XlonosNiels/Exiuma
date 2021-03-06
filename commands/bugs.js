module.exports = {
    name: ['bug', 'bugs', 'debug'],
    description: 'This reloads all bot functions for debugging purposes',
    category: 'developer',
    main: function(bot, message) {
        const readdir = require('fs').readdir;
        //dev check
        if (bot.devs.indexOf(message.author.id) < 0) {
            return message.channel.send('Sorry, you need developer permissions to run this command');
        }
        let failedLoads = 0;

        readdir('./commands/', (err, files) => {
            if (err) throw err;
            message.channel.send(`Loading ${files.length} commands...`).then(msg => {
                files.forEach(f => {
                    //see if all the commands load up
                    if(f !== "config.json") {
                        try {
                            for (s = 0; s < require(`./${f}`).name.length; s++) {
                                let name = require(`./${f}`).name[s];
                                bot.commands.set(name, require(`./${f}`));
                                msg.edit(msg.content + `\nloading ${name}`)
                            }
                        } catch (e) {
                            message.channel.send(`Unable to load command ${f}: ${e}`);
                            failedLoads++
                        }
                    }
                });
                if(failedLoads !== 0){
                    msg.edit(msg.content + `\n`+`:x: ${files.length-failedLoads}`+" file(s) loaded successfully, "+failedLoads+" file(s) failed to load")
                } else {
                    msg.edit(msg.content + `\n`+":white_check_mark: All files loaded, no errors detected!");
                }
            })
        });
    },
}