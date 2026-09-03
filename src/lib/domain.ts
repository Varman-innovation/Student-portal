export type OnboardingFieldType = "text" | "select" | "phone";

export type OnboardingField = {
  key: keyof StudentProfile;
  label: string;
  type: OnboardingFieldType;
  step: 1 | 2;
  required: boolean;
  placeholder?: string;
  options?: string[];
  readOnly?: boolean;
};

export type StudentProfile = {
  full_name?: string;
  college_name?: string;
  region?: string;
  language?: string;
  phone?: string;
  degree?: string;
  branch?: string;
  year_of_study?: string;
  primary_interest?: string;
};

export type Student = {
  id: string;
  mobile: string;
  created_at: string;
  verified_at?: string;
  onboarding_started_at?: string;
  onboarding_completed_at?: string;
  onboarding_step: number;
  profile: StudentProfile;
  last_activity_at: string;
  source?: string;
  campaign?: string;
};

export type WebinarStatus = "draft" | "scheduled" | "live" | "completed" | "cancelled";

export type Webinar = {
  id: string;
  title: string;
  description: string;
  starts_at: string;
  duration_minutes: number;
  timezone: string;
  meeting_url: string;
  status: WebinarStatus;
  capacity?: number;
  created_at: string;
};

export type Registration = {
  id: string;
  student_id: string;
  webinar_id: string;
  registered_at: string;
  join_clicked_at?: string;
};

export type EventType =
  | "student_created"
  | "otp_requested"
  | "otp_verified"
  | "onboarding_started"
  | "onboarding_step_completed"
  | "onboarding_completed"
  | "webinar_viewed"
  | "webinar_registered"
  | "webinar_join_clicked";

export type ActivityEvent = {
  id: string;
  student_id: string;
  event_type: EventType;
  created_at: string;
  webinar_id?: string;
  metadata?: Record<string, unknown>;
};

export type Funnel = {
  students: number;
  verified: number;
  onboarding_completed: number;
  registered: number;
  join_clicked: number;
};

export const onboardingFields: OnboardingField[] = [
  { key: "full_name", label: "Full name", type: "text", step: 1, required: true, placeholder: "Enter your full name" },
  { key: "college_name", label: "College or institution", type: "text", step: 1, required: true, placeholder: "Enter your college name" },
  {
    key: "language",
    label: "Preferred language",
    type: "select",
    step: 1,
    required: true,
    options: ["Tamil", "English", "Telugu", "Kannada", "Malayalam", "Hindi", "Other"]
  },
  {
    key: "degree",
    label: "Degree (optional)",
    type: "select",
    step: 2,
    required: false,
    options: ["B.Tech / B.E", "B.Sc", "B.Com", "BBA", "BA", "Diploma", "MBA", "M.Tech", "Other"]
  },
  {
    key: "year_of_study",
    label: "Year of study",
    type: "select",
    step: 2,
    required: true,
    options: ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year", "Graduated", "Other"]
  },
  {
    key: "primary_interest",
    label: "What would you most like help with?",
    type: "select",
    step: 2,
    required: true,
    options: ["Finding a startup idea", "Validating my idea", "Building an MVP", "Finding a team", "Launching and getting users", "Exploring entrepreneurship"]
  }
];

export type WebinarPhase = "upcoming" | "joinable" | "ended";

export function webinarPhase(webinar: Pick<Webinar, "starts_at" | "duration_minutes">, reference = new Date()): WebinarPhase {
  const startsAt = new Date(webinar.starts_at).getTime();
  const nowAt = reference.getTime();
  if (nowAt < startsAt - 10 * 60 * 1000) return "upcoming";
  if (nowAt <= startsAt + (webinar.duration_minutes + 30) * 60 * 1000) return "joinable";
  return "ended";
}

export function normalizeIndianMobile(value: string) {
  const digits = value.replace(/\D/g, "");
  const local = digits.startsWith("91") && digits.length === 12 ? digits.slice(2) : digits;
  if (!/^[6-9]\d{9}$/.test(local)) throw new Error("Enter a valid 10-digit Indian mobile number");
  return `+91${local}`;
}

export function percent(part: number, total: number) {
  return total === 0 ? 0 : Math.round((part / total) * 1000) / 10;
}

export function nextStudentPath(student: Student) {
  if (!student.verified_at) return "/verify";
  if (!student.onboarding_completed_at) return "/onboarding";
  return "/webinar";
}
