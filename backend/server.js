const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');


dotenv.config();



const RFP = require('./models/RFP');
const Vendor = require('./models/Vendor');
const AIService = require('./services/aiService');

const app = express();
app.use(cors());
app.use(express.json());


mongoose.connect(process.env.MONGODB_URI)
.then(()=>console.log("MongoDb Coonected"))
.catch(()=>console.log("Error in conected with db"));



app.get('/api/health',(req,res)=>{
    res.json({
        ok:true
    });
})

// Create RFP from natural language
app.post('/api/rfps', async (req, res) => {
    try {
      const { text } = req.body;
      const rfpData = await AIService.createRFPFromText(text);
      const rfp = new RFP(rfpData);
      await rfp.save();
      res.json(rfp);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });


  // List RFPs
app.get('/api/rfps', async (req, res) => {
    const rfps = await RFP.find().sort({ createdAt: -1 });
    res.json(rfps);
  });



  // Basic vendor CRUD
app.get('/api/vendors', async (req, res) => {
    const vendors = await Vendor.find();
    res.json(vendors);
  });
  
  app.post('/api/vendors', async (req, res) => {
    const vendor = new Vendor(req.body);
    await vendor.save();
    res.json(vendor);
  });


const port = process.env.PORT || 5001;
app.listen(port,()=> {
    console.log(`server running in the port ${port}`);
    console.log(`mongouri ${process.env.MONGODB_URI}`)
});