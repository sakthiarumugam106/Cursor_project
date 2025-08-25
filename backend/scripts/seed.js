const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { sequelize } = require('../config/database');
const User = require('../models/User');
const Session = require('../models/Session');
const Payment = require('../models/Payment');
const Attendance = require('../models/Attendance');
const Notification = require('../models/Notification');

// Seed data
const seedData = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Create users
    const users = await createUsers();
    console.log(`✅ Created ${users.length} users`);

    // Create sessions
    const sessions = await createSessions(users);
    console.log(`✅ Created ${sessions.length} sessions`);

    // Create payments
    const payments = await createPayments(users, sessions);
    console.log(`✅ Created ${payments.length} payments`);

    // Create attendance records
    const attendance = await createAttendance(users, sessions);
    console.log(`✅ Created ${attendance.length} attendance records`);

    // Create notifications
    const notifications = await createNotifications(users);
    console.log(`✅ Created ${notifications.length} notifications`);

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📱 Demo Accounts:');
    console.log('Student: student@std.com / password123');
    console.log('Tutor: tutor@tut.com / password123');
    console.log('Admin: admin@adm.com / password123');
    console.log('Super Admin: superadmin@adm.com / password123');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

// Create users
const createUsers = async () => {
  const users = [
    // Super Admin
    {
      id: uuidv4(),
      email: 'superadmin@adm.com',
      password: 'password123',
      firstName: 'Super',
      lastName: 'Admin',
      phone: '+1234567890',
      role: 'super_admin',
      status: 'active'
    },
    // Admin
    {
      id: uuidv4(),
      email: 'admin@adm.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Admin',
      phone: '+1234567891',
      role: 'admin',
      status: 'active'
    },
    // Tutors
    {
      id: uuidv4(),
      email: 'tutor@tut.com',
      password: 'password123',
      firstName: 'Sarah',
      lastName: 'Johnson',
      phone: '+1234567892',
      role: 'tutor',
      status: 'active'
    },
    {
      id: uuidv4(),
      email: 'tutor2@tut.com',
      password: 'password123',
      firstName: 'Michael',
      lastName: 'Chen',
      phone: '+1234567893',
      role: 'tutor',
      status: 'active'
    },
    {
      id: uuidv4(),
      email: 'tutor3@tut.com',
      password: 'password123',
      firstName: 'Emily',
      lastName: 'Davis',
      phone: '+1234567894',
      role: 'tutor',
      status: 'active'
    },
    // Students
    {
      id: uuidv4(),
      email: 'student@std.com',
      password: 'password123',
      firstName: 'Alex',
      lastName: 'Smith',
      phone: '+1234567895',
      role: 'student',
      status: 'active'
    },
    {
      id: uuidv4(),
      email: 'student2@std.com',
      password: 'password123',
      firstName: 'Maria',
      lastName: 'Garcia',
      phone: '+1234567896',
      role: 'student',
      status: 'active'
    },
    {
      id: uuidv4(),
      email: 'student3@std.com',
      password: 'password123',
      firstName: 'David',
      lastName: 'Wilson',
      phone: '+1234567897',
      role: 'student',
      status: 'active'
    },
    {
      id: uuidv4(),
      email: 'student4@std.com',
      password: 'password123',
      firstName: 'Lisa',
      lastName: 'Brown',
      phone: '+1234567898',
      role: 'student',
      status: 'active'
    },
    {
      id: uuidv4(),
      email: 'student5@std.com',
      password: 'password123',
      firstName: 'James',
      lastName: 'Taylor',
      phone: '+1234567899',
      role: 'student',
      status: 'active'
    }
  ];

  const createdUsers = [];
  for (const userData of users) {
    const user = await User.create(userData);
    createdUsers.push(user);
  }

  return createdUsers;
};

