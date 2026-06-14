# Spring Boot Backend - Women Safety & Emergency Alert System

This directory represents the Java Spring Boot + Spring Security REST API implementation for the Women Safety & Emergency Alert System project, fully configured for Maven and MySQL.

## Project Structure

```text
backend
├── pom.xml
└── src
    └── main
        ├── java
        │   └── com
        │       └── safety
        │           ├── WomenSafetyApplication.java
        │           ├── controller
        │           │   ├── AuthController.java
        │           │   ├── ContactController.java
        │           │   └── AlertController.java
        │           ├── entity
        │           │   ├── User.java
        │           │   ├── Contact.java
        │           │   ├── Alert.java
        │           │   └── IncidentReport.java
        │           ├── repository
        │           │   ├── UserRepository.java
        │           │   ├── ContactRepository.java
        │           │   ├── AlertRepository.java
        │           │   └── IncidentRepository.java
        │           └── security
        │               ├── JwtTokenProvider.java
        │               ├── JwtAuthenticationFilter.java
        │               └── WebSecurityConfig.java
        └── resources
            └── application.properties
```

## Running the Java Backend

1. **Prerequisites**: Ensure you have Java 17 SDK and Maven installed.
2. **Database configuration**: Create a MySQL database named `women_safety_db` and apply the scripts located in `/database/schema.sql`.
3. **Application variables**: Configure database credentials in `backend/src/main/resources/application.properties`:
   ```properties
   spring.datasource.url=jdbc:mysql://localhost:3306/women_safety_db?useSSL=false&serverTimezone=UTC
   spring.datasource.username=YOUR_MYSQL_USERNAME
   spring.datasource.password=YOUR_MYSQL_PASSWORD
   spring.jpa.hibernate.ddl-auto=update
   app.jwt.secret=women-safety-platform-jwt-secret-key-448833
   ```
4. **Compile and Run**:
   ```bash
   cd backend
   mvn spring-boot:run
   ```

## API Highlights
- Uses **Spring Security 6+** and **JSON Web Tokens (JWT)** for stateless request authentication.
- Implements secure, non-reversible BCrypt hashing on passwords.
- Sends SMTP emails to emergency contacts using configured Spring Mail sender libraries when the SOS endpoint is pinged.
