    const mongoose = require('mongoose');
    const bodyParser = require('body-parser');
    // Define User Schema and Model
    const userSchema = new mongoose.Schema({
        name: { type: String },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true }
    });
    const User = mongoose.model('User', userSchema);
    module.exports = User;

