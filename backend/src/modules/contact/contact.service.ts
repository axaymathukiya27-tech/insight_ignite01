import { prisma } from "@insight-ignite/database";
import { ContactInquiryInput } from "@insight-ignite/shared";

export async function createContactInquiry(input: ContactInquiryInput) {
  const inquiry = await prisma.contactInquiry.create({
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

export async function listContactInquiries() {
  const inquiries = await prisma.contactInquiry.findMany({
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
