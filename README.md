# Gestão financeira

Aplicação estática para anotar vendas, valores a receber, saídas e itens que precisam ser comprados novamente. Não exige cadastro de clientes ou produtos e não controla estoque.

## Rodar no VS Code

1. Abra esta pasta no VS Code.
2. Abra `index.html` e clique em **Go Live** na barra inferior. Se o Live Server não estiver instalado, instale a extensão Live Server.
3. O navegador abrirá o app. O login é usuário `admin` e senha `admin123`.

## Rodar no Termux

No Termux, entre na pasta do projeto e inicie um servidor estático:

```sh
cd ~/gestao
python -m http.server 8080 --bind 0.0.0.0
```

Abra `http://127.0.0.1:8080` no navegador do celular. Para acessar de outro aparelho na mesma rede, use o IP do celular e a porta `8080`.

## Como usar

- **Resumo:** veja vendido, recebido, a receber, saídas e saldo recebido nesta semana, neste mês ou neste ano. O app também organiza os valores por dia da semana e por mês.
- **Vendas e recebimentos:** anote o que vendeu, para quem, valor, data e se já recebeu. Use **Marcar recebido** quando a pessoa pagar; o recebimento entra no balanço na data em que for marcado.
- **Saídas:** anote compras e outros gastos para acompanhar o saldo.
- **Lista de compras:** registre lembretes do que precisa comprar novamente. Essa lista não representa estoque.

Os dados ficam salvos no armazenamento local do navegador usado para abrir o app e não são sincronizados entre aparelhos. O login `admin` / `admin123` é apenas uma barreira visual para uso local; como esta versão não tem servidor, não use a senha para proteger informações reais ou acesso público.
