<?php

require_once("/export/working/www/igs/lib/Stomp/Stomp.php");

// make a connection
$connection = new Stomp("tcp://messaging.server.example.com:61613");
$connection->connect();

$message = "test1\ntest2\ntest3";

// send a message to the topic
$connection->send("/topic/test", $message, array('persistent' => 'true'));

// disconnect
$connection->disconnect();

?>
