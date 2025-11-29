const mongoose = require('mongoose');

const PlayerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  history: [{
    wave: Number,
    score: Number,
    playtime: Number,
    playedAt: {
        type: Date,
        default: Date.now,
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('Player', PlayerSchema);