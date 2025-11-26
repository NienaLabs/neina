"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var prisma_1 = require("../lib/prisma");
var jobs_1 = require("../inngest/jobs");
// Usage:
//  npx ts-node scripts/run-jsearch.ts [categoryId] [--seed] [categoryName] [location]
// Examples:
//  npx ts-node scripts/run-jsearch.ts software-engineer --seed "Software Engineer" "United States"
//  CATEGORY_ID=software-engineer SEED=true npx ts-node scripts/run-jsearch.ts
var args = process.argv.slice(2);
var overrideCategoryId = args[0] || process.env.TEST_CATEGORY_ID;
var seedFlag = args.includes('--seed') || process.env.SEED === 'true';
// Optional category name and location (when seeding)
var maybeName = args[args.indexOf('--seed') + 1] || process.env.TEST_CATEGORY_NAME;
var maybeLocation = args[args.indexOf('--seed') + 2] || process.env.TEST_CATEGORY_LOCATION;
function ensureCategory(id, name, location) {
    return __awaiter(this, void 0, void 0, function () {
        var existing, category, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!id)
                        return [2 /*return*/];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, prisma_1.default.job_categories.findUnique({ where: { id: id } }).catch(function () { return null; })];
                case 2:
                    existing = _a.sent();
                    if (existing)
                        return [2 /*return*/];
                    category = name !== null && name !== void 0 ? name : id;
                    return [4 /*yield*/, prisma_1.default.job_categories.create({ data: { id: id, category: category, location: location !== null && location !== void 0 ? location : null } })];
                case 3:
                    _a.sent();
                    console.log('[run-jsearch] seeded job_categories', { id: id, category: category, location: location });
                    return [3 /*break*/, 5];
                case 4:
                    err_1 = _a.sent();
                    console.error('[run-jsearch] seed failed (do you have migrations applied?)', String(err_1));
                    throw err_1;
                case 5: return [2 /*return*/];
            }
        });
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var result, err_2, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    console.log('[run-jsearch] starting manual ingest', { overrideCategoryId: overrideCategoryId, seedFlag: seedFlag });
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 5, 6, 10]);
                    if (!(seedFlag && overrideCategoryId)) return [3 /*break*/, 3];
                    return [4 /*yield*/, ensureCategory(overrideCategoryId, maybeName, maybeLocation)];
                case 2:
                    _b.sent();
                    _b.label = 3;
                case 3: return [4 /*yield*/, (0, jobs_1.runJsearchIngest)(overrideCategoryId)];
                case 4:
                    result = _b.sent();
                    console.log('[run-jsearch] result:', JSON.stringify(result, null, 2));
                    return [3 /*break*/, 10];
                case 5:
                    err_2 = _b.sent();
                    console.error('[run-jsearch] failed:', err_2);
                    process.exitCode = 1;
                    return [3 /*break*/, 10];
                case 6:
                    _b.trys.push([6, 8, , 9]);
                    return [4 /*yield*/, prisma_1.default.$disconnect()];
                case 7:
                    _b.sent();
                    return [3 /*break*/, 9];
                case 8:
                    _a = _b.sent();
                    return [3 /*break*/, 9];
                case 9: return [7 /*endfinally*/];
                case 10: return [2 /*return*/];
            }
        });
    });
}
main();
