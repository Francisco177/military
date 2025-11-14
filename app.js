require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const auth = require('basic-auth');
const Contact = require('./models/contact');
const LeaveRequest = require('./models/leaveRequest');
const Soldier = require('./models/soldier');
const mosRoutes = require('./routes/mos');  // Import MOS routes

const app = express();

// MongoDB URI from Atlas
const mongoURI = process.env.MONGO_URI || 'mongodb+srv://torkpandeternenge:%40Torkpande17@cluster0.tliskaj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
}).catch((err) => {
  console.error('Error connecting to MongoDB:', err);
});

// Admin credentials
const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;


// Admin Authentication Middleware
function adminAuth(req, res, next) {
  const user = auth(req);
  if (!user || user.name !== ADMIN_USERNAME || user.pass !== ADMIN_PASSWORD) {
    res.set('WWW-Authenticate', 'Basic realm="Admin Area"');
    return res.status(401).send('Authentication required.');
  }
  next();
}

// Multer setup for photo upload (memory storage for photos as binary data)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public'))); // Use path.join for better compatibility
app.set('view engine', 'ejs');

// Use MOS routes for managing soldiers
app.use('/mos', require('./routes/mos'));

// Routes
app.get('/', (req, res) => res.render('index'));
app.get('/about', (req, res) => res.render('about'));
app.get('/services', (req, res) => res.render('services'));
app.get('/contact', (req, res) => res.render('contact', { success: req.query.success === 'false' }));
app.get('/joining', (req, res) => res.render('joining'));
app.get('/training', (req, res) => res.render('training'));
app.get('/leave', (req, res) => res.render('leave', { success: req.query.success === 'false' }));

// Contact Form Submission
app.post('/contact', async (req, res) => {
  const { name, email, message } = req.body;
  try {
    await Contact.create({ name, email, message });
    res.render('contact', { success: true });
  } catch (error) {
    console.error(error);
    res.status(500).send('Something went wrong while sending the message.');
  }
});

// Leave Request Submission
app.post('/leave', async (req, res) => {
  const { fullName, rank, unit, leaveType, startDate, endDate, reason, officerName, serviceNumber, relationship, address } = req.body;
  
  const newLeaveRequest = new LeaveRequest({
    fullName, rank, unit, leaveType, startDate, endDate, reason, officerName, serviceNumber, relationship, address,
    submittedAt: new Date(),
  });

  try {
    await newLeaveRequest.save();
    res.render('leave', { success: true });
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred while submitting your leave request.');
  }
});

// Add Soldier (Post) — Photo stored as Buffer
app.post('/admin/mos/add', adminAuth, upload.single('photo'), async (req, res) => {
  const { name, rank, mos, unit, bio } = req.body;

  const newSoldier = new Soldier({
    name,
    rank,
    mos,
    unit,
    bio,
    photo: {
      data: req.file.buffer,
      contentType: req.file.mimetype,
    }
  });

  try {
    await newSoldier.save();
    res.redirect('/mos');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error saving soldier.');
  }
});

// Route to serve soldier photo
app.get('/mos/photo/:id', async (req, res) => {
  const soldierId = req.params.id;
  
  try {
    const soldier = await Soldier.findById(soldierId);
    if (soldier && soldier.photo && soldier.photo.data) {
      res.contentType('image/jpeg');
      res.send(soldier.photo.data);
    } else {
      res.status(404).send('Photo not found');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching photo');
  }
});


// Admin Panel to view contacts and leave requests
app.get('/admin', adminAuth, async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ submittedAt: -1 });
    const leaves = await LeaveRequest.find().sort({ submittedAt: -1 });
    res.render('admin', { contacts, leaves });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
