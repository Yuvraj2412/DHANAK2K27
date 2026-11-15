import SimplePageShell from '../components/SimplePageShell';
import AboutConceptStory from './AboutConceptStory';

export const metadata = {
  title: 'About | Dhanak IIST',
  description:
    'The chronicle, spirit, and theme of Dhanak — the annual cultural festival of the Indian Institute of Space Science and Technology (IIST).',
};

export default function AboutPage() {
  return (
    <SimplePageShell
      eyebrow="Dhanak 2027 · IIST Valiamala"
      title="About Dhanak"
      subtitle="The annual cultural festival of the Indian Institute of Space Science and Technology — built by student organizers, artists, and engineers in Thiruvananthapuram."
      maxWidth="max-w-5xl lg:max-w-6xl"
    >
      <AboutConceptStory />
    </SimplePageShell>
  );
}
