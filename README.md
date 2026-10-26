# Crosstraining Evolution — Aniversariantes

Protótipo inicial de painel responsivo com identidade visual preta e amarela.

## O que funciona neste protótipo
- Cadastro, edição e exclusão de alunos no armazenamento local do navegador.
- Lista de aniversários de hoje e próximos aniversários.
- Mensagem de parabéns personalizada pelo nome e pelo gênero selecionado.
- Botão WhatsApp que abre uma conversa com o texto preenchido; o envio precisa ser confirmado no WhatsApp.

## Importante antes de usar com dados reais
Esta versão **não** possui login nem sincronização com Firebase. Os cadastros ficam apenas no navegador/dispositivo usado e podem ser perdidos ao limpar os dados do navegador. Não insira dados pessoais reais de alunos até configurar autenticação, banco de dados e regras de segurança.

## Arquivos
- `index.html`: estrutura da página
- `style.css`: visual responsivo preto/amarelo
- `app.js`: cadastro demonstrativo e mensagens
- `firestore.rules.example`: exemplo inicial de regras para revisar antes de publicar

## Próximos passos
1. Criar projeto no Firebase.
2. Configurar Firebase Authentication (e-mail/senha).
3. Integrar Firestore com regras que autorizem somente usuários da equipe.
4. Hospedar o site em Firebase Hosting.
5. Avaliar a integração permitida para envio automático de mensagens a grupos do WhatsApp. O botão atual apenas prepara uma mensagem e abre o WhatsApp.
