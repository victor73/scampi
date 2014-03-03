stomp-js
========

## Overview

An exercise with node.js to implement the STOMP protocol.

For documentation see http://benjaminws.github.com/stomp-js/

## Installation

`npm install stomp`

`git clone https://benjaminws@github.com/benjaminws/stomp-js.git`

## Examples

### Consumer

See examples/stomp-examples.js #listener()

### Producer

See examples/stomp-examples.js #publishMessage()

### Producer with Transaction Support

See examples/stomp-examples.js #publishMessageWithTransaction()

### App
To run the examples app, open 5 terminal windows.

In each window, navigate to stomp-js folder.
Make sure active mq is running (you can modify the make file start/stop)

In a each window, run one of the following:
  node examples/app --file ./stomp-examples.js --debug false -- params ListenerA
  node examples/app --file ./stomp-examples.js --debug false -- params ListenerB
  node examples/app --file ./stomp-examples.js --debug false -- params ListenerC
  node examples/app --file ./stomp-examples.js --debug false -- params ListenerAll
  node examples/app --file ./stomp-examples.js --debug false -- params Publisher

Once you run the publisher, you should see the listeners dequeue their messages.
There are 3 A, 2 B, and 1 C message.  A and C are topics so Listener All should also get a copy of those, but B is a queue so Listener B should get 1 and Listener All should get 1.
Therefore, you should see the following output:
Listener A should get 3 messages
Listener B should get 1 message
Listener C should get 1 message
Listener All should get 5 messages


### Contributors

rofflwaffls -at- gmail.com
dkhunt27 -at- gmail.com