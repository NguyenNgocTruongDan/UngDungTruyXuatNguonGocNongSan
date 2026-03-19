import mongoose from 'mongoose';

const connectDB = async (uri: string): Promise<typeof mongoose> => {
  return mongoose.connect(uri);
};

export default connectDB;
