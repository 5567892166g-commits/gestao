# Gestão financeira

Aplicação estática para anotar vendas, valores a receber, saídas e itens que precisam ser comprados novamente. Não exige cadastro de clientes ou produtos e não controla estoque.

## Publicar no Firebase Hosting

1. Crie um projeto no [Firebase Console](https://console.firebase.google.com/) ou selecione um projeto existente.
2. Instale o [Node.js LTS](https://nodejs.org/) se ainda não estiver instalado.
3. No terminal do VS Code, na pasta do projeto, instale e autentique a CLI do Firebase:

   ```powershell
   npm install -g firebase-tools
   firebase login
   ```

4. Publique o site, substituindo `SEU_PROJECT_ID` pelo ID do projeto mostrado nas configurações do Firebase:

   ```powershell
   firebase deploy --project SEU_PROJECT_ID
   ```

O Firebase mostrará o endereço do site, normalmente `https://SEU_PROJECT_ID.web.app`. As próximas alterações só serão publicadas quando você executar `firebase deploy` novamente. A configuração ignora arquivos locais, banco de dados e pastas do projeto que não fazem parte do site, e solicita a revalidação dos arquivos para evitar que o navegador mantenha estilos antigos.

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

Os dados ficam salvos no armazenamento local do navegador e não são sincronizados entre aparelhos ou pessoas. Hospedar no Firebase Hosting torna o site acessível por um link, mas não cria um banco de dados compartilhado. O login aceita qualquer e-mail válido e qualquer senha numérica de 8 dígitos; ele é apenas uma entrada demonstrativa, não protege informações. Não use dados financeiros ou pessoais reais. Para compartilhar informações com segurança entre pessoas, será necessário adicionar um servidor, banco de dados e autenticação real.
