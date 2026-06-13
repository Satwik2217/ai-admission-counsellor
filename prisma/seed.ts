import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const orgSlug = "demo-institute";
  let org = await prisma.organization.findUnique({ where: { slug: orgSlug } });

  if (!org) {
    org = await prisma.organization.create({
      data: {
        name: "Demo Coaching Institute",
        slug: orgSlug,
        phone: "+91 98765 43210",
        email: "info@demoinstitute.com",
        website: "https://demoinstitute.com",
        address: "123, Education Lane, Mumbai - 400001",
        openingTime: "09:00",
        closingTime: "18:00",
        greetingMessage: "Namaste! Welcome to Demo Coaching Institute. How can I help you with your academic journey today?",
        onboardingComplete: true,
        workingDays: JSON.stringify([1, 2, 3, 4, 5, 6]),
        maxBookingsPerSlot: 2,
        appointmentDuration: 60,
        widgetPrimaryColor: "#7C3AED",
        widgetDarkMode: false,
      },
    });
    console.log(`Created organization: ${org.name}`);
  } else {
    console.log(`Organization already exists: ${org.name}`);
  }

  const faqs = [
    { question: "What courses do you offer?", answer: "We offer coaching for JEE Main, JEE Advanced, NEET, MHT-CET, and CBSE board exams (Science stream).", category: "courses" },
    { question: "What is the fee structure?", answer: "Our fee varies by course. JEE Advanced: ₹1,20,000/year, NEET: ₹1,00,000/year, MHT-CET: ₹60,000/year. Discounts available for early enrollment.", category: "fees" },
    { question: "Do you offer hostel facilities?", answer: "Yes, we have separate hostels for boys and girls with 24/7 security, WiFi, and mess facilities. Hostel fee: ₹60,000/year.", category: "hostel" },
    { question: "What is the admission process?", answer: "1) Fill the online application form. 2) Appear for an entrance test. 3) Personal interview. 4) Document verification. 5) Fee payment.", category: "admissions" },
    { question: "Do you offer scholarships?", answer: "Yes! Merit-based scholarships up to 100% tuition fee waiver for top performers in our entrance test. Need-based scholarships also available.", category: "scholarships" },
    { question: "What is the class schedule?", answer: "Regular batches run from 7 AM to 12 PM and 4 PM to 9 PM. Weekend batches available for school-going students.", category: "general" },
    { question: "How can I contact the institute?", answer: "Call us at +91 98765 43210 or email info@demoinstitute.com. You can also visit our campus between 9 AM and 6 PM, Monday to Saturday.", category: "contact" },
  ];

  for (const faq of faqs) {
    const existing = await prisma.fAQ.findFirst({
      where: { organizationId: org.id, question: faq.question },
    });
    if (!existing) {
      await prisma.fAQ.create({
        data: { organizationId: org.id, ...faq },
      });
    }
  }
  console.log(`Seeded ${faqs.length} FAQs`);

  const kbEntries = [
    { title: "JEE Main 2026 Complete Guide", content: "JEE Main is conducted by NTA for admission to NITs, IIITs, and other engineering colleges. The exam is held twice a year (January and April). Paper 1 is for B.E./B.Tech, Paper 2 for B.Arch/B.Planning. Syllabus covers Physics, Chemistry, and Mathematics of Class 11 and 12.", category: "courses" },
    { title: "NEET UG 2026 Complete Guide", content: "NEET UG is the sole entrance exam for MBBS, BDS, and other medical courses in India. Conducted by NTA, the exam covers Physics, Chemistry, and Biology (Zoology + Botany). 180 questions, 720 marks, 3 hours duration.", category: "courses" },
    { title: "Fee Refund Policy", content: "Full refund within 7 days of enrollment. 75% refund within 30 days. No refund after 30 days. Hostel fee is non-refundable after 15 days of joining.", category: "policies" },
    { title: "Study Material Provided", content: "We provide comprehensive study material including theory books, practice workbooks, previous year question papers (last 10 years), and daily practice problem sets. Digital access via our student portal.", category: "courses" },
    { title: "Test Series Details", content: "Weekly chapter-wise tests, monthly full syllabus tests, and a grand test series of 20 full-length mock tests before the final exam. All tests follow the exact pattern of the actual exam.", category: "courses" },
  ];

  for (const kb of kbEntries) {
    const existing = await prisma.knowledgeBase.findFirst({
      where: { organizationId: org.id, title: kb.title },
    });
    if (!existing) {
      await prisma.knowledgeBase.create({
        data: { organizationId: org.id, ...kb },
      });
    }
  }
  console.log(`Seeded ${kbEntries.length} knowledge base entries`);

  await prisma.lead.upsert({
    where: { id: "seed-lead-1" },
    update: {},
    create: {
      id: "seed-lead-1",
      organizationId: org.id,
      name: "Rahul Sharma",
      phone: "+91 98765 43210",
      email: "rahul.sharma@example.com",
      interestedCourse: "JEE Advanced",
      source: "website",
      status: "interested",
      score: 60,
      category: "hot",
    },
  });

  await prisma.lead.upsert({
    where: { id: "seed-lead-2" },
    update: {},
    create: {
      id: "seed-lead-2",
      organizationId: org.id,
      name: "Priya Patel",
      phone: "+91 87654 32109",
      interestedCourse: "NEET",
      source: "referral",
      status: "new",
      score: 20,
      category: "warm",
    },
  });

  await prisma.lead.upsert({
    where: { id: "seed-lead-3" },
    update: {},
    create: {
      id: "seed-lead-3",
      organizationId: org.id,
      name: "Amit Singh",
      email: "amit.singh@example.com",
      source: "chat",
      status: "contacted",
      score: 10,
      category: "cold",
    },
  });

  await prisma.lead.upsert({
    where: { id: "seed-lead-4" },
    update: {},
    create: {
      id: "seed-lead-4",
      organizationId: org.id,
      name: "Neha Gupta",
      phone: "+91 76543 21098",
      email: "neha.gupta@example.com",
      interestedCourse: "MHT-CET",
      source: "walk_in",
      status: "converted",
      score: 30,
      category: "warm",
    },
  });

  await prisma.lead.upsert({
    where: { id: "seed-lead-5" },
    update: {},
    create: {
      id: "seed-lead-5",
      organizationId: org.id,
      name: "Vikram Joshi",
      phone: "+91 65432 10987",
      source: "social_media",
      status: "lost",
      score: 20,
      category: "warm",
    },
  });

  console.log("Seeded 5 demo leads");

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  await prisma.appointment.upsert({
    where: { id: "seed-appt-1" },
    update: {},
    create: {
      id: "seed-appt-1",
      organizationId: org.id,
      leadName: "Rahul Sharma",
      leadPhone: "+91 98765 43210",
      leadEmail: "rahul.sharma@example.com",
      date: tomorrow,
      time: "10:00",
      status: "confirmed",
    },
  });

  await prisma.appointment.upsert({
    where: { id: "seed-appt-2" },
    update: {},
    create: {
      id: "seed-appt-2",
      organizationId: org.id,
      leadName: "Priya Patel",
      leadPhone: "+91 87654 32109",
      date: tomorrow,
      time: "11:00",
      status: "pending",
    },
  });

  await prisma.appointment.upsert({
    where: { id: "seed-appt-3" },
    update: {},
    create: {
      id: "seed-appt-3",
      organizationId: org.id,
      leadName: "Demo Walk-in",
      leadPhone: "+91 99887 76655",
      date: tomorrow,
      time: "14:00",
      status: "pending",
    },
  });

  console.log("Seeded 3 demo appointments");
  console.log("\n✓ Seed complete!");
  console.log(`\nOrganization slug: ${orgSlug}`);
  console.log("Visit /dashboard after signing in to see the demo data.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
