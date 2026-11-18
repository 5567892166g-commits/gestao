# Gestão financeira

Aplicação estática para anotar vendas, valores a receber, saídas e itens que precisam ser comprados novamente. Não exige cadastro de clientes ou produtos e não controla estoque.

## Publicar no Firebase Hosting

1. O projeto `gestao-1b9fa` e o app Web já estão registrados, e a configuração pública do SDK está em `static/firebase-config.js`. Não coloque senhas nem chaves de conta de serviço nesse arquivo.
2. Em **Authentication → Sign-in method**, habilite **E-mail/senha**. Em **Authentication → Users**, adicione a conta da Tabata e copie o UID dessa conta.
3. Crie o banco em **Firestore Database**, escolha **Production mode** e a região `southamerica-east1` (São Paulo). No arquivo `firestore.rules`, substitua `PREENCHA_COM_O_UID_DA_TABATA` pelo UID copiado.
4. Instale o [Node.js LTS](https://nodejs.org/) se ainda não estiver instalado.
5. No terminal do VS Code, na pasta do projeto, instale e autentique a CLI do Firebase:

   ```powershell
   npm install -g firebase-tools
   firebase login
   ```

6. Publique o site e as regras do banco:

   ```powershell
   firebase deploy --project gestao-1b9fa
   ```

O Firebase mostrará o endereço do site, normalmente `https://gestao-1b9fa.web.app`. As próximas alterações só serão publicadas quando você executar `firebase deploy --project gestao-1b9fa` novamente. A configuração ignora arquivos locais, banco de dados e pastas do projeto que não fazem parte do site, e solicita a revalidação dos arquivos para evitar que o navegador mantenha estilos antigos.

Depois de confirmar que o endereço do Firebase está funcionando, desative o GitHub Pages em **Settings → Pages** no GitHub para deixar de usar a hospedagem anterior. O repositório GitHub continuará guardando o código.

## Rodar localmente no VS Code

1. Abra esta pasta no VS Code.
2. Abra `index.html` e clique em **Go Live** na barra inferior. Se o Live Server não estiver instalado, instale a extensão Live Server.
3. Na demonstração, informe qualquer e-mail válido e uma senha de 8 números para entrar.

## Como usar

- **Resumo:** veja vendido, recebido, a receber, saídas e saldo recebido nesta semana, neste mês ou neste ano. O app também organiza os valores por dia da semana e por mês.
- **Vendas e recebimentos:** anote o que vendeu, para quem, valor, data e se já recebeu. Use **Marcar recebido** quando a pessoa pagar; o recebimento entra no balanço na data em que for marcado.
- **Devedores:** anote quem deve, o motivo, o valor e a data combinada. Os registros podem ser marcados como pagos; valores vencidos são destacados. Esta lista é separada das vendas para evitar somar a mesma dívida duas vezes.
- **Saídas:** anote compras e outros gastos para acompanhar o saldo.
- **Lista de compras:** registre lembretes do que precisa comprar novamente. Essa lista não representa estoque.

Após configurar Firebase Authentication e Firestore, os lançamentos ficam na conta autorizada da Tabata e sincronizam entre os aparelhos em que ela entrar. Os dados antigos do armazenamento local do navegador não são importados. O arquivo local `gestao.db` também não é usado pelo app. As regras do Firestore permitem acesso somente ao UID configurado em `firestore.rules`; não publique até criar a conta e preencher esse UID. Nunca inclua senhas ou chaves de conta de serviço no código.
