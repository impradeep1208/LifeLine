# Emergency Response Optimizer - Backend

A Spring Boot backend for the Emergency Response Optimizer system with MySQL database, WebSocket support, and REST APIs.

## Tech Stack

- **Java 17**
- **Spring Boot 3.2.2**
- **MySQL 8.0**
- **Maven**
- **WebSocket (STOMP)**
- **JWT Authentication**
- **Spring Security**
- **JPA/Hibernate**

## Database Setup

1. **Install MySQL 8.0** (if not already installed)

2. **Create Database**:
```sql
CREATE DATABASE ero_db;
```

3. **Database Configuration** is in `src/main/resources/application.properties`:
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/ero_db
spring.datasource.username=root
spring.datasource.password=root
```

> **Note**: Update username/password if your MySQL credentials are different.

4. **Auto Schema Creation**: The application will automatically create all tables on first run using JPA.

## Build & Run

### Prerequisites
- Java 17 installed
- Maven installed
- MySQL running on localhost:3306

### Build the Project
```bash
cd backend
mvn clean install
```

### Run the Application
```bash
mvn spring-boot:run
```

The server will start on **http://localhost:8080**

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login (returns JWT token)
- `GET /api/auth/user/{id}` - Get user by ID

### Emergency Operations
- `POST /api/emergency/create` - Create emergency SOS
- `GET /api/emergency/all` - Get all emergencies
- `GET /api/emergency/active` - Get active emergencies
- `GET /api/emergency/{id}` - Get emergency by ID
- `GET /api/emergency/code/{code}` - Get emergency by code
- `POST /api/emergency/{id}/assign-ambulance/{ambulanceId}` - Assign ambulance
- `POST /api/emergency/{id}/assign-hospital` - Assign nearest hospital
- `PUT /api/emergency/{id}/status` - Update emergency status

### Ambulance Operations
- `GET /api/ambulance/all` - Get all ambulances
- `GET /api/ambulance/available` - Get available ambulances
- `GET /api/ambulance/{id}` - Get ambulance by ID
- `GET /api/ambulance/operator/{userId}` - Get ambulance by operator user ID
- `GET /api/ambulance/nearest?latitude={lat}&longitude={lng}&radius={km}` - Find nearest ambulances
- `PUT /api/ambulance/{id}/location` - Update ambulance GPS location
- `PUT /api/ambulance/{id}/status` - Update ambulance status
- `POST /api/ambulance/create` - Create new ambulance
- `DELETE /api/ambulance/{id}` - Delete ambulance

### Hospital Operations
- `GET /api/hospital/all` - Get all hospitals
- `GET /api/hospital/active` - Get active hospitals
- `GET /api/hospital/{id}` - Get hospital by ID
- `GET /api/hospital/admin/{userId}` - Get hospital by admin user ID
- `GET /api/hospital/nearest?latitude={lat}&longitude={lng}&radius={km}` - Find nearest hospitals
- `PUT /api/hospital/{id}/beds` - Update available beds
- `POST /api/hospital/create` - Create new hospital
- `PUT /api/hospital/{id}` - Update hospital details
- `DELETE /api/hospital/{id}` - Delete hospital
- `GET /api/hospital/stats/beds` - Get total available beds

### Traffic Police Operations
- `GET /api/traffic/all` - Get all traffic police
- `GET /api/traffic/available` - Get available officers
- `GET /api/traffic/{id}` - Get traffic police by ID
- `GET /api/traffic/officer/{userId}` - Get traffic police by officer user ID
- `PUT /api/traffic/{id}/location` - Update officer GPS location
- `PUT /api/traffic/{id}/status` - Update officer status
- `POST /api/traffic/assignment/create` - Create traffic assignment
- `POST /api/traffic/assignment/{id}/acknowledge` - Acknowledge assignment
- `POST /api/traffic/assignment/{id}/start` - Start clearing traffic
- `POST /api/traffic/assignment/{id}/complete` - Complete assignment
- `GET /api/traffic/assignment/emergency/{emergencyId}` - Get assignments by emergency
- `GET /api/traffic/assignment/officer/{officerId}` - Get assignments by officer

## WebSocket Endpoints

**Connection URL**: `ws://localhost:8080/ws`

### Subscribe Topics (Client listens to these)
- `/topic/emergencies` - New emergency broadcasts
- `/topic/control` - Control room updates
- `/topic/emergency/{emergencyId}` - Specific emergency updates
- `/topic/ambulance/{ambulanceId}` - Specific ambulance updates
- `/topic/ambulance/{ambulanceId}/location` - Ambulance GPS updates
- `/topic/hospital/{hospitalId}` - Hospital updates
- `/topic/traffic/{officerId}` - Traffic officer updates
- `/topic/traffic/{officerId}/assignment` - Traffic assignments
- `/topic/control/ambulances` - All ambulance updates
- `/topic/control/hospitals` - All hospital updates
- `/topic/control/traffic` - All traffic updates

### Send Topics (Client sends to these)
- `/app/location/ambulance` - Send ambulance location update
- `/app/location/traffic` - Send traffic officer location update

## Project Structure

