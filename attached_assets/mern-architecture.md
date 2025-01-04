# Express.js + React LMS Architecture with PostgreSQL

## 1. Project Structure

### Backend (Express.js)
```
backend/
├── src/
│   ├── config/
│   │   ├── database.js      # PostgreSQL configuration
│   │   ├── auth.js
│   │   └── mail.js
│   ├── db/
│   │   ├── migrations/      # PostgreSQL migrations
│   │   ├── seeds/          # Database seeders
│   │   └── queries/        # SQL queries
│   ├── models/
│   │   ├── User.js
│   │   ├── Subject.js
│   │   ├── Class.js
│   │   └── Session.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── classController.js
│   │   └── sessionController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── roleCheck.js
│   │   └── validation.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── class.js
│   │   └── session.js
│   ├── services/
│   │   ├── googleMeet.js
│   │   ├── payment.js
│   │   └── notification.js
│   └── utils/
       ├── validation.js
       └── helpers.js
├── tests/
└── package.json
```

### Frontend (React)
```
frontend/
├── src/
│   ├── components/
│   │   ├── common/
│   │   ├── dashboard/
│   │   └── forms/
│   ├── pages/
│   │   ├── admin/
│   │   ├── teacher/
│   │   └── student/
│   ├── services/
│   │   ├── api.js
│   │   └── auth.js
│   ├── hooks/
│   ├── context/
│   └── utils/
│       └── schemas/        # Zod schemas
├── public/
└── package.json
```

## 2. Essential Packages

### Backend Packages
- **Core**:
  - `express`
  - `pg` (node-postgres)
  - `knex` (query builder)
  - `cors`
  - `dotenv`
  - `helmet`

- **Database**:
  - `postgres` (PostgreSQL driver)
  - `knex` (for migrations and seeds)
  - `pg-promise` (optional, for complex queries)

- **Authentication & Security**:
  - `jsonwebtoken`
  - `bcryptjs`
  - `express-rate-limit`
  - `express-validator`

- **File Handling**:
  - `multer`
  - `@digitalocean/spaces` (for DigitalOcean Spaces)

- **Real-time**:
  - `socket.io`

- **Utilities**:
  - `moment-timezone`
  - `nodemailer`
  - `winston` (logging)
  - `zod` (validation)

### Frontend Packages
- **Core**:
  - `react-router-dom`
  - `@tanstack/react-query`
  - `axios`

- **State Management**:
  - `zustand` (lightweight and efficient)

- **UI Components**:
  - `@chakra-ui/react`
  - `@fullcalendar/react`
  - `react-big-calendar`

- **Forms & Validation**:
  - `react-hook-form`
  - `zod` (chosen for type safety and integration)
  - `@hookform/resolvers/zod`

- **Data Display**:
  - `@tanstack/react-table`
  - `recharts`

## 3. Database Setup

### 3.1 PostgreSQL Schema
```sql
-- Example of core tables
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sessions (
    id SERIAL PRIMARY KEY,
    class_id INTEGER REFERENCES classes(id),
    start_time TIMESTAMP NOT NULL,
    duration INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'scheduled',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3.2 Knex Migrations
```javascript
// migrations/20240105_create_users.js
exports.up = function(knex) {
  return knex.schema.createTable('users', table => {
    table.increments('id');
    table.string('email').notNullable().unique();
    table.string('password_hash').notNullable();
    table.string('role').notNullable();
    table.timestamps(true, true);
  });
};
```

## 4. Form Validation with Zod

### 4.1 Schema Definition
```typescript
// frontend/src/utils/schemas/sessionSchema.ts
import { z } from 'zod';

export const sessionSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  startTime: z.date(),
  duration: z.number().min(30).max(180),
  students: z.array(z.number()).min(1, 'Select at least one student'),
  teacherId: z.number(),
  notes: z.string().optional()
});

type SessionFormData = z.infer<typeof sessionSchema>;
```

### 4.2 Form Implementation
```typescript
// frontend/src/components/forms/SessionForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { sessionSchema } from '@/utils/schemas/sessionSchema';

export const SessionForm = () => {
  const { 
    register, 
    handleSubmit, 
    formState: { errors } 
  } = useForm({
    resolver: zodResolver(sessionSchema)
  });

  const onSubmit = (data: SessionFormData) => {
    // Handle form submission
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Form fields */}
    </form>
  );
};
```

## 5. DigitalOcean Deployment

### 5.1 Infrastructure Setup
- Use Docker for containerization
- Deploy to DigitalOcean Droplets
- Use DigitalOcean Managed Database for PostgreSQL
- Use DigitalOcean Spaces for file storage
- Configure Nginx as reverse proxy

### 5.2 Deployment Configuration
```yaml
# docker-compose.yml
version: '3.8'
services:
  backend:
    build: ./backend
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - DO_SPACES_KEY=${DO_SPACES_KEY}
      - DO_SPACES_SECRET=${DO_SPACES_SECRET}
    ports:
      - "3000:3000"

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend
```

### 5.3 Nginx Configuration
```nginx
# nginx.conf
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://frontend;
    }

    location /api {
        proxy_pass http://backend:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
    }
}
```

## 6. Performance Optimizations

### 6.1 Database
- Implement proper indexing
- Use connection pooling
- Implement query caching
- Use prepared statements
- Regular VACUUM and maintenance

### 6.2 Application
- Implement Redis caching
- Use proper connection pooling
- Implement request rate limiting
- Use compression middleware
- Implement proper error handling

## 7. Security Considerations

1. **Database Security**
   - Use connection pooling
   - Implement proper backup strategy
   - Use SSL for database connections
   - Regular security updates

2. **Application Security**
   - Implement rate limiting
   - Use security headers
   - Validate all inputs
   - Implement proper logging
   - Regular security audits

## 8. Monitoring and Maintenance

1. **Monitoring**
   - Use DigitalOcean Monitoring
   - Implement proper logging
   - Set up error tracking (Sentry)
   - Monitor database performance

2. **Backup Strategy**
   - Regular database backups
   - DigitalOcean Spaces backups
   - System state backups
   - Automated backup testing

This architecture provides a robust foundation for the LMS system, leveraging PostgreSQL's relational capabilities and DigitalOcean's reliable infrastructure while using Zod for type-safe form validation.