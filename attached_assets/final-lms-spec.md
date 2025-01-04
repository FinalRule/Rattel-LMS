# Complete LMS Web Application Specification

## 1. System Overview

### 1.1 Purpose
A comprehensive Learning Management System (LMS) web application primarily focused on **one-to-one sessions** with built-in flexibility for future group classes expansion. The system will provide end-to-end management of educational operations including scheduling, attendance tracking, financial management, and online lesson delivery.

### 1.2 Core Features
- **Advanced Scheduling System** with timezone support
- **Comprehensive Attendance Tracking**
- **Multi-currency Financial Management** 
- **Integrated Online Learning** via Google Meet
- **Resource Management and Sharing**
- **Progress Tracking and Reporting**
- **Multi-role Access** (Admin, Teacher, Student)

---

## 2. Entity Specifications

### 2.1 Subject
#### Basic Information
- **ID** (PK)
- **Name**
- **Details** (description, objectives)
- **Category** (subject grouping)
- **Difficulty Level** (beginner, intermediate, advanced)
- **Available Durations** (JSON array: 30min, 60min, etc.)
- **Number of Sessions per Month**
- **Prerequisites** (JSON array of subject IDs)
- **Default Buffer Time** (minutes between sessions)

#### Management Fields
- **Active** (boolean)
- **created_at**
- **updated_at**
- **deleted_at** (for soft delete)

#### Relationships
- Has many PricePlans
- Has many Classes
- Can be taught by many Teachers
- Has many Resources

---

### 2.2 Teacher
#### Personal Information
- **ID** (PK)
- **Full Name**
- **Bio**
- **Gender**
- **Date of Birth**
- **Profile Picture**
- **CV File**

#### Contact Information
- **Residence City**
- **Phone**
- **Email**
- **WhatsApp**
- **Emergency Contact** (JSON)

#### Professional Details
- **Subjects** (can teach)
- **Specializations** (JSON array)
- **Teaching Experience**
- **Certifications**
- **Rating** (calculated from feedback)
- **Max Daily Sessions**

#### Preferences
- **Time Zone**
- **Availability Schedule** (JSON - recurring weekly schedule)
- **Buffer Time Preference**
- **Preferred Notification Method**
- **Video Conference Preferences**
- **Currency Preference**

#### Financial Information
- **Payment Method** (bank details, digital wallets)
- **Base Salary per Hour**
- **Tax Information**

#### System Fields
- **Google Account** (for Meet integration)
- **Active Status**
- **Notes**
- **created_at/updated_at/deleted_at**

---

### 2.3 Student
#### Personal Information
- **ID** (PK)
- **Full Name**
- **Date of Birth**
- **Gender**
- **Profile Picture**
- **Nationality**
- **Country of Residence**

#### Contact Information
- **Phone**
- **Email**
- **WhatsApp**
- **Parent Name** (if applicable)
- **Emergency Contact**

#### Learning Details
- **Time Zone**
- **Enrolled Subjects**
- **Learning Goals**
- **Preferred Learning Style**
- **Progress Metrics** (JSON)
- **Preferred Session Days/Times**

#### Financial Information
- **Payment Method**
- **Currency Preference**
- **Promotional Credits**
- **Default Price Plan**
- **Tax Information**

#### System Fields
- **Active Status**
- **Referral Source**
- **Notes** (general and teacher-specific)
- **created_at/updated_at/deleted_at**

---

### 2.4 Class
#### Basic Information
- **ID** (PK)
- **Subject** (FK)
- **Teacher** (FK)
- **Student(s)** (FK - supporting multiple for future group classes)
- **Name/Identifier**

#### Schedule Information
- **Start Date**
- **Default Duration**
- **Week Days**
- **Times per Weekday**
- **Buffer Time**
- **Recurring Pattern** (JSON)
- **Next Session Date**

#### Progress Tracking
- **Total Sessions Completed**
- **Average Attendance Rate**
- **Materials** (relationship to Resources)
- **Progress Metrics** (JSON)

