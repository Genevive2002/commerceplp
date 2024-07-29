const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const stripe = require('stripe')('your_stripe_secret_key');
const nodemailer = require('nodemailer');
const csv = require('csv-parser');
const fs = require('fs');

(express()).use(express.json());

// MongoDB Models (Assuming you have defined these models)
const User = require('./models/User');
const Product = require('./models/Product');
const Cart = require('./models/Cart');
const Order = require('./models/Order');
const Review = require('./models/Review');

// Email Transporter

// User Registration and Login
(express()).post('/register', async (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword });
    await user.save();
    res.status(201).send('User registered');
});

(express()).post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (user && await bcrypt.compare(password, user.password)) {
        const token = jwt.sign({ id: user._id }, 'your_jwt_secret');
        res.json({ token });
    } else {
        res.status(401).send('Invalid credentials');
    }
});

// Shopping Cart
(express()).post('/cart', async (req, res) => {
    const { userId, productId, quantity } = req.body;
    const cart = await Cart.findOneAndUpdate(
        { userId },
        { $push: { items: { productId, quantity } } },
        { upsert: true, new: true }
    );
    res.json(cart);
});

// Checkout
(express()).post('/checkout', async (req, res) => {
    const { amount, source } = req.body;
    try {
        const charge = await stripe.charges.create({
            amount,
            currency: 'usd',
            source,
            description: 'Sample Charge',
        });
        res.json(charge);
    } catch (error) {
        res.status(500).send(error);
    }
});

// Product Categories and Filters
(express()).get('/products', async (req, res) => {
    const { category, priceMin, priceMax } = req.query;
    const filters = {};
    if (category) filters.category = category;
    if (priceMin && priceMax) filters.price = { $gte: priceMin, $lte: priceMax };

    const products = await Product.find(filters);
    res.json(products);
});

// Product Reviews and Ratings
(express()).post('/review', async (req, res) => {
    const { productId, userId, rating, comment } = req.body;
    const review = new Review({ productId, userId, rating, comment });
    await review.save();
    res.status(201).send('Review added');
});

// Search Products
(express()).get('/search', async (req, res) => {
    const { query } = req.query;
    const products = await Product.find({ name: { $regex: query, $options: 'i' } });
    res.json(products);
});

// Wishlist
(express()).post('/wishlist', async (req, res) => {
    const { userId, productId } = req.body;
    const user = await User.findById(userId);
    user.wishlist.push(productId);
    await user.save();
    res.json(user);
});

// Order History
(express()).get('/orders/:userId', async (req, res) => {
    const { userId } = req.params;
    const orders = await Order.find({ userId });
    res.json(orders);
});

// Inventory Management
(express()).post('/inventory/update', async (req, res) => {
    const { productId, quantity } = req.body;
    await Product.findByIdAndUpdate(productId, { $inc: { stock: -quantity } });
    res.send('Inventory updated');
});

// Promotions and Discounts
(express()).post('/apply-discount', (req, res) => {
    const { total, discountCode } = req.body;
    const discounts = { 'SUMMER20': 0.2, 'WINTER15': 0.15 };
    const discount = discounts[discountCode] || 0;
    const finalTotal = total * (1 - discount);
    res.json({ finalTotal });
});

// Email Notifications
const sendEmail = (to, subject, text) => {
    const mailOptions = {
        from: 'your_email@gmail.com',
        to,
        subject,
        text
    };
    (nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: 'your_email@gmail.com',
            pass: 'your_password'
        }
    })).sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
};

// Product Image Gallery
(express()).get('/images/:productId', async (req, res) => {
    const { productId } = req.params;
    const product = await Product.findById(productId);
    res.json(product.images); // Assuming product has an 'images' field
});

// Advanced Admin Features
(express()).post('/import-products', (req, res) => {
    const results = [];
    fs.createReadStream('products.csv')
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', async () => {
            // Save results to your database
            await Product.insertMany(results);
            res.send('Products imported');
        });
});


