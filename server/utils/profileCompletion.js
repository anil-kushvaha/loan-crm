// ONLY these steps are REQUIRED for 100% profile completion (loan eligibility)
const REQUIRED_STEPS = [
  "personalDetails",
  "addressDetails",
  "employmentDetails",
  "documents",
];

export const calculateProfileCompletion = (applicant) => {
  if (!applicant) return 0;

  // Auto-mark steps as complete if data exists (optional convenience)
  if (
    applicant.personalDetails &&
    Object.keys(applicant.personalDetails).length > 0
  ) {
    applicant.completedSteps.personalDetails = true;
  }
  if (
    applicant.addressDetails &&
    Object.keys(applicant.addressDetails).length > 0
  ) {
    applicant.completedSteps.addressDetails = true;
  }
  if (
    applicant.employmentDetails &&
    Object.keys(applicant.employmentDetails).length > 0
  ) {
    applicant.completedSteps.employmentDetails = true;
  }
  if (applicant.documents && applicant.documents.length > 0) {
    applicant.completedSteps.documents = true;
  }

  let completedCount = 0;
  for (const step of REQUIRED_STEPS) {
    if (applicant.completedSteps && applicant.completedSteps[step] === true) {
      completedCount++;
    }
  }

  const percentage = Math.floor((completedCount / REQUIRED_STEPS.length) * 100);

  applicant.profileCompletion = percentage;
  applicant.profileCompleted = percentage === 100;

  return percentage;
};
