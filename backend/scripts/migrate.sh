#!/usr/bin/env bash

set -euo pipefail

# Run Flyway without starting the HTTP server; dotenv-java loads backend/.env.
./mvnw spring-boot:run -Dspring-boot.run.arguments="--spring.flyway.enabled=true --spring.main.web-application-type=none --debug=false --logging.level.root=WARN --logging.level.org.flywaydb=WARN --logging.level.org.hibernate.orm.connections.pooling=WARN"
