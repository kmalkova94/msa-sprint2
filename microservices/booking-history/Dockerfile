FROM eclipse-temurin:17-jdk
WORKDIR /app
COPY . /app
RUN sed -i 's/\r$//' ./gradlew
RUN chmod +x ./gradlew
RUN ./gradlew build
EXPOSE 8080
CMD ["java", "-jar", "build/libs/booking-history-0.0.1-SNAPSHOT.jar"]