require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const rentalRoutes = require('./routes/rentals');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/rentals', rentalRoutes);

const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://admin:<mypassword@123>@cluster0.hj0i4jp.mongodb.net/?appName=Cluster0', { useNewUrlParser:true, useUnifiedTopology:true })
  .then(()=> {
    console.log('MongoDB connected');
    app.listen(PORT, ()=> console.log('Server running on port', PORT));
  })
  .catch(err => {
    console.error('Mongo connect error', err);
  });
