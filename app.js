// File: app.js
import AdminJS from 'adminjs';
import AdminJSExpress from '@adminjs/express';
import express from 'express';
import Connect from 'connect-pg-simple';
import session from 'express-session';
import sequelize from './database.js'; // Import Sequelize instance
import defineUserModel from './models/User.js';
import { Database, Resource } from '@adminjs/sequelize';

const PORT = 3000;

const DEFAULT_ADMIN = {
  email: 'admin@example.com',
  password: 'password',
};

AdminJS.registerAdapter({ Database, Resource });

// Define User model
const User = defineUserModel(sequelize);

// Authentication function
const authenticate = async (email, password) => {
  if (email === 'admin@example.com' && password === 'password') {
    return Promise.resolve(DEFAULT_ADMIN);
  }
  return null;
};

// Start function
const start = async () => {
  const app = express();

  // Define User resource directly in the app.js file
  const userResource = {
    resource: User,
    options: {
      properties: {
        id: { isVisible: { list: false, filter: false, show: true, edit: false } },
        createdAt: { isVisible: { list: false, filter: false, show: true, edit: false } },
        updatedAt: { isVisible: { list: false, filter: false, show: true, edit: false } },
        name: { 
            isVisible: { list: true, filter: true, show: true, edit: true }, // Set visibility for name field
            type: 'string' // Define type of the field
          },
          email: { 
            isVisible: { list: true, filter: true, show: true, edit: true }, // Set visibility for email field
            type: 'string' // Define type of the field
          },
      },
    },
  };

  const admin = new AdminJS({
    // Pass resources here
    resources: [userResource],
  });

  const ConnectSession = Connect(session);
  const sessionStore = new ConnectSession({
    conObject: {
      connectionString: 'postgresql://postgres:Tirtha@4321@localhost:5432/adminJS',
    },
    tableName: 'session',
    createTableIfMissing: true,
  });

  const adminRouter = AdminJSExpress.buildAuthenticatedRouter(
    admin,
    {
      authenticate,
      cookieName: 'adminjs',
      cookiePassword: 'sessionsecret',
    },
    null,
    {
      store: sessionStore,
      resave: true,
      saveUninitialized: true,
      secret: 'sessionsecret',
      cookie: {
        httpOnly: process.env.NODE_ENV === 'production',
        secure: process.env.NODE_ENV === 'production',
      },
      name: 'adminjs',
    }
  );
  app.use(admin.options.rootPath, adminRouter);

  app.listen(PORT, () => {
    console.log(`AdminJS started on http://localhost:${PORT}${admin.options.rootPath}`);
  });
};

start();
