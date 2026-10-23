/**
 * Site-wide configuration and metadata for Insight Ignite.
 */

export interface NavItem {
  label: string;
  href: string;
  description?: string;
}

export interface ProgramCategory {
  slug: string;
  title: string;
  subtitle: string;
  tagline: string;
  description: string;
  targetAudience: string;
  focusAreas: string[];
  ctaLabel: string;
}

export const siteConfig = {
  name: "Insight Ignite",
  author: "Dr. Nivedita Ganguli",
  authorTitle: "Educator & Student-Support Mentor",
  description:
    "Official developmental and educational platform led by Dr. Nivedita Ganguli. Providing evidence-informed mentorship across parenting & families, adolescent development, educator training, and corporate emotional resilience.",
  contactEmail: "info@insightignite.org",
  navItems: [
    { label: "About", href: "/about" },
    { label: "Programs", href: "/programs" },
    { label: "Courses", href: "/courses" },
    { label: "Assessment", href: "/assessments" },
    { label: "Resources", href: "/resources" },
    { label: "Contact", href: "/contact" },
  ] as NavItem[],
  policyLinks: [
    { label: "Privacy Notice & Child Data Protection", href: "/privacy" },
    { label: "Terms of Service & Platform Governance", href: "/terms" },
    { label: "Refund & Cancellation Policy", href: "/refund-policy" },
  ] as NavItem[],
  links: {
    login: "/login",
    register: "/register",
    forgotPassword: "/forgot-password",
    exploreCourse: "/courses/the-6-powers-of-conscious-parenting",
    parentAssessment: "/assessments",
    learnerDashboard: "/learn",
    adminDashboard: "/admin",
  },
  programs: [
    {
      slug: "parenting-families",
      title: "Parenting & Family Life",
      subtitle: "Conscious Parenting & Co-Regulation",
      tagline: "Cultivating presence, empathy, and shame-free limits at home",
      description:
        "Guiding parents and guardians through conscious parenting frameworks, nervous-system co-regulation, and restorative repair practices that rebuild trust and emotional intimacy in daily family life.",
      targetAudience: "Parents, foster guardians, and extended caregivers",
      focusAreas: [
        "The 6 Powers of Conscious Parenting",
        "Calm Nervous System Co-Regulation",
        "Restorative Family Repair Practices",
        "Empathetic, Predictable Boundary Setting",
      ],
      ctaLabel: "Explore Parenting Course",
    },
    {
      slug: "students-adolescents",
      title: "Students & Adolescents",
      subtitle: "Emotional Wellbeing & Academic Resilience",
      tagline: "Empowering youth with self-efficacy, emotional awareness, and confidence",
      description:
        "Developmental workshops and reflective guidance tailored for secondary and higher-secondary youth navigating academic stress, identity formation, peer pressure, and self-regulation.",
      targetAudience: "Adolescents, high school students, and youth mentors",
      focusAreas: [
        "Stress Inoculation & Exam Calmness",
        "Emotional Intelligence & Self-Advocacy",
        "Digital Wellness & Healthy Screen Boundaries",
        "Peer Relationship Dynamics & Boundary Navigation",
      ],
      ctaLabel: "View Student Offerings",
    },
    {
      slug: "educators-schools",
      title: "Educators & School Development",
      subtitle: "Pedagogical Mentorship & Classroom Observation",
      tagline: "Strengthening teacher wellbeing and supportive classroom systems",
      description:
        "Institutional capacity-building for teachers and school leadership. Establishing non-stigmatizing classroom observation systems, restorative conflict resolution, and teacher emotional self-care.",
      targetAudience: "K-12 educators, school principals, counselors, and academic coordinators",
      focusAreas: [
        "Objective Classroom Observation Protocols",
        "Trauma-Informed School Classrooms",
        "Teacher-Parent Collaborative Communication",
        "Educator Burnout Prevention & Wellbeing",
      ],
      ctaLabel: "Institutional Inquiries",
    },
    {
      slug: "corporate-training",
      title: "Corporate Development",
      subtitle: "Leadership Presence & Emotional Intelligence",
      tagline: "Cultivating psychological safety and calm clarity in executive environments",
      description:
        "Executive masterclasses and organizational training on mindful leadership, emotional co-regulation in high-stakes negotiations, and sustainable stress mastery for corporate teams.",
      targetAudience: "Executive leaders, HR managers, and corporate teams",
      focusAreas: [
        "Mindful Leadership Under Pressure",
        "Cultivating Psychological Safety at Work",
        "Empathetic Communication & Conflict Resolution",
        "Executive Burnout Resilience",
      ],
      ctaLabel: "Corporate Inquiries",
    },
    {
      slug: "educational-resources",
      title: "Educational Resources",
      subtitle: "Guides, Frameworks & Reflective Toolkits",
      tagline: "Freely accessible insights for parents, mentors, and educators",
      description:
        "A curated library of evidence-informed guides, conversation prompt cards, and reflective templates authored by Dr. Nivedita Ganguli to support everyday developmental mentoring.",
      targetAudience: "All learners, parents, educators, and developmental advocates",
      focusAreas: [
        "Printable Family Connection Prompts",
        "Daily Attunement Journal Templates",
        "Classroom Observation Checklists",
        "Developmental Milestone Insight Guides",
      ],
      ctaLabel: "Access Resource Hub",
    },
  ] as ProgramCategory[],
};
