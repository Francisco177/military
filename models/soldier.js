const mongoose = require('mongoose');

const SoldierSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  age: {
    type: String,
    required: true
  },
  gender: {
    type: String,
    required: true
  },
  rank: {
    type: String,
    required: true
  },
  unit: {
    type: String,
    required: true
  },
  mos: {
    type: String,
    required: true
  },
  bio: {
    type: String,
    required: true
  },
  photo: {
    data: Buffer,
    contentType: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Soldier', SoldierSchema);
