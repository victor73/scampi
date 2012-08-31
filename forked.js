var spawn = require('child_process').spawn;

function init() {
    process.on('message', function(msg) {

       var text = msg.text;
       var user = msg.user;
       var script = msg.script;

       console.log("Text: " + text);
       console.log("User: " + user);
       console.log("Script: " + script);

       process.setuid(user);
       console.log("Switched identity to: " + process.getuid());

       try {
            var spawned_script = spawn(script);
   
            spawned_script.stdout.on('data', function(data) {
                console.log('Script stdout: ' + data);
            });

            spawned_script.on('exit', function(code) {
                console.log('Script ' + script + ' exited with code ' + code);
                process.exit(code);
            });

            spawned_script.stdin.write(text);
            spawned_script.stdin.end();

        } catch (e) {
            console.log("Error invoking " + script + ": ", e);
            process.exit(1);
        }

    });
}

function main() {
    console.log("Running as: " + process.getuid());
    init();
}

main();
