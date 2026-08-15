#!/usr/bin/env bash

set -euo pipefail

# Run Flyway without starting the HTTP server; dotenv-java loads backend/.env.
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd "${SCRIPT_DIR}/.."
./mvnw spring-boot:run -Dspring-boot.run.arguments="--spring.flyway.enabled=true --spring.main.web-application-type=none --debug=false --logging.level.root=WARN --logging.level.org.flywaydb=WARN --logging.level.org.hibernate.orm.connections.pooling=WARN"
