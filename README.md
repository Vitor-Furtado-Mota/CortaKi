# Navalha (nome provisório) — Protótipo MVP v2

Protótipo navegável de uma plataforma que conecta clientes a barbeiros e barbearias,
agora com **busca automática estilo Uber**, **pagamento pré-pago**, **agendamento com
calendário completo**, **seleção de múltiplos serviços**, **carteira do barbeiro com saque**
e um **painel administrativo** que permite ver barbeiro por barbeiro ou barbearia por barbearia.

> Todos os dados são **mockados**. Não há backend, banco de dados, pagamento real ou
> geolocalização real nesta versão.

## Como executar

```bash
cd navalha
python3 -m http.server 8000
# depois acesse http://localhost:8000
```
Ou apenas abra `index.html` direto no navegador.

## O que mudou nesta versão

- **Verificação de segurança em duas etapas** — cada atendimento recebe um código de 6 dígitos visível somente ao cliente. O barbeiro precisa validá-lo para iniciar e concluir o serviço. Sem validação, o encerramento aplica a divisão de segurança: 50% para o barbeiro e 50% devolvidos ao saldo do cliente.
- **Notificações por perfil** — cliente recebe confirmações de pagamento, cancelamentos e atualizações; barbeiro acompanha inícios de atendimento, saques e mudanças da plataforma; administrador acompanha novos barbeiros, novas barbearias e solicitações de saque.
- **Identidade Cortaki nas áreas internas** — painéis de barbeiro e administrador usam a logo adequada ao tema claro ou escuro.

- **`chamar.html`** — fluxo "Chamar agora": cliente escolhe serviços (múltipla escolha),
  endereço e paga antes de chamar. O app roda um algoritmo simples de match
  (`findMatch` em `assets/js/app.js`) que escolhe automaticamente o barbeiro online mais
  bem posicionado por **preço e localidade**, simula a busca (animação tipo radar) e mostra
  o barbeiro "aceito" com ETA, exatamente como um app de transporte.
- **`agendar.html`** — fluxo de agendamento com serviços em múltipla escolha e um
  **calendário mensal completo** (não apenas os próximos dias): todo dia com horário livre
  fica marcado, e ao clicar aparecem **todos** os horários daquele dia. Pagamento também é
  antecipado, antes de confirmar.
- **Pagamento pré-pago em ambos os fluxos** — Pix ou cartão (mock) antes de a solicitação
  ou chamada ser enviada; `confirmacao.html` mostra o ticket já com "Pago".
- **`dashboard/saldo.html`** — carteira do barbeiro: saldo bruto, taxa da plataforma
  (${'$'}{5}% por serviço), saldo líquido, saldo disponível e um formulário de **solicitar saque**.
  `assets/js/mock-data.js` define `PLATFORM_FEE_PCT = 5`.
- **`admin/barbeiros.html` + `admin/barbeiro-detalhe.html`** e
  **`admin/barbearias.html` + `admin/barbearia-detalhe.html`** — o admin deixou de ser só
  uma tela única e agora permite abrir cada barbeiro ou cada barbearia individualmente,
  com extrato, histórico de atendimentos e saldo.
- **`dashboard/index.html`** — barbeiro tem um toggle "Disponível para chamadas" (como um
  motorista fica online/offline) e recebe uma simulação de chamada instantânea com
  contagem regressiva para aceitar/recusar.

## Estrutura do projeto

```
navalha/
├── index.html                 Home (Chamar agora / Agendar)
├── busca.html                  Busca de barbeiros com filtros
├── barbeiro.html                 Perfil público do barbeiro
├── chamar.html                     Chamada automática estilo Uber (NOVO)
├── agendar.html                     Agendamento com calendário completo
├── confirmacao.html                   Ticket de confirmação (pago)
├── historico.html                       Histórico de agendamentos do cliente
├── atendimento.html                       Detalhe + timeline de status
├── perfil-cliente.html                      Perfil do cliente + seletor de ambiente demo
├── dashboard/                                 Área do barbeiro
│   ├── index.html                               Painel + toggle online + chamada simulada
│   ├── agenda.html                                Calendário completo do barbeiro
│   ├── solicitacoes.html                            Aceitar/recusar agendamentos
│   ├── clientes.html                                  Clientes atendidos
│   ├── servicos.html                                    Serviços (múltipla escolha do catálogo)
│   ├── saldo.html                                         Carteira: saldo bruto/líquido + saque (NOVO)
│   └── perfil.html                                          Edição do perfil profissional
├── admin/
│   ├── index.html                    Métricas gerais da plataforma
│   ├── barbeiros.html                  Lista de todos os barbeiros (NOVO)
│   ├── barbeiro-detalhe.html             Detalhe individual do barbeiro (NOVO)
│   ├── barbearias.html                     Lista de barbearias (NOVO)
│   └── barbearia-detalhe.html                Detalhe individual da barbearia (NOVO)
└── assets/
    ├── css/style.css            Design system (preto premium + dourado)
    └── js/
        ├── mock-data.js          Dados mockados + PLATFORM_FEE_PCT
        └── app.js                  Helpers: calendário, matching, carteira, nav

```

## Próximos passos (fora do escopo deste MVP)

- Migrar para Next.js + Prisma + Postgres (ver schema sugerido na v1 deste README, ainda
  válido — só adicionar `platformFeePct` em `Payment` e uma tabela `Withdrawal`).
- Geolocalização real (Google Maps/Mapbox) no lugar da distância aproximada.
- Gateway de pagamento real (Stripe, Mercado Pago ou PIX via PSP) com retenção automática
  da taxa da plataforma e repasse programado ao barbeiro.
- Algoritmo de matching real (fila de barbeiros online, timeout de aceite, fallback para o
  próximo mais próximo caso o primeiro não aceite).
- Autenticação real e notificações push para a chamada instantânea.
