"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dailyJobFeed = exports.jsearchIngestCategory = void 0;
exports.runJsearchIngest = runJsearchIngest;
/* eslint-disable @typescript-eslint/no-explicit-any */
var client_1 = require("./client");
var prisma_1 = require("../lib/prisma");
var jsearchClient_1 = require("../lib/jsearchClient");
var embeddings_1 = require("../lib/embeddings");
var jobProcessor_1 = require("../lib/jobProcessor");
// env defaults
var DEFAULT_MAX_PAGES = 3;
var DEFAULT_BATCH = 16;
/********************************************************************
 * LOGGING WRAPPER
 ********************************************************************/
function stepLog(step) {
    var args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args[_i - 1] = arguments[_i];
    }
    return __awaiter(this, void 0, void 0, function () {
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 3, , 4]);
                    if (!(step === null || step === void 0 ? void 0 : step.log)) return [3 /*break*/, 2];
                    return [4 /*yield*/, step.log.apply(step, args)];
                case 1: return [2 /*return*/, _b.sent()];
                case 2: return [3 /*break*/, 4];
                case 3:
                    _a = _b.sent();
                    return [3 /*break*/, 4];
                case 4:
                    console.log.apply(console, __spreadArray(['[jsearch-step]'], args, false));
                    return [2 /*return*/, Promise.resolve()];
            }
        });
    });
}
/********************************************************************
 * INGEST A SINGLE CATEGORY
 ********************************************************************/