#### Financial Details
- **Monthly Price**
- **Currency**
- **Teacher Salary Rate**
- **Discount Code Applied**
- **Cancellation Policy** (JSON)

#### System Fields
- **Status** (active, paused, completed, cancelled)
- **created_at/updated_at/deleted_at**

---

### 2.5 Session
#### Basic Information
- **ID** (PK)
- **Class** (FK)
- **Date and Time**
- **Planned Duration**
- **Actual Duration**
- **Buffer Time** (before/after)

#### Attendance
- **Student Attendance** (present, absent, late)
- **Teacher Attendance**
- **Status** (scheduled, in-progress, completed, cancelled, rescheduled)
- **Cancellation Reason**
- **Rescheduled From** (session_id)

#### Content
- **Google Meet Link**
- **Materials Used** (relationship to Resources)
- **Recording URL**
- **Student Points** (0-10)
- **Teacher Notes**
- **Student Notes**
- **Technical Issues** (JSON)

#### System Fields
- **Makeup Session** (boolean)
- **Reminder Sent**
- **Feedback Submitted**
- **created_at/updated_at/deleted_at**

---

### 2.6 PricePlan
#### Basic Information
- **ID** (PK)
- **Subject** (FK)
- **Plan Name**
- **Duration per Session**
- **Sessions per Month**

#### Financial Details
- **Monthly Fee**
- **Currency**
- **Promotional Price**
- **Promotion Valid Until**
- **Minimum Commitment** (months)
- **Trial Eligible**
- **Bulk Discount Rules** (JSON)
- **Seasonal Adjustments** (JSON)
- **Refund Policy** (JSON)

#### System Fields
- **Active Status**
- **created_at/updated_at/deleted_at**

---

### 2.7 Payment
#### Transaction Details
- **ID** (PK)
- **User ID** (FK)
- **Role** (student/teacher)
- **Amount**
- **Currency**
- **Exchange Rate**
- **Transaction Fee**
- **Type** (payment/payout)

#### Processing Information
- **Payment Method**
- **Payment Processor**
- **Status** (pending, completed, failed, refunded)
- **Transaction Reference**
- **Invoice Number**
- **Receipt URL**

#### Additional Information
- **Month/Year** (for reporting)
- **Promotional Discount**
- **Tax Information** (JSON)
- **Refund Status**
- **Payment Schedule** (for installments)
- **Notes**

#### System Fields
- **created_at/updated_at/deleted_at**

---

### 2.8 Resource
#### Basic Information
- **ID** (PK)
- **Title**
- **Type** (document, video, link)
- **Content** (file/URL)
- **Description**

#### Ownership & Access
- **Owner** (teacher_id)
- **Subject** (FK)
- **Shared With** (JSON array of class_ids)
- **Access Level** (public, private, shared)

#### Technical Details
- **Version**
- **File Size**
- **Format**
- **Download Count**
- **Last Accessed**

#### System Fields
- **Status** (active/archived)
- **created_at/updated_at/deleted_at**

---

### 2.9 Notification
#### Basic Information
- **ID** (PK)
- **User ID** (FK)
- **User Type** (teacher/student/admin)
- **Type** (session_reminder, payment_due, etc.)
- **Content**
- **Priority Level**

#### Delivery Information
- **Delivery Method** (email/SMS/in-app)
- **Status**
- **Scheduled For**
- **Sent At**
- **Read At**
- **Error Log**

#### System Fields
- **created_at/updated_at**

---

### 2.10 AuditLog
#### Event Information
- **ID** (PK)
- **User ID** (FK)
- **User Type**
- **Action** (create/update/delete)
- **Entity Type**
- **Entity ID**
- **Old Values** (JSON)
- **New Values** (JSON)

#### Technical Details
- **IP Address**
- **User Agent**
- **Timestamp**

---

## 3. Dashboard Specifications

