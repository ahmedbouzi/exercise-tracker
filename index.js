const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose');
const User = require('./models/User');
const Exercise = require('./models/Exercise');
mongoose.connect("mongodb+srv://bouzirii:Pizap.com1998@cluster0.9qf2wdu.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0", {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log(' Connected to MongoDB'))
.catch((err) => console.error(' MongoDB connection error:', err));

app.use(cors())
app.use(express.static('public'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.get('/hello', (req , res ) => {
  res.send('hello world');
})


app.post('/api/users', async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: 'Username is required' });
    const newUser = new User({ username });
    const savedUser = await newUser.save();

    res.json({ username: savedUser.username, _id: savedUser._id });
    
  } catch (error) { 
      res.status(500).json({ error: "Server error",details: error.message });
  }
});
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({}, 'username _id'); 
    res.json(users); 
  } catch (error) {
    res.status(500).json({ error: "Server error", details: error.message });
  }
});
app.post('/api/users/:_id/exercises', async (req, res) => {
  try {
     const { description, duration, date } = req.body;
     const {_id} = req.params;
     const user = await User.findById(_id);
     if (!user) return res.status(400).json({ error: 'User not found' });
     if (!description || !duration) {
       return res.status(400).json({ error: "Description and duration are required" });
     }

     const exerciseDate = date ? new Date(date) : new Date();
     const newExercise = new Exercise({
       userId: user._id,
       description,
       duration: parseInt(duration),
       date: exerciseDate
     });
    const savedExercise = await newExercise.save();

    res.json({
      _id: user._id,
      username: user.username,
      date: savedExercise.date.toDateString(),
      duration: savedExercise.duration,
      description: savedExercise.description
    });
  } catch (err) {
       console.error(err);
       res.status(500).json({ error: 'Server error' });
  }
});
app.get('/api/users/:_id/logs', async (req, res) => {
  try {
          const { _id } = req.params;
          const { from, to, limit } = req.query;
          const user = await User.findById(_id);
          if (!user) return res.status(400).json({ error: 'User not found' });
          const filter = { userId: _id };
          if (from || to) {
            filter.date = {};
            if (from) filter.date.$gte = new Date(from);
            if (to) filter.date.$lte = new Date(to);
          }
      
          let query = Exercise.find(filter).select('description duration date -_id');
          if (limit) query = query.limit(parseInt(limit));
          const exercises = await query.exec();
          const log = exercises.map(ex => ({
            description: ex.description,
            duration: ex.duration,
            date: ex.date.toDateString()
          }));
          res.json({
            username: user.username,
            count: log.length,
            _id: user._id,
            log
          });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
