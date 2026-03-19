import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import * as authService from '../services/auth.service';

export const getAllUsers = async (_req: Request, res: Response) => {
  const users = await authService.getAllUsers();
  res.status(StatusCodes.OK).json({ users, count: users.length });
};

export const getUser = async (req: Request, res: Response) => {
  const user = await authService.getUserById(req.params.id);
  res.status(StatusCodes.OK).json({ user });
};

export const updateUser = async (req: Request, res: Response) => {
  // @ts-ignore
  const user = await authService.updateUser(req.user.userId, req.body);
  res.status(StatusCodes.OK).json({ user });
};
