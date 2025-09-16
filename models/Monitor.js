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
// models/Monitor.ts
const mongoose_1 = __importStar(require("mongoose"));
const MonitorSchema = new mongoose_1.Schema({
    _id: { type: mongoose_1.Schema.Types.ObjectId, auto: true },
    url: { type: String, required: true },
    name: { type: String },
    frequencySec: { type: Number, required: true, min: 10 }, // keep a min
    timeoutMs: { type: Number, default: 10000 },
    expectedStatusCodes: { type: [Number], default: undefined },
    checkType: { type: String, enum: ["http_ping", "full_page"], default: "http_ping" },
    active: { type: Boolean, default: true },
    lastCheckedAt: { type: Date },
    lastStatusCode: { type: Number },
    lastUp: { type: Boolean },
    createdAt: { type: Date, default: () => new Date() },
});
const Monitor = mongoose_1.models.Monitor || mongoose_1.default.model("Monitor", MonitorSchema);
exports.default = Monitor;
