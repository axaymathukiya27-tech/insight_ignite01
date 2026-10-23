"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleGetPublicCourses = handleGetPublicCourses;
exports.handleGetPublicCourseBySlug = handleGetPublicCourseBySlug;
exports.handleGetAdminCourses = handleGetAdminCourses;
exports.handleGetAdminCourseById = handleGetAdminCourseById;
exports.handleCreateCourse = handleCreateCourse;
exports.handleUpdateCourse = handleUpdateCourse;
exports.handlePublishCourse = handlePublishCourse;
exports.handleUnpublishCourse = handleUnpublishCourse;
const courses_service_1 = require("./courses.service");
const response_1 = require("../../utils/response");
const database_1 = require("@insight-ignite/database");
async function handleGetPublicCourses(req, res, next) {
    try {
        const requestId = req.headers["x-request-id"];
        const courses = await (0, courses_service_1.getPublishedCourses)();
        (0, response_1.sendSuccess)(res, { courses }, undefined, 200, requestId);
    }
    catch (error) {
        next(error);
    }
}
async function handleGetPublicCourseBySlug(req, res, next) {
    try {
        const requestId = req.headers["x-request-id"];
        const { slug } = req.params;
        const course = await (0, courses_service_1.getPublishedCourseBySlug)(slug);
        if (!course) {
            (0, response_1.sendError)(res, `Course '${slug}' not found or not published`, 404, "NOT_FOUND", requestId);
            return;
        }
        (0, response_1.sendSuccess)(res, { course }, undefined, 200, requestId);
    }
    catch (error) {
        next(error);
    }
}
async function handleGetAdminCourses(req, res, next) {
    try {
        const requestId = req.headers["x-request-id"];
        const courses = await (0, courses_service_1.getAdminCourses)();
        (0, response_1.sendSuccess)(res, { courses }, undefined, 200, requestId);
    }
    catch (error) {
        next(error);
    }
}
async function handleGetAdminCourseById(req, res, next) {
    try {
        const requestId = req.headers["x-request-id"];
        const { id } = req.params;
        const course = await (0, courses_service_1.getAdminCourseById)(id);
        if (!course) {
            (0, response_1.sendError)(res, "Course not found", 404, "NOT_FOUND", requestId);
            return;
        }
        (0, response_1.sendSuccess)(res, { course }, undefined, 200, requestId);
    }
    catch (error) {
        next(error);
    }
}
async function handleCreateCourse(req, res, next) {
    try {
        const requestId = req.headers["x-request-id"];
        const course = await (0, courses_service_1.createCourse)(req.body);
        (0, response_1.sendSuccess)(res, { course }, "Course created successfully.", 201, requestId);
    }
    catch (error) {
        next(error);
    }
}
async function handleUpdateCourse(req, res, next) {
    try {
        const requestId = req.headers["x-request-id"];
        const { id } = req.params;
        const course = await (0, courses_service_1.updateCourse)(id, req.body);
        (0, response_1.sendSuccess)(res, { course }, "Course updated successfully.", 200, requestId);
    }
    catch (error) {
        next(error);
    }
}
async function handlePublishCourse(req, res, next) {
    try {
        const requestId = req.headers["x-request-id"];
        const { id } = req.params;
        const course = await (0, courses_service_1.setCourseStatus)(id, database_1.CourseStatus.PUBLISHED);
        (0, response_1.sendSuccess)(res, { course }, "Course published successfully.", 200, requestId);
    }
    catch (error) {
        next(error);
    }
}
async function handleUnpublishCourse(req, res, next) {
    try {
        const requestId = req.headers["x-request-id"];
        const { id } = req.params;
        const course = await (0, courses_service_1.setCourseStatus)(id, database_1.CourseStatus.DRAFT);
        (0, response_1.sendSuccess)(res, { course }, "Course unpublished (set to draft).", 200, requestId);
    }
    catch (error) {
        next(error);
    }
}
