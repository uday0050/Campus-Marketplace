const jwt = require('jsonwebtoken');
const User = require('../models/User');

const signToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const createError = (message, statusCode) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

const register = async ({ name, email, password }) => {
  if (!name || !email || !password) {
    throw createError('Name, email and password are required', 400);
  }
  const user = await User.create({ name, email, password });
  const token = signToken(user._id);
  return { user, token };
};

const login = async ({ email, password }) => {
  if (!email || !password) {
    throw createError('Email and password are required', 400);
  }
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw createError('Invalid email or password', 401);
  }
  const token = signToken(user._id);
  return { user, token };
};

const getMe = async (userId) => User.findById(userId);

module.exports = { register, login, getMe };
