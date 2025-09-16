"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
// models/CheckResult.ts
const mongoose_1 = __importStar(require("mongoose"));
const CheckResultSchema = new mongoose_1.Schema({
    monitorId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Monitor", required: true, index: true },
    timestamp: { type: Date, default: () => new Date(), index: true },
    statusCode: Number,
    up: { type: Boolean, required: true },
    responseTimeMs: Number,
    error: String,
    headers: mongoose_1.Schema.Types.Mixed,
});
// Indexes:
CheckResultSchema.index({ monitorId: 1, timestamp: -1 });
// TTL: keep raw checks for 90 days (adjust as needed)
CheckResultSchema.index({ timestamp: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });
const CheckResult = mongoose_1.models.CheckResult || mongoose_1.default.model("CheckResult", CheckResultSchema);
exports.default = CheckResult;
