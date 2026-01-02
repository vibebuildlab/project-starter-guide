-- Add role to User
ALTER TABLE "User" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'user';
