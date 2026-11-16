# Stage 1: Build JAR using Maven
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app

# Copy pom.xml and cache dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code and build production jar
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Minimal Runtime Image with Java 17 + Python 3 + edge-tts
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

# Install Python 3, pip and edge-tts
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/* \
    && ln -sf /usr/bin/python3 /usr/bin/python \
    && pip3 install --no-cache-dir --upgrade edge-tts

# Copy built jar from build stage
COPY --from=build /app/target/*.jar app.jar

# Copy scripts directory (synthesize.py)
COPY scripts ./scripts

# Render and dynamic cloud port
ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
