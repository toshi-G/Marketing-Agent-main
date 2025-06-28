"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTemplateSchema = exports.startWorkflowSchema = void 0;
const zod_1 = require("zod");
exports.startWorkflowSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).optional(),
    initialInput: zod_1.z
        .object({
        targetGenre: zod_1.z.string().min(1).optional(),
        keywords: zod_1.z.array(zod_1.z.string()).optional(),
    })
        .optional(),
});
exports.createTemplateSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    category: zod_1.z.string().min(1),
    type: zod_1.z.string().min(1),
    content: zod_1.z.any(),
    performance: zod_1.z.any().optional(),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
});
