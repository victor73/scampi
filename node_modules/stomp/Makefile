ACTIVEMQ_HOME = "/usr/local/Cellar/activemq/5.7.0"

start:;@ \
        echo "...starting activemq server..."; \
        pushd ${ACTIVEMQ_HOME}; \
        bin/activemq start; \
        popd; \
        echo "----------------------------------------------------------------------------------------------------------"; \
        echo "----------------------------------------------------------------------------------------------------------"; \
        echo "Started!!!"; \
        echo "...http://localhost:8161/admin to manage activemq"; \
        echo "----------------------------------------------------------------------------------------------------------"; \
        echo "----------------------------------------------------------------------------------------------------------"; \

stop:;@ \
        echo "----------------------------------------------------------------------------------------------------------"; \
        echo "----------------------------------------------------------------------------------------------------------"; \
        echo "...stopping activemq server..."; \
        pushd ${ACTIVEMQ_HOME}; \
        bin/activemq stop \
        popd; \
		    echo "----------------------------------------------------------------------------------------------------------"; \
        echo "----------------------------------------------------------------------------------------------------------"; \
        echo "Stopped!!!"; \

testUnit:;@echo "Running unit tests ..."; \
        ./node_modules/.bin/mocha ./test/*.Unit.Tests.js \
        --reporter spec \
        --recursive \
        --globals "logger,events,buffertools,SlowBuffer, util"

testInt:;@echo "Running integration tests..."; \
        ./node_modules/.bin/mocha ./test/*.Integration.Tests.js \
        --reporter spec \
        --recursive \
        --timeout 2000 \
        --globals "logger"

jsduck:;@echo "Running jsduck to build documentation..."; \
        jsduck --config=jsduckConfig.json