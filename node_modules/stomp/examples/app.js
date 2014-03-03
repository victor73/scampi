module.exports = function App() {
    "use strict";

    var program, exec, log;

    var init = function() {
        program = require('commander');
        var version = require('../package.json').version;
        var debugOptions = ['true','false'];

        program
            .version(version)
            .option('-f, --file <type>', 'The example file to load.')
            .option('-d, --debug <items>', 'Run in debug mode.', debugOptions)
            .option('-p, --params <type>', 'Other parameters to pass to example file.')
            .parse(process.argv);

        var debug = false;
        if (program.debug) {
            if (program.debug === "true") {
                debug = true;
            }
        }

        var file = './examples/stomp-example.js';
        if (program.file) {
            file = program.file;
        }

        var params = null;
        if (program.params) {
            params = program.params[0];
        }

        var StompLogger = require('../lib/stomp.logger.js');
        log = new StompLogger(debug);

        log.info('initializing app...');
        log.debug('root dir:' + __dirname);
        exec = require(program.file).init(debug, params);
    };

    var execute = function() {
        log.info('executing app...');
        exec.execute();
    };

    init();
    execute();

    return {};
} ();