```
backend/
├── src/main/java/com/ero/
│   ├── config/
│   │   ├── SecurityConfig.java      # Spring Security configuration
│   │   └── WebSocketConfig.java     # WebSocket configuration
│   ├── controller/
│   │   ├── AuthController.java      # Authentication endpoints
│   │   ├── EmergencyController.java # Emergency endpoints
│   │   ├── AmbulanceController.java # Ambulance endpoints
│   │   ├── HospitalController.java  # Hospital endpoints
│   │   ├── TrafficController.java   # Traffic endpoints
│   │   └── WebSocketController.java # WebSocket handlers
│   ├── service/
│   │   ├── AuthService.java         # Auth business logic
│   │   ├── EmergencyService.java    # Emergency business logic
│   │   ├── AmbulanceService.java    # Ambulance business logic
│   │   ├── HospitalService.java     # Hospital business logic
│   │   ├── TrafficService.java      # Traffic business logic
│   │   └── GeoLocationService.java  # Distance calculations
│   ├── repository/
│   │   ├── UserRepository.java
│   │   ├── EmergencyRepository.java
│   │   ├── AmbulanceRepository.java
│   │   ├── HospitalRepository.java
│   │   ├── TrafficPoliceRepository.java
│   │   └── TrafficAssignmentRepository.java
│   ├── model/
│   │   ├── User.java
│   │   ├── Emergency.java
│   │   ├── Ambulance.java
│   │   ├── Hospital.java
│   │   ├── TrafficPolice.java
│   │   └── TrafficAssignment.java
│   ├── dto/
│   │   ├── LoginRequest.java
│   │   ├── RegisterRequest.java
│   │   ├── CreateEmergencyRequest.java
│   │   └── LocationUpdate.java
│   └── EmergencyResponseOptimizerApplication.java
├── src/main/resources/
│   └── application.properties
└── pom.xml
```

## Database Schema

### Tables
- **users** - All system users (citizens, operators)
- **emergencies** - Emergency SOS records
- **ambulances** - Ambulance fleet
- **hospitals** - Hospital network
- **traffic_police** - Traffic police officers
- **traffic_assignments** - Green corridor assignments

All tables are auto-created with proper indexes and spatial support for GPS queries.

## Features

✅ **Role-Based Access** - 5 user roles (Citizen, Ambulance, Traffic, Hospital, Control)  
✅ **JWT Authentication** - Secure token-based auth  
✅ **Real-Time Updates** - WebSocket for live coordination  
✅ **Spatial Queries** - Find nearest ambulances/hospitals using Haversine formula  
✅ **Emergency Lifecycle** - Complete tracking from SOS to completion  
✅ **Green Corridor** - Traffic police coordination  
✅ **Auto Resource Allocation** - Intelligent ambulance/hospital assignment  
✅ **RESTful APIs** - Clean, documented endpoints  

## Example API Calls

### 1. Create Emergency (Citizen)
```bash
curl -X POST http://localhost:8080/api/emergency/create \
  -H "Content-Type: application/json" \
  -d '{
    "citizenId": "guest",
    "latitude": 12.9716,
    "longitude": 77.5946,
    "address": "Bangalore, India",
    "severity": "HIGH"
  }'
```

### 2. Find Nearest Ambulances
```bash
curl "http://localhost:8080/api/ambulance/nearest?latitude=12.9716&longitude=77.5946&radius=10"
```

### 3. Update Ambulance Location
```bash
curl -X PUT http://localhost:8080/api/ambulance/{ambulanceId}/location \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 12.9800,
    "longitude": 77.6000
  }'
```

## WebSocket Usage (JavaScript)

```javascript
// Connect to WebSocket
const socket = new SockJS('http://localhost:8080/ws');
const stompClient = Stomp.over(socket);

stompClient.connect({}, function(frame) {
    console.log('Connected: ' + frame);
    
    // Subscribe to emergencies
    stompClient.subscribe('/topic/emergencies', function(message) {
        const emergency = JSON.parse(message.body);
        console.log('New Emergency:', emergency);
    });
    
    // Subscribe to ambulance location updates
    stompClient.subscribe('/topic/ambulance/' + ambulanceId + '/location', function(message) {
        const location = JSON.parse(message.body);
        console.log('Ambulance moved:', location);
    });
});

// Send location update
function sendLocation(latitude, longitude) {
    stompClient.send('/app/location/ambulance', {}, JSON.stringify({
        latitude: latitude,
        longitude: longitude
    }));
}
```

## Development Notes

- **Port**: Backend runs on port 8080
- **CORS**: Enabled for all origins (configure for production)
- **Session**: Stateless (JWT-based)
- **Database**: Auto-creates schema on startup
- **Logging**: Check console for startup info

## Troubleshooting

### Port 8080 already in use
```bash
# Windows
netstat -ano | findstr :8080
taskkill /F /PID <PID>

# Change port in application.properties
server.port=8081
```

### MySQL Connection Failed
- Verify MySQL is running: `mysql -u root -p`
- Check credentials in application.properties
- Ensure database `ero_db` exists

### Build Failed
```bash
# Clean and rebuild
mvn clean install -U
```

## Next Steps

1. **Run Backend**: `mvn spring-boot:run`
2. **Test APIs**: Use Postman or curl
3. **Connect Frontend**: Update API URLs in JavaScript
4. **Add WebSocket**: Integrate SockJS + STOMP in frontend
5. **Deploy**: Package as JAR with `mvn package`

---

**Backend Ready!** 🚀 Connect your frontend to start the real-time emergency coordination system.
