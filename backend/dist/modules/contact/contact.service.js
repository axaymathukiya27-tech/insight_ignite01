"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createContactInquiry = createContactInquiry;
exports.listContactInquiries = listContactInquiries;
const database_1 = require("@insight-ignite/database");
async function createContactInquiry(input) {
    const inquiry = await database_1.prisma.contactInquiry.create({
        data: {
            name: input.name,
            email: input.email.toLowerCase(),
            phone: input.phone || null,
            organization: input.organization || null,
            inquiryType: input.inquiryType,
            message: input.message,
        },
    });
    return { id: inquiry.id, createdAt: inquiry.createdAt.toISOString() };
}
async function listContactInquiries() {
    const inquiries = await database_1.prisma.contactInquiry.findMany({
        orderBy: { createdAt: "desc" },
        take: 200,
    });
    return inquiries.map((inq) => ({
        id: inq.id,
        name: inq.name,
        email: inq.email,
        phone: inq.phone,
        organization: inq.organization,
        inquiryType: inq.inquiryType,
        message: inq.message,
        status: inq.status,
        createdAt: inq.createdAt.toISOString(),
    }));
}
