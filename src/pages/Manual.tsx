import React, { useState } from 'react'
import {
  BookOpen,
  Users,
  ShieldCheck,
  Search,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  MessageSquare,
  Bell,
  Moon,
  Sun,
  History,
  RotateCcw,
  PlusCircle,
  Building2,
  UserCheck,
  Wrench,
  FileSpreadsheet,
  FileText,
  CalendarCheck2,
  KeyRound,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Smartphone,
  Monitor,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import { Link, useSearchParams } from 'react-router-dom'

export const Manual: React.FC = () => {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const isTIStaff = user?.role === 'Admin' || user?.role === 'Tecnico'

  // Determina a aba inicial com base no perfil e em query param (?aba=ti / ?tab=ti),
  // garantindo que usuários comuns NUNCA iniciem na aba 'ti'.
  const requestedTab = searchParams.get('aba') || searchParams.get('tab') || ''
  const getSafeTab = React.useCallback(
    (tab: string | null) => {
      if (!isTIStaff) return 'cliente'
      if (tab === 'ti' || tab === 'cliente') return tab
      return 'ti'
    },
    [isTIStaff],
  )

  const [activeTab, setActiveTab] = useState<string>(() => getSafeTab(requestedTab))
  const [searchTerm, setSearchTerm] = useState('')

  // Garante que se o usuário perder o privilégio ou tentar forçar ?aba=ti pela URL,
  // o estado sempre converja para 'cliente'.
  React.useEffect(() => {
    if (!isTIStaff && activeTab !== 'cliente') {
      setActiveTab('cliente')
    }
  }, [isTIStaff, activeTab])

  // Se o usuário alterar os query params diretamente na URL (ex: ?aba=ti)
  React.useEffect(() => {
    const currentRequested = searchParams.get('aba') || searchParams.get('tab')
    if (currentRequested) {
      const safe = getSafeTab(currentRequested)
      if (safe !== activeTab) {
        setActiveTab(safe)
      }
      // Se um usuário comum tentou acessar ?aba=ti ou ?tab=ti, limpe o parâmetro da URL
      if (!isTIStaff && currentRequested === 'ti') {
        const nextParams = new URLSearchParams(searchParams)
        nextParams.delete('aba')
        nextParams.delete('tab')
        setSearchParams(nextParams, { replace: true })
      }
    }
  }, [searchParams, isTIStaff, getSafeTab, activeTab, setSearchParams])

  const handleTabChange = (value: string) => {
    // Bloqueia qualquer tentativa de selecionar 'ti' para quem não for da equipe de T.I.
    if (value === 'ti' && !isTIStaff) {
      setActiveTab('cliente')
      return
    }
    setActiveTab(value)
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set('aba', value)
    setSearchParams(nextParams, { replace: true })
  }

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 p-6 md:p-8 text-white shadow-lg">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur px-3 py-1 text-xs font-semibold uppercase tracking-wider text-blue-100 border border-white/20">
              <BookOpen className="h-3.5 w-3.5" />
              Central de Ajuda e Documentação
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Manual de Uso — Sistema Help Desk
            </h1>
            <p className="text-sm md:text-base text-blue-100 leading-relaxed">
              Guia ilustrado e prático para solicitação de suporte, acompanhamento de chamados e
              administração da plataforma de Help Desk.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link to="/chamados/novo">
              <Button className="w-full sm:w-auto bg-white text-blue-700 hover:bg-blue-50 font-semibold shadow-md text-xs">
                <PlusCircle className="h-4 w-4 mr-2 text-blue-600" />
                Abrir Chamado Agora
              </Button>
            </Link>
            <Link to="/sobre">
              <Button
                variant="outline"
                className="w-full sm:w-auto border-white/30 text-white hover:bg-white/10 text-xs"
              >
                Sobre o Sistema
              </Button>
            </Link>
          </div>
        </div>

        {/* Decorative background shapes */}
        <div className="absolute -right-10 -bottom-10 h-64 w-64 rounded-full bg-white/5 blur-2xl" />
        <div className="absolute left-1/2 -top-12 h-40 w-40 rounded-full bg-blue-400/20 blur-xl" />
      </div>

      {/* Main Tabs Selector */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <div
          className={`flex flex-col sm:flex-row sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4 ${
            isTIStaff ? 'justify-between' : 'justify-end'
          }`}
        >
          {/* Seletor de abas: visível SOMENTE para Admin e Técnico */}
          {isTIStaff && (
            <TabsList className="bg-slate-100 dark:bg-[#1A1E30] border border-slate-200 dark:border-slate-800 p-1 h-auto">
              <TabsTrigger
                value="cliente"
                className="py-2.5 px-4 text-xs font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-blue-600 data-[state=active]:text-blue-600 dark:data-[state=active]:text-white shadow-sm flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                Manual para Clientes (Usuários)
              </TabsTrigger>
              <TabsTrigger
                value="ti"
                className="py-2.5 px-4 text-xs font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-blue-600 data-[state=active]:text-blue-600 dark:data-[state=active]:text-white shadow-sm flex items-center gap-2"
              >
                <ShieldCheck className="h-4 w-4" />
                Manual para T.I. (Técnicos & Admins)
              </TabsTrigger>
            </TabsList>
          )}

          {/* Quick filter in manual */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <Input
              type="text"
              placeholder="Pesquisar tópico no manual..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-xs bg-white dark:bg-[#1A1E30] border-slate-200 dark:border-slate-800"
            />
          </div>
        </div>

        {/* TAB 1: CLIENTES */}
        <TabsContent value="cliente" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
            {/* Table of Contents sidebar */}
            <div className="lg:col-span-1 sticky top-20 bg-white dark:bg-[#1A1E30] border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm space-y-3">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <BookOpen className="h-3.5 w-3.5 text-blue-600" />
                Sumário do Cliente
              </h3>
              <nav className="space-y-1 text-xs">
                <button
                  onClick={() => scrollToSection('cli-login')}
                  className="w-full text-left px-2.5 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium transition-colors"
                >
                  1. Como Acessar o Sistema (Login)
                </button>
                <button
                  onClick={() => scrollToSection('cli-abrir')}
                  className="w-full text-left px-2.5 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium transition-colors"
                >
                  2. Como Abrir um Chamado
                </button>
                <button
                  onClick={() => scrollToSection('cli-acompanhar')}
                  className="w-full text-left px-2.5 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium transition-colors"
                >
                  3. Acompanhar Andamento e Status
                </button>
                <button
                  onClick={() => scrollToSection('cli-chat')}
                  className="w-full text-left px-2.5 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium transition-colors"
                >
                  4. Chat e Mensagens com o Suporte
                </button>
                <button
                  onClick={() => scrollToSection('cli-notificacoes')}
                  className="w-full text-left px-2.5 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium transition-colors"
                >
                  5. Notificações em Tempo Real
                </button>
                <button
                  onClick={() => scrollToSection('cli-historico')}
                  className="w-full text-left px-2.5 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium transition-colors"
                >
                  6. Histórico e Reabertura
                </button>
                <button
                  onClick={() => scrollToSection('cli-tema')}
                  className="w-full text-left px-2.5 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium transition-colors"
                >
                  7. Tema Claro / Escuro
                </button>
                <button
                  onClick={() => scrollToSection('cli-app')}
                  className="w-full text-left px-2.5 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium transition-colors"
                >
                  8. Instalação no Celular (PWA)
                </button>
              </nav>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-lg text-[11px] text-blue-700 dark:text-blue-300 flex items-start gap-2">
                  <HelpCircle className="h-4 w-4 shrink-0 mt-0.5 text-blue-600" />
                  <span>Dúvidas urgentes? Fale com nosso suporte pelo chat do chamado aberto.</span>
                </div>
              </div>
            </div>

            {/* Content area */}
            <div className="lg:col-span-3 space-y-6">
              {/* Sec 1 */}
              <Card
                id="cli-login"
                className="bg-white dark:bg-[#1A1E30] border-slate-200 dark:border-slate-800"
              >
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <span className="h-6 w-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                      1
                    </span>
                    <CardTitle className="text-base font-bold">
                      Como Acessar o Sistema (Login)
                    </CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    Primeiro acesso, credenciais da sua empresa e recuperação de acesso
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                  <p>
                    Para entrar no <strong>Sistema Help Desk</strong>, acesse o link
                    fornecido pela equipe de T.I. ou abra o aplicativo instalado no seu computador
                    ou celular.
                  </p>
                  <ol className="list-decimal list-inside space-y-1.5 pl-2">
                    <li>
                      <strong>Informe seu E-mail corporativo:</strong> utilize o e-mail cadastrado
                      para sua empresa ou solicitante.
                    </li>
                    <li>
                      <strong>Digite sua Senha pessoal:</strong> sua senha é confidencial e
                      individual.
                    </li>
                    <li>
                      <strong>Clique em &quot;Entrar no Sistema&quot;:</strong> você será
                      direcionado para o painel inicial (Dashboard) onde visualiza seus chamados
                      abertos.
                    </li>
                    <li>
                      <strong>Esqueceu sua senha?</strong> Clique no link{' '}
                      <em>&quot;Esqueci minha senha&quot;</em> abaixo do botão de login para receber
                      um link de redefinição imediato por e-mail, ou solicite ao administrador da
                      equipe de suporte a redefinição pelo painel.
                    </li>
                  </ol>
                </CardContent>
              </Card>

              {/* Sec 2 */}
              <Card
                id="cli-abrir"
                className="bg-white dark:bg-[#1A1E30] border-slate-200 dark:border-slate-800"
              >
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <span className="h-6 w-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                      2
                    </span>
                    <CardTitle className="text-base font-bold">
                      Como Abrir um Chamado Passo a Passo
                    </CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    Preenchendo informações essenciais para que o suporte resolva seu problema com
                    rapidez
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-50 dark:bg-[#131728] rounded-lg border border-slate-200 dark:border-slate-800 space-y-1">
                      <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
                        Título Claro e Direto
                      </span>
                      <p className="text-[11px] text-slate-500">
                        Exemplo: <em>
                          &quot;Impressora HP do financeiro não conecta à rede&quot;
                        </em>{' '}
                        ou <em>&quot;Sistema ERP travando na emissão de NF-e&quot;</em>. Evite
                        apenas &quot;Erro&quot; ou &quot;Ajuda&quot;.
                      </p>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-[#131728] rounded-lg border border-slate-200 dark:border-slate-800 space-y-1">
                      <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
                        Descrição Detalhada
                      </span>
                      <p className="text-[11px] text-slate-500">
                        Informe o que aconteceu, qual mensagem de erro apareceu na tela e em qual
                        máquina/setor ocorre a falha.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-bold text-slate-900 dark:text-white">
                      Passo a passo no formulário:
                    </h4>
                    <ol className="list-decimal list-inside space-y-2 pl-2">
                      <li>
                        No menu lateral ou na barra inferior do celular, clique em{' '}
                        <strong>Chamados &gt; Novo Chamado</strong> (ou no botão azul &quot;Novo
                        Chamado&quot; no Dashboard).
                      </li>
                      <li>
                        <strong>Identificação do Solicitante:</strong> caso você pertença a uma
                        empresa específica, selecione seu nome no campo &quot;Solicitante&quot; (a
                        lista traz apenas colaboradores da sua empresa).
                      </li>
                      <li>
                        <strong>Prioridade:</strong>
                        <ul className="list-disc list-inside pl-4 mt-1 space-y-1 text-slate-600 dark:text-slate-400">
                          <li>
                            <strong className="text-emerald-600">Baixa:</strong> Dúvidas gerais,
                            pequenas melhorias ou pedidos sem urgência operacional.
                          </li>
                          <li>
                            <strong className="text-blue-600">Média:</strong> Falha parcial que
                            permite continuar o trabalho por vias alternativas.
                          </li>
                          <li>
                            <strong className="text-amber-600">Alta:</strong> Impacto direto em um
                            setor ou processo importante.
                          </li>
                          <li>
                            <strong className="text-red-600">Urgente:</strong> Operação totalmente
                            parada, servidor inativo ou bloqueio total das atividades.
                          </li>
                        </ul>
                      </li>
                      <li>
                        <strong>Anexos e Fotos:</strong> se desejar, adicione arquivos ou capturas
                        de tela para facilitar o diagnóstico do técnico.
                      </li>
                      <li>
                        Clique em <strong>&quot;Criar Chamado&quot;</strong>. Um número de protocolo
                        único (ex.: #1024) será gerado automaticamente.
                      </li>
                    </ol>
                  </div>
                </CardContent>
              </Card>

              {/* Sec 3 */}
              <Card
                id="cli-acompanhar"
                className="bg-white dark:bg-[#1A1E30] border-slate-200 dark:border-slate-800"
              >
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <span className="h-6 w-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                      3
                    </span>
                    <CardTitle className="text-base font-bold">
                      Acompanhamento de Status do Chamado
                    </CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    Entenda as etapas pelas quais sua solicitação passa até ser finalizada
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                    <div className="p-2.5 rounded-lg border border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 text-center space-y-1">
                      <Badge className="bg-amber-500 hover:bg-amber-500 text-white text-[10px]">
                        Aberto
                      </Badge>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400">
                        Registrado no sistema, aguardando triagem ou início do atendimento.
                      </p>
                    </div>

                    <div className="p-2.5 rounded-lg border border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 text-center space-y-1">
                      <Badge className="bg-blue-600 hover:bg-blue-600 text-white text-[10px]">
                        Em Andamento
                      </Badge>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400">
                        O técnico já assumiu o chamado e está trabalhando na resolução.
                      </p>
                    </div>

                    <div className="p-2.5 rounded-lg border border-purple-200 bg-purple-50/50 dark:bg-purple-950/20 text-center space-y-1">
                      <Badge className="bg-purple-600 hover:bg-purple-600 text-white text-[10px]">
                        Agendado
                      </Badge>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400">
                        Visita técnica presencial ou intervenção programada para data/hora
                        específica.
                      </p>
                    </div>

                    <div className="p-2.5 rounded-lg border border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20 text-center space-y-1">
                      <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white text-[10px]">
                        Fechado
                      </Badge>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400">
                        Serviço concluído e solução documentada pelo técnico responsável.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Sec 4 */}
              <Card
                id="cli-chat"
                className="bg-white dark:bg-[#1A1E30] border-slate-200 dark:border-slate-800"
              >
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <span className="h-6 w-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                      4
                    </span>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-blue-600" />
                      Chat Interno e Mensagens com o Suporte
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                  <p>
                    Cada chamado possui uma área de mensagens em tempo real com a equipe da Central
                    Informática:
                  </p>
                  <ul className="list-disc list-inside space-y-1.5 pl-2">
                    <li>
                      Abra o chamado desejado na lista para visualizar a aba de{' '}
                      <strong>Mensagens</strong>.
                    </li>
                    <li>
                      Digite sua dúvida, responda a perguntas do técnico ou informe dados
                      adicionais.
                    </li>
                    <li>
                      O técnico recebe um aviso instantâneo quando você envia uma mensagem,
                      garantindo que a conversa não se perca em e-mails externos.
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Sec 5 */}
              <Card
                id="cli-notificacoes"
                className="bg-white dark:bg-[#1A1E30] border-slate-200 dark:border-slate-800"
              >
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <span className="h-6 w-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                      5
                    </span>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <Bell className="h-4 w-4 text-blue-600" />
                      Notificações e Alertas Visuais
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                  <p>
                    No topo superior direito, o ícone de sino avisa você sempre que houver novidades
                    no seu chamado:
                  </p>
                  <ul className="list-disc list-inside space-y-1.5 pl-2">
                    <li>
                      O sino balança e exibe um contador em vermelho com a quantidade de novidades.
                    </li>
                    <li>
                      Ao clicar, veja a lista de alterações recentes e navegue direto para o
                      chamado.
                    </li>
                    <li>
                      Você pode clicar em <em>&quot;Marcar todas como lidas&quot;</em> ou acessar o
                      histórico completo na página de <strong>Notificações</strong>.
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Sec 6 */}
              <Card
                id="cli-historico"
                className="bg-white dark:bg-[#1A1E30] border-slate-200 dark:border-slate-800"
              >
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <span className="h-6 w-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                      6
                    </span>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <RotateCcw className="h-4 w-4 text-blue-600" />
                      Histórico e Reabertura de Chamado
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                  <p>O chamado foi fechado, mas o problema voltou ou não ficou 100% resolvido?</p>
                  <ol className="list-decimal list-inside space-y-1.5 pl-2">
                    <li>
                      Acesse o menu <strong>Chamados &gt; Fechados</strong>.
                    </li>
                    <li>Abra o chamado correspondente.</li>
                    <li>
                      Clique no botão <strong>&quot;Reabrir Chamado&quot;</strong> e descreva
                      resumidamente o motivo.
                    </li>
                    <li>
                      O status volta automaticamente para <strong>Em Aberto</strong> e a equipe
                      técnica é imediatamente notificada para retornar o atendimento.
                    </li>
                  </ol>
                </CardContent>
              </Card>

              {/* Sec 7 */}
              <Card
                id="cli-tema"
                className="bg-white dark:bg-[#1A1E30] border-slate-200 dark:border-slate-800"
              >
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <span className="h-6 w-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                      7
                    </span>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <Moon className="h-4 w-4 text-amber-500" />
                      Tema Claro / Tema Escuro
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                  <p>O sistema oferece dois modos visuais otimizados para seu conforto:</p>
                  <ul className="list-disc list-inside space-y-1 pl-2">
                    <li>
                      <strong>Atalho Rápido:</strong> clique no ícone de Sol/Lua no topo direito da
                      barra superior para alternar instantaneamente.
                    </li>
                    <li>
                      <strong>Configurações:</strong> acesse <em>Configurações &gt; Aparência</em>{' '}
                      para visualizar prévias completas de cada tema.
                    </li>
                    <li>
                      Sua preferência fica gravada no seu usuário e é lembrada automaticamente no
                      próximo acesso.
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Sec 8 */}
              <Card
                id="cli-app"
                className="bg-white dark:bg-[#1A1E30] border-slate-200 dark:border-slate-800"
              >
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <span className="h-6 w-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                      8
                    </span>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <Smartphone className="h-4 w-4 text-emerald-600" />
                      Como Instalar no Celular (PWA)
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                  <p>
                    Você não precisa baixar da loja de aplicativos para ter o Help Desk no celular.
                    Ele funciona como Progressive Web App (PWA):
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                    <div className="p-3 bg-slate-50 dark:bg-[#131728] rounded-lg border border-slate-200 dark:border-slate-800">
                      <h5 className="font-bold text-slate-900 dark:text-white mb-1">
                        No Android (Google Chrome):
                      </h5>
                      <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
                        <li>Abra o site no Chrome.</li>
                        <li>Toque nos 3 pontinhos no canto superior direito.</li>
                        <li>
                          Toque em <strong>&quot;Instalar aplicativo&quot;</strong> ou
                          &quot;Adicionar à tela inicial&quot;.
                        </li>
                        <li>O ícone do Sistema Help Desk aparecerá entre seus apps.</li>
                      </ol>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-[#131728] rounded-lg border border-slate-200 dark:border-slate-800">
                      <h5 className="font-bold text-slate-900 dark:text-white mb-1">
                        No iPhone / iPad (Safari):
                      </h5>
                      <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
                        <li>Abra o site no navegador Safari.</li>
                        <li>
                          Toque no botão de <strong>Compartilhar</strong> (quadrado com seta para
                          cima).
                        </li>
                        <li>
                          Role e escolha <strong>&quot;Adicionar à Tela de Início&quot;</strong>.
                        </li>
                        <li>Confirme o nome e toque em &quot;Adicionar&quot;.</li>
                      </ol>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* TAB 2: T.I. (ADMINS & TECNICOS) - Visível SOMENTE para Admin e Técnico */}
        {isTIStaff && (
          <TabsContent value="ti" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
              {/* Table of Contents sidebar */}
              <div className="lg:col-span-1 sticky top-20 bg-white dark:bg-[#1A1E30] border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm space-y-3">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
                  Sumário da Equipe T.I.
                </h3>
                <nav className="space-y-1 text-xs">
                  <button
                    onClick={() => scrollToSection('ti-gestao-chamados')}
                    className="w-full text-left px-2.5 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium transition-colors"
                  >
                    1. Triagem e Atribuição de Chamados
                  </button>
                  <button
                    onClick={() => scrollToSection('ti-atendimento-tecnico')}
                    className="w-full text-left px-2.5 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium transition-colors"
                  >
                    2. Área de Atendimento Técnico
                  </button>
                  <button
                    onClick={() => scrollToSection('ti-empresas')}
                    className="w-full text-left px-2.5 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium transition-colors"
                  >
                    3. Gestão de Empresas e Contratos
                  </button>
                  <button
                    onClick={() => scrollToSection('ti-usuarios-tecnicos')}
                    className="w-full text-left px-2.5 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium transition-colors"
                  >
                    4. Gestão de Usuários e Técnicos
                  </button>
                  <button
                    onClick={() => scrollToSection('ti-senha')}
                    className="w-full text-left px-2.5 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium transition-colors"
                  >
                    5. Redefinição de Senha pelo Painel
                  </button>
                  <button
                    onClick={() => scrollToSection('ti-preventivas')}
                    className="w-full text-left px-2.5 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium transition-colors"
                  >
                    6. Preventivas (Criar, Agendar, Concluir)
                  </button>
                  <button
                    onClick={() => scrollToSection('ti-relatorios')}
                    className="w-full text-left px-2.5 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium transition-colors"
                  >
                    7. Relatórios & Exportação CSV/PDF
                  </button>
                  <button
                    onClick={() => scrollToSection('ti-logs-paginacao')}
                    className="w-full text-left px-2.5 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium transition-colors"
                  >
                    8. Logs de Atividades & Paginação
                  </button>
                  <button
                    onClick={() => scrollToSection('ti-desktop')}
                    className="w-full text-left px-2.5 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium transition-colors"
                  >
                    9. Executável Desktop Windows (.exe)
                  </button>
                </nav>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                  <Badge variant="outline" className="text-[10px] w-full justify-center">
                    Perfil Restrito: Admin & Técnico
                  </Badge>
                </div>
              </div>

              {/* Content area */}
              <div className="lg:col-span-3 space-y-6">
                {/* Sec TI 1 */}
                <Card
                  id="ti-gestao-chamados"
                  className="bg-white dark:bg-[#1A1E30] border-slate-200 dark:border-slate-800"
                >
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <span className="h-6 w-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
                        1
                      </span>
                      <CardTitle className="text-base font-bold">
                        Triagem, Filtros Rápidos e Atribuição de Técnicos
                      </CardTitle>
                    </div>
                    <CardDescription className="text-xs">
                      Como distribuir a carga de suporte entre a equipe técnica
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                    <p>
                      Na listagem de chamados, a equipe de T.I. conta com filtros avançados por{' '}
                      <strong>Status</strong>, <strong>Prioridade</strong>, <strong>Empresa</strong>{' '}
                      e <strong>Técnico Responsável</strong>, além da busca rápida por número
                      (#1001) na barra superior.
                    </p>
                    <ol className="list-decimal list-inside space-y-2 pl-2">
                      <li>
                        <strong>Atribuir Chamado a um Técnico:</strong> ao abrir o detalhe do
                        chamado, utilize o seletor <em>&quot;Técnico Responsável&quot;</em> no card
                        lateral. O técnico selecionado receberá uma notificação automática imediata.
                      </li>
                      <li>
                        <strong>Alteração de Status:</strong> mude para{' '}
                        <em>&quot;Em andamento&quot;</em> assim que iniciar a análise técnica. Se
                        for necessária uma visita ou intervenção fora do horário comercial, mude
                        para <em>&quot;Agendado&quot;</em> e defina a data.
                      </li>
                      <li>
                        <strong>Edição do Solicitante / Empresa:</strong> em caso de cadastro
                        incorreto pelo usuário, o Administrador pode clicar em <em>Editar</em> no
                        chamado. O campo solicitante é filtrado dinamicamente pela empresa
                        selecionada.
                      </li>
                    </ol>
                  </CardContent>
                </Card>

                {/* Sec TI 2 */}
                <Card
                  id="ti-atendimento-tecnico"
                  className="bg-white dark:bg-[#1A1E30] border-slate-200 dark:border-slate-800"
                >
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <span className="h-6 w-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
                        2
                      </span>
                      <CardTitle className="text-base font-bold flex items-center gap-2">
                        <Wrench className="h-4 w-4 text-indigo-600" />
                        Área de Atendimento Técnico (Identificado / Realizado / Solução)
                      </CardTitle>
                    </div>
                    <CardDescription className="text-xs">
                      Documentação padronizada do serviço prestado para prestação de contas com o
                      cliente
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                    <p>
                      Dentro de cada chamado, o bloco{' '}
                      <strong>&quot;Atendimento Técnico&quot;</strong> é de preenchimento
                      obrigatório para manter o padrão de qualidade do atendimento:
                    </p>
                    <div className="space-y-2">
                      <div className="p-3 bg-slate-50 dark:bg-[#131728] rounded-lg border border-slate-200 dark:border-slate-800">
                        <span className="font-bold text-slate-900 dark:text-white">
                          1. Problema Identificado (Diagnóstico):
                        </span>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Ex.:{' '}
                          <em>
                            &quot;Cabo de rede rompido atrás da mesa de trabalho, causando perda
                            intermitente de pacotes.&quot;
                          </em>
                        </p>
                      </div>

                      <div className="p-3 bg-slate-50 dark:bg-[#131728] rounded-lg border border-slate-200 dark:border-slate-800">
                        <span className="font-bold text-slate-900 dark:text-white">
                          2. Serviço Realizado:
                        </span>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Ex.:{' '}
                          <em>
                            &quot;Substituição do patch cord Cat6 de 2m e recrimpagem do conector
                            RJ45 na tomada fêmea.&quot;
                          </em>
                        </p>
                      </div>

                      <div className="p-3 bg-slate-50 dark:bg-[#131728] rounded-lg border border-slate-200 dark:border-slate-800">
                        <span className="font-bold text-slate-900 dark:text-white">
                          3. Solução Aplicada e Observações Finais:
                        </span>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Ex.:{' '}
                          <em>
                            &quot;Conexão restabelecida a 1 Gbps estável. Testes de impressão e
                            navegação realizados com sucesso junto à solicitante.&quot;
                          </em>
                        </p>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Ao salvar os detalhes e marcar como <strong>Fechado</strong>, a data/hora de
                      fechamento é registrada com precisão de segundos para os relatórios de SLA e
                      tempo de resposta.
                    </p>
                  </CardContent>
                </Card>

                {/* Sec TI 3 */}
                <Card
                  id="ti-empresas"
                  className="bg-white dark:bg-[#1A1E30] border-slate-200 dark:border-slate-800"
                >
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <span className="h-6 w-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
                        3
                      </span>
                      <CardTitle className="text-base font-bold flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-indigo-600" />
                        Gestão de Empresas e Contratos
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                    <p>
                      A plataforma é multiempresa, permitindo isolar dados ou atender clientes em
                      modalidades distintas:
                    </p>
                    <ul className="list-disc list-inside space-y-1.5 pl-2">
                      <li>
                        <strong>Empresas com Contrato Ativo:</strong> clientes recorrentes com
                        franquia de horas ou suporte contratual contínuo.
                      </li>
                      <li>
                        <strong>Clientes sem Contrato:</strong> categoria especial identificada por
                        uma tag visual tracejada <em>&quot;Cliente sem contrato&quot;</em>. Permite
                        registrar atendimentos avulsos mantendo o histórico organizado sem misturar
                        com contratados.
                      </li>
                      <li>
                        <strong>Cadastro:</strong> em <em>Empresas &gt; Nova Empresa</em>, informe
                        Razão Social, Nome Fantasia, CNPJ/CPF, Telefone, Contato Principal e Status
                        do Contrato.
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                {/* Sec TI 4 */}
                <Card
                  id="ti-usuarios-tecnicos"
                  className="bg-white dark:bg-[#1A1E30] border-slate-200 dark:border-slate-800"
                >
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <span className="h-6 w-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
                        4
                      </span>
                      <CardTitle className="text-base font-bold flex items-center gap-2">
                        <UserCheck className="h-4 w-4 text-indigo-600" />
                        Gestão de Usuários e Técnicos
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                    <p>Controle de acessos baseado em perfis (RBAC - Role-Based Access Control):</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="p-3 bg-slate-50 dark:bg-[#131728] rounded-lg border border-slate-200 dark:border-slate-800">
                        <Badge className="bg-red-600 text-white text-[10px] mb-1">Admin</Badge>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400">
                          Acesso irrestrito a configurações, empresas, relatórios gerenciais, logs e
                          redefinição de senhas.
                        </p>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-[#131728] rounded-lg border border-slate-200 dark:border-slate-800">
                        <Badge className="bg-indigo-600 text-white text-[10px] mb-1">Tecnico</Badge>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400">
                          Visualiza e assume chamados de todas as empresas, executa atendimentos e
                          gerencia preventivas.
                        </p>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-[#131728] rounded-lg border border-slate-200 dark:border-slate-800">
                        <Badge className="bg-slate-600 text-white text-[10px] mb-1">Usuario</Badge>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400">
                          Usuário final do cliente. Visualiza exclusivamente os chamados vinculados
                          à sua própria empresa.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Sec TI 5 */}
                <Card
                  id="ti-senha"
                  className="bg-white dark:bg-[#1A1E30] border-slate-200 dark:border-slate-800"
                >
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <span className="h-6 w-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
                        5
                      </span>
                      <CardTitle className="text-base font-bold flex items-center gap-2">
                        <KeyRound className="h-4 w-4 text-amber-500" />
                        Redefinição de Senha de Usuários pelo Painel
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                    <p>
                      Caso um cliente ou colaborador esqueça a senha e não consiga acessar o e-mail:
                    </p>
                    <ol className="list-decimal list-inside space-y-1.5 pl-2">
                      <li>
                        Acesse o menu <strong>Usuários</strong> (ou <strong>Técnicos</strong>).
                      </li>
                      <li>Localize o usuário na lista com paginação ou busque por nome/e-mail.</li>
                      <li>
                        Clique no botão de opções e selecione{' '}
                        <strong>&quot;Redefinir Senha&quot;</strong>.
                      </li>
                      <li>
                        Digite a nova senha provisória (mínimo de 8 caracteres) e confirme. A
                        alteração entra em vigor imediatamente sem exigir confirmação externa.
                      </li>
                    </ol>
                  </CardContent>
                </Card>

                {/* Sec TI 6 */}
                <Card
                  id="ti-preventivas"
                  className="bg-white dark:bg-[#1A1E30] border-slate-200 dark:border-slate-800"
                >
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <span className="h-6 w-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
                        6
                      </span>
                      <CardTitle className="text-base font-bold flex items-center gap-2">
                        <CalendarCheck2 className="h-4 w-4 text-indigo-600" />
                        Manutenções Preventivas (Criar, Agendar, Concluir)
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                    <p>
                      Módulo dedicado a rotinas periódicas de T.I. (backup, limpeza física de
                      servidores, atualização de antivírus, verificação de nobreaks):
                    </p>
                    <ul className="list-disc list-inside space-y-1.5 pl-2">
                      <li>
                        <strong>Criar Preventiva:</strong> defina o título da rotina, a empresa
                        atendida, o técnico encarregado e a data prevista de execução.
                      </li>
                      <li>
                        <strong>Lembretes Automáticos:</strong> o sistema gera alerta de notificação
                        48 horas antes da data limite agendada.
                      </li>
                      <li>
                        <strong>Conclusão:</strong> o técnico marca como concluída e anota as
                        observações do checklist executado.
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                {/* Sec TI 7 */}
                <Card
                  id="ti-relatorios"
                  className="bg-white dark:bg-[#1A1E30] border-slate-200 dark:border-slate-800"
                >
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <span className="h-6 w-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
                        7
                      </span>
                      <CardTitle className="text-base font-bold flex items-center gap-2">
                        <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                        Relatórios com Exportação CSV e PDF
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                    <p>
                      Em <strong>Relatórios</strong>, o administrador acompanha métricas de
                      atendimento:
                    </p>
                    <ul className="list-disc list-inside space-y-1.5 pl-2">
                      <li>Volume total de chamados por empresa e por período.</li>
                      <li>Taxa de resolução e distribuição de chamados por técnico responsável.</li>
                      <li>
                        <strong>Exportação CSV:</strong> planilha compatível com Excel e Google
                        Sheets contendo colunas detalhadas (protocolo, empresa, solicitante,
                        prioridade, status, data de abertura e fechamento).
                      </li>
                      <li>
                        <strong>Impressão / PDF:</strong> layout limpo para impressão de relatórios
                        de prestação de contas para diretoria ou clientes.
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                {/* Sec TI 8 */}
                <Card
                  id="ti-logs-paginacao"
                  className="bg-white dark:bg-[#1A1E30] border-slate-200 dark:border-slate-800"
                >
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <span className="h-6 w-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
                        8
                      </span>
                      <CardTitle className="text-base font-bold flex items-center gap-2">
                        <ShieldAlert className="h-4 w-4 text-indigo-600" />
                        Log de Atividades & Paginação Otimizada
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                    <p>Auditoria completa e usabilidade em telas de qualquer tamanho:</p>
                    <ul className="list-disc list-inside space-y-1.5 pl-2">
                      <li>
                        <strong>Log de Atividades:</strong> acessível pelo menu{' '}
                        <em>Logs de Atividades</em> (somente Administradores), registra quem abriu
                        chamados, quem alterou status e ações críticas do sistema com data e hora
                        exatas.
                      </li>
                      <li>
                        <strong>Paginação Responsiva:</strong> todas as listagens (chamados,
                        empresas, usuários, preventivas, relatórios e logs) usam paginação
                        automática adaptável: <strong>10 itens por página no Desktop</strong> e{' '}
                        <strong>5 itens por página no Celular</strong> para evitar rolagem
                        excessiva.
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                {/* Sec TI 9 */}
                <Card
                  id="ti-desktop"
                  className="bg-white dark:bg-[#1A1E30] border-slate-200 dark:border-slate-800"
                >
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <span className="h-6 w-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
                        9
                      </span>
                      <CardTitle className="text-base font-bold flex items-center gap-2">
                        <Monitor className="h-4 w-4 text-blue-600" />
                        Empacotamento Desktop Windows (.exe)
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                    <p>
                      O Help Desk foi estruturado para gerar executáveis nativos para Windows (.exe
                      instalador NSIS e versão Portable):
                    </p>
                    <div className="p-3 bg-slate-900 text-slate-100 rounded-lg font-mono text-[11px] space-y-1">
                      <p className="text-slate-400">
                        # Compilar frontend e gerar o executável Windows:
                      </p>
                      <p className="text-emerald-400">npm run desktop:dist</p>
                      <p className="text-slate-400 mt-2">
                        # Executar o app em janela Electron de teste:
                      </p>
                      <p className="text-blue-300">npm run desktop:dev</p>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      O executável final é gerado na pasta <code>dist-electron/</code> com ícone
                      próprio do sistema, nome customizado e suporte a execução
                      offline/online conectando à API e ao PostgreSQL central.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}

export default Manual
