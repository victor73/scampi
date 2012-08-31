<?php

require_once("/export/working/www/igs/lib/Stomp/Stomp.php");

// make a connection
$connection = new Stomp("tcp://activemq.igs.umaryland.edu:61613");
$connection->clientId = "test";
$connection->connect();

// send a message to the topic
$connection->subscribe("/topic/roster");

// receive a message from the topic
$msg = $connection->readFrame();

// do what you want with the message
if ( $msg != null) {
    echo "Message " . $msg->body . " received from topic\n";
    $connection->ack($msg);
} else {
    echo "Failed to receive a message\n";
}

// disconnect
$connection->disconnect();

?>
