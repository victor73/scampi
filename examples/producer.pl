#!/usr/bin/perl

use strict;
use Net::Stomp;

my $stomp = Net::Stomp->new( {hostname => "messaging.server.example.com", port => 61613} );

#$stomp->connect({ login => "user", passcode => "password" });
$stomp->connect();

$stomp->send({destination => "/queue/test.q", body => "Message 1"});
$stomp->send({destination => "/queue/test2.q", body => "Message 2"});
$stomp->send({destination => "/topic/test_topic", body => "Message 3"});
$stomp->disconnect();

