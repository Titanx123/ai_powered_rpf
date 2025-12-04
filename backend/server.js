const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const nodemailer = require('nodemailer')


dotenv.config();



const RFP = require('./models/RFP');
const Vendor = require('./models/Vendor');
const AIService = require('./services/aiService');

const app = express();
app.use(cors());
app.use(express.json());



// Nodemailer transporter (add this)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

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

  // Send an RFP to selected vendors
app.post('/api/rfps/:id/send', async (req, res) => {
  try {
    const { vendorIds } = req.body; // array of vendor _id strings

    const rfp = await RFP.findById(req.params.id);
    if (!rfp) return res.status(404).json({ error: "RFP not found" });

    const vendors = await Vendor.find({ _id: { $in: vendorIds } });

    for (const vendor of vendors) {
      // 1) send email
      await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: vendor.email,
        subject: `RFP: ${rfp.title}`,
        html: `
          <h2>Request for Proposal: ${rfp.title}</h2>
          <p><strong>Budget:</strong> ${rfp.budget} ${rfp.currency}</p>
          <p><strong>Delivery:</strong> ${rfp.deliveryDays} days</p>
          <p><strong>Payment Terms:</strong> ${rfp.paymentTerms}</p>
          <p><strong>Warranty:</strong> ${rfp.warrantyMonths} months</p>
          <h3>Items</h3>
          <ul>
            ${rfp.items
              .map(i => `<li>${i.quantity} × ${i.description}</li>`)
              .join("")}
          </ul>
          <p>Please reply with your detailed quotation including item-wise prices, delivery time, and warranty.</p>
        `,
      });

      // 2) record this vendor on the RFP (so we can attach responses later)
      if (!rfp.vendors) rfp.vendors = [];

      let vRef = rfp.vendors.find(v => String(v.vendorId) === String(vendor._id));
      if (!vRef) {
        rfp.vendors.push({
          vendorId: vendor._id,
          email: vendor.email,
          name: vendor.name,
          sentAt: new Date(),
          responses: []
        });
      } else {
        vRef.sentAt = new Date();
      }
    }

    await rfp.save();

    res.json({ message: "RFP sent to vendors", vendors: rfp.vendors });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send RFP emails" });
  }
});


// Mock inbound vendor response: parse with AI and store on RFP
app.post('/api/rfps/:id/mock-response', async (req, res) => {
  try {
    const { vendorEmail, subject, body } = req.body;
    console.log("vendoremail",vendorEmail)
    console.log("subject",subject)
    const rfp = await RFP.findById(req.params.id);
    if (!rfp) return res.status(404).json({ error: "RFP not found" });

    // Use AI to extract prices, terms, delivery, etc.
    const parsed = await AIService.parseVendorProposal(body, subject || "");

    // Attach to correct vendor on this RFP
    const vendor = rfp.vendors?.find(v => v.email === vendorEmail);
    if (!vendor) {
      return res.status(404).json({ error: "Vendor not found on this RFP" });
    }

    if (!vendor.responses) vendor.responses = [];
    vendor.responses.push({
      receivedAt: new Date(),
      subject,
      body,
      parsed
    });

    await rfp.save();
    res.json({ success: true, parsed });
  } catch (err) {
    console.error("mock-response error:", err);
    res.status(500).json({ error: err.message });
  }
});
app.post('/api/rfps/:id/compare', async (req, res) => {
  try {
    const rfp = await RFP.findById(req.params.id);
    if (!rfp) return res.status(404).json({ error: "RFP not found" });

    const proposals = rfp.vendors
      .filter(v => v.responses && v.responses.length > 0)
      .map(v => ({
        vendorName: v.name,
        vendorEmail: v.email,
        proposal: v.responses[v.responses.length - 1].parsed
      }));

    if (proposals.length === 0) {
      return res.json({ message: "No proposals received yet" });
    }

    const result = await AIService.compareProposals(rfp, proposals);
    res.json({ proposals, result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});




const port = process.env.PORT || 5001;
app.listen(port,()=> {
    console.log(`server running in the port ${port}`);
    console.log(`mongouri ${process.env.MONGODB_URI}`)
});