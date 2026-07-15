import { z } from "zod";

export const registerSchema = z
  .object({
    displayName: z.string().min(2, "Name must be at least 2 characters").max(100),
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(30)
      .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
    email: z.string().email("Invalid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain an uppercase letter")
      .regex(/[a-z]/, "Password must contain a lowercase letter")
      .regex(/[0-9]/, "Password must contain a number"),
    confirmPassword: z.string(),
    acceptTerms: z.literal(true, { errorMap: () => ({ message: "You must accept the terms" }) }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Token is required"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain an uppercase letter")
      .regex(/[a-z]/, "Password must contain a lowercase letter")
      .regex(/[0-9]/, "Password must contain a number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain an uppercase letter")
      .regex(/[a-z]/, "Password must contain a lowercase letter")
      .regex(/[0-9]/, "Password must contain a number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const courseSchema = z.object({
  title: z.string().min(3).max(200),
  slug: z.string().min(3).max(200).regex(/^[a-z0-9-]+$/),
  description: z.string().min(10),
  shortDescription: z.string().max(500).optional(),
  difficulty: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]),
  category: z.string().min(1),
  isPremium: z.boolean().default(false),
  objectives: z.array(z.string()).optional(),
  prerequisites: z.array(z.string()).optional(),
  estimatedHours: z.number().positive().optional(),
});

export const lessonSchema = z.object({
  title: z.string().min(3).max(200),
  content: z.string().optional(),
  contentType: z.enum(["TEXT", "VIDEO", "MIXED"]).default("TEXT"),
  videoUrl: z.string().url().optional(),
  duration: z.number().positive().optional(),
});

export const assessmentSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().optional(),
  type: z.enum(["QUIZ", "EXAM", "PRACTICAL"]).default("QUIZ"),
  passScore: z.number().min(0).max(100).default(70),
  timeLimit: z.number().positive().optional(),
  maxAttempts: z.number().positive().optional(),
});

export const questionSchema = z.object({
  type: z.enum(["MULTIPLE_CHOICE", "MULTIPLE_ANSWER", "TRUE_FALSE", "SHORT_ANSWER"]),
  question: z.string().min(5),
  explanation: z.string().optional(),
  points: z.number().positive().default(1),
  answerOptions: z.array(
    z.object({
      text: z.string().min(1),
      isCorrect: z.boolean(),
    })
  ).optional(),
});
