FROM eclipse-temurin:17-jdk
WORKDIR /app
COPY . /app
RUN sed -i 's/\r$//' ./gradlew
RUN chmod +x ./gradlew
RUN ./gradlew build
EXPOSE 8080
CMD ["java", "-jar", "build/libs/hotelio-monolith-1.0.0.jar"]