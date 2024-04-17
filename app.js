// File: app.js
import AdminJS from 'adminjs';
import * as AdminJSSequelize from '@adminjs/sequelize'
import AdminJSExpress from '@adminjs/express'
import express from 'express';
import Connect from 'connect-pg-simple';
import session from 'express-session';
import sequelize from './database.js'; // Import Sequelize instance
import {User} from './models/User.js'; // Import defineUserModel function for User entity

const PORT = 3000;

const DEFAULT_ADMIN = {
  email: 'admin@example.com',
  password: 'password',
};

// Register Sequelize adapter with AdminJS
AdminJS.registerAdapter({
  Resource: AdminJSSequelize.Resource,
  Database: AdminJSSequelize.Database,
})

// Define User model using defineUserModel function
//const newUser = new User(sequelize);

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

  const adminOptions = {
    // Include User resource in resources array
    resources: [User],
  };

  const admin = new AdminJS(adminOptions);

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