### 3.1 Admin Dashboard

#### 1. Subject Management
- **Create Subject**
  - Basic information entry (name, details, durations)
  - Price plan configuration
  - Teacher assignments
- **Edit Subject**
  - Modal-based editing interface
  - Real-time updates
- **Delete Subject**
  - Soft delete with activity preservation
- **Subject Listing**
  - Interactive list with clickable entries
  - Detailed view in modal
  - Automatic teacher association updates
- **Resource Management**
  - Teaching materials organization
  - Content library

#### 2. Teacher Management
- **Add Teacher**
  - Comprehensive profile creation
  - Subject teaching capability assignment
  - Automatic subject-teacher linking
- **Edit Teacher**
  - Modal-based profile editing
  - Real-time updates
- **Teacher Listing**
  - Interactive list with clickable entries
  - Detailed profile view
- **Financial Management**
  - Real-time dues calculation
  - Historical payout tracking
  - Payout processing with:
    - Date and time
    - Month and year (for reporting)
    - Payment method
    - Reference number
    - Contact information
- **Class Management**
  - Active classes overview
  - Historical class records
  - Student relationship tracking
- **Performance Tracking**
  - Teaching hours
  - Student feedback
  - Attendance records

#### 3. Student Management
- **Add Student**
  - Complete profile creation
  - Subject enrollment
  - Price plan assignment
- **Edit Student**
  - Modal-based profile editing
  - Real-time updates
- **Student Listing**
  - Interactive list with clickable entries
  - Detailed profile view
- **Financial Management**
  - Real-time dues calculation
  - Payment history tracking
  - Payment processing with:
    - Date and time
    - Month and year (for reporting)
    - Payment method
    - Reference number
    - Contact information
- **Class Management**
  - Active class enrollment
  - Historical class records
  - Teacher relationship tracking
- **Progress Tracking**
  - Attendance records
  - Performance metrics
  - Teacher feedback

#### 4. Class Management
- **Class Creation**
  - Basic information setup:
    - Teacher assignment
    - Student enrollment
    - Subject selection
    - Duration setting
    - Schedule configuration
    - Salary and pricing setup
  - Automatic session generation with:
    - Unique session IDs
    - Sequential numbering
    - Participant information
    - Schedule details
    - Google Meet integration
    - Attendance tracking
    - Note-taking capability
    - Performance scoring
    - Financial calculations:
      - Teacher salary (with attendance rules)
      - Student pricing
- **Class Editing**
  - Modal-based modification
  - Schedule adjustments
  - Pricing updates
- **Class Listing**
  - Interactive list
  - Detailed class view
  - Session history
  - Financial tracking

#### 5. Session Management
- **Automated Generation**
  - Google Meet link creation
  - Schedule management
  - Attendance tracking
- **Financial Tracking**
  - Teacher salary calculation:
    - Full pay for complete attendance
    - Half pay for student absence
    - No pay for teacher absence
  - Student payment tracking
- **Performance Monitoring**
  - Attendance records
  - Student scoring
  - Teacher feedback
  - Student notes

#### 6. Financial Operations
- **Payment Processing**
  - Student payment handling
  - Teacher salary disbursement
  - Multi-currency support
- **Invoice Management**
  - Automated generation
  - Payment tracking
  - Historical records
- **Financial Reporting**
  - Revenue analysis
  - Salary expenditure
  - Outstanding dues
  - Transaction history

#### 7. System Configuration
- **User Management**
  - Role assignments
  - Permission control
  - Access monitoring
- **Integration Settings**
  - Google Meet configuration
  - Payment gateway setup
  - Notification system
- **System Monitoring**
  - Performance tracking
  - Error logging
  - Usage analytics

#### 8. Reporting and Analytics
- **Financial Reports**
  - Revenue tracking
  - Salary disbursement
  - Payment history
- **Attendance Reports**
  - Student participation
  - Teacher attendance
  - Session completion
