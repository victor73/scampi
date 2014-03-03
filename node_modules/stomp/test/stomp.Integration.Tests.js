describe('stomp.Integration.Tests', function(){
    "use strict";

    var path = require('path');
    var injectr = require('injectr');
    var should = require("chai").should();
    var sinon = require("sinon");

    var injectrFilePath = path.join(path.join(__dirname, '../lib'),'stomp.js');
    var injectrRequireOverrides = {}; //{ fs: mockfs} would update require('fs') to use mockfs in the injectr file
    var injectrContext = {}; // {"__dirname": __dirname, "Buffer": Buffer} would update those context variables

    // TODO figure out how to delete this queue after test
    var testQueue = "/queue/testQ";

    var Stomp,stompClient,eventSpy;

    beforeEach(function(){
        Stomp = injectr(injectrFilePath, injectrRequireOverrides, injectrContext);
        eventSpy = sinon.spy();
    });

    describe('#Client() constructor', function() {
        var args;
        beforeEach(function(){
            stompClient = new Stomp();
        });
        describe('given empty args,', function(){
            beforeEach(function(){
                args = {};
            });
            describe('when called', function(){
                beforeEach(function(){
                    stompClient.isInitialized().should.equal(false);
                    stompClient = stompClient.Client(args);
                    stompClient.isInitialized().should.equal(true);
                });
                it('then should use defaults', function(){
                    var options = stompClient.getOptions();

                    options.port.should.equal(61613);
                    options.host.should.equal('127.0.0.1');
                    should.not.exist(options.login);
                    should.not.exist(options.passcode);
                    options.ssl.should.equal(false);
                    options.sslValidate.should.equal(false);
                    should.exist(options.sslOptions);
                    should.not.exist(options.clientId);
                    should.not.exist(options.vhost);
                });
            });
        });
        describe('given valid args,', function(){
            beforeEach(function(){
                args = {
                    port: 123,
                    host: "local",
                    debug: false,
                    login: "blah",
                    passcode: "secret",
                    ssl: true,
                    ssl_validate: true,
                    ssl_options: "abc",
                    "client-id": "def",
                    vhost: "ghi"
                };
            });
            describe('when called', function(){
                beforeEach(function(){
                    stompClient.isInitialized().should.equal(false);
                    stompClient = stompClient.Client(args);
                    stompClient.isInitialized().should.equal(true);
                });

                it('then should use inputs and be initialized', function(){
                    var options = stompClient.getOptions();

                    options.port.should.equal(123);
                    options.host.should.equal('local');
                    options.login.should.equal("blah");
                    options.passcode.should.equal("secret");
                    options.ssl.should.equal(true);
                    options.sslValidate.should.equal(true);
                    options.sslOptions.should.equal("abc");
                    options.clientId.should.equal("def");
                    options.vhost.should.equal("ghi");

                });
            });
        });
    });

    describe('#connect() and #disconnect()', function() {
        describe('given not initialized', function(){
            beforeEach(function(){
                stompClient = new Stomp();
            });
            describe('when connect called', function(){
                var errCaught, errThrown, errReturned;
                beforeEach(function(){
                    try {
                        stompClient.isInitialized().should.equal(false);
                        stompClient.connect();
                        errThrown = false;
                    } catch (err) {
                        errThrown = true;
                        errCaught = err;
                    }
                });

                it('then should error', function(){
                    shouldThrowError(errThrown, errCaught, errReturned, 'not initialized');
                });
            });
            describe('when disconnect called', function(){
                var errCaught, errThrown, errReturned;
                beforeEach(function(){
                    try {
                        try {
                            stompClient.isInitialized().should.equal(false);
                            stompClient.disconnect();
                            errThrown = false;
                        } catch (err) {
                            errThrown = true;
                            errCaught = err;
                        }
                    } catch (err) {
                        errThrown = true;
                        errCaught = err;
                    }
                });

                it('then should error', function(){
                    shouldThrowError(errThrown, errCaught, errReturned, 'not initialized');
                });
            });
        });
        describe('given initialized', function(){
            beforeEach(function(){
                var args = {port:61613, host:'localhost', debug:false, login:'guest', passcode:'guest'};
                stompClient = new Stomp().Client(args);
            });
            describe('when connect/disconnect called', function(){
                var errCaught, errThrown, errReturned;
                beforeEach(function(done){
                    try {
                        stompClient.isConnected().should.equal(false);
                        stompClient.on('connected',function(data){
                            stompClient.isConnected().should.equal(true);
                            done();
                        });
                        stompClient.connect();
                        errThrown = false;
                    } catch (err) {
                        errThrown = true;
                        errCaught = err;
                    }
                });
                afterEach(function(done){
                    stompClient.isConnected().should.equal(true);
                    stompClient.on('disconnected',function(data){
                        stompClient.isConnected().should.equal(false);
                        done();
                    });
                    stompClient.disconnect();
                });
                it('then should emit connected/disconnected without error', function(){
                    shouldReturnNoErrors(errThrown, errCaught, errReturned);

                    // emit checking checked in before/after
                });
            });
        });
    });

    describe('#subscribe() and #unsubscribe()', function() {

        describe('given not initialized', function(){
            beforeEach(function(){
                stompClient = new Stomp();
            });
            describe('when subscribe called', function(){
                var errCaught, errThrown, resultsReturned, errReturned;
                beforeEach(function(){
                    try {
                        try {
                            stompClient.subscribe();
                            errThrown = false;
                        } catch (err) {
                            errThrown = true;
                            errCaught = err;
                        }
                    } catch (err) {
                        errThrown = true;
                        errCaught = err;
                    }
                });

                it('then should error', function(){
                    shouldThrowError(errThrown, errCaught, errReturned, 'not initialized');
                });
            });
            describe('when unsubscribe called', function(){
                var errCaught, errThrown, errReturned;
                beforeEach(function(){
                    try {
                        try {
                            stompClient.unsubscribe();
                            errThrown = false;
                        } catch (err) {
                            errThrown = true;
                            errCaught = err;
                        }
                    } catch (err) {
                        errThrown = true;
                        errCaught = err;
                    }
                });

                it('then should error', function(){
                    shouldThrowError(errThrown, errCaught, errReturned, 'not initialized');
                });
            });
        });
        describe('given initialized', function(){
            beforeEach(function(){
                var args = {port:61613, host:'localhost', debug:false, login:'guest', passcode:'guest'};
                stompClient = new Stomp().Client(args);
            });
            describe('given not connected', function(){
                beforeEach(function(){
                    // do nothing so its not connected
                });
                describe('when subscribe called', function(){
                    var errCaught, errThrown, errReturned;
                    beforeEach(function(){
                        try {
                            try {
                                stompClient.on('subscribed', eventSpy);
                                stompClient.subscribe();
                                errThrown = false;
                            } catch (err) {
                                errThrown = true;
                                errCaught = err;
                            }
                        } catch (err) {
                            errThrown = true;
                            errCaught = err;
                        }
                    });

                    it('then should error', function(){
                        shouldThrowError(errThrown, errCaught, errReturned, 'not connected');
                        eventSpy.called.should.equal(false, 'event should not fire');
                    });
                });
                describe('when unsubscribe called', function(){
                    var errCaught, errThrown, resultsReturned, errReturned;
                    beforeEach(function(){
                        try {
                            try {
                                stompClient.on('unsubscribed', eventSpy);
                                stompClient.unsubscribe();
                                errThrown = false;
                            } catch (err) {
                                errThrown = true;
                                errCaught = err;
                            }
                        } catch (err) {
                            errThrown = true;
                            errCaught = err;
                        }
                    });

                    it('then should error', function(){
                        shouldThrowError(errThrown, errCaught, errReturned, 'not connected');
                        eventSpy.called.should.equal(false, 'event should not fire');
                    });
                });
            });
            describe('given connected', function(){
                beforeEach(function(done){
                    stompClient.on('connected', function(){
                        done();
                    });
                    stompClient.connect();
                });
                afterEach(function(done){
                    stompClient.on('disconnected', function(){
                        done();
                    });
                    stompClient.disconnect();
                });
                describe('given subscribe args', function(){
                    var subscribeArgs;
                    beforeEach(function(){
                        subscribeArgs = {destination: testQueue};
                    });
                    describe('when subscribe/unsubscribe called', function(){
                        var errCaught, errThrown, errReturned;
                        beforeEach(function(done){
                            try {
                                stompClient.on('subscribed',function(data){
                                    errThrown = false;
                                    done();
                                });
                                stompClient.subscribe(subscribeArgs);
                            } catch (err) {
                                errThrown = true;
                                errCaught = err;
                                done();
                            }
                        });
                        afterEach(function(done){
                            stompClient.on('unsubscribed',function(data){
                                done();
                            });
                            stompClient.unsubscribe(subscribeArgs);
                        });
                        it('then should emit connected/disconnected without error', function(){
                            shouldReturnNoErrors(errThrown, errCaught, errReturned);

                            // emit checking checked in before/after
                        });
                    });
                });
            });
        });
    });

    describe.skip("TODO #send(), #ack()", function(){});
    describe.skip("TODO #begin(), #commit(), #abort()", function(){});

    var shouldReturnNoErrors = function(errThrown, errCaught, errReturned) {
        if (errThrown) {console.error('errCaught',errCaught);} //output the error for better debugging purposes since it should not exist
        if (errReturned) {console.error('errReturned',errReturned);} //output the error for better debugging purposes since it should not exist
        errThrown.should.equal(false, 'errThrown.should.equal(false)');
        should.not.exist(errCaught, 'should.not.exist(errCaught)');
        should.not.exist(errReturned, 'should.not.exist(errReturned)');
        return;
    };

    var shouldThrowError = function(errThrown, errCaught, errReturned, expectedErrMsg){
        if (errReturned) {console.error(errReturned);} //output the error for better debugging purposes since it should not exist
        errThrown.should.equal(true, 'errThrown.should.equal(true)');
        should.exist(errCaught, 'should.exist(errCaught)');
        should.not.exist(errReturned, 'should.not.exist(errReturned)');
        should.exist(errCaught.message,'should.exist(errCaught.message)');
        errCaught.message.should.contain(expectedErrMsg, 'errCaught.message.should.contain(expectedErrMsg)');
        return;
    };

    var shouldThrowSomeError = function(errThrown, errCaught, errReturned){
        if (errReturned) {console.error(errReturned);} //output the error for better debugging purposes since it should not exist
        errThrown.should.equal(true, 'errThrown.should.equal(true)');
        should.exist(errCaught, 'should.exist(errCaught)');
        should.exist(errCaught.message,'should.exist(errCaught.message)');
        return;
    };
});

