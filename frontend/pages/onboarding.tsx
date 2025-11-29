import OnboardingWizard from '../components/OnboardingWizard';

// Onboarding is public; global Nav is already rendered in _app.tsx, so avoid duplicate navigation/header.
export default function OnboardingPage() {
  return <OnboardingWizard />;
}
