const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

const app = express();

// Configure CORS for production
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:5173',
  'https://healthpix-frontend.vercel.app', // Your Vercel URL (will be updated once deployed)
  'https://healthpix-frontend-git-main.vercel.app', // Alternative Vercel URL
  'https://healthpix-frontend-skdas20.vercel.app', // User-specific Vercel URL
  'https://healthpix.netlify.app', // Netlify URL
  'https://healthpix-platform.netlify.app', // Alternative Netlify URL
  'https://amazing-biscuit-*.netlify.app', // Netlify auto-generated URL pattern  'https://frontend-mu-cyan-75.vercel.app', // Previous Vercel deployment URL
  'https://frontend-euyt68fnj-sumit-s-projects-bda037af.vercel.app', // Previous Vercel deployment URL
  'https://frontend-36idtyteg-sumit-s-projects-bda037af.vercel.app', // First new deployment URL
  'https://frontend-8phc11qui-sumit-s-projects-bda037af.vercel.app', // Previous production deployment URL
  'https://frontend-ebt4ipefi-sumit-s-projects-bda037af.vercel.app' // Latest production deployment URL
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());

// Store OTPs temporarily (in production, use Redis or similar)
const otpStore = new Map();
// Store medicines data in memory
let medicinesData = [];

// Load medicines data from CSV
const loadMedicinesData = () => {
  const results = [];
  fs.createReadStream(path.join(__dirname, 'Data', 'data.csv'))    .pipe(csv())
    .on('data', (data) => {
      // Add a unique ID and price for each medicine
      results.push({
        id: results.length + 1,
        name: data['Medicine name'],
        type: data['Medicine Type'],
        dosage: data['Dosage'],
        composition: data['Composition'],
        price: parseFloat((Math.random() * (500 - 50) + 50).toFixed(2)), // Random price between 50 and 500
        stock: Math.floor(Math.random() * 100) + 1 // Random stock between 1 and 100
      });
    })
    .on('end', () => {
      medicinesData = results;
      console.log('Medicines data loaded:', medicinesData.length, 'items');
    })
    .on('error', (error) => {
      console.error('Error loading medicines data:', error);
    });
};

// Load medicines data on startup
loadMedicinesData();

const userModel = require("./users");
const orderModel = require("./orders");

// Updated to use MongoDB Atlas URI provided by the user
const MONGODB_URI = "mongodb+srv://Sumit:okenopei123@cluster0.ebs6g.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log("Successfully connected to MongoDB Atlas");
    
    // Ensure TTL index exists for automatic order deletion after 7 days
    try {
      // Get detailed index information
      const indexes = await orderModel.collection.listIndexes().toArray();
      console.log("Current order collection indexes:", indexes.map(idx => ({
        name: idx.name,
        key: idx.key,
        expireAfterSeconds: idx.expireAfterSeconds
      })));
      
      // Check if TTL index exists
      const hasTTLIndex = indexes.some(idx => 
        idx.key && idx.key.createdAt && idx.expireAfterSeconds !== undefined
      );
      
      if (hasTTLIndex) {
        console.log("✅ TTL index already exists - Orders will auto-delete after 7 days");
      } else {
        console.log("⚠️  TTL index not found - Creating new TTL index for 7-day auto-deletion");
        
        // Create TTL index manually
        await orderModel.collection.createIndex(
          { createdAt: 1 }, 
          { expireAfterSeconds: 604800 } // 7 days
        );
        console.log("✅ TTL index created successfully - Orders will now auto-delete after 7 days");
      }
    } catch (err) {
      console.error("Error managing TTL indexes:", err);
    }
  })
  .catch(err => console.error("MongoDB connection error:", err));

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'temp.healthpix@gmail.com', // Replace with actual email
    pass: 'temp123456' // Replace with actual password
  }
});

// Function to generate OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Function to send OTP
async function sendOTP(email, otp) {
  const mailOptions = {
    from: 'temp.healthpix@gmail.com',
    to: email,
    subject: 'OTP for HealthPix Registration',
    text: `Your OTP for HealthPix registration is: ${otp}`
  };

  return transporter.sendMail(mailOptions);
}

// Endpoint to send OTP
app.post("/send-otp", async (req, res) => {
  try {
    const { email } = req.body;
    const otp = generateOTP();
    otpStore.set(email, { otp, timestamp: Date.now() });
    
    await sendOTP(email, otp);
    res.json({ status: "success", message: "OTP sent successfully" });
  } catch (err) {
    console.error("Error sending OTP:", err);
    res.status(500).json({ status: "error", message: "Failed to send OTP" });
  }
});

