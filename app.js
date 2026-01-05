const express = require("express");
const app = express();
const { rateLimit } = require("express-rate-limit");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const helmet = require("helmet");
dotenv.config();

app.use(helmet());
const port = process.env.PORT;
let secretkey = process.env.SECRETKEY;

const mongoose = require("mongoose");
async function connection() {
  await mongoose.connect(process.env.MONGODBURL);
}
//schema
let productSchema = new mongoose.Schema({
  title: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String, required: true },
});

let usersSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  password: { type: String, required: true },
});
//model
const productsmodel = mongoose.model("products", productSchema);
const userss = mongoose.model("users", usersSchema);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 2, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
  standardHeaders: "draft-8", // draft-6: `RateLimit-*` headers; draft-7 & draft-8: combined `RateLimit` header
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
  ipv6Subnet: 56, // Set to 60 or 64 to be less aggressive, or 52 or 48 to be more aggressive
  // store: .
});

app.use(limiter);
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  console.log(`logic veified`);
  next();
});

app.get(`/`, (req, res) => {
  res.json({
    msg: "server is runing",
  });
});

// desgn an api where seller send the details and i will store in database
app.post("/products", async (req, res) => {
  try {
    const { title, price, image } = req.body;
    await productsmodel.create({ title, price, image });
    res.status(201).json({ msg: "products are added successfully" });
    let transporter = await nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    let mailOptions = {
      from: process.env.GMAIL_USER,
      to: "sushganji5@gmail.com",
      subject: "Product update",
      html: `A new product is added in our store `,
    };
    transporter.sendMail(mailOptions, (error) => {
      if (error) throw error;
      console.log("product sent successfully");
    });
  } catch (error) {
    res,
      express.json({
        msg: error.message,
      });
  }
});

//api-3  fetch from db
app.get("/products", async (req, res) => {
  try {
    let products = await productsmodel.find();
    res.status(200).json(products);
  } catch (error) {
    res.json({
      msg: error.message,
    });
  }
});

app.delete("/products", async (req, res) => {
  try {
    let products = await productsmodel.findByIdAndDelete(
      "69575dca0f4a318422935f24"
    );
    res.status(200).json(products);
  } catch (error) {
    res.json({
      msg: error.message,
    });
  }
});

app.put("/products", async (req, res) => {
  try {
    let products = await productsmodel.findByIdAndUpdate(
      "6957637e6e17bfd669d8fefd",
      { title: "brandnew watch" }
    );
    res.status(200).json(products);
  } catch (error) {
    res.json({
      msg: error.message,
    });
  }
});

app.get("/details", (req, res) => {
  let location = req.query.location;
  let age = req.query.age;
  let company = req.query.company;
  res.send(
    `this person is living in ${location} and this age and he is working in company`
  );
});

app.get("/products/:id", async (re, res) => {
  id = req.params.id;
  let singleproduct = await productsmodel.findById(id);
  res.json(singleproduct);
});

//registration
app.post("/register", async (req, res) => {
  try {
    const { email, username, password } = req.body;
    let users = await userss.findOne({ email });
    if (users) return res.json({ msg: "user already exists" });
    //hash passwords
    let hashassword = await bcrypt.hash(password, 10);
    await userss.create({ email, username, password: hashassword });
    res.json({ msg: "registration succesfull" });

    let transporter = await nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    let mailOptions = {
      from: process.env.GMAIL_USER,
      to: email,
      subject: "ACCOUNT REGISTRATION",
      html: `Hi ${username} your account is created successfully`,
    };
    transporter.sendMail(mailOptions, (error) => {
      if (error) throw error;
      console.log("email sent successfully");
    });
  } catch (error) {
    res.json({
      msg: error.message,
    });
  }
});

//login
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    let users = await userss.findOne({ email });
    if (!users) return res.json("invalid credentials");
    let checkpassword = await bcrypt.compare(password, users.password);
    if (!checkpassword)
      return res.json({ msg: "email or password is incorrect" });
    //token
    let payload = { email: email };
    let token = await jwt.sign(payload, secretkey, { expiresIn: "1hr" });
    res.json({ msg: "login successfully", token });
  } catch (error) {
    res.json({
      msg: error.message,
    });
  }
});

app.listen(port, async () => {
  console.log(`Example app listening on port ${port}`);
  connection();
  console.log("DB connected");
});