// Create sessions
const createSessions = async (users) => {
  const tutors = users.filter(u => u.role === 'tutor');
  const students = users.filter(u => u.role === 'student');

  const sessions = [
    {
      id: uuidv4(),
      title: 'Introduction to Mathematics',
      description: 'Basic concepts of algebra and arithmetic',
      topic: 'Mathematics Fundamentals',
      startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000), // Tomorrow + 1 hour
      duration: 60,
      status: 'scheduled',
      sessionType: 'one_on_one',
      maxStudents: 1,
      currentStudents: 1,
      price: 50.00,
      currency: 'USD',
      tutorId: tutors[0].id
    },
    {
      id: uuidv4(),
      title: 'Advanced Physics Workshop',
      description: 'Deep dive into quantum mechanics',
      topic: 'Quantum Physics',
      startTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Day after tomorrow
      endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000), // + 1.5 hours
      duration: 90,
      status: 'scheduled',
      sessionType: 'group',
      maxStudents: 5,
      currentStudents: 3,
      price: 75.00,
      currency: 'USD',
      tutorId: tutors[1].id
    },
    {
      id: uuidv4(),
      title: 'English Literature Analysis',
      description: 'Shakespeare and classical literature',
      topic: 'Classical Literature',
      startTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 120 * 60 * 1000), // + 2 hours
      duration: 120,
      status: 'scheduled',
      sessionType: 'workshop',
      maxStudents: 8,
      currentStudents: 6,
      price: 60.00,
      currency: 'USD',
      tutorId: tutors[2].id
    },
    {
      id: uuidv4(),
      title: 'Computer Science Basics',
      description: 'Programming fundamentals and algorithms',
      topic: 'Computer Science',
      startTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next week
      endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 75 * 60 * 1000), // + 1.25 hours
      duration: 75,
      status: 'scheduled',
      sessionType: 'group',
      maxStudents: 6,
      currentStudents: 4,
      price: 65.00,
      currency: 'USD',
      tutorId: tutors[0].id
    },
    {
      id: uuidv4(),
      title: 'Chemistry Lab Session',
      description: 'Hands-on chemistry experiments',
      topic: 'Chemistry',
      startTime: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
      endTime: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000 + 150 * 60 * 1000), // + 2.5 hours
      duration: 150,
      status: 'scheduled',
      sessionType: 'workshop',
      maxStudents: 12,
      currentStudents: 8,
      price: 80.00,
      currency: 'USD',
      tutorId: tutors[1].id
    }
  ];

  const createdSessions = [];
  for (const sessionData of sessions) {
    const session = await Session.create(sessionData);
    createdSessions.push(session);
  }

  return createdSessions;
};

// Create payments
const createPayments = async (users, sessions) => {
  const students = users.filter(u => u.role === 'student');
  const payments = [];

  // Create payments for each student
  for (const student of students) {
    // Random payment for a session
    const randomSession = sessions[Math.floor(Math.random() * sessions.length)];
    
    const payment = await Payment.create({
      id: uuidv4(),
      studentId: student.id,
      sessionId: randomSession.id,
      amount: randomSession.price,
      currency: randomSession.currency,
      paymentMethod: process.env.ENVIRONMENT === 'dev' ? 'dev_mode' : 'credit_card',
      status: process.env.ENVIRONMENT === 'dev' ? 'completed' : 'pending',
      description: `Payment for ${randomSession.title}`,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      environment: process.env.ENVIRONMENT || 'dev'
    });

    payments.push(payment);

    // Create additional random payments
    const additionalPayments = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < additionalPayments; i++) {
      const randomAmount = Math.floor(Math.random() * 100) + 20;
      const randomStatus = process.env.ENVIRONMENT === 'dev' ? 'completed' : 
        ['pending', 'completed', 'failed'][Math.floor(Math.random() * 3)];

      const additionalPayment = await Payment.create({
        id: uuidv4(),
        studentId: student.id,
        amount: randomAmount,
        currency: 'USD',
        paymentMethod: process.env.ENVIRONMENT === 'dev' ? 'dev_mode' : 'credit_card',
        status: randomStatus,
        description: `Additional payment ${i + 1}`,
        dueDate: new Date(Date.now() + (Math.floor(Math.random() * 60) + 7) * 24 * 60 * 60 * 1000),
        environment: process.env.ENVIRONMENT || 'dev'
      });

      payments.push(additionalPayment);
    }
  }

  return payments;
};

// Create attendance records
const createAttendance = async (users, sessions) => {
  const students = users.filter(u => u.role === 'student');
  const attendance = [];

  for (const session of sessions) {
    // Randomly assign students to sessions
    const sessionStudents = students.slice(0, Math.floor(Math.random() * students.length) + 1);
    
    for (const student of sessionStudents) {
      const statuses = ['present', 'absent', 'late', 'excused'];
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
      
      const attendanceRecord = await Attendance.create({
        id: uuidv4(),
        sessionId: session.id,
        studentId: student.id,
        status: randomStatus,
        checkInTime: randomStatus === 'present' || randomStatus === 'late' ? new Date() : null,
        checkOutTime: randomStatus === 'present' ? new Date(Date.now() + 60 * 60 * 1000) : null,
        duration: randomStatus === 'present' ? 60 : null,
        markedBy: users.find(u => u.role === 'tutor').id,
        markedAt: new Date()
      });

      attendance.push(attendanceRecord);
    }
  }

  return attendance;
};

// Create notifications
const createNotifications = async (users) => {
  const notifications = [];

  for (const user of users) {
    // Create 2-5 notifications per user
    const notificationCount = Math.floor(Math.random() * 4) + 2;
    
    for (let i = 0; i < notificationCount; i++) {
      const types = ['info', 'success', 'warning', 'session', 'payment'];
      const randomType = types[Math.floor(Math.random() * types.length)];
      
      const notification = await Notification.create({
        id: uuidv4(),
        userId: user.id,
        title: `Notification ${i + 1}`,
        message: `This is a ${randomType} notification for ${user.firstName}`,
        type: randomType,
        isRead: Math.random() > 0.5,
        actionUrl: '/dashboard',
        metadata: { priority: 'normal' }
      });

      notifications.push(notification);
    }
  }

  return notifications;
};

// Main execution
if (require.main === module) {
  seedData()
    .then(() => {
      console.log('✅ Seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedData };