import { Request, Response, NextFunction } from 'express';
import { verifyJWT } from '../utils/jwt';
import { UnauthenticatedError, UnauthorizedError } from '../utils/errors';

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthenticatedError('Token kh?ng h?p l?');
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = verifyJWT(token);
    req.user = {
      userId: payload.userId,
      email: payload.email,
      name: payload.name,
      role: payload.role,
    };
    next();
  } catch {
    throw new UnauthenticatedError('Token h?t h?n ho?c kh?ng h?p l?');
  }
};

export const authorize = (...roles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!roles.includes(req.user!.role)) {
      throw new UnauthorizedError('B?n kh?ng c? quy?n truy c?p');
    }
    next();
  };
};
