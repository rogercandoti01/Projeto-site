# Payin - Gestão Financeira Inteligente 💼✨

O **Payin** é uma aplicação completa e sofisticada de gestão e controle financeiro pessoal, desenvolvida para fornecer clareza total sobre o seu orçamento mensal e histórico.

---

## 🌟 Principais Recursos

1. **Gestão Multiusuário**:
   - Cadastre e alterne entre diferentes usuários com um clique.
   - Cada usuário possui seus próprios lançamentos, histórico e configurações isoladas.

2. **Controle Financeiro Mês a Mês**:
   - Navegue facilmente entre os meses (passados, presentes e futuros).
   - Resumo em tempo real: **Total de Gastos**, **Contas Fixas (R$ e %)**, **Contas Variáveis (R$ e %)**, **Receitas e Saldo Restante**, e **Contas Pagas vs. Pendentes**.
   - Filtros instantâneos por texto, tipo de gasto (Fixo / Variável), forma de pagamento (À Vista / A Prazo), status (Pago / Pendente) e categoria.
   - Ações rápidas na tabela: alternar status com 1 clique, editar, duplicar para o próximo mês e excluir.

3. **Cadastro Detalhado de Custos**:
   - **Contas Fixas**: Escolha o tipo de conta (Aluguel, Condomínio, Energia Elétrica, Água, Internet, Streaming, Financiamento, etc.) com a opção inteligente de **replicar para todos os meses do ano**.
   - **Contas Variáveis**: Campo específico para detalhar **"O que foi comprado"** (ex: Compras de mercado, calçados, restaurante, combustível, farmácia, etc.).
   - **Condição de Pagamento**:
     - **À Vista**: Pix, Boleto, Débito, Dinheiro.
     - **A Prazo**: Cartão de Crédito, Boleto Parcelado, Carnê, com controle de número de parcelas (ex: 3x, 6x) e opção de **lançar parcelas futuras automaticamente nos meses seguintes**.
   - **Observações**: Campo para anotar comprovantes, links, garantias ou lembretes.
   - **Status**: Marque como *Pago* ou *Pendente*.

4. **Dashboard Geral de TODOS os Meses**:
   - Métricas globais consolidadas: Total histórico gasto, Média mensal de despesas, Mês com maior gasto (pico financeiro) e proporção acumulada de Fixos vs. Variáveis.
   - Gráficos visuais interativos (Chart.js):
     - **Evolução Mensal**: Gastos Fixos vs. Gastos Variáveis mês a mês.
     - **Maiores Gastos Registrados**: Gráfico horizontal dos itens mais caros comprados.
     - **Distribuição por Categoria**: Gráfico donut das principais categorias de despesa.
     - **À Vista vs. A Prazo**: Proporção de compras imediatas versus compras parceladas.
   - **Ranking Geral**: Tabela ordenada com as maiores despesas de todos os tempos.

5. **Design Sofisticado e Temas Claro/Escuro**:
   - Paleta elegante e refinada baseada em tons de marrom (*espresso, mocha*), bege (*sand, linen*), creme, off-white e dourado champanhe.
   - Alternância fluida entre **Modo Claro (Light)** e **Modo Escuro (Dark)** com persistência da sua escolha.

6. **Armazenamento Local & Planilhas CSV**:
   - Salva automaticamente no banco de dados local da sua pasta (`data/database.json`).
   - Gera e atualiza automaticamente o arquivo `data/despesas_payin.csv` formatado para o Microsoft Excel (delimitador `;` e codificação UTF-8).
   - Botões na tela para baixar CSV geral, CSV do mês selecionado, Backup completo em JSON ou importar planilhas CSV existentes.

---

## 🚀 Como Iniciar o Payin

### Opção 1 (Recomendada - Com Servidor Local e Gravação na Pasta `data/`):
1. Dê um duplo clique no arquivo **`iniciar_payin.bat`**.
2. O servidor local em PowerShell será iniciado automaticamente e abrirá o seu navegador padrão no endereço:
   ```
   http://localhost:8080
   ```

### Opção 2 (Acesso Direto sem Servidor):
1. Dê um duplo clique no arquivo **`index.html`** para abrir diretamente no Google Chrome, Microsoft Edge ou seu navegador de preferência.
2. O sistema funcionará com 100% dos recursos usando o armazenamento local do navegador!

---

## 📁 Estrutura de Arquivos

```
projeto mcp/
├── iniciar_payin.bat          # Inicializador de 1 clique no Windows
├── server.ps1                 # Servidor local nativo em PowerShell (sem dependências)
├── index.html                 # Interface completa do sistema
├── README.md                  # Manual do usuário
├── css/
│   └── styles.css             # Estilos sofisticados (Marrom, Bege, Branco, Dourado)
├── js/
│   ├── chart.min.js           # Biblioteca de gráficos (suporte 100% offline)
│   └── app.js                 # Lógica de negócio, multiusuário, filtros e relatórios
└── data/
    ├── database.json          # Banco de dados local em formato JSON
    └── despesas_payin.csv     # Planilha CSV sincronizada pronta para o Excel
```