function ingestOnce(step, categoryId) {
    return __awaiter(this, void 0, void 0, function () {
        var rows, row, category, location, maxPages, batch, page, totalCreated, totalUpdated, _loop_1, state_1;
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p;
        return __generator(this, function (_q) {
            switch (_q.label) {
                case 0:
                    if (!categoryId) return [3 /*break*/, 2];
                    return [4 /*yield*/, prisma_1.default.$queryRaw(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n      UPDATE job_categories\n      SET last_fetched_at = NOW()\n      WHERE active = true AND id = ", "\n      RETURNING id, category, location\n      LIMIT 1\n    "], ["\n      UPDATE job_categories\n      SET last_fetched_at = NOW()\n      WHERE active = true AND id = ", "\n      RETURNING id, category, location\n      LIMIT 1\n    "])), categoryId)];
                case 1:
                    rows = _q.sent();
                    return [3 /*break*/, 4];
                case 2: return [4 /*yield*/, prisma_1.default.$queryRaw(templateObject_2 || (templateObject_2 = __makeTemplateObject(["\n      UPDATE job_categories\n      SET last_fetched_at = NOW()\n      WHERE id = (\n        SELECT id\n        FROM job_categories\n        WHERE active = true\n        ORDER BY COALESCE(last_fetched_at, '1970-01-01') ASC\n        LIMIT 1\n      )\n      RETURNING id, category, location\n    "], ["\n      UPDATE job_categories\n      SET last_fetched_at = NOW()\n      WHERE id = (\n        SELECT id\n        FROM job_categories\n        WHERE active = true\n        ORDER BY COALESCE(last_fetched_at, '1970-01-01') ASC\n        LIMIT 1\n      )\n      RETURNING id, category, location\n    "])))];
                case 3:
                    rows = _q.sent();
                    _q.label = 4;
                case 4:
                    row = rows === null || rows === void 0 ? void 0 : rows[0];
                    if (!!row) return [3 /*break*/, 6];
                    return [4 /*yield*/, stepLog(step, 'jsearch-ingest', 'no active categories')];
                case 5:
                    _q.sent();
                    return [2 /*return*/, { skipped: true }];
                case 6:
                    category = row.category;
                    location = (_a = row.location) !== null && _a !== void 0 ? _a : '';
                    maxPages = Number((_b = process.env.JSEARCH_MAX_PAGES_PER_RUN) !== null && _b !== void 0 ? _b : DEFAULT_MAX_PAGES);
                    batch = Number((_c = process.env.JSEARCH_EMBED_BATCH) !== null && _c !== void 0 ? _c : DEFAULT_BATCH);
                    page = 1;
                    totalCreated = 0;
                    totalUpdated = 0;
                    _loop_1 = function () {
                        var pageRes, err_1, respLists, skillLists, _i, _r, it_1, respCandidates, skillCandidates, respBullets, skillBullets, flatResp, flatSkills, respEmbeddings, skillEmbeddings, err_2, rIdx, sIdx, jobsForStore, res, err_3;
                        return __generator(this, function (_s) {
                            switch (_s.label) {
                                case 0: return [4 /*yield*/, stepLog(step, "fetching page=".concat(page, " category=").concat(category))];
                                case 1:
                                    _s.sent();
                                    pageRes = void 0;
                                    _s.label = 2;
                                case 2:
                                    _s.trys.push([2, 4, , 6]);
                                    return [4 /*yield*/, (0, jsearchClient_1.fetchJobs)(category, location, page)];
                                case 3:
                                    pageRes = _s.sent();
                                    return [3 /*break*/, 6];
                                case 4:
                                    err_1 = _s.sent();
                                    return [4 /*yield*/, stepLog(step, 'fetch-error', String(err_1))];
                                case 5:
                                    _s.sent();
                                    if (String(err_1).includes('rate limited') || String(err_1).includes('429')) {
                                        return [2 /*return*/, { value: { error: 'rate_limited' } }];
                                    }
                                    return [2 /*return*/, "break"];
                                case 6:
                                    if (!((_d = pageRes === null || pageRes === void 0 ? void 0 : pageRes.data) === null || _d === void 0 ? void 0 : _d.length))
                                        return [2 /*return*/, "break"];
                                    respLists = [];
                                    skillLists = [];
                                    for (_i = 0, _r = pageRes.data; _i < _r.length; _i++) {
                                        it_1 = _r[_i];
                                        respCandidates = (_j = (_g = (_f = (_e = it_1.job_highlights) === null || _e === void 0 ? void 0 : _e.Responsibilities) !== null && _f !== void 0 ? _f : it_1.responsibilities) !== null && _g !== void 0 ? _g : (_h = it_1.highlights) === null || _h === void 0 ? void 0 : _h.responsibilities) !== null && _j !== void 0 ? _j : null;
                                        skillCandidates = (_p = (_m = (_l = (_k = it_1.job_highlights) === null || _k === void 0 ? void 0 : _k.Qualifications) !== null && _l !== void 0 ? _l : it_1.qualifications) !== null && _m !== void 0 ? _m : (_o = it_1.highlights) === null || _o === void 0 ? void 0 : _o.qualifications) !== null && _p !== void 0 ? _p : null;
                                        respBullets = Array.isArray(respCandidates)
                                            ? respCandidates.map(function (r) { return String(r).trim(); }).filter(Boolean)
                                            : typeof respCandidates === 'string'
                                                ? respCandidates
                                                    .split(/\r?\n|•|\u2022/)
                                                    .map(function (s) { return s.trim(); })
                                                    .filter(Boolean)
                                                : [];
                                        skillBullets = Array.isArray(skillCandidates)
                                            ? skillCandidates.map(function (s) { return String(s).trim(); }).filter(Boolean)
                                            : typeof skillCandidates === 'string'
                                                ? skillCandidates
                                                    .split(/\r?\n|,|;|•|\u2022/)
                                                    .map(function (s) { return s.trim(); })
                                                    .filter(Boolean)
                                                : [];
                                        respLists.push(respBullets);
                                        skillLists.push(skillBullets);
                                    }
                                    flatResp = respLists.flat();
                                    flatSkills = skillLists.flat();
                                    respEmbeddings = [];
                                    skillEmbeddings = [];
                                    _s.label = 7;
                                case 7:
                                    _s.trys.push([7, 12, , 14]);
                                    if (!flatResp.length) return [3 /*break*/, 9];
                                    return [4 /*yield*/, (0, embeddings_1.embedTexts)(flatResp, batch)];
                                case 8:
                                    respEmbeddings = _s.sent();
                                    _s.label = 9;
                                case 9:
                                    if (!flatSkills.length) return [3 /*break*/, 11];
                                    return [4 /*yield*/, (0, embeddings_1.embedTexts)(flatSkills, batch)];
                                case 10:
                                    skillEmbeddings = _s.sent();
                                    _s.label = 11;
                                case 11: return [3 /*break*/, 14];
                                case 12:
                                    err_2 = _s.sent();
                                    return [4 /*yield*/, stepLog(step, 'embed-error', String(err_2))];
                                case 13:
                                    _s.sent();
                                    return [2 /*return*/, "break"];
                                case 14:
                                    rIdx = 0;
                                    sIdx = 0;
                                    jobsForStore = pageRes.data.map(function (it) {
                                        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x;
                                        var respBullets = respLists.shift() || [];
                                        var skillBullets = skillLists.shift() || [];
                                        var responsibilities_list = respBullets.map(function (text) {
                                            var _a;
                                            return ({
                                                text: text,
                                                embedding: (_a = respEmbeddings[rIdx++]) !== null && _a !== void 0 ? _a : undefined,
                                            });
                                        });
                                        var skills = skillBullets.map(function (text) {
                                            var _a;
                                            return ({
                                                text: text,
                                                embedding: (_a = skillEmbeddings[sIdx++]) !== null && _a !== void 0 ? _a : undefined,
                                                is_required: true,
                                            });
                                        });
                                        return {
                                            job_publisher: (_b = (_a = it.job_publisher) !== null && _a !== void 0 ? _a : it.publisher) !== null && _b !== void 0 ? _b : null,
                                            job_title: (_e = (_d = (_c = it.job_title) !== null && _c !== void 0 ? _c : it.position) !== null && _d !== void 0 ? _d : it.title) !== null && _e !== void 0 ? _e : null,
                                            employer_name: (_g = (_f = it.employer_name) !== null && _f !== void 0 ? _f : it.company) !== null && _g !== void 0 ? _g : null,
                                            employer_logo: (_h = it.employer_logo) !== null && _h !== void 0 ? _h : null,
                                            job_apply_link: (_l = (_k = (_j = it.apply_link) !== null && _j !== void 0 ? _j : it.url) !== null && _k !== void 0 ? _k : it.job_apply_link) !== null && _l !== void 0 ? _l : null,
                                            job_location: (_m = it.job_location) !== null && _m !== void 0 ? _m : null,
                                            job_description: (_o = it.job_description) !== null && _o !== void 0 ? _o : null,
                                            job_posted_at: (_p = it.job_posted_at) !== null && _p !== void 0 ? _p : null,
                                            job_is_remote: (_r = (_q = it.job_is_remote) !== null && _q !== void 0 ? _q : it.remote) !== null && _r !== void 0 ? _r : false,
                                            qualifications: (_u = (_t = (_s = it.job_highlights) === null || _s === void 0 ? void 0 : _s.Qualifications) !== null && _t !== void 0 ? _t : it.qualifications) !== null && _u !== void 0 ? _u : null,
                                            responsibilities: (_x = (_w = (_v = it.job_highlights) === null || _v === void 0 ? void 0 : _v.Responsibilities) !== null && _w !== void 0 ? _w : it.responsibilities) !== null && _x !== void 0 ? _x : null,
                                            skills: skills,
                                            responsibilities_list: responsibilities_list,
                                        };
                                    });
                                    _s.label = 15;
                                case 15:
                                    _s.trys.push([15, 18, , 20]);
                                    return [4 /*yield*/, (0, jobProcessor_1.storeJobs)(jobsForStore)];
                                case 16:
                                    res = _s.sent();
                                    totalCreated += res.created;
                                    totalUpdated += res.updated;
                                    return [4 /*yield*/, stepLog(step, "page=".concat(page, " created=").concat(res.created, " updated=").concat(res.updated))];
                                case 17:
                                    _s.sent();
                                    return [3 /*break*/, 20];
                                case 18:
                                    err_3 = _s.sent();
                                    return [4 /*yield*/, stepLog(step, 'store-error', String(err_3))];
                                case 19:
                                    _s.sent();
                                    return [3 /*break*/, 20];
                                case 20:
                                    page++;
                                    return [2 /*return*/];
                            }
                        });
                    };
                    _q.label = 7;
                case 7:
                    if (!(page <= maxPages)) return [3 /*break*/, 9];
                    return [5 /*yield**/, _loop_1()];
                case 8:
                    state_1 = _q.sent();
                    if (typeof state_1 === "object")
                        return [2 /*return*/, state_1.value];
                    if (state_1 === "break")
                        return [3 /*break*/, 9];
                    return [3 /*break*/, 7];
                case 9: return [2 /*return*/, { created: totalCreated, updated: totalUpdated }];
            }
        });
    });
}
/********************************************************************
 * WORKER FUNCTION FOR A SINGLE CATEGORY (FANOUT TARGET)
 ********************************************************************/
exports.jsearchIngestCategory = client_1.inngest.createFunction({ id: 'jsearch.ingest.category' }, { event: 'jsearch/category.ingest' }, function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
    var categoryId, result;
    var event = _b.event, step = _b.step;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                categoryId = event.data.categoryId;
                return [4 /*yield*/, stepLog(step, "Worker started for category=".concat(categoryId))];
            case 1:
                _c.sent();
                return [4 /*yield*/, ingestOnce(step, categoryId)];
            case 2:
                result = _c.sent();
                return [4 /*yield*/, stepLog(step, "Worker finished category=".concat(categoryId), result)];
            case 3:
                _c.sent();
                return [2 /*return*/, result];
        }
    });
}); });
/********************************************************************
 * DAILY SCHEDULER → FANOUT TO CATEGORY WORKERS
 ********************************************************************/
