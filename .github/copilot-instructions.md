# Zawiyah2025 - School Classroom Reservation System

## Project Overview
**Zawiyah2025** (زاوية) is a real-time school classroom reservation system designed for synchronized booking across multiple devices. The system manages classroom reservations with live updates to ensure all users see bookings instantly.

## Architecture & Tech Stack
- **Frontend**: React/Next.js with Socket.IO client for real-time sync
- **Backend**: Node.js/Express with Socket.IO server for real-time communication
- **Database**: MongoDB/PostgreSQL for reservation data
- **Real-time**: WebSocket connections for instant booking updates
- **Language Support**: Arabic (RTL) primary interface

## Key Features & Business Logic

### Core Pages Structure
1. **الصفحة الرئيسية (Home)**: Welcome page with quick stats (today's bookings, most booked rooms)
2. **صفحة الحجوزات (Reservations)**: Room selection with booking grid showing time slots
3. **صفحة القاعات (Rooms)**: Room management and statistics dashboard

### School Schedule System
- **Time Slots**: 8 academic periods + assembly time + activity period
- **School Days**: Sunday to Thursday (Arabic week)
- **Date Display**: Each day shows full date when clicked
- **Booking Form**: Teacher fills reservation details when clicking any time slot

### Classroom Structure
```
- القاعة الذكية (Smart Classroom)
- ساحة الطابور القديم (Old Assembly Area)  
- Grade 5-10: Each grade has 3 sections (شعبة)
- Grade 11-12: Each grade has 6 sections (شعبة)
```

## Development Patterns

### Real-time Synchronization
```javascript
// Socket events for instant updates
socket.on('booking-created', handleNewBooking);
socket.on('booking-cancelled', handleCancelBooking);
socket.emit('create-booking', bookingData);
```

### Arabic-first Development
- Use Arabic property names in data models where appropriate
- RTL layout considerations in CSS
- Arabic date formatting and display
- Teacher names and subjects in Arabic

### Data Models
```javascript
// Core entities
Classroom { id, name_ar, type, capacity, grade, section }
Booking { id, classroom_id, teacher_name, subject, date, time_slot, notes }
TimeSlot { id, name_ar, start_time, end_time, type } // academic/assembly/activity
```

## Critical Workflows

### Booking Creation Flow
1. Select classroom from صفحة القاعات
2. View availability grid in صفحة الحجوزات  
3. Click available time slot
4. Fill teacher booking form (معلم، مادة، ملاحظات)
5. Real-time broadcast to all connected clients

### Statistics Generation
- **Daily bookings count**: Count today's active reservations
- **Most booked rooms**: Aggregate booking frequency by classroom
- **Teacher booking stats**: Track most active teachers
- **Subject popularity**: Track most reserved subjects by subject type

## File Organization
```
src/
├── components/
│   ├── layout/          # Navigation, RTL layout
│   ├── booking/         # Booking grid, forms
│   └── rooms/          # Classroom components
├── pages/
│   ├── index.js        # الصفحة الرئيسية
│   ├── bookings.js     # صفحة الحجوزات  
│   └── rooms.js        # صفحة القاعات
├── services/
│   ├── socket.js       # Real-time connection
│   └── api.js          # HTTP requests
└── utils/
    ├── dateHelpers.js  # Arabic date formatting
    └── validation.js   # Form validation
```

## AI Agent Guidelines
When working on this project:
1. **Prioritize real-time sync** - Every booking action needs Socket.IO events
2. **Arabic-first approach** - UI text, data display, and user flow in Arabic
3. **School context awareness** - Understand academic periods, grade structure
4. **Multi-device consistency** - Test booking conflicts and race conditions
5. **Statistics accuracy** - Ensure aggregation queries perform well with school data volume