const PORT = process.env.PORT || 3000;
mongoose.connect('mongodb://localhost:27017/yourdatabase', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => (express()).listen(PORT, () => console.log(`Server running on port ${PORT}`)))
    .catch(err => console.error(err));
    const express = require('express');
    const mongoose = require('mongoose');
    const bcrypt = require('bcrypt');
    const jwt = require('jsonwebtoken');
    const nodemailer = require('nodemailer');
    const csv = require('csv-parser');
    const fs = require('fs');
    
    const app = express();
    (express()).use(express.json());
    
    // MongoDB Models (Assuming you have defined these models)
    const User = require('./models/User');
    const Product = require('./models/Product');
    const Cart = require('./models/Cart');
    const Order = require('./models/Order');
    const Review = require('./models/Review');
    
    // Email Transporter
    const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: 'your_email@gmail.com',
            pass: 'your_password'
        }
    });
    
    // User Registration and Login
    (express()).post('/register', async (req, res) => {
        const { username, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ username, password: hashedPassword });
        await user.save();
        res.status(201).send('User registered');
    });
    
    (express()).post('/login', async (req, res) => {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (user && await bcrypt.compare(password, user.password)) {
            const token = jwt.sign({ id: user._id }, 'your_jwt_secret');
            res.json({ token });
        } else {
            res.status(401).send('Invalid credentials');
        }
    });
    
    // Shopping Cart
    (express()).post('/cart', async (req, res) => {
        const { userId, productId, quantity } = req.body;
        const cart = await Cart.findOneAndUpdate(
            { userId },
            { $push: { items: { productId, quantity } } },
            { upsert: true, new: true }
        );
        res.json(cart);
    });
    
    // Checkout
    (express()).post('/checkout', async (req, res) => {
        const { amount, source } = req.body;
        try {
            const charge = await stripe.charges.create({
                amount,
                currency: 'usd',
                source,
                description: 'Sample Charge',
            });
            res.json(charge);
        } catch (error) {
            res.status(500).send(error);
        }
    });
    
    // Product Categories and Filters
    (express()).get('/products', async (req, res) => {
        const { category, priceMin, priceMax } = req.query;
        const filters = {};
        if (category) filters.category = category;
        if (priceMin && priceMax) filters.price = { $gte: priceMin, $lte: priceMax };
    
        const products = await Product.find(filters);
        res.json(products);
    });
    
    // Product Reviews and Ratings
    (express()).post('/review', async (req, res) => {
        const { productId, userId, rating, comment } = req.body;
        const review = new Review({ productId, userId, rating, comment });
        await review.save();
        res.status(201).send('Review added');
    });
    
    // Search Products
    (express()).get('/search', async (req, res) => {
        const { query } = req.query;
        const products = await Product.find({ name: { $regex: query, $options: 'i' } });
        res.json(products);
    });
    
    // Wishlist
    (express()).post('/wishlist', async (req, res) => {
        const { userId, productId } = req.body;
        const user = await User.findById(userId);
        user.wishlist.push(productId);
        await user.save();
        res.json(user);
    });
    
    // Order History
    (express()).get('/orders/:userId', async (req, res) => {
        const { userId } = req.params;
        const orders = await Order.find({ userId });
        res.json(orders);
    });
    
    // Inventory Management
    (express()).post('/inventory/update', async (req, res) => {
        const { productId, quantity } = req.body;
        await Product.findByIdAndUpdate(productId, { $inc: { stock: -quantity } });
        res.send('Inventory updated');
    });
    
    // Responsive Design (CSS)
    (express()).get('/styles.css', (req, res) => {
        res.send(`
            .carousel-item { display: none; }
            .carousel-item.visible { display: block; }
            @media (max-width: 600px) {
                .container {
                    width: 100%;
                    padding: 10px;
                }
            }
        `);
    });
    
    // Promotions and Discounts
    (express()).post('/apply-discount', (req, res) => {
        const { total, discountCode } = req.body;
        const discounts = { 'SUMMER20': 0.2, 'WINTER15': 0.15 };
        const discount = discounts[discountCode] || 0;
        const finalTotal = total * (1 - discount);
        res.json({ finalTotal });
    });
    
    // Email Notifications
    function sendEmail(to, subject, text) {
    const mailOptions = {
        from: 'your_email@gmail.com',
        to,
        subject,
        text
    };
    (nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: 'your_email@gmail.com',
                pass: 'your_password'
            }
        })).sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
}
    
    // Product Image Gallery
    (express()).get('/images/:productId', async (req, res) => {
        const { productId } = req.params;
        const product = await Product.findById(productId);
        res.json(product.images); // Assuming product has an 'images' field
    });
    
    // Advanced Admin Features
    (express()).post('/import-products', (req, res) => {
        const results = [];
        fs.createReadStream('products.csv')
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', async () => {
                // Save results to your database
                await Product.insertMany(results);
                res.send('Products imported');
            });
    });

    
    mongoose.connect('mongodb://localhost:27017/yourdatabase', { useNewUrlParser: true, useUnifiedTopology: true })
        .then(() => (express()).listen(PORT, () => console.log(`Server running on port ${PORT}`)))
        .catch(err => console.error(err));
    