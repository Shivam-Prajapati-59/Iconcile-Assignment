# ---- Build stage ----
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /workspace
COPY pom.xml .
RUN mvn -q -DskipTests dependency:go-offline || true
COPY src src
RUN mvn -q -DskipTests package

# ---- Runtime stage ----
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /workspace/target/*.jar app.jar
EXPOSE 8080
# FLYWAY_ENABLED=true applies pending Flyway migrations on boot (idempotent).
# Render sets PORT automatically; the app binds to it via ${PORT}.
CMD ["sh", "-c", "java -jar /app/app.jar --spring.flyway.enabled=${FLYWAY_ENABLED:-true}"]
