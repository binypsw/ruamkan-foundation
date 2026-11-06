'use client';
import { useMe } from '@/lib/client/api';
import { Alert, LinkButton } from '@/components/ui';
import { ProjectWizard } from '@/components/f3/ProjectWizard';
import { f3 } from '@/messages/f3';

export default function NewProjectPage() {
  const { me } = useMe();
  if (me === undefined) return <p data-testid="wizard-loading">{f3.loading}</p>;
  if (me === null) {
    return (
      <div className="stack">
        <Alert kind="warn" testid="wizard-login-required">{f3.needLogin}</Alert>
        <LinkButton href="/login?next=/my/projects/new" testid="wizard-login-link">{f3.loginLink}</LinkButton>
      </div>
    );
  }
  return <ProjectWizard mode="create" />;
}
