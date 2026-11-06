import { f1 } from '@/messages/f1';
import ProjectList from '@/components/f1/ProjectList';

export default function Home() {
  return (
    <div className="stack">
      <section className="hero row" style={{ gap: 24, justifyContent: 'space-between' }} aria-labelledby="home-title">
        <div style={{ flex: '1 1 280px' }}>
          <h1 id="home-title" data-testid="home-title" style={{ marginTop: 0 }}>{f1.heroTitle}</h1>
          <p style={{ fontSize: '1.125rem' }} data-testid="home-hero-sub">{f1.heroSub}</p>
          <a href="#projects" className="btn btn-primary" data-testid="home-hero-cta">{f1.heroCta}</a>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/img/home-hero.svg" alt={f1.heroImgAlt} width={360} height={220} style={{ flex: '0 1 360px', maxWidth: '100%', height: 'auto' }} data-testid="home-hero-img" />
      </section>
      <ProjectList />
    </div>
  );
}
