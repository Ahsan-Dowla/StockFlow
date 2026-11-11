# Stage 1: Build application with Maven
FROM maven:3.9.9-eclipse-temurin-21-alpine AS builder

WORKDIR /app

# Copy pom.xml first to optimize Docker layer caching
COPY pom.xml .

# Download dependencies offline
RUN mvn dependency:go-offline -B

# Copy source code and package application JAR
COPY src ./src
RUN mvn clean package -DskipTests -B

# Stage 2: Minimal runtime image
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Install curl for container health check
RUN apk --no-cache add curl

# Create non-root user and group
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy compiled JAR from builder stage
COPY --from=builder --chown=appuser:appgroup /app/target/stockflow-backend-*.jar app.jar

# Switch to non-root user
USER appuser:appgroup

# Expose backend port
EXPOSE 8090

# Production-tuned JVM flags and entrypoint
ENTRYPOINT ["java", "-XX:+UseG1GC", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
