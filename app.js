
// app.js

import AdminJS from 'adminjs';
import * as AdminJSSequelize from '@adminjs/sequelize';
import AdminJSExpress from '@adminjs/express';
import express from 'express';
import session from 'express-session';
import sequelize from './database.js'; // Import Sequelize instance
import { User } from './models/User.js';
import { Order } from './models/Order.js';
import { Invoice } from './models/invoice.js'
import { Return } from './models/return.js'
import ConnectPgSimple from 'connect-pg-simple';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const PORT = process.env.PORT;

const DEFAULT_ADMIN = {
  email: process.env.EMAIL,
  password: process.env.PASSWORD,
};

// Generate a static token from environment variable
const STATIC_TOKEN = process.env.STATIC_TOKEN;

// Register Sequelize adapter with AdminJS
AdminJS.registerAdapter({
  Resource: AdminJSSequelize.Resource,
  Database: AdminJSSequelize.Database,
});

const authenticate = async (email, password) => {
  // Check if the user is the default admin
  if (email === DEFAULT_ADMIN.email && password === DEFAULT_ADMIN.password) {
    return DEFAULT_ADMIN;
  }
  // If not the default admin, check the database for the user
  const user = await User.findOne({ where: { email } });
  if (user) {
    console.log("Password from DB:", user.password);
    if (password === user.password) { // Compare plaintext passwords
      return user;
    }
  }
  
  // If neither the default admin nor a regular user, return null
  return null;
};

// Start function
const start = async () => {
  const app = express();

  const adminOptions = {
    // Include User, Order, Invoice, and Return resources in resources array
    resources: [
      {
        resource: User,
        options: {
          properties: {
            id: { isVisible: { list: true, show: true, edit: false } },
            name: { isVisible: { list: true, show: true, edit: true } },
            email: { isVisible: { list: true, show: true, edit: true } },
          },
          actions: {
            new: { isAccessible: ({ currentAdmin }) => currentAdmin && currentAdmin.email === DEFAULT_ADMIN.email },
            edit: { isAccessible: ({ currentAdmin }) => currentAdmin && currentAdmin.email === DEFAULT_ADMIN.email },
          },
        },
      },
      {
        resource: Order,
        options: {
          properties: {
            id: { isVisible: { list: true, show: true, edit: false } },
            status: { isVisible: { list: true, show: true, edit: true } },
            deliveryAddress: { isVisible: { list: true, show: true, edit: true } },
            amount: { isVisible: { list: true, show: true, edit: true } },
          },
          actions: {
            new: { isAccessible: ({ currentAdmin }) => currentAdmin && currentAdmin.email === DEFAULT_ADMIN.email },
            edit: { isAccessible: ({ currentAdmin }) => currentAdmin && currentAdmin.email === DEFAULT_ADMIN.email },
            delete: { isAccessible: ({ currentAdmin }) => currentAdmin && currentAdmin.email === DEFAULT_ADMIN.email },
          },
        },
      },
      {
        resource: Invoice,
        options: {
          properties: {
            billingAddress: { isVisible: { list: true, show: true, edit: true } },
            invoiceLink: { isVisible: { list: true, show: true, edit: true } },
            finderFees: { isVisible: { list: true, show: true, edit: true } },
            amount: { isVisible: { list: true, show: true, edit: true } },
          },
          actions: {
            new: { isAccessible: ({ currentAdmin }) => currentAdmin && currentAdmin.email === DEFAULT_ADMIN.email },
            edit: { isAccessible: ({ currentAdmin }) => currentAdmin && currentAdmin.email === DEFAULT_ADMIN.email },
            delete: { isAccessible: ({ currentAdmin }) => currentAdmin && currentAdmin.email === DEFAULT_ADMIN.email },
          },
        },
      },
      {
        resource: Return,
        options: {
          properties: {
            itemId: { isVisible: { list: true, show: true, edit: true } },
            reason: { isVisible: { list: true, show: true, edit: true } },
            returnImages: { isVisible: { list: true, show: true, edit: true } },
            status: { isVisible: { list: true, show: true, edit: true } },
          },
          actions: {
            new: { isAccessible: ({ currentAdmin }) => currentAdmin && currentAdmin.email === DEFAULT_ADMIN.email },
            edit: { isAccessible: ({ currentAdmin }) => currentAdmin && currentAdmin.email === DEFAULT_ADMIN.email },
            delete: { isAccessible: ({ currentAdmin }) => currentAdmin && currentAdmin.email === DEFAULT_ADMIN.email },
          },
        },
      },
    ],
  };  

  const admin = new AdminJS(adminOptions);

// Initialize session store with ConnectPgSimple
const ConnectSession = ConnectPgSimple(session);
const sessionStore = new ConnectSession({
  conObject: {
    connectionString: process.env.DB_CONNECTION_STRING,
  },
  tableName: 'session',
});

// Configure session middleware
const sessionOptions = {
  store: sessionStore,
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  cookie: {
    httpOnly: process.env.NODE_ENV === 'production',
    secure: process.env.NODE_ENV === 'production',
  },
};

app.use(session(sessionOptions));

  const adminRouter = AdminJSExpress.buildAuthenticatedRouter(
    admin,
    {
      authenticate,
      cookieName: process.env.ADMINJS_COOKIE_NAME,
      cookiePassword: process.env.ADMINJS_COOKIE_PASSWORD,
    },
    null,
    {
      store: sessionStore,
      resave: true,
      saveUninitialized: true,
      secret: process.env.SESSION_SECRET,
      cookie: {
        httpOnly: process.env.NODE_ENV === 'production',
        secure: process.env.NODE_ENV === 'production',
      },
      name: process.env.ADMINJS_COOKIE_NAME,
    }
  );
  // Custom authentication middleware for the '/admin/api/resources/orders/actions/list' endpoint
  const requireAuthentication = (req, res, next) => {
    // Check if a token is present in the request headers
    const token = req.headers['authorization'];

    // If token is provided and matches the expected static token, proceed
    if (token && token === `Bearer ${STATIC_TOKEN}`) {
        return next();
    }

    // If no token provided, check if there is a session with user information
    if ((!token && req.session && req.session.adminUser && req.session.adminUser.email === process.env.EMAIL) || (!token && req.session.adminUser.role === 'admin')) {
        return next(); // Proceed if authenticated with session
    }

    // If neither token-based nor session-based authentication succeeds, return unauthorized
    return res.status(401).json({ message: 'Unauthorized' });
};

  
  // Apply authentication middleware to the '/admin/api/resources/orders/actions/list' endpoint
  app.use('/admin/api/resources/orders/actions/list', requireAuthentication);
  app.use('/admin/api/resources/invoices/actions/list', requireAuthentication);
  app.use('/admin/api/resources/returns/actions/list', requireAuthentication);

  app.use(admin.options.rootPath, adminRouter);
  

  try {
    // Sync Sequelize models with the database
    await sequelize.sync();
    console.log('All models were synchronized successfully.');
  } catch (error) {
    console.error('Error synchronizing models:', error);
    return; // Exit the function if synchronization fails
  }

  app.listen(PORT, () => {
    console.log(`AdminJS started on http://localhost:${PORT}${admin.options.rootPath}`);
  });
};

start();