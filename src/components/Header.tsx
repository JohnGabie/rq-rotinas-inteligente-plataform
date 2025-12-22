import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';

export function Header() {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
      <div className="container mx-auto flex h-14 sm:h-16 items-center justify-between px-3 sm:px-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2 sm:gap-3"
        >
          <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg sm:rounded-xl bg-primary/20">
            <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-foreground">Smart Office</h1>
            <p className="text-[10px] sm:text-xs text-muted-foreground hidden xs:block">Gerenciador de Automação</p>
          </div>
        </motion.div>

        <nav className="flex items-center gap-1">
          <span className="inline-flex items-center gap-1 sm:gap-1.5 rounded-full bg-primary/20 px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-medium text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-glow" />
            <span className="hidden xs:inline">Sistema</span> Ativo
          </span>
        </nav>
      </div>
    </header>
  );
}
