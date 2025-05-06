const express = require('express');
const multer = require('multer');
const Soldier = require('../models/soldier');
const router = express.Router();

// Multer setup for photo upload (memory storage for photos as binary data)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Route to display the search form
router.get('/search', (req, res) => {
  res.render('mos/search', { message: undefined });
});
// Route to handle search results
router.get('/search/results', async (req, res) => {
  const { mos } = req.query;
  try {
    const soldier = await Soldier.findOne({ mos: new RegExp(mos, 'i') });
    if (soldier) {
      res.render('mos/detail', { soldier });
    } else {
      res.render('mos/search', { message: 'No soldier found with that MOS number.' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Error searching soldier.');
  }
});

// Route to serve soldier photo
router.get('/photo/:id', async (req, res) => {
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

// Route for displaying all soldiers
router.get('/', async (req, res) => {
  try {
    const query = req.query.q?.toLowerCase() || ''; // Search query
    const soldiers = await Soldier.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { mos: { $regex: query, $options: 'i' } }
      ]
    });
    res.render('mos/index', { soldiers }); // Rendering the view with the soldier data
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching soldiers.');
  }
});

// View Soldier Profile
router.get('/:id', async (req, res) => {
  try {
    const soldier = await Soldier.findById(req.params.id);
    if (!soldier) return res.status(404).send('Soldier not found');
    res.render('mos/view', { soldier });
  } catch (err) {
    res.status(500).send('Invalid Soldier ID');
  }
});

// Add Soldier Form (Admin only)
router.get('/admin/add', (req, res) => {
  res.render('mos/add');
});

// Add Soldier (Post) — Photo stored as Buffer
router.post('/admin/add', upload.single('photo'), async (req, res) => {
  const { name, age, gender, rank, mos, unit, bio } = req.body;

  const newSoldier = new Soldier({
    name,
    age: parseInt(age), // Ensure age is stored as a number
    gender,
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


module.exports = router;
