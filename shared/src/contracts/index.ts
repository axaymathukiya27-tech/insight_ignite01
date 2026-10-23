export interface ContactSubmissionPayload {
  name: string;
  email: string;
  interestCategory: "parenting" | "adolescent" | "schools" | "corporate" | "general";
  message: string;
}
