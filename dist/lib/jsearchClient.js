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
exports.fetchJobs = fetchJobs;
var JSEARCH_BASE = process.env.JSEARCH_BASE_URL;
var JSEARCH_KEY = process.env.JSEARCH_API_KEY;
function sleep(ms) {
    return new Promise(function (r) { return setTimeout(r, ms); });
}
function fetchJobs(query_1) {
    return __awaiter(this, arguments, void 0, function (query, location, page, maxRetries) {
        var base, url, attempt, backoff, res, text, json, data, err_1;
        var _a, _b, _c, _d;
        if (location === void 0) { location = ''; }
        if (page === void 0) { page = 1; }
        if (maxRetries === void 0) { maxRetries = 3; }
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    if (!JSEARCH_BASE || !JSEARCH_KEY) {
                        throw new Error('JSEARCH_BASE_URL or JSEARCH_API_KEY not configured');
                    }
                    base = JSEARCH_BASE.replace(/\/+$/, '');
                    url = "".concat(base, "/search?query=").concat(encodeURIComponent(query), "&page=").concat(page).concat(location ? "&location=".concat(encodeURIComponent(location), "&fields=").concat(encodeURIComponent("employer_name,job_publisher,job_title,job_country,job_description,job_posted_at,job_highlights,job_is_remote")) : '');
                    attempt = 0;
                    backoff = 800;
                    _e.label = 1;
                case 1:
                    if (!(attempt <= maxRetries)) return [3 /*break*/, 10];
                    _e.label = 2;
                case 2:
                    _e.trys.push([2, 7, , 9]);
                    return [4 /*yield*/, fetch(url, {
                            method: 'GET',
                            headers: {
                                'x-api-key': String(JSEARCH_KEY),
                            }
                        })];
                case 3:
                    res = _e.sent();
                    if (res.status === 429) {
                        throw new Error('JSearch rate limited (429)');
                    }
                    if (!!res.ok) return [3 /*break*/, 5];
                    return [4 /*yield*/, res.text()];
                case 4:
                    text = _e.sent();
                    throw new Error("JSearch error ".concat(res.status, ": ").concat(text));
                case 5: return [4 /*yield*/, res.json()];
                case 6:
                    json = (_e.sent());
                    data = (_b = (_a = json === null || json === void 0 ? void 0 : json.data) !== null && _a !== void 0 ? _a : json === null || json === void 0 ? void 0 : json.jobs) !== null && _b !== void 0 ? _b : [];
                    return [2 /*return*/, { data: data, num_pages: (_d = (_c = json === null || json === void 0 ? void 0 : json.num_pages) !== null && _c !== void 0 ? _c : json === null || json === void 0 ? void 0 : json.num_pages) !== null && _d !== void 0 ? _d : undefined, page: page }];
                case 7:
                    err_1 = _e.sent();
                    attempt += 1;
                    if (attempt > maxRetries)
                        throw err_1;
                    return [4 /*yield*/, sleep(backoff)];
                case 8:
                    _e.sent();
                    backoff *= 2;
                    return [3 /*break*/, 9];
                case 9: return [3 /*break*/, 1];
                case 10: return [2 /*return*/, { data: [], page: page }];
            }
        });
    });
}
exports.default = fetchJobs;
