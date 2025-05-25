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
  'http://localhost:5173',
  'https://healthpix-frontend.vercel.app', // Your Vercel URL (will be updated once deployed)
  'https://healthpix-frontend-git-main.vercel.app', // Alternative Vercel URL
  'https://healthpix-frontend-skdas20.vercel.app', // User-specific Vercel URL
  'https://healthpix.netlify.app', // Netlify URL
  'https://healthpix-platform.netlify.app', // Alternative Netlify URL
  'https://amazing-biscuit-*.netlify.app', // Netlify auto-generated URL pattern
  'https://frontend-mu-cyan-75.vercel.app', // New Vercel deployment URL
  'https://frontend-euyt68fnj-sumit-s-projects-bda037af.vercel.app' // Previous Vercel deployment URL
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

// Updated to use MongoDB Atlas URI provided by the user
const MONGODB_URI = "mongodb+srv://Sumit:okenopei123@cluster0.ebs6g.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
mongoose.connect(MONGODB_URI)
  .then(() => console.log("Successfully connected to MongoDB Atlas"))
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

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});
