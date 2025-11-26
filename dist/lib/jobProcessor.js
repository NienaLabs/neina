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
Object.defineProperty(exports, "__esModule", { value: true });
exports.storeJobs = storeJobs;
var prisma_1 = require("./prisma");
function vectorLiteral(vec) {
    return '[' + vec.map(function (v) { return String(v); }).join(',') + ']';
}
function storeJobs(jobs) {
    return __awaiter(this, void 0, void 0, function () {
        var results, _loop_1, _i, jobs_1, job;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    results = { created: 0, updated: 0 };
                    _loop_1 = function (job) {
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0: 
                                // Wrap per-job operations in a transaction to avoid partial writes
                                return [4 /*yield*/, prisma_1.default.$transaction(function (tx) { return __awaiter(_this, void 0, void 0, function () {
                                        var existing, _a, _i, _b, s, created, lit, _c, _d, r, created, lit, createdJob, _e, _f, s, created, lit, _g, _h, r, created, lit;
                                        var _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8;
                                        return __generator(this, function (_9) {
                                            switch (_9.label) {
                                                case 0:
                                                    if (!job.job_apply_link) return [3 /*break*/, 2];
                                                    return [4 /*yield*/, tx.jobs.findFirst({ where: { job_apply_link: job.job_apply_link } })];
                                                case 1:
                                                    _a = _9.sent();
                                                    return [3 /*break*/, 4];
                                                case 2: return [4 /*yield*/, tx.jobs.findFirst({ where: { job_title: (_j = job.job_title) !== null && _j !== void 0 ? _j : undefined, employer_name: (_k = job.employer_name) !== null && _k !== void 0 ? _k : undefined, job_location: (_l = job.job_location) !== null && _l !== void 0 ? _l : undefined } })];
                                                case 3:
                                                    _a = _9.sent();
                                                    _9.label = 4;
                                                case 4:
                                                    existing = _a;
                                                    if (!existing) return [3 /*break*/, 18];
                                                    return [4 /*yield*/, tx.jobs.update({ where: { id: existing.id }, data: { job_publisher: (_m = job.job_publisher) !== null && _m !== void 0 ? _m : undefined, job_title: (_o = job.job_title) !== null && _o !== void 0 ? _o : undefined, employer_name: (_p = job.employer_name) !== null && _p !== void 0 ? _p : undefined, employer_logo: (_q = job.employer_logo) !== null && _q !== void 0 ? _q : undefined, job_apply_link: (_r = job.job_apply_link) !== null && _r !== void 0 ? _r : undefined, job_location: (_s = job.job_location) !== null && _s !== void 0 ? _s : undefined, job_description: (_t = job.job_description) !== null && _t !== void 0 ? _t : undefined, job_posted_at: job.job_posted_at ? new Date(job.job_posted_at) : undefined, job_is_remote: (_u = job.job_is_remote) !== null && _u !== void 0 ? _u : undefined, qualifications: (_v = job.qualifications) !== null && _v !== void 0 ? _v : undefined, responsibilities: (_w = job.responsibilities) !== null && _w !== void 0 ? _w : undefined } })];
                                                case 5:
                                                    _9.sent();
                                                    return [4 /*yield*/, tx.job_skills.deleteMany({ where: { job_id: existing.id } })];
                                                case 6:
                                                    _9.sent();
                                                    return [4 /*yield*/, tx.job_responsibilities.deleteMany({ where: { job_id: existing.id } })];
                                                case 7:
                                                    _9.sent();
                                                    if (!(job.skills && job.skills.length)) return [3 /*break*/, 12];
                                                    _i = 0, _b = job.skills;
                                                    _9.label = 8;
                                                case 8:
                                                    if (!(_i < _b.length)) return [3 /*break*/, 12];
                                                    s = _b[_i];
                                                    return [4 /*yield*/, tx.job_skills.create({ data: { job_id: existing.id, skill_text: s.text, is_required: (_x = s.is_required) !== null && _x !== void 0 ? _x : true } })];
                                                case 9:
                                                    created = _9.sent();
                                                    if (!(s.embedding && s.embedding.length)) return [3 /*break*/, 11];
                                                    lit = vectorLiteral(s.embedding);
                                                    // parameterize the vector literal and id
                                                    return [4 /*yield*/, tx.$executeRaw(templateObject_1 || (templateObject_1 = __makeTemplateObject(["UPDATE job_skills SET embedding = ", "::vector WHERE id = ", ""], ["UPDATE job_skills SET embedding = ", "::vector WHERE id = ", ""])), lit, created.id)];
                                                case 10:
                                                    // parameterize the vector literal and id
                                                    _9.sent();
                                                    _9.label = 11;
                                                case 11:
                                                    _i++;
                                                    return [3 /*break*/, 8];
                                                case 12:
                                                    if (!(job.responsibilities_list && job.responsibilities_list.length)) return [3 /*break*/, 17];
                                                    _c = 0, _d = job.responsibilities_list;
                                                    _9.label = 13;
                                                case 13:
                                                    if (!(_c < _d.length)) return [3 /*break*/, 17];
                                                    r = _d[_c];
                                                    return [4 /*yield*/, tx.job_responsibilities.create({ data: { job_id: existing.id, bullet_text: r.text } })];
                                                case 14:
                                                    created = _9.sent();
                                                    if (!(r.embedding && r.embedding.length)) return [3 /*break*/, 16];
                                                    lit = vectorLiteral(r.embedding);
                                                    return [4 /*yield*/, tx.$executeRaw(templateObject_2 || (templateObject_2 = __makeTemplateObject(["UPDATE job_responsibilities SET embedding = ", "::vector WHERE id = ", ""], ["UPDATE job_responsibilities SET embedding = ", "::vector WHERE id = ", ""])), lit, created.id)];
                                                case 15:
                                                    _9.sent();
                                                    _9.label = 16;
                                                case 16:
                                                    _c++;
                                                    return [3 /*break*/, 13];
                                                case 17:
                                                    results.updated += 1;
                                                    return [3 /*break*/, 30];
                                                case 18: return [4 /*yield*/, tx.jobs.create({ data: { job_publisher: (_y = job.job_publisher) !== null && _y !== void 0 ? _y : undefined, job_title: (_z = job.job_title) !== null && _z !== void 0 ? _z : undefined, employer_name: (_0 = job.employer_name) !== null && _0 !== void 0 ? _0 : undefined, employer_logo: (_1 = job.employer_logo) !== null && _1 !== void 0 ? _1 : undefined, job_apply_link: (_2 = job.job_apply_link) !== null && _2 !== void 0 ? _2 : undefined, job_location: (_3 = job.job_location) !== null && _3 !== void 0 ? _3 : undefined, job_description: (_4 = job.job_description) !== null && _4 !== void 0 ? _4 : undefined, job_posted_at: job.job_posted_at ? new Date(job.job_posted_at) : undefined, job_is_remote: (_5 = job.job_is_remote) !== null && _5 !== void 0 ? _5 : undefined, qualifications: (_6 = job.qualifications) !== null && _6 !== void 0 ? _6 : undefined, responsibilities: (_7 = job.responsibilities) !== null && _7 !== void 0 ? _7 : undefined } })];
                                                case 19:
                                                    createdJob = _9.sent();
                                                    if (!(job.skills && job.skills.length)) return [3 /*break*/, 24];
                                                    _e = 0, _f = job.skills;
                                                    _9.label = 20;
                                                case 20:
                                                    if (!(_e < _f.length)) return [3 /*break*/, 24];
                                                    s = _f[_e];
                                                    return [4 /*yield*/, tx.job_skills.create({ data: { job_id: createdJob.id, skill_text: s.text, is_required: (_8 = s.is_required) !== null && _8 !== void 0 ? _8 : true } })];
                                                case 21:
                                                    created = _9.sent();
                                                    if (!(s.embedding && s.embedding.length)) return [3 /*break*/, 23];
                                                    lit = vectorLiteral(s.embedding);
                                                    return [4 /*yield*/, tx.$executeRaw(templateObject_3 || (templateObject_3 = __makeTemplateObject(["UPDATE job_skills SET embedding = ", "::vector WHERE id = ", ""], ["UPDATE job_skills SET embedding = ", "::vector WHERE id = ", ""])), lit, created.id)];
                                                case 22:
                                                    _9.sent();
                                                    _9.label = 23;
                                                case 23:
                                                    _e++;
                                                    return [3 /*break*/, 20];
                                                case 24:
                                                    if (!(job.responsibilities_list && job.responsibilities_list.length)) return [3 /*break*/, 29];
                                                    _g = 0, _h = job.responsibilities_list;
                                                    _9.label = 25;
                                                case 25:
                                                    if (!(_g < _h.length)) return [3 /*break*/, 29];
                                                    r = _h[_g];
                                                    return [4 /*yield*/, tx.job_responsibilities.create({ data: { job_id: createdJob.id, bullet_text: r.text } })];
                                                case 26:
                                                    created = _9.sent();
                                                    if (!(r.embedding && r.embedding.length)) return [3 /*break*/, 28];
                                                    lit = vectorLiteral(r.embedding);
                                                    return [4 /*yield*/, tx.$executeRaw(templateObject_4 || (templateObject_4 = __makeTemplateObject(["UPDATE job_responsibilities SET embedding = ", "::vector WHERE id = ", ""], ["UPDATE job_responsibilities SET embedding = ", "::vector WHERE id = ", ""])), lit, created.id)];
                                                case 27:
                                                    _9.sent();
                                                    _9.label = 28;
                                                case 28:
                                                    _g++;
                                                    return [3 /*break*/, 25];
                                                case 29:
                                                    results.created += 1;
                                                    _9.label = 30;
                                                case 30: return [2 /*return*/];
                                            }
                                        });
                                    }); })];
                                case 1:
                                    // Wrap per-job operations in a transaction to avoid partial writes
                                    _b.sent();
                                    return [2 /*return*/];
                            }
                        });
                    };
                    _i = 0, jobs_1 = jobs;
                    _a.label = 1;
                case 1:
                    if (!(_i < jobs_1.length)) return [3 /*break*/, 4];
                    job = jobs_1[_i];
                    return [5 /*yield**/, _loop_1(job)];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4: return [2 /*return*/, results];
            }
        });
    });
}
exports.default = { storeJobs: storeJobs };
var templateObject_1, templateObject_2, templateObject_3, templateObject_4;
