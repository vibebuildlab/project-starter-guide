-- Convert role from TEXT to enum
CREATE TYPE "Role" AS ENUM ('user', 'member', 'admin', 'owner');

-- Update existing column to use enum (preserving existing 'user' values)
ALTER TABLE "User"
  ALTER COLUMN "role" TYPE "Role" USING "role"::"Role";

-- Ensure default is still set
ALTER TABLE "User"
  ALTER COLUMN "role" SET DEFAULT 'user'::"Role";
