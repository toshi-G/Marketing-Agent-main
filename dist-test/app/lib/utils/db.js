"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testDatabaseConnection = testDatabaseConnection;
exports.closeDatabaseConnection = closeDatabaseConnection;
const client_1 = require("@prisma/client");
// 環境変数の検証
if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set. Please check your .env file.');
}
// Prismaクライアントの設定
const createPrismaClient = () => {
    return new client_1.PrismaClient({
        log: process.env.NODE_ENV === 'development'
            ? ['query', 'info', 'warn', 'error']
            : ['error'],
        datasources: {
            db: {
                url: process.env.DATABASE_URL,
            },
        },
    });
};
// シングルトンパターンでPrismaクライアントを管理
const prisma = global.prisma || createPrismaClient();
// 開発環境ではホットリロード対応
if (process.env.NODE_ENV !== 'production') {
    global.prisma = prisma;
}
// 接続テスト関数
async function testDatabaseConnection() {
    try {
        await prisma.$connect();
        console.log('✅ Database connection successful');
        return true;
    }
    catch (error) {
        console.error('❌ Database connection failed:', error);
        return false;
    }
}
// 安全なシャットダウン関数
async function closeDatabaseConnection() {
    try {
        await prisma.$disconnect();
        console.log('✅ Database connection closed');
    }
    catch (error) {
        console.error('❌ Error closing database connection:', error);
    }
}
exports.default = prisma;
