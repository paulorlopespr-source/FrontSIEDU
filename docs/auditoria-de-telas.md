# Auditoria de telas do SIEDU

## Escopo conferido

- Rotas declaradas em `App.jsx`.
- Rotas geradas para Coordenação e Secretaria Financeira.
- Menus laterais e ações rápidas dos painéis.
- Páginas sem conteúdo, integrações pendentes e links que não levavam a uma rota.
- Compilação e testes automatizados do frontend.

## Cobertura por módulo

| Módulo | Telas/rotas conferidas | Situação |
| --- | ---: | --- |
| Secretaria Administrativa | 12 | Rotas cobertas pelo menu |
| Coordenação Pedagógica | 13 | Rotas cobertas; ocorrências concluída nesta revisão |
| Direção Escolar | 15 | Rotas cobertas pelo painel |
| Secretaria Financeira | 6 | Painel e cinco telas internas concluídos |
| Gestão Municipal/Gestor | 10 | Rotas cobertas pelos menus e módulos compartilhados |
| Professor | 16 | Rotas cobertas pelo painel |
| Superintendência | 1 painel consolidado | Seções internas cobertas no próprio painel |
| Aluno | 1 rota principal com subrotas internas | Fora da padronização institucional, conforme decisão do projeto |
| Serviços compartilhados | 9 | Login, senha, termos, escolas, usuários, calendário, aprendizagem, transportes e demandas |

## Telas criadas ou concluídas

### Secretaria Financeira

- Orçamento e Execução.
- Despesas e Pagamentos.
- Prestação de Contas.
- Relatórios Fiscais.
- Auditorias e Inspeções.
- Navegação completa do menu lateral e dos atalhos do painel.

### Coordenação Pedagógica

- Ocorrências pedagógicas com alertas oficiais do painel e encaminhamento para Gestão Pedagógica.
- Ações rápidas de Turmas, Comunicação e Ocorrências ligadas às respectivas telas.

### Sistema compartilhado

- Tipografia institucional aplicada globalmente.
- Identificação fixa de município removida dos cabeçalhos principais já padronizados.

## Pendências que não representam telas ausentes

- Login por Google e Microsoft permanece desativado até existir configuração de autenticação externa.
- O módulo do Aluno continua separado da padronização visual institucional para receber identidade própria.
- Uma validação completa com dados reais depende de sessões de teste para cada perfil.
