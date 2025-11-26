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
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.embedTexts = embedTexts;
exports.embedText = embedText;
var OPENAI_KEY = process.env.OPENAI_API_KEY;
var OPENAI_BASE = ((_a = process.env.OPENAI_BASE_URL) !== null && _a !== void 0 ? _a : 'https://api.openai.com/v1').replace(/\/+$/, '');
var EMBEDDING_MODEL = (_b = process.env.EMBEDDING_MODEL) !== null && _b !== void 0 ? _b : 'text-embedding-3-small';
function sleep(ms) {
    return new Promise(function (r) { return setTimeout(r, ms); });
}
function callEmbeddings(inputs) {
    return __awaiter(this, void 0, void 0, function () {
        var url, body, res, text, json, data;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!OPENAI_KEY)
                        throw new Error('OPENAI_API_KEY not configured');
                    url = "".concat(OPENAI_BASE, "/embeddings");
                    body = { model: EMBEDDING_MODEL, input: inputs };
                    return [4 /*yield*/, fetch(url, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', Authorization: "Bearer ".concat(OPENAI_KEY) },
                            body: JSON.stringify(body)
                        })];
                case 1:
                    res = _b.sent();
                    if (!!res.ok) return [3 /*break*/, 3];
                    return [4 /*yield*/, res.text()];
                case 2:
                    text = _b.sent();
                    throw new Error("OpenAI embeddings error ".concat(res.status, ": ").concat(text));
                case 3: return [4 /*yield*/, res.json()];
                case 4:
                    json = _b.sent();
                    data = (_a = json === null || json === void 0 ? void 0 : json.data) !== null && _a !== void 0 ? _a : [];
                    return [2 /*return*/, data.map(function (d) { return d.embedding; })];
            }
        });
    });
}
function embedTexts(texts_1) {
    return __awaiter(this, arguments, void 0, function (texts, batchSize) {
        var out, i, chunk, attempt, backoff, res, err_1;
        if (batchSize === void 0) { batchSize = 16; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    out = [];
                    i = 0;
                    _a.label = 1;
                case 1:
                    if (!(i < texts.length)) return [3 /*break*/, 9];
                    chunk = texts.slice(i, i + batchSize);
                    attempt = 0;
                    backoff = 500;
                    _a.label = 2;
                case 2:
                    if (!true) return [3 /*break*/, 8];
                    _a.label = 3;
                case 3:
                    _a.trys.push([3, 5, , 7]);
                    return [4 /*yield*/, callEmbeddings(chunk)];
                case 4:
                    res = _a.sent();
                    out.push.apply(out, res);
                    return [3 /*break*/, 8];
                case 5:
                    err_1 = _a.sent();
                    attempt += 1;
                    if (attempt >= 3)
                        throw err_1;
                    return [4 /*yield*/, sleep(backoff)];
                case 6:
                    _a.sent();
                    backoff *= 2;
                    return [3 /*break*/, 7];
                case 7: return [3 /*break*/, 2];
                case 8:
                    i += batchSize;
                    return [3 /*break*/, 1];
                case 9: return [2 /*return*/, out];
            }
        });
    });
}
function embedText(text) {
    return __awaiter(this, void 0, void 0, function () {
        var r;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, embedTexts([text], 1)];
                case 1:
                    r = _b.sent();
                    return [2 /*return*/, (_a = r[0]) !== null && _a !== void 0 ? _a : []];
            }
        });
    });
}
exports.default = { embedText: embedText, embedTexts: embedTexts };
