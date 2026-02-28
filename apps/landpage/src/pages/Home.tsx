import { useOrganization } from '@/hooks/useOrganization';

const APP_HUB_URL = 'https://app.zionhub.app';

export default function Home() {
  const { org, loading, error } = useOrganization();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !org) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-4">
        <h1 className="text-2xl font-bold text-foreground">Organização não encontrada</h1>
        <p className="text-muted-foreground">Este domínio não está associado a nenhuma organização ZionHub.</p>
      </div>
    );
  }

  const loginUrl = `${APP_HUB_URL}/login?tenant=${org.slug}`;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center animate-fade-in">
        <div className="max-w-2xl mx-auto space-y-6">
          <h1 className="text-5xl font-bold text-foreground">{org.name}</h1>
          <p className="text-xl text-muted-foreground">
            Bem-vindo ao portal digital da {org.name}.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <a
              href={loginUrl}
              className="inline-flex items-center justify-center px-8 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
            >
              Entrar
            </a>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 text-center text-sm text-muted-foreground">
        Powered by{' '}
        <a href={APP_HUB_URL} className="text-primary hover:underline">
          ZionHub
        </a>
      </footer>
    </div>
  );
}
