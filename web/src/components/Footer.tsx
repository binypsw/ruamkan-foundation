import { common as t } from '@/messages/common';

export default function Footer() {
  return (
    <footer className="site-footer" data-testid="site-footer">
      <div className="container">
        <p><strong>{t.brand}</strong> · {t.tagline}</p>
        <p>{t.footerOrg}</p>
        <p className="field-hint" style={{ color: '#cfd8ea' }}>{t.footerNote}</p>
      </div>
    </footer>
  );
}
