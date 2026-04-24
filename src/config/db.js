// Import thư viện mongoose
const mongoose = require('mongoose');

// Hàm kết nối Database
const connectDB = async () => {
  let dbUri = process.env.MONGODB_URI;
  
  try {
    console.log('Attempting to connect to MongoDB...');
    const conn = await mongoose.connect(dbUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`\x1b[32mMongoDB Connected: ${conn.connection.host}\x1b[0m`);
  } catch (error) {
    if (process.env.NODE_ENV === 'development' && process.env.LOCAL_MONGODB_URI) {
      console.warn(`\x1b[33mPrimary DB connection failed. Attempting fallback to local MongoDB...\x1b[0m`);
      try {
        const localConn = await mongoose.connect(process.env.LOCAL_MONGODB_URI, {
          serverSelectionTimeoutMS: 2000,
        });
        console.log(`\x1b[32mConnected to Local MongoDB: ${localConn.connection.host}\x1b[0m`);
        return;
      } catch (localError) {
        console.error(`\x1b[31mLocal MongoDB fallback also failed: ${localError.message}\x1b[0m`);
      }
    }
    
    console.error(`\x1b[31mDatabase Connection Error: ${error.message}\x1b[0m`);
    console.error(`\x1b[33mTip: Please ensure your current IP address is whitelisted in MongoDB Atlas or that your network allows connection to port 27017.\x1b[0m`);
    throw error;
  }
};

// Xuất hàm ra để file khác gọi được
module.exports = connectDB;