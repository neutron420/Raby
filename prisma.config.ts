import 'dotenv/config';
import { defineConfig } from "prisma/config";

export default defineConfig({
  // Prisma folder was moved under backend/
  schema: "backend/prisma/schema.prisma",
  migrations: {
    path: "backend/prisma/migrations",
  },
  engine: "classic",
  datasource: {
    url: process.env.DATABASE_URL!,
  },
});
