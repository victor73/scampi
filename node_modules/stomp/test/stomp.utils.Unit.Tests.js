describe('stomp.utils.Unit.Tests', function(){
    "use strict";

    var path = require('path');
    var injectr = require('injectr');
    var should = require("chai").should();
    var sinon = require("sinon");

    var injectrFilePath = path.join(path.join(__dirname, '../lib'),'stomp.utils.js');
    var injectrRequireOverrides = {}; //{ fs: mockfs} would update require('fs') to use mockfs in the injectr file
    var injectrContext = {}; // {"__dirname": __dirname, "Buffer": Buffer} would update those context variables


    var StompUtils;

    beforeEach(function(){
        StompUtils = injectr(injectrFilePath, injectrRequireOverrides, injectrContext);
    });

    describe('#isDefined()', function() {
        var functionToTest, nothing, value;
        beforeEach(function(){
            var stompUtils = new StompUtils();
            functionToTest = function(value) {
                return stompUtils.isDefined(value);
            };
        });
        describe('given typeof undefined;', function() {
            beforeEach(function(){
                value = nothing;
            });

            describe('when called', function() {
                var resultsReturned;
                beforeEach(function(){
                    resultsReturned = functionToTest(value);
                });
                it('then should return false', function(){
                    resultsReturned.should.equal(false);
                });
            });
        });

        describe('given null;', function() {
            beforeEach(function(){
                value = null;
            });

            describe('when called', function() {
                var resultsReturned;
                beforeEach(function(){
                    resultsReturned = functionToTest(value);
                });
                it('then should return false', function(){
                    resultsReturned.should.equal(false);
                });
            });
        });
        describe('given empty string;', function() {
            beforeEach(function(){
                value = '';
            });

            describe('when called', function() {
                var resultsReturned;
                beforeEach(function(){
                    resultsReturned = functionToTest(value);
                });
                it('then should return true', function(){
                    resultsReturned.should.equal(true);
                });
            });
        });

        describe('given 0;', function() {
            beforeEach(function(){
                value = 0;
            });

            describe('when called', function() {
                var resultsReturned;
                beforeEach(function(){
                    resultsReturned = functionToTest(value);
                });
                it('then should return true', function(){
                    resultsReturned.should.equal(true);
                });
            });
        });

        describe('given false;', function() {
            beforeEach(function(){
                value = false;
            });

            describe('when called', function() {
                var resultsReturned;
                beforeEach(function(){
                    resultsReturned = functionToTest(value);
                });
                it('then should return true', function(){
                    resultsReturned.should.equal(true);
                });
            });
        });

        describe('given an empty object;', function() {
            beforeEach(function(){
                value = {};
            });

            describe('when called', function() {
                var resultsReturned;
                beforeEach(function(){
                    resultsReturned = functionToTest(value);
                });
                it('then should return true', function(){
                    resultsReturned.should.equal(true);
                });
            });
        });

        describe('given an empty array;', function() {
            beforeEach(function(){
                value = [];
            });

            describe('when called', function() {
                var resultsReturned;
                beforeEach(function(){
                    resultsReturned = functionToTest(value);
                });
                it('then should return true', function(){
                    resultsReturned.should.equal(true);
                });
            });
        });

        describe('given a string;', function() {
            beforeEach(function(){
                value = 'abc';
            });

            describe('when called', function() {
                var resultsReturned;
                beforeEach(function(){
                    resultsReturned = functionToTest(value);
                });
                it('then should return true', function(){
                    resultsReturned.should.equal(true);
                });
            });
        });

        describe('given a integer;', function() {
            beforeEach(function(){
                value = 123;
            });

            describe('when called', function() {
                var resultsReturned;
                beforeEach(function(){
                    resultsReturned = functionToTest(value);
                });
                it('then should return true', function(){
                    resultsReturned.should.equal(true);
                });
            });
        });

        describe('given a populated object;', function() {
            beforeEach(function(){
                value = {"abc":123};
            });

            describe('when called', function() {
                var resultsReturned;
                beforeEach(function(){
                    resultsReturned = functionToTest(value);
                });
                it('then should return true', function(){
                    resultsReturned.should.equal(true);
                });
            });
        });

        describe('given a populated array;', function() {
            beforeEach(function(){
                value = [{"abc":123}];
            });

            describe('when called', function() {
                var resultsReturned;
                beforeEach(function(){
                    resultsReturned = functionToTest(value);
                });
                it('then should return true', function(){
                    resultsReturned.should.equal(true);
                });
            });
        });

        describe('given a date object;', function() {
            beforeEach(function(){
                value = new Date();
            });

            describe('when called', function() {
                var resultsReturned;
                beforeEach(function(){
                    resultsReturned = functionToTest(value);
                });
                it('then should return true', function(){
                    resultsReturned.should.equal(true);
                });
            });
        });
    });

    describe('#extend', function() {
        var stompUtils;
        beforeEach(function(){
            stompUtils = new StompUtils();
        });
        describe('given undefined destination,', function(){
            var destination;
            beforeEach(function(){
                // do nothing
            });
            describe('given undefined source,', function(){
                var source;
                beforeEach(function(){
                    // do nothing
                });
                describe('when called', function(){
                    var results;
                    beforeEach(function(){
                        results = stompUtils.extend(destination, source);
                    });

                    it('then should return nothing', function(){
                        should.not.exist(results);
                    });
                });
            });
            describe('given defined source,', function(){
                var source;
                beforeEach(function(){
                    source = {abc:123, def:456};
                });
                describe('when called', function(){
                    var results;
                    beforeEach(function(){
                        results = stompUtils.extend(destination, source);
                    });

                    it('then should return nothing', function(){
                        should.not.exist(results);
                    });
                });
            });
        });
        describe('given empty destination,', function(){
            var destination;
            beforeEach(function(){
                destination = {};
            });
            describe('given undefined source,', function(){
                var source;
                beforeEach(function(){
                    // do nothing
                });
                describe('when called', function(){
                    var results;
                    beforeEach(function(){
                        results = stompUtils.extend(destination, source);
                    });

                    it('then should return orig object', function(){
                        should.exist(results);
                    });
                });
            });
            describe('given defined source,', function(){
                var source;
                beforeEach(function(){
                    source = {abc:123, def:456};
                });
                describe('when called', function(){
                    var results;
                    beforeEach(function(){
                        results = stompUtils.extend(destination, source);
                    });

                    it('then should return extended obj', function(){
                        should.exist(results);
                        should.exist(results.abc);
                        should.exist(results.def);
                        results.abc.should.equal(123);
                        results.def.should.equal(456);
                    });
                });
            });
        });
        describe('given defined destination,', function(){
            var destination;
            beforeEach(function(){
                destination = {a:1, b:2};
            });
            describe('given undefined source,', function(){
                var source;
                beforeEach(function(){
                    // do nothing
                });
                describe('when called', function(){
                    var results;
                    beforeEach(function(){
                        results = stompUtils.extend(destination, source);
                    });

                    it('then should return orig object', function(){
                        should.exist(results);
                        should.exist(results.a);
                        should.exist(results.b);
                        results.a.should.equal(1);
                        results.b.should.equal(2);
                    });
                });
            });
            describe('given defined source,', function(){
                var source;
                beforeEach(function(){
                    source = {abc:123, def:456};
                });
                describe('when called', function(){
                    var results;
                    beforeEach(function(){
                        results = stompUtils.extend(destination, source);
                    });

                    it('then should return extended obj', function(){
                        should.exist(results);
                        should.exist(results.a);
                        should.exist(results.b);
                        results.a.should.equal(1);
                        results.b.should.equal(2);
                        should.exist(results.abc);
                        should.exist(results.def);
                        results.abc.should.equal(123);
                        results.def.should.equal(456);
                    });
                });
            });
        });
    });
});

