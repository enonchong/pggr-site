var should = require('should');
var request = require('request');
var url = (u = "/") => ('http://localhost:3000' + u);
var app = require('./app').app;

describe('Root Redirects', function() {
    it('No Cookie', function(done) {
        request({
            url: url(),
            headers: {}
        }, function(error, response, body) {
            response.statusCode.should.eql(200);
            response.request.uri.path.should.eql("/fr/home");
            done();
        });
    });

    it('FR Cookie', function(done) {
        request({
            url: url(),
            headers: {'Cookie': 'lang=fr'}
        }, function(error, response, body) {
            response.statusCode.should.eql(200);
            response.request.uri.path.should.eql("/fr/home");
            done();
        });
    });

    it('EN Cookie', function(done) {
        request({
            url: url(),
            headers: {'Cookie': 'lang=en'}
        }, function(error, response, body) {
            response.statusCode.should.eql(200);
            response.request.uri.path.should.eql("/en/home");
            done();
        });
    });

    it('Invalid Cookie', function(done) {
        request({
            url: url(),
            headers: {'Cookie': 'lang=foobar'}
        }, function(error, response, body) {
            response.statusCode.should.eql(200);
            response.request.uri.path.should.eql("/fr/home");
            done();
        });
    });
});

describe('Legacy Redirects', function() {
    it('No Cookie', function(done) {
        request({
            url: url("/home"),
            headers: {}
        }, function(error, response, body) {
            response.statusCode.should.eql(200);
            response.request.uri.path.should.eql("/fr/home");
            done();
        });
    });

    it('FR Cookie', function(done) {
        request({
            url: url("/home"),
            headers: {'Cookie': 'lang=fr'}
        }, function(error, response, body) {
            response.statusCode.should.eql(200);
            response.request.uri.path.should.eql("/fr/home");
            done();
        });
    });

    it('EN Cookie', function(done) {
        request({
            url: url("/home"),
            headers: {'Cookie': 'lang=en'}
        }, function(error, response, body) {
            response.statusCode.should.eql(200);
            response.request.uri.path.should.eql("/en/home");
            done();
        });
    });

    it('Invalid Cookie', function(done) {
        request({
            url: url("/home"),
            headers: {'Cookie': 'lang=foobar'}
        }, function(error, response, body) {
            response.statusCode.should.eql(200);
            response.request.uri.path.should.eql("/fr/home");
            done();
        });
    });
});

describe('Data Integrity Test', function() {
    it('Length', function(done) {
        request({
            url: url("/dynamic/compiled.js"),
            headers: {}
        }, function(error, response, body) {
            response.statusCode.should.eql(200);
            JSON.parse(response.body).length.should.be.above(10);
            done();
        });
    });
});