app.post("/register", async (req, res) => {
  try {
    const { firstname, lastname, email, phonenumber, password, otp } = req.body;
    
    // Verify OTP
    const storedOTPData = otpStore.get(email);
    if (!storedOTPData) {
      return res.status(400).json({ status: "error", message: "No OTP found. Please request a new OTP." });
    }

    if (storedOTPData.otp !== otp) {
      return res.status(400).json({ status: "error", message: "Invalid OTP" });
    }

    // Check if OTP is expired (15 minutes validity)
    if (Date.now() - storedOTPData.timestamp > 15 * 60 * 1000) {
      otpStore.delete(email);
      return res.status(400).json({ status: "error", message: "OTP expired. Please request a new OTP." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await userModel.create({
      firstname,
      lastname,
      email,
      phonenumber,
      password: hashedPassword,
    });

    // Clear OTP after successful registration
    otpStore.delete(email);
    res.json({ status: "success", user });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// Login Endpoint
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ status: "error", message: "User not found" });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ status: "error", message: "Invalid credentials" });
    }
    // For now, just send a success message. JWT/session will be added later.
    res.json({ status: "success", message: "Login successful", userId: user._id });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// Medicines API endpoint
app.get('/api/medicines', (req, res) => {
  if (medicinesData.length === 0) {
    loadMedicinesData(); // Try reloading if empty
  }
  res.json(medicinesData);
});

// Order Management Routes
app.post('/api/orders', async (req, res) => {
  try {
    const orderData = req.body;
    const order = await orderModel.create(orderData);
    const orderObject = order.toObject();
    res.json({ 
      success: true, 
      data: {
        ...orderObject,
        id: orderObject._id.toString() // Map _id to id
      }
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ success: false, message: 'Failed to create order' });
  }
});

app.get('/api/orders/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const orders = await orderModel.find({ userId }).sort({ createdAt: -1 });
    const ordersWithId = orders.map(order => {
      const orderObj = order.toObject();
      return {
        ...orderObj,
        id: orderObj._id.toString(),
      };
    });
    res.json({ success: true, data: ordersWithId });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch orders' });
  }
});

// Admin Routes
app.post('/api/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Simple hardcoded admin credentials for demo
    if (email === 'temporary@work.com' && password === 'permanent') {
      res.json({ success: true, message: 'Admin login successful' });
    } else {
      res.status(401).json({ success: false, message: 'Invalid admin credentials' });
    }
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
});

app.get('/api/admin/orders', async (req, res) => {
  try {
    const orders = await orderModel.find().sort({ createdAt: -1 });
      // Populate customer names from user data and map _id to id
    const ordersWithCustomerInfo = await Promise.all(
      orders.map(async (order) => {
        try {
          const user = await userModel.findById(order.userId);
          const orderObject = order.toObject();
          return {
            ...orderObject,
            id: orderObject._id.toString(), // Map _id to id
            customerName: user ? `${user.firstname} ${user.lastname}` : 'Unknown Customer',
            customerEmail: user ? user.email : 'unknown@email.com'
          };
        } catch (err) {
          const orderObject = order.toObject();
          return {
            ...orderObject,
            id: orderObject._id.toString(), // Map _id to id
            customerName: 'Unknown Customer',
            customerEmail: 'unknown@email.com'
          };
        }
      })
    );
    
    res.json({ success: true, data: ordersWithCustomerInfo });
  } catch (error) {
    console.error('Error fetching admin orders:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch orders' });
  }
});

app.put('/api/admin/orders/:orderId/status', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, trackingId } = req.body;
    
    const updateData = { status, updatedAt: new Date() };
    if (trackingId) {
      updateData.trackingId = trackingId;
    }
    
    // Set estimated delivery for shipped orders
    if (status === 'shipped' && !trackingId) {
      const estimatedDelivery = new Date();
      estimatedDelivery.setDate(estimatedDelivery.getDate() + 7); // 7 days from now
      updateData.estimatedDelivery = estimatedDelivery;
    }
    
    const order = await orderModel.findByIdAndUpdate(
      orderId,
      updateData,
      { new: true }
    );
      if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    
    const orderObject = order.toObject();
    res.json({ 
      success: true, 
      data: {
        ...orderObject,
        id: orderObject._id.toString() // Map _id to id
      }
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ success: false, message: 'Failed to update order status' });
  }
});

app.get('/api/admin/stats', async (req, res) => {
  try {
    const totalOrders = await orderModel.countDocuments();
    const pendingOrders = await orderModel.countDocuments({ 
      status: { $in: ['placed', 'confirmed', 'packed'] } 
    });
    const shippedOrders = await orderModel.countDocuments({ status: 'shipped' });
    const deliveredOrders = await orderModel.countDocuments({ status: 'delivered' });
    
    // Calculate total revenue from delivered orders
    const revenueResult = await orderModel.aggregate([
      { $match: { status: 'delivered' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    const revenue = revenueResult.length > 0 ? revenueResult[0].total : 0;
    
    res.json({
      success: true,
      data: {
        totalOrders,
        pendingOrders,
        shippedOrders,
        deliveredOrders,
        revenue
      }
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch stats' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});
