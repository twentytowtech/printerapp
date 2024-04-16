const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const net = require('net');
const Order = require('./orderModel');
require('dotenv').config();


// Connect to MongoDB database
mongoose.connect('mongodb://localhost:27017/printer-db', { useNewUrlParser: true, useUnifiedTopology: true });

// Establish connection to Xprinter XP80C
const printerAddress = '192.168.0.100';
const printerPort = 9100;
const client = net.connect(printerPort, printerAddress, () => {
    console.log('Connected to printer');
});

// Express app setup
const app = express();
app.use(bodyParser.json());

// Log incoming requests for debugging purposes
app.use((req, res, next) => {
    console.log(`Incoming ${req.method} request to ${req.originalUrl}`);
    next();
});

// POST endpoint to create new order
app.post('/api/orders', async (req, res) => {
    try {
        // Save order data to MongoDB
        const orderData = req.body;
        console.log('Received order data:', orderData); // Log received order data
        const order = new Order(orderData);
        await order.save();

        // Format order data for printing
        const formattedData = formatOrderData(order);
        console.log('Formatted order data:', formattedData); // Log formatted order data

        // Start printing process
        console.log('Starting printing...');
        await sendDataToPrinter(formattedData);
        console.log('Printing completed successfully.');

        res.status(201).send('Order created and printed successfully');
    } catch (error) {
        console.error('Error creating order and printing:', error);
        res.status(500).send('Internal Server Error');
    }
});


app.get('/', (req, res)=>{
    res.send("hello world!")
})
// Function to format order data for printing
function formatOrderData(order) {
    let formattedData = `Order ID: ${order._id}\n`;
    formattedData += `Customer Name: ${order.customerName}\n`;
    formattedData += `Total Amount: $${order.totalAmount}\n`;
    formattedData += 'Items:\n';
    order.items.forEach((item, index) => {
        formattedData += `${index + 1}. ${item.name}, Quantity: ${item.quantity}, Price: $${item.price}\n`;
    });
    return formattedData;
}


function sendDataToPrinter(data) {
    return new Promise((resolve, reject) => {
        console.log('Sending data to printer...');
        client.write(data, (err) => {
            if (err) {
                if (err.code === 'EPIPE') {
                    console.error('Error: Printer connection closed unexpectedly.');
                } else {
                    console.error('Error sending data to printer:', err);
                }
                reject(err);
            } else {
                console.log('Data sent to printer successfully.');
                resolve();
            }
        });
    });
}
// Start the server
const PORT = process.env.PORT || 3004;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
