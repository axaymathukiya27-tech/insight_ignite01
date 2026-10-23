"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readStoredGuidance = readStoredGuidance;
exports.storeGuidance = storeGuidance;
function readStoredGuidance(value) {
    if (Array.isArray(value)) {
        return { courses: value, practiceRecommendations: [], practicePlan: [] };
    }
    const v = (value || {});
    return {
        courses: Array.isArray(v.courses) ? v.courses : [],
        practiceRecommendations: Array.isArray(v.practiceRecommendations) ? v.practiceRecommendations : [],
        practicePlan: Array.isArray(v.practicePlan) ? v.practicePlan : [],
    };
}
function storeGuidance(g) {
    return g;
}
