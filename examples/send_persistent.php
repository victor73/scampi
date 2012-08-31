<?php

require_once("/export/working/www/igs/lib/Stomp/Stomp.php");

// make a connection
$connection = new Stomp("tcp://activemq.igs.umaryland.edu:61613");
$connection->connect();

$message = "test1\ntest2\ntest3";

// send a message to the topic
$connection->send("/topic/roster", $message, array('persistent' => 'true'));

// disconnect
$connection->disconnect();

?>
