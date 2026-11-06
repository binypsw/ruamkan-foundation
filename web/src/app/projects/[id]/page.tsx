import ProjectView from '@/components/f2/ProjectView';

export const dynamic = 'force-dynamic';

export default function ProjectPage({ params }: { params: { id: string } }) {
  return <ProjectView idParam={params.id} />;
}
