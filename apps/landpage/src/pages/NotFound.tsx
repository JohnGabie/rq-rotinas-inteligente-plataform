export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-4">
      <h1 className="text-6xl font-bold text-muted-foreground">404</h1>
      <p className="text-xl text-foreground font-semibold">Página não encontrada</p>
      <p className="text-muted-foreground">Este domínio não está associado a nenhuma organização.</p>
    </div>
  );
}