- **Performance Metrics**
  - Student progress
  - Teacher effectiveness
  - System usage
- **Custom Reports**
  - Configurable parameters
  - Export capabilities
  - Scheduled reporting

---

### 3.2 Teacher Dashboard

#### Main Features
1. **Schedule Management**
   - Calendar view
   - Availability settings
   - Session tracking
   - Buffer management

2. **Class Management**
   - Student profiles
   - Attendance tracking
   - Progress monitoring
   - Resource sharing

3. **Resource Center**
   - Material upload
   - Content organization
   - Resource sharing
   - Template management

4. **Financial Center**
   - Earnings overview
   - Payment history
   - Tax documents
   - Banking details

5. **Communication Hub**
   - Student messaging
   - Session notes
   - Announcements
   - Feedback management

---

### 3.3 Student Dashboard

#### Core Features
1. **Learning Center**
   - Class schedule
   - Resource access
   - Progress tracking
   - Session history

2. **Session Management**
   - Upcoming sessions
   - Past sessions
   - Rescheduling requests
   - Attendance record

3. **Financial Center**
   - Payment history
   - Upcoming payments
   - Invoices
   - Payment methods

4. **Progress Tracking**
   - Achievement overview
   - Skill progression
   - Attendance statistics
   - Teacher feedback

---

## 4. Technical Implementation

### 4.1 Technology Stack
- **Backend**: PHP (Laravel/Symfony)
- **Frontend**: React/Vue.js
- **Database**: PostgreSQL
- **Caching**: Redis
- **Search**: Elasticsearch
- **Queue**: RabbitMQ
- **Storage**: AWS S3/similar

### 4.2 Security Implementation
- Role-based access control (RBAC)
- Two-factor authentication
- Data encryption at rest
- HTTPS enforcement
- API key management
- Regular security audits
- GDPR compliance features

### 4.3 Integration Architecture
- RESTful API with versioning
- GraphQL for complex queries
- Message queue system
- Webhook system
- OAuth2 implementation
- Payment gateway integration

### 4.4 Performance Optimization
- CDN implementation
- Database optimization
- Caching strategy
- Background job processing
- Query optimization
- Load balancing

### 4.5 Monitoring & Logging
- Error tracking
- Performance monitoring
- User activity logging
- System health checks
- Automated alerts
- Audit trail maintenance

---

## 5. Development & Deployment

### 5.1 Infrastructure
- Container orchestration (Kubernetes)
- CI/CD pipeline
- Automated testing
- Backup strategy
- Disaster recovery
- High availability setup

### 5.2 Scalability Considerations
- Horizontal scaling
- Database replication
- Caching layers
- Load distribution
- Resource optimization

### 5.3 Maintenance
- Regular backups
- System updates
- Performance optimization
- Security patches
- Data archiving

---

## 6. Future Considerations

### 6.1 Feature Expansion
- Mobile applications
- Virtual classroom features
- AI-powered scheduling
- Advanced analytics
- Integrated assessment tools

### 6.2 Integration Opportunities
- Additional payment gateways
- CRM systems
- Analytics platforms
- Email marketing tools
- Social media integration

### 6.3 Market Expansion
- Multi-language support
- Regional pricing
- Cultural customization
- Local payment methods
- Regulatory compliance

---

## 7. Conclusion

This comprehensive specification provides a complete foundation for building a robust, scalable, and feature-rich LMS platform. Key strengths include:

1. **Flexible Architecture**: Supporting both one-to-one and future group sessions
2. **Comprehensive Financial Management**: Multi-currency support with advanced payment features
3. **Robust Security**: Industry-standard security implementations
4. **Scalable Infrastructure**: Ready for growth and expansion
5. **User-Centric Design**: Tailored dashboards for each user type
6. **Future-Ready**: Extensible design for additional features and integrations

The system is designed to be maintainable, secure, and capable of growing with the business needs while providing an excellent experience for administrators, teachers, and students alike.