import React from 'react'
import { Link } from 'react-router-dom'
import {
  Info,
  Layers,
  Code2,
  Calendar,
  User,
  ShieldCheck,
  Server,
  Smartphone,
  Monitor,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  Database,
  Palette,
  Zap,
  Globe,
  Sparkles,
  ClipboardList,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export const Sobre: React.FC = () => {
  const tecnologias = [
    {
      nome: 'React 19',
      tipo: 'Frontend Library',
      descricao: 'Construção declarativa e modular de interfaces reativas em componentes.',
      badge: 'Frontend',
      badgeColor: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
    },
    {
      nome: 'TypeScript',
      tipo: 'Tipagem Estática',
      descricao:
        'Código fortemente tipado com interfaces compartilhadas para Help Desk e Service Desk.',
      badge: 'Linguagem',
      badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    },
    {
      nome: 'Vite',
      tipo: 'Build Tool & DevServer',
      descricao:
        'Empacotamento ultraveloz com Hot Module Replacement instantâneo e compilação otimizada.',
      badge: 'Tooling',
      badgeColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    },
    {
      nome: 'Tailwind CSS',
      tipo: 'Framework CSS Utilitário',
      descricao:
        'Design responsivo, consistente, suporte a Dark Mode completo e customização precisa.',
      badge: 'Estilização',
      badgeColor: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20',
    },
    {
      nome: 'shadcn/ui & Radix UI',
      tipo: 'Componentes de Interface',
      descricao:
        'Primitivas acessíveis (a11y) com design moderno: modais, abas, dropdowns e formulários.',
      badge: 'Design System',
      badgeColor: 'bg-slate-500/10 text-slate-600 dark:text-slate-300 border-slate-500/20',
    },
    {
      nome: 'PostgreSQL + Node.js',
      tipo: 'Backend & Banco Central',
      descricao:
        'API Node com autenticação e regras de acesso sobre banco PostgreSQL centralizado.',
      badge: 'Backend / Banco',
      badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    },
    {
      nome: 'PWA (Progressive Web App)',
      tipo: 'Mobile Instalável',
      descricao:
        'Manifest e Service Worker para instalação direta no smartphone (Android/iOS) como aplicativo nativo.',
      badge: 'Mobile PWA',
      badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    },
    {
      nome: 'Electron / Desktop Windows',
      tipo: 'Executável Desktop (.exe)',
      descricao:
        'Arquitetura preparada para empacotamento NSIS e Portable para Windows com banco central sincronizado.',
      badge: 'Desktop',
      badgeColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
    },
  ]

  const caracteristicas = [
    {
      titulo: 'Multiempresa com Isolamento Seguro',
      descricao:
        'Cada cliente visualiza exclusivamente os seus chamados e solicitantes, enquanto a equipe técnica tem visão global unificada.',
    },
    {
      titulo: 'Categoria "Clientes sem Contrato"',
      descricao:
        'Flexibilidade para registrar atendimentos avulsos ou orçamentos pontuais com identificação visual diferenciada.',
    },
    {
      titulo: 'Atendimento Técnico Estruturado',
      descricao:
        'Campos dedicados para Diagnóstico/Problema Identificado, Serviço Realizado e Solução Aplicada para prestação de contas precisa.',
    },
    {
      titulo: 'Notificações Realtime e Chat Interno',
      descricao:
        'Comunicação direta por chamado sem depender de e-mail, com sino interativo e alertas sonoros/visuais.',
    },
    {
      titulo: 'Manutenções Preventivas Periódicas',
      descricao:
        'Agendamento de rotinas de T.I. com alertas automáticos 48h antes e controle de checklists de conclusão.',
    },
    {
      titulo: 'Paginação Responsiva Inteligente',
      descricao:
        'Adaptação dinâmica automática: 10 registros por página no computador e 5 registros no celular.',
    },
  ]

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-6 md:p-8 text-white shadow-xl border border-blue-900/40">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-blue-300 border border-blue-500/30">
              <ClipboardList className="h-3.5 w-3.5" />
              Service Desk & Gestão de Chamados
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Sistema Help Desk
            </h1>
            <p className="text-sm md:text-base text-slate-300 leading-relaxed">
              Plataforma corporativa multiempresa desenvolvida para agilizar o suporte técnico,
              centralizar chamados de T.I. e gerenciar manutenções preventivas com transparência.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link to="/manual">
              <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md">
                <BookOpen className="h-4 w-4 mr-2" />
                Acessar Manual de Uso
              </Button>
            </Link>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute -right-8 -top-8 h-48 w-48 rounded-full bg-blue-500/10 blur-2xl" />
        <div className="absolute right-1/3 -bottom-10 h-40 w-40 rounded-full bg-indigo-500/10 blur-2xl" />
      </div>

      {/* Visão Geral do Sistema */}
      <Card className="bg-white dark:bg-[#1A1E30] border-slate-200 dark:border-slate-800">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-base font-bold">O que é a Plataforma?</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Visão arquitetural e objetivo do sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
          <p>
            O <strong>Sistema Help Desk</strong> é uma solução completa de Service
            Desk concebida para atender empresas conveniadas e clientes sob demanda. O sistema
            unifica o fluxo de abertura de ocorrências, diagnóstico técnico, agendamento de visitas,
            mensagens diretas entre solicitante e técnico, além de relatórios gerenciais
            consolidados.
          </p>

          <p>
            Com foco em alta disponibilidade e usabilidade moderna, a plataforma funciona em{' '}
            <strong>três frentes integradas ao mesmo banco de dados central</strong>:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#131728] space-y-1.5">
              <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                <Globe className="h-4 w-4" />
              </div>
              <h4 className="font-bold text-slate-900 dark:text-white">Web SPA</h4>
              <p className="text-[11px] text-slate-500">
                Acesso direto por qualquer navegador moderno, rápido, responsivo e seguro com HTTPS.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#131728] space-y-1.5">
              <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <Smartphone className="h-4 w-4" />
              </div>
              <h4 className="font-bold text-slate-900 dark:text-white">PWA Mobile</h4>
              <p className="text-[11px] text-slate-500">
                Instalável na tela inicial do smartphone (Android e iOS) com visual e toque de
                aplicativo nativo.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#131728] space-y-1.5">
              <div className="h-8 w-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                <Monitor className="h-4 w-4" />
              </div>
              <h4 className="font-bold text-slate-900 dark:text-white">Desktop Windows</h4>
              <p className="text-[11px] text-slate-500">
                Estruturado para empacotamento executável (.exe) para as estações de trabalho e
                técnicos de campo.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recursos Principais */}
      <Card className="bg-white dark:bg-[#1A1E30] border-slate-200 dark:border-slate-800">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-base font-bold">Recursos e Diferenciais</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Funcionalidades para a operação de uma equipe de suporte
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {caracteristicas.map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#131728] space-y-1"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span className="font-bold text-xs text-slate-900 dark:text-white">
                    {item.titulo}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 pl-6">
                  {item.descricao}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tecnologias e Linguagens */}
      <Card className="bg-white dark:bg-[#1A1E30] border-slate-200 dark:border-slate-800">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Code2 className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-base font-bold">
              Tecnologias e Linguagens Utilizadas
            </CardTitle>
          </div>
          <CardDescription className="text-xs">
            Stack tecnológica de alto desempenho selecionada para o projeto
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {tecnologias.map((tech, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#131728] flex flex-col justify-between gap-2"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">
                      {tech.nome}
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-[9px] px-1.5 py-0 ${tech.badgeColor}`}
                    >
                      {tech.badge}
                    </Badge>
                  </div>
                  <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 block mb-1">
                    {tech.tipo}
                  </span>
                  <p className="text-[11px] text-slate-500 leading-snug">{tech.descricao}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Dados do Projeto, Autoria e Créditos */}
      <Card className="bg-gradient-to-br from-blue-50/50 via-white to-indigo-50/30 dark:from-[#131728] dark:via-[#1A1E30] dark:to-blue-950/20 border-blue-200 dark:border-blue-900/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-base font-bold">
              Autoria e Identificação do Projeto
            </CardTitle>
          </div>
          <CardDescription className="text-xs">
            Créditos oficiais de desenvolvimento e termos de acesso
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 bg-white dark:bg-[#161A2B] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-blue-600" />
                Desenvolvedora
              </span>
              <p className="text-sm font-extrabold text-slate-900 dark:text-white">
                Equipe de Desenvolvimento
              </p>
              <p className="text-[11px] text-slate-500">Desenvolvimento Full Stack</p>
            </div>

            <div className="p-3.5 bg-white dark:bg-[#161A2B] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-blue-600" />
                Data de Desenvolvimento
              </span>
              <p className="text-sm font-extrabold text-slate-900 dark:text-white">Ano de 2026</p>
              <p className="text-[11px] text-slate-500">Versão 2.4.0 (Build de Produção)</p>
            </div>

            <div className="p-3.5 bg-white dark:bg-[#161A2B] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
                Direitos & Acesso
              </span>
              <p className="text-sm font-extrabold text-slate-900 dark:text-white">
                Acesso Restrito © 2026
              </p>
              <p className="text-[11px] text-slate-500">
                Sistema Help Desk - Projeto demonstrativo
              </p>
            </div>
          </div>

          <div className="p-3.5 bg-slate-100/70 dark:bg-slate-900/60 rounded-xl text-center text-xs text-slate-600 dark:text-slate-400 font-medium">
            Aplicação de gestão de chamados © 2026.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Sobre
