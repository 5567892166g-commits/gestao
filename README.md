# Gestão financeira

Aplicação estática para anotar vendas, valores a receber, saídas e itens que precisam ser comprados novamente. Não exige cadastro de clientes ou produtos e não controla estoque.

## Publicar para acesso pelo navegador

O site pode ser aberto por este endereço depois de ativar o GitHub Pages:

https://5567892166g-commits.github.io/gestao/

Para publicar:

1. Envie esta atualização para a branch `main` do GitHub.
2. No repositório, abra **Settings → Pages**.
3. Em **Build and deployment**, selecione **GitHub Actions** como origem.
4. Abra a aba **Actions** e aguarde o workflow **Publish to GitHub Pages** terminar. Depois, use o link acima.

As próximas atualizações na branch `main` serão publicadas automaticamente.

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

Os dados ficam salvos no armazenamento local do navegador e não são sincronizados entre aparelhos ou pessoas. A publicação torna o site acessível por um link, mas não cria um banco de dados compartilhado. O login aceita qualquer e-mail válido e qualquer senha numérica de 8 dígitos; ele é apenas uma entrada demonstrativa, não protege informações. Não use dados financeiros ou pessoais reais. Para compartilhar informações com segurança entre pessoas, será necessário adicionar um servidor, banco de dados e autenticação real.
