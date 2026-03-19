import jwt, { SignOptions } from 'jsonwebtoken';
import env from '../config/env';

export const createJWT = (payload: object): string => {
  const options: SignOptions = {
    expiresIn: env.JWT_LIFETIME as SignOptions['expiresIn'],
  };
  return jwt.sign(payload, env.JWT_SECRET, options);
};

export const verifyJWT = (token: string): any => {
  return jwt.verify(token, env.JWT_SECRET);
};
