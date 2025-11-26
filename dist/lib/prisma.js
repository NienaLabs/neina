"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("./generated/prisma/client");
var extension_accelerate_1 = require("@prisma/extension-accelerate");
var globalForPrisma = global;
var prisma = globalForPrisma.prisma || new client_1.PrismaClient().$extends((0, extension_accelerate_1.withAccelerate)());
if (process.env.NODE_ENV !== 'production')
    globalForPrisma.prisma = prisma;
exports.default = prisma;
