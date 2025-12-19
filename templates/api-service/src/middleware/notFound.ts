import { Request, Response, NextFunction } from "express";

export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = new Error(`Not found - ${req.originalUrl}`);
  res.status(404);
  (error as Error & { statusCode?: number }).statusCode = 404;
  next(error);
};
