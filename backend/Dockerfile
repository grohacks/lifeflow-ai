# Build Stage
FROM maven:3.9.6-eclipse-temurin-21-alpine AS builder
WORKDIR /build
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn clean package -DskipTests -B

# Runtime Stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Add curl for healthcheck
RUN apk add --no-cache curl

# Create non-root user
RUN addgroup -S lifeflow && adduser -S lifeflow -G lifeflow

# Copy built JAR
COPY --from=builder /build/target/*.jar app.jar
RUN chown -R lifeflow:lifeflow /app
USER lifeflow

EXPOSE 8080

# Tuned JVM parameters for 512MB free tier containers
ENV JAVA_TOOL_OPTIONS="-XX:+UseSerialGC -Xmx384m -Xss512k -XX:MaxRAMPercentage=75.0"

ENTRYPOINT ["sh", "-c", "java $JAVA_TOOL_OPTIONS -jar app.jar"]