exports.dailyJobFeed = client_1.inngest.createFunction({ id: 'jsearch-daily-feed' }, { cron: '0 8 * * *', timezone: 'UTC' }, function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
    var categories;
    var step = _b.step;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0: return [4 /*yield*/, stepLog(step, 'daily-job-feed:start')];
            case 1:
                _c.sent();
                return [4 /*yield*/, prisma_1.default.job_categories.findMany({
                        where: { active: true },
                        select: { id: true },
                    })];
            case 2:
                categories = _c.sent();
                return [4 /*yield*/, stepLog(step, "fanout \u2192 ".concat(categories.length, " categories"))
                    // FANOUT: send event for each category
                ];
            case 3:
                _c.sent();
                // FANOUT: send event for each category
                return [4 /*yield*/, Promise.all(categories.map(function (cat) {
                        return step.sendEvent('jsearch/category.ingest', { categoryId: cat.id });
                    }))];
            case 4:
                // FANOUT: send event for each category
                _c.sent();
                return [4 /*yield*/, stepLog(step, 'daily-job-feed:dispatched')];
            case 5:
                _c.sent();
                return [2 /*return*/, { dispatched: categories.length }];
        }
    });
}); });
/********************************************************************
 * MANUAL TEST FUNCTION
 ********************************************************************/
function runJsearchIngest(categoryId) {
    return __awaiter(this, void 0, void 0, function () {
        var fakeStep;
        var _this = this;
        return __generator(this, function (_a) {
            fakeStep = {
                log: function () {
                    var args = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        args[_i] = arguments[_i];
                    }
                    return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                        return [2 /*return*/, console.log.apply(console, __spreadArray(['[manual-ingest]'], args, false))];
                    }); });
                },
            };
            return [2 /*return*/, ingestOnce(fakeStep, categoryId)];
        });
    });
}
var templateObject_1, templateObject_2;
