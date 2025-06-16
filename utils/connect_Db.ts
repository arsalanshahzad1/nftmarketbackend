// const mongoose = require('mongoose')
import mongoose from 'mongoose'
import dotenv from 'dotenv';
dotenv.config();

 const connect = async () => {
    try {
        const db = await mongoose.connect(process.env.MONGODB_CONNECTION_STRING!);

        console.log(`DB connected: ${db.connection.host} `);
    } catch (err) {
        console.error("Error connecting to MongoDB:", err);
        process.exit(1); // Exit if connection fails
    }
};

export { connect };
                                     