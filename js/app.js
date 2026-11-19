/**
 * ============================================================================
 * PAYIN - GESTÃO FINANCEIRA INTELIGENTE
 * Lógica principal da aplicação, múltiplos usuários, controle mensal,
 * dashboard histórico com gráficos e exportação CSV.
 * ============================================================================
 */

(function () {
  'use strict';

  // --------------------------------------------------------------------------
  // ESTADO GLOBAL DA APLICAÇÃO
  // --------------------------------------------------------------------------
  const APP_STORAGE_KEY = 'payin_finance_db_v1';
  const THEME_STORAGE_KEY = 'payin_theme_mode';

  let appState = {
    currentUserId: null,
    currentMonth: getTodayMonth(), // 'AAAA-MM'
    filterType: 'all', // 'all' | 'fixo' | 'variavel'
    filterTerm: 'all', // 'all' | 'vista' | 'prazo'
    filterStatus: 'all', // 'all' | 'pago' | 'pendente'
    filterCategory: 'all',
    filterSearch: '',
    dashboardYear: '2026',
    data: {
      users: [],
      expenses: [],
      incomes: []
    }
  };

  // Instâncias dos Gráficos (Chart.js)
  let charts = {
    monthlyEvolution: null,
    topExpenses: null,
    categoryDistribution: null,
    paymentDistribution: null
  };

  // --------------------------------------------------------------------------
  // DADOS DE EXEMPLO (SEED) PARA DEMONSTRAÇÃO IMEDIATA
  // --------------------------------------------------------------------------
  function getSampleData() {
    const demoUser = {
      id: 'usr_demo_1',
      name: 'Lucas Candoti',
      email: 'lucas@payin.com',
      createdAt: '2026-01-01T10:00:00Z'
    };

    const demoExpenses = [
      // Mês 2026-08
      { id: 'exp_1', userId: 'usr_demo_1', type: 'fixo', fixedAccountType: 'Aluguel / Moradia', description: 'Aluguel do Apartamento', category: 'Moradia', amount: 1850.00, date: '2026-08-05', targetMonth: '2026-08', paymentTerm: 'vista', paymentMethod: 'Pix', installmentCurrent: 1, installmentTotal: 1, status: 'pago', notes: 'Pago com comprovante' },
      { id: 'exp_2', userId: 'usr_demo_1', type: 'fixo', fixedAccountType: 'Energia Elétrica (Luz)', description: 'Conta de Energia (Enel)', category: 'Moradia', amount: 215.40, date: '2026-08-10', targetMonth: '2026-08', paymentTerm: 'vista', paymentMethod: 'Boleto', installmentCurrent: 1, installmentTotal: 1, status: 'pago', notes: '' },
      { id: 'exp_3', userId: 'usr_demo_1', type: 'variavel', fixedAccountType: '', description: 'Supermercado Mensal Pão de Açúcar', category: 'Alimentação / Mercado', amount: 980.50, date: '2026-08-12', targetMonth: '2026-08', paymentTerm: 'vista', paymentMethod: 'Cartão de Débito', installmentCurrent: 1, installmentTotal: 1, status: 'pago', notes: 'Abastecimento da despensa e carnes' },
      { id: 'exp_4', userId: 'usr_demo_1', type: 'variavel', fixedAccountType: '', description: 'Jantar Restaurante La Pasta', category: 'Restaurantes / Delivery', amount: 240.00, date: '2026-08-20', targetMonth: '2026-08', paymentTerm: 'vista', paymentMethod: 'Cartão de Crédito', installmentCurrent: 1, installmentTotal: 1, status: 'pago', notes: 'Comemoração com a família' },

      // Mês 2026-09
      { id: 'exp_5', userId: 'usr_demo_1', type: 'fixo', fixedAccountType: 'Aluguel / Moradia', description: 'Aluguel do Apartamento', category: 'Moradia', amount: 1850.00, date: '2026-09-05', targetMonth: '2026-09', paymentTerm: 'vista', paymentMethod: 'Pix', installmentCurrent: 1, installmentTotal: 1, status: 'pago', notes: '' },
      { id: 'exp_6', userId: 'usr_demo_1', type: 'fixo', fixedAccountType: 'Internet / Wi-Fi', description: 'Fibra Óptica 600MB', category: 'Moradia', amount: 129.90, date: '2026-09-15', targetMonth: '2026-09', paymentTerm: 'vista', paymentMethod: 'Pix', installmentCurrent: 1, installmentTotal: 1, status: 'pago', notes: '' },
      { id: 'exp_7', userId: 'usr_demo_1', type: 'variavel', fixedAccountType: '', description: 'Tênis de Corrida Nike Air', category: 'Vestuário / Moda', amount: 699.90, date: '2026-09-18', targetMonth: '2026-09', paymentTerm: 'prazo', paymentMethod: 'Cartão de Crédito', installmentCurrent: 1, installmentTotal: 3, status: 'pago', notes: 'Comprado na Netshoes com desconto' },
      { id: 'exp_8', userId: 'usr_demo_1', type: 'variavel', fixedAccountType: '', description: 'Revisão e Troca de Óleo Carro', category: 'Transporte / Combustível', amount: 480.00, date: '2026-09-25', targetMonth: '2026-09', paymentTerm: 'vista', paymentMethod: 'Pix', installmentCurrent: 1, installmentTotal: 1, status: 'pago', notes: 'Oficina Mecânica Centro' },

      // Mês 2026-10
      { id: 'exp_9', userId: 'usr_demo_1', type: 'fixo', fixedAccountType: 'Aluguel / Moradia', description: 'Aluguel do Apartamento', category: 'Moradia', amount: 1850.00, date: '2026-10-05', targetMonth: '2026-10', paymentTerm: 'vista', paymentMethod: 'Pix', installmentCurrent: 1, installmentTotal: 1, status: 'pago', notes: '' },
      { id: 'exp_10', userId: 'usr_demo_1', type: 'fixo', fixedAccountType: 'Condomínio', description: 'Condomínio Edifício Florença', category: 'Moradia', amount: 450.00, date: '2026-10-10', targetMonth: '2026-10', paymentTerm: 'vista', paymentMethod: 'Boleto', installmentCurrent: 1, installmentTotal: 1, status: 'pago', notes: '' },
      { id: 'exp_11', userId: 'usr_demo_1', type: 'variavel', fixedAccountType: '', description: 'Monitor Dell 27 4K UltraHD', category: 'Eletrônicos / Tecnologia', amount: 2199.00, date: '2026-10-12', targetMonth: '2026-10', paymentTerm: 'prazo', paymentMethod: 'Cartão de Crédito', installmentCurrent: 1, installmentTotal: 6, status: 'pago', notes: 'Setup de trabalho home office' },
      { id: 'exp_12', userId: 'usr_demo_1', type: 'variavel', fixedAccountType: '', description: 'Tênis de Corrida Nike Air', category: 'Vestuário / Moda', amount: 233.30, date: '2026-10-18', targetMonth: '2026-10', paymentTerm: 'prazo', paymentMethod: 'Cartão de Crédito', installmentCurrent: 2, installmentTotal: 3, status: 'pago', notes: 'Parcela 2 de 3' },
      { id: 'exp_13', userId: 'usr_demo_1', type: 'variavel', fixedAccountType: '', description: 'Compras Supermercado Carrefour', category: 'Alimentação / Mercado', amount: 1120.00, date: '2026-10-22', targetMonth: '2026-10', paymentTerm: 'vista', paymentMethod: 'Cartão de Débito', installmentCurrent: 1, installmentTotal: 1, status: 'pago', notes: '' },

      // Mês 2026-11 (Mês Atual)
      { id: 'exp_14', userId: 'usr_demo_1', type: 'fixo', fixedAccountType: 'Aluguel / Moradia', description: 'Aluguel do Apartamento', category: 'Moradia', amount: 1850.00, date: '2026-11-05', targetMonth: '2026-11', paymentTerm: 'vista', paymentMethod: 'Pix', installmentCurrent: 1, installmentTotal: 1, status: 'pago', notes: 'Transferência feita via Pix' },
      { id: 'exp_15', userId: 'usr_demo_1', type: 'fixo', fixedAccountType: 'Condomínio', description: 'Condomínio Edifício Florença', category: 'Moradia', amount: 450.00, date: '2026-11-10', targetMonth: '2026-11', paymentTerm: 'vista', paymentMethod: 'Boleto', installmentCurrent: 1, installmentTotal: 1, status: 'pago', notes: '' },
      { id: 'exp_16', userId: 'usr_demo_1', type: 'fixo', fixedAccountType: 'Energia Elétrica (Luz)', description: 'Conta de Energia (Enel)', category: 'Moradia', amount: 198.70, date: '2026-11-20', targetMonth: '2026-11', paymentTerm: 'vista', paymentMethod: 'Pix', installmentCurrent: 1, installmentTotal: 1, status: 'pendente', notes: 'Vence dia 20' },
      { id: 'exp_17', userId: 'usr_demo_1', type: 'fixo', fixedAccountType: 'Internet / Wi-Fi', description: 'Fibra Óptica 600MB', category: 'Moradia', amount: 129.90, date: '2026-11-22', targetMonth: '2026-11', paymentTerm: 'vista', paymentMethod: 'Cartão de Crédito', installmentCurrent: 1, installmentTotal: 1, status: 'pendente', notes: 'Débito automático' },
      { id: 'exp_18', userId: 'usr_demo_1', type: 'fixo', fixedAccountType: 'Assinaturas / Streaming', description: 'Netflix + Spotify Duo', category: 'Serviços / Assinaturas', amount: 89.80, date: '2026-11-15', targetMonth: '2026-11', paymentTerm: 'vista', paymentMethod: 'Cartão de Crédito', installmentCurrent: 1, installmentTotal: 1, status: 'pago', notes: '' },
      { id: 'exp_19', userId: 'usr_demo_1', type: 'variavel', fixedAccountType: '', description: 'Monitor Dell 27 4K UltraHD', category: 'Eletrônicos / Tecnologia', amount: 366.50, date: '2026-11-12', targetMonth: '2026-11', paymentTerm: 'prazo', paymentMethod: 'Cartão de Crédito', installmentCurrent: 2, installmentTotal: 6, status: 'pago', notes: 'Parcela 2 de 6' },
      { id: 'exp_20', userId: 'usr_demo_1', type: 'variavel', fixedAccountType: '', description: 'Tênis de Corrida Nike Air', category: 'Vestuário / Moda', amount: 233.30, date: '2026-11-18', targetMonth: '2026-11', paymentTerm: 'prazo', paymentMethod: 'Cartão de Crédito', installmentCurrent: 3, installmentTotal: 3, status: 'pendente', notes: 'Última parcela! Finaliza a compra' },
      { id: 'exp_21', userId: 'usr_demo_1', type: 'variavel', fixedAccountType: '', description: 'Supermercado Pão de Açúcar', category: 'Alimentação / Mercado', amount: 760.40, date: '2026-11-14', targetMonth: '2026-11', paymentTerm: 'vista', paymentMethod: 'Cartão de Débito', installmentCurrent: 1, installmentTotal: 1, status: 'pago', notes: 'Frutas, legumes e lanches' },
      { id: 'exp_22', userId: 'usr_demo_1', type: 'variavel', fixedAccountType: '', description: 'Combustível Posto Ipiranga', category: 'Transporte / Combustível', amount: 250.00, date: '2026-11-16', targetMonth: '2026-11', paymentTerm: 'vista', paymentMethod: 'Pix', installmentCurrent: 1, installmentTotal: 1, status: 'pago', notes: 'Tanque cheio gasolina aditivada' },
      { id: 'exp_23', userId: 'usr_demo_1', type: 'variavel', fixedAccountType: '', description: 'Farmácia Remédios & Vitaminas', category: 'Saúde / Farmácia', amount: 145.20, date: '2026-11-17', targetMonth: '2026-11', paymentTerm: 'vista', paymentMethod: 'Pix', installmentCurrent: 1, installmentTotal: 1, status: 'pago', notes: 'Vitamina C e analgésico' }
    ];

    const demoIncomes = [
      { id: 'inc_1', userId: 'usr_demo_1', description: 'Salário Mensal', amount: 6500.00, date: '2026-08-05', targetMonth: '2026-08', category: 'Salário' },
      { id: 'inc_2', userId: 'usr_demo_1', description: 'Salário Mensal', amount: 6500.00, date: '2026-09-05', targetMonth: '2026-09', category: 'Salário' },
      { id: 'inc_3', userId: 'usr_demo_1', description: 'Salário Mensal', amount: 6500.00, date: '2026-10-05', targetMonth: '2026-10', category: 'Salário' },
      { id: 'inc_4', userId: 'usr_demo_1', description: 'Projeto Freelance Web', amount: 2200.00, date: '2026-10-20', targetMonth: '2026-10', category: 'Freelance' },
      { id: 'inc_5', userId: 'usr_demo_1', description: 'Salário Mensal', amount: 6500.00, date: '2026-11-05', targetMonth: '2026-11', category: 'Salário' },
      { id: 'inc_6', userId: 'usr_demo_1', description: 'Dividendos Investimentos', amount: 340.50, date: '2026-11-15', targetMonth: '2026-11', category: 'Investimentos' }
    ];

    return {
      users: [demoUser],
      expenses: demoExpenses,
      incomes: demoIncomes
    };
  }

  // --------------------------------------------------------------------------
  // CARREGAR E SALVAR DADOS
  // --------------------------------------------------------------------------
  function loadDatabase() {
    try {
      const stored = localStorage.getItem(APP_STORAGE_KEY);
      if (stored) {
        appState.data = JSON.parse(stored);
      } else {
        appState.data = getSampleData();
        saveDatabaseLocally();
      }
    } catch (e) {
      console.error('Erro ao ler localStorage:', e);
      appState.data = getSampleData();
    }

    // Selecionar primeiro usuário se nenhum selecionado
    if (!appState.currentUserId && appState.data.users.length > 0) {
      appState.currentUserId = appState.data.users[0].id;
    }

    // Tentar sincronizar em background com o servidor local (PowerShell REST API) se disponível
    syncWithBackendServer();
  }

  function saveDatabaseLocally() {
    try {
      localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(appState.data));
    } catch (e) {
      console.error('Erro ao salvar no localStorage:', e);
    }
    // Dispara salvamento no backend se conectado
    syncWithBackendServer();
  }

  async function syncWithBackendServer() {
    try {
      const response = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appState.data)
      });
      if (response.ok) {
        const badge = document.getElementById('serverStatusBadge');
        if (badge) {
          badge.textContent = 'Banco Local Conectado (Pasta data/)';
          badge.className = 'badge badge-paid';
        }
      }
    } catch (e) {
      // Servidor local não está rodando ou estamos em file://
      const badge = document.getElementById('serverStatusBadge');
      if (badge) {
        badge.textContent = 'Armazenamento Local do Navegador';
        badge.className = 'badge badge-variable';
      }
    }
  }

  // --------------------------------------------------------------------------
  // UTILITÁRIOS DE DATA E FORMATAÇÃO
  // --------------------------------------------------------------------------
  function getTodayMonth() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  function getTodayDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function formatCurrency(val) {
    const num = Number(val) || 0;
    return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function formatDateBR(dateStr) {
    if (!dateStr) return '-';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  }

  function getMonthNameLabel(yearMonth) {
    if (!yearMonth) return '';
    const [year, month] = yearMonth.split('-');
    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    const mIdx = parseInt(month, 10) - 1;
    return `${monthNames[mIdx]} / ${year}`;
  }

  // --------------------------------------------------------------------------
  // GESTÃO DE USUÁRIOS
  // --------------------------------------------------------------------------
  function getCurrentUser() {
    return appState.data.users.find(u => u.id === appState.currentUserId) || null;
  }

  function renderUserHeader() {
    const user = getCurrentUser();
    const nameEl = document.getElementById('currentUserName');
    const letterEl = document.getElementById('userAvatarLetter');
    if (user) {
      nameEl.textContent = user.name;
      letterEl.textContent = user.name.charAt(0).toUpperCase();
    } else {
      nameEl.textContent = 'Visitante';
      letterEl.textContent = 'V';
    }
  }

  function renderUsersModalList() {
    const container = document.getElementById('usersListContainer');
    container.innerHTML = '';

    appState.data.users.forEach(user => {
      const isCurrent = user.id === appState.currentUserId;
      const card = document.createElement('div');
      card.className = 'ranking-item';
      card.style.cursor = 'pointer';
      if (isCurrent) {
        card.style.borderColor = 'var(--color-brown-primary)';
        card.style.backgroundColor = 'var(--color-gold-soft)';
      }

      card.innerHTML = `
        <div class="ranking-item-left">
          <div class="user-avatar-circle" style="width: 36px; height: 36px;">
            ${user.name.charAt(0).toUpperCase()}
          </div>
          <div class="ranking-item-info">
            <h5>${escapeHtml(user.name)} ${isCurrent ? '<span style="font-size: 11px; color: var(--color-brown-primary); font-weight:700;">(Ativo)</span>' : ''}</h5>
            <span>${escapeHtml(user.email || 'Sem e-mail cadastrado')}</span>
          </div>
        </div>
        <button class="btn btn-sm ${isCurrent ? 'btn-primary' : 'btn-outline'}">
          ${isCurrent ? 'Selecionado' : 'Entrar'}
        </button>
      `;

      card.addEventListener('click', () => {
        switchUser(user.id);
        closeUserModal();
      });

      container.appendChild(card);
    });
  }

  function switchUser(userId) {
    appState.currentUserId = userId;
    saveDatabaseLocally();
    renderUserHeader();
    renderMonthlyView();
    if (isDashboardActive()) {
      renderDashboardView();
    }
    showToast(`Usuário alterado com sucesso!`, 'info');
  }

  function handleCreateUser(e) {
    e.preventDefault();
    const nameInput = document.getElementById('newUserName');
    const emailInput = document.getElementById('newUserEmail');
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();

    if (!name) {
      showToast('Por favor, digite o nome do usuário.', 'error');
      return;
    }

    const newUser = {
      id: 'usr_' + Date.now(),
      name: name,
      email: email,
      createdAt: new Date().toISOString()
    };

    appState.data.users.push(newUser);
    appState.currentUserId = newUser.id;
    saveDatabaseLocally();

    nameInput.value = '';
    emailInput.value = '';

    renderUserHeader();
    renderMonthlyView();
    closeUserModal();
    showToast(`Usuário "${newUser.name}" cadastrado e ativado!`, 'success');
  }

  // --------------------------------------------------------------------------
  // CONTROLE MÊS A MÊS (RENDERIZAÇÃO E FILTROS)
  // --------------------------------------------------------------------------
  function getUserExpenses() {
    return appState.data.expenses.filter(e => e.userId === appState.currentUserId);
  }

  function getUserIncomes() {
    return appState.data.incomes.filter(i => i.userId === appState.currentUserId);
  }

  function renderMonthlyView() {
    const month = appState.currentMonth;
    document.getElementById('currentMonthLabel').textContent = getMonthNameLabel(month);
    document.getElementById('tableMonthTitle').textContent = getMonthNameLabel(month);
    document.getElementById('monthPickerInput').value = month;
    const exportLabel = document.getElementById('exportMonthLabelName');
    if (exportLabel) exportLabel.textContent = getMonthNameLabel(month);

    // Despesas do mês
    const allExpenses = getUserExpenses();
    const monthExpenses = allExpenses.filter(e => e.targetMonth === month);

    // Receitas do mês
    const allIncomes = getUserIncomes();
    const monthIncomes = allIncomes.filter(i => i.targetMonth === month);

    // Calcular KPIs do Mês
    const totalExpenses = monthExpenses.reduce((acc, cur) => acc + (Number(cur.amount) || 0), 0);
    const fixedExpenses = monthExpenses.filter(e => e.type === 'fixo').reduce((acc, cur) => acc + (Number(cur.amount) || 0), 0);
    const variableExpenses = monthExpenses.filter(e => e.type === 'variavel').reduce((acc, cur) => acc + (Number(cur.amount) || 0), 0);
    const totalIncomes = monthIncomes.reduce((acc, cur) => acc + (Number(cur.amount) || 0), 0);
    const balance = totalIncomes - totalExpenses;

    const paidExpenses = monthExpenses.filter(e => e.status === 'pago');
    const pendingExpenses = monthExpenses.filter(e => e.status === 'pendente');
    const paidTotal = paidExpenses.reduce((acc, cur) => acc + (Number(cur.amount) || 0), 0);

    const fixedPct = totalExpenses > 0 ? Math.round((fixedExpenses / totalExpenses) * 100) : 0;
    const varPct = totalExpenses > 0 ? Math.round((variableExpenses / totalExpenses) * 100) : 0;

    // Atualizar Elementos no DOM
    document.getElementById('kpiMonthTotalExpenses').textContent = formatCurrency(totalExpenses);
    document.getElementById('kpiMonthCountExpenses').textContent = `${monthExpenses.length} ${monthExpenses.length === 1 ? 'despesa cadastrada' : 'despesas cadastradas'}`;

    document.getElementById('kpiMonthFixedExpenses').textContent = formatCurrency(fixedExpenses);
    document.getElementById('kpiMonthFixedPercent').textContent = `${fixedPct}% do total`;

    document.getElementById('kpiMonthVariableExpenses').textContent = formatCurrency(variableExpenses);
    document.getElementById('kpiMonthVariablePercent').textContent = `${varPct}% do total`;

    const balanceEl = document.getElementById('kpiMonthBalance');
    balanceEl.textContent = formatCurrency(balance);
    balanceEl.style.color = balance >= 0 ? 'var(--badge-paid-text)' : 'var(--badge-pending-text)';
    document.getElementById('kpiMonthIncomes').textContent = formatCurrency(totalIncomes);

    document.getElementById('kpiMonthPaidTotal').textContent = formatCurrency(paidTotal);
    document.getElementById('kpiMonthPaidCount').textContent = `${paidExpenses.length} pagas`;
    document.getElementById('kpiMonthPendingCount').textContent = `${pendingExpenses.length} pendentes`;

    // Atualizar categorias no dropdown de filtro
    populateCategoryFilter(allExpenses);

    // Filtrar e Renderizar Tabela
    renderFilteredExpensesTable(monthExpenses);
  }

  function populateCategoryFilter(expenses) {
    const select = document.getElementById('filterCategorySelect');
    const currentVal = appState.filterCategory;
    const categories = new Set();
    expenses.forEach(e => {
      if (e.category) categories.add(e.category);
    });

    select.innerHTML = '<option value="all">Todas as Categorias</option>';
    Array.from(categories).sort().forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat;
      opt.textContent = cat;
      if (cat === currentVal) opt.selected = true;
      select.appendChild(opt);
    });
  }

  function renderFilteredExpensesTable(monthExpenses) {
    const tbody = document.getElementById('monthExpensesTableBody');
    const emptyState = document.getElementById('emptyStateExpenses');
    const countBadge = document.getElementById('tableRowCountBadge');
    tbody.innerHTML = '';

    // Aplicar filtros
    let filtered = monthExpenses.filter(e => {
      // Tipo (Fixo / Variável)
      if (appState.filterType !== 'all' && e.type !== appState.filterType) return false;

      // Condição de Pagamento (À Vista / A Prazo)
      if (appState.filterTerm !== 'all' && e.paymentTerm !== appState.filterTerm) return false;

      // Status (Pago / Pendente)
      if (appState.filterStatus !== 'all' && e.status !== appState.filterStatus) return false;

      // Categoria
      if (appState.filterCategory !== 'all' && e.category !== appState.filterCategory) return false;

      // Busca por texto
      if (appState.filterSearch) {
        const query = appState.filterSearch.toLowerCase();
        const desc = (e.description || '').toLowerCase();
        const fixedType = (e.fixedAccountType || '').toLowerCase();
        const obs = (e.notes || '').toLowerCase();
        const cat = (e.category || '').toLowerCase();
        const method = (e.paymentMethod || '').toLowerCase();
        if (!desc.includes(query) && !fixedType.includes(query) && !obs.includes(query) && !cat.includes(query) && !method.includes(query)) {
          return false;
        }
      }

      return true;
    });

    // Ordenar por data decrescente
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

    countBadge.textContent = `${filtered.length} ${filtered.length === 1 ? 'registro' : 'registros'}`;

    if (filtered.length === 0) {
      emptyState.style.display = 'flex';
      return;
    }

    emptyState.style.display = 'none';

    filtered.forEach(item => {
      const tr = document.createElement('tr');

      // Descrição & Observação
      const displayName = item.type === 'fixo' && item.fixedAccountType 
        ? `${escapeHtml(item.description)} <span style="font-size:11.5px; color:var(--text-muted); font-weight:normal;">(${escapeHtml(item.fixedAccountType)})</span>`
        : escapeHtml(item.description);

      const obsHtml = item.notes ? `<span class="obs-text" title="${escapeHtml(item.notes)}">📝 ${escapeHtml(item.notes)}</span>` : '';

      // Badges
      const typeBadgeClass = item.type === 'fixo' ? 'badge-fixed' : 'badge-variable';
      const typeLabel = item.type === 'fixo' ? 'Fixo' : 'Variável';

      const isPrazo = item.paymentTerm === 'prazo';
      const paymentInfo = isPrazo && item.installmentTotal > 1 
        ? `${item.paymentMethod || 'A Prazo'} (${item.installmentCurrent || 1}/${item.installmentTotal}x)`
        : `${item.paymentMethod || 'À Vista'}`;

      const statusBadgeClass = item.status === 'pago' ? 'badge-paid' : 'badge-pending';
      const statusLabel = item.status === 'pago' ? '✓ Pago' : '⏳ Pendente';

      tr.innerHTML = `
        <td style="white-space: nowrap; color: var(--text-secondary); font-size: 13px;">${formatDateBR(item.date)}</td>
        <td>
          <div class="item-desc-cell">
            <span>${displayName}</span>
            ${obsHtml}
          </div>
        </td>
        <td><span class="badge badge-payment">${escapeHtml(item.category || 'Geral')}</span></td>
        <td><span class="badge ${typeBadgeClass}">${typeLabel}</span></td>
        <td><span class="badge badge-payment">${escapeHtml(paymentInfo)}</span></td>
        <td class="amount-cell">${formatCurrency(item.amount)}</td>
        <td>
          <span class="badge badge-status ${statusBadgeClass}" data-action="toggle-status" data-id="${item.id}" title="Clique para alternar status de pagamento">
            ${statusLabel}
          </span>
        </td>
        <td>
          <div class="row-actions">
            <button class="action-btn" data-action="edit" data-id="${item.id}" title="Editar Gasto">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
            <button class="action-btn" data-action="duplicate" data-id="${item.id}" title="Duplicar para o próximo mês">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
            </button>
            <button class="action-btn delete" data-action="delete" data-id="${item.id}" title="Excluir Gasto">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </button>
          </div>
        </td>
      `;

      tbody.appendChild(tr);
    });
  }

  // Ações na Tabela de Gastos
  function handleTableClick(e) {
    const target = e.target.closest('[data-action]');
    if (!target) return;

    const action = target.getAttribute('data-action');
    const id = target.getAttribute('data-id');

    if (action === 'toggle-status') {
      toggleExpenseStatus(id);
    } else if (action === 'edit') {
      openEditExpenseModal(id);
    } else if (action === 'duplicate') {
      duplicateExpenseToNextMonth(id);
    } else if (action === 'delete') {
      confirmDeleteExpense(id);
    }
  }

  function toggleExpenseStatus(id) {
    const expense = appState.data.expenses.find(e => e.id === id);
    if (!expense) return;

    expense.status = expense.status === 'pago' ? 'pendente' : 'pago';
    saveDatabaseLocally();
    renderMonthlyView();
    if (isDashboardActive()) renderDashboardView();
    showToast(`Status alterado para: ${expense.status === 'pago' ? 'Pago' : 'Pendente'}`, 'info');
  }

  function duplicateExpenseToNextMonth(id) {
    const original = appState.data.expenses.find(e => e.id === id);
    if (!original) return;

    // Calcular próximo mês
    const [y, m] = original.targetMonth.split('-').map(Number);
    let nextY = y;
    let nextM = m + 1;
    if (nextM > 12) {
      nextM = 1;
      nextY++;
    }
    const nextTargetMonth = `${nextY}-${String(nextM).padStart(2, '0')}`;

    // Nova data correspondente
    const day = original.date.split('-')[2] || '05';
    const nextDate = `${nextTargetMonth}-${day}`;

    const newExpense = {
      ...original,
      id: 'exp_' + Date.now(),
      targetMonth: nextTargetMonth,
      date: nextDate,
      status: 'pendente', // Duplica como pendente por padrão
      createdAt: new Date().toISOString()
    };

    appState.data.expenses.push(newExpense);
    saveDatabaseLocally();
    renderMonthlyView();
    if (isDashboardActive()) renderDashboardView();
    showToast(`Gasto duplicado para ${getMonthNameLabel(nextTargetMonth)}!`, 'success');
  }

  function confirmDeleteExpense(id) {
    const expense = appState.data.expenses.find(e => e.id === id);
    if (!expense) return;

    if (confirm(`Deseja realmente excluir "${expense.description}"?`)) {
      appState.data.expenses = appState.data.expenses.filter(e => e.id !== id);
      saveDatabaseLocally();
      renderMonthlyView();
      if (isDashboardActive()) renderDashboardView();
      showToast('Gasto excluído com sucesso.', 'info');
    }
  }

  // --------------------------------------------------------------------------
  // NAVEGAÇÃO DE MÊS
  // --------------------------------------------------------------------------
  function navigateMonth(offset) {
    const [y, m] = appState.currentMonth.split('-').map(Number);
    let nextY = y;
    let nextM = m + offset;
    if (nextM > 12) {
      nextM = 1;
      nextY++;
    } else if (nextM < 1) {
      nextM = 12;
      nextY--;
    }
    appState.currentMonth = `${nextY}-${String(nextM).padStart(2, '0')}`;
    renderMonthlyView();
  }

  function setMonth(monthStr) {
    if (!monthStr) return;
    appState.currentMonth = monthStr;
    renderMonthlyView();
  }

  // --------------------------------------------------------------------------
  // DASHBOARD GERAL HISTÓRICO (TODOS OS MESES & GRÁFICOS)
  // --------------------------------------------------------------------------
  function renderDashboardView() {
    const allExpenses = getUserExpenses();
    const allIncomes = getUserIncomes();
    const yearFilter = appState.dashboardYear;

    // Filtrar por ano caso selecionado
    let expenses = allExpenses;
    let incomes = allIncomes;
    if (yearFilter !== 'all') {
      expenses = allExpenses.filter(e => (e.targetMonth || '').startsWith(yearFilter));
      incomes = allIncomes.filter(i => (i.targetMonth || '').startsWith(yearFilter));
    }

    // Totais Globais
    const totalSpent = expenses.reduce((acc, cur) => acc + (Number(cur.amount) || 0), 0);
    const fixedTotal = expenses.filter(e => e.type === 'fixo').reduce((acc, cur) => acc + (Number(cur.amount) || 0), 0);
    const varTotal = expenses.filter(e => e.type === 'variavel').reduce((acc, cur) => acc + (Number(cur.amount) || 0), 0);

    // Média Mensal
    const uniqueMonths = Array.from(new Set(expenses.map(e => e.targetMonth))).filter(Boolean);
    const countMonths = uniqueMonths.length || 1;
    const monthlyAverage = totalSpent / countMonths;

    // Mês com maior gasto
    const monthlyTotalsMap = {};
    expenses.forEach(e => {
      monthlyTotalsMap[e.targetMonth] = (monthlyTotalsMap[e.targetMonth] || 0) + Number(e.amount);
    });

    let peakMonth = '-';
    let peakAmount = 0;
    Object.entries(monthlyTotalsMap).forEach(([m, amt]) => {
      if (amt > peakAmount) {
        peakAmount = amt;
        peakMonth = m;
      }
    });

    const fixedRatio = totalSpent > 0 ? Math.round((fixedTotal / totalSpent) * 100) : 0;
    const varRatio = totalSpent > 0 ? Math.round((varTotal / totalSpent) * 100) : 0;

    // Atualizar KPIs Globais no DOM
    document.getElementById('kpiGlobalTotalExpenses').textContent = formatCurrency(totalSpent);
    document.getElementById('kpiGlobalExpensesCount').textContent = `${expenses.length} despesas registradas`;
    document.getElementById('kpiGlobalMonthlyAverage').textContent = formatCurrency(monthlyAverage);
    document.getElementById('kpiGlobalPeakMonth').textContent = peakMonth !== '-' ? getMonthNameLabel(peakMonth) : 'Nenhum';
    document.getElementById('kpiGlobalPeakMonthAmount').textContent = peakAmount > 0 ? `Pico de ${formatCurrency(peakAmount)}` : 'R$ 0,00';
    document.getElementById('kpiGlobalFixedVsVarRatio').textContent = `${fixedRatio}% / ${varRatio}%`;

    // Renderizar Gráficos Chart.js
    renderEvolutionChart(expenses, incomes);
    renderTopExpensesChart(expenses);
    renderCategoryChart(expenses);
    renderPaymentChart(expenses);

    // Renderizar Tabela Ranking das Maiores Despesas
    renderRankingTable(expenses);
  }

  function getThemeColors() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    return {
      textColor: isDark ? '#F8F5F0' : '#2B2019',
      mutedColor: isDark ? '#B7A89B' : '#746459',
      gridColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
      brownDeep: isDark ? '#D4A373' : '#5C3E2A',
      brownLight: isDark ? '#8C5528' : '#8A5D3B',
      variableColor: isDark ? '#F0A868' : '#C0662A',
      fixedColor: isDark ? '#D3C3B7' : '#4A3B32',
      gold: '#C59A3F',
      goldSoft: isDark ? '#3D311B' : '#FDF7EB',
      palette: [
        isDark ? '#D4A373' : '#5C3E2A',
        isDark ? '#F0A868' : '#C0662A',
        isDark ? '#E5B869' : '#C59A3F',
        isDark ? '#7AC290' : '#3E7B54',
        isDark ? '#B084CC' : '#724D8C',
        isDark ? '#6FA8DC' : '#396B9A',
        isDark ? '#E07A5F' : '#B84A39',
        isDark ? '#A89F91' : '#8C8275'
      ]
    };
  }

  function renderEvolutionChart(expenses, incomes) {
    const ctx = document.getElementById('chartMonthlyEvolution');
    if (!ctx) return;

    const colors = getThemeColors();

    // Obter todos os meses ordenados cronologicamente
    const monthsSet = new Set();
    expenses.forEach(e => { if (e.targetMonth) monthsSet.add(e.targetMonth); });
    incomes.forEach(i => { if (i.targetMonth) monthsSet.add(i.targetMonth); });

    let sortedMonths = Array.from(monthsSet).sort();
    if (sortedMonths.length === 0) {
      sortedMonths = [appState.currentMonth];
    }

    const labels = sortedMonths.map(m => {
      const [year, month] = m.split('-');
      const monthShort = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      return `${monthShort[parseInt(month, 10) - 1]}/${year.substring(2)}`;
    });

    const fixedData = sortedMonths.map(m => {
      return expenses.filter(e => e.targetMonth === m && e.type === 'fixo')
                     .reduce((acc, cur) => acc + Number(cur.amount), 0);
    });

    const varData = sortedMonths.map(m => {
      return expenses.filter(e => e.targetMonth === m && e.type === 'variavel')
                     .reduce((acc, cur) => acc + Number(cur.amount), 0);
    });

    if (charts.monthlyEvolution) {
      charts.monthlyEvolution.destroy();
    }

    charts.monthlyEvolution = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Contas Fixas',
            data: fixedData,
            backgroundColor: colors.fixedColor,
            borderRadius: 6,
            stack: 'expenses'
          },
          {
            label: 'Contas Variáveis',
            data: varData,
            backgroundColor: colors.variableColor,
            borderRadius: 6,
            stack: 'expenses'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: colors.textColor, font: { family: 'Outfit', size: 12 } }
          },
          tooltip: {
            callbacks: {
              label: (item) => `${item.dataset.label}: ${formatCurrency(item.raw)}`
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: colors.mutedColor, font: { family: 'Outfit' } }
          },
          y: {
            grid: { color: colors.gridColor },
            ticks: {
              color: colors.mutedColor,
              font: { family: 'Outfit' },
              callback: (val) => 'R$ ' + val
            }
          }
        }
      }
    });
  }

  function renderTopExpensesChart(expenses) {
    const ctx = document.getElementById('chartTopExpenses');
    if (!ctx) return;

    const colors = getThemeColors();

    // Top 6 Maiores Gastos Individuais
    const sorted = [...expenses].sort((a, b) => Number(b.amount) - Number(a.amount)).slice(0, 6);

    const labels = sorted.map(e => {
      const desc = e.description || e.fixedAccountType || 'Gasto';
      return desc.length > 20 ? desc.substring(0, 20) + '...' : desc;
    });
    const data = sorted.map(e => Number(e.amount));

    if (charts.topExpenses) {
      charts.topExpenses.destroy();
    }

    charts.topExpenses = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Valor da Despesa',
          data: data,
          backgroundColor: colors.brownDeep,
          borderRadius: 8
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (item) => `Valor: ${formatCurrency(item.raw)}`
            }
          }
        },
        scales: {
          x: {
            grid: { color: colors.gridColor },
            ticks: {
              color: colors.mutedColor,
              font: { family: 'Outfit' },
              callback: (val) => 'R$ ' + val
            }
          },
          y: {
            grid: { display: false },
            ticks: { color: colors.textColor, font: { family: 'Outfit', weight: '500' } }
          }
        }
      }
    });
  }

  function renderCategoryChart(expenses) {
    const ctx = document.getElementById('chartCategoryDistribution');
    if (!ctx) return;

    const colors = getThemeColors();

    const categoryMap = {};
    expenses.forEach(e => {
      const cat = e.category || 'Outros';
      categoryMap[cat] = (categoryMap[cat] || 0) + Number(e.amount);
    });

    const entries = Object.entries(categoryMap).sort((a, b) => b[1] - a[1]);
    const labels = entries.map(item => item[0]);
    const data = entries.map(item => item[1]);

    if (charts.categoryDistribution) {
      charts.categoryDistribution.destroy();
    }

    charts.categoryDistribution = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: colors.palette,
          borderWidth: 2,
          borderColor: document.documentElement.getAttribute('data-theme') === 'dark' ? '#221C18' : '#FFFFFF'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '68%',
        plugins: {
          legend: {
            position: 'right',
            labels: {
              color: colors.textColor,
              font: { family: 'Outfit', size: 12 },
              padding: 12
            }
          },
          tooltip: {
            callbacks: {
              label: (item) => `${item.label}: ${formatCurrency(item.raw)}`
            }
          }
        }
      }
    });
  }

  function renderPaymentChart(expenses) {
    const ctx = document.getElementById('chartPaymentDistribution');
    if (!ctx) return;

    const colors = getThemeColors();

    const vistaTotal = expenses.filter(e => e.paymentTerm === 'vista').reduce((acc, cur) => acc + Number(cur.amount), 0);
    const prazoTotal = expenses.filter(e => e.paymentTerm === 'prazo').reduce((acc, cur) => acc + Number(cur.amount), 0);

    if (charts.paymentDistribution) {
      charts.paymentDistribution.destroy();
    }

    charts.paymentDistribution = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['À Vista', 'A Prazo (Parcelado)'],
        datasets: [{
          data: [vistaTotal, prazoTotal],
          backgroundColor: [colors.brownDeep, colors.gold],
          borderWidth: 2,
          borderColor: document.documentElement.getAttribute('data-theme') === 'dark' ? '#221C18' : '#FFFFFF'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '68%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: colors.textColor,
              font: { family: 'Outfit', size: 12 }
            }
          },
          tooltip: {
            callbacks: {
              label: (item) => `${item.label}: ${formatCurrency(item.raw)}`
            }
          }
        }
      }
    });
  }

  function renderRankingTable(expenses) {
    const tbody = document.getElementById('rankingExpensesTableBody');
    tbody.innerHTML = '';

    const sorted = [...expenses].sort((a, b) => Number(b.amount) - Number(a.amount)).slice(0, 15);

    if (sorted.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding: 24px; color: var(--text-muted);">Nenhuma despesa para exibir no ranking.</td></tr>';
      return;
    }

    sorted.forEach((item, index) => {
      const tr = document.createElement('tr');
      const isPrazo = item.paymentTerm === 'prazo';
      const paymentInfo = isPrazo && item.installmentTotal > 1 
        ? `${item.paymentMethod || 'A Prazo'} (${item.installmentCurrent || 1}/${item.installmentTotal}x)`
        : `${item.paymentMethod || 'À Vista'}`;

      const typeBadgeClass = item.type === 'fixo' ? 'badge-fixed' : 'badge-variable';
      const typeLabel = item.type === 'fixo' ? 'Fixo' : 'Variável';
      const statusBadgeClass = item.status === 'pago' ? 'badge-paid' : 'badge-pending';
      const statusLabel = item.status === 'pago' ? 'Pago' : 'Pendente';

      tr.innerHTML = `
        <td style="font-weight: 700; color: var(--color-brown-primary);">${index + 1}º</td>
        <td>
          <div class="item-desc-cell">
            <span>${escapeHtml(item.description)}</span>
            ${item.notes ? `<span class="obs-text">📝 ${escapeHtml(item.notes)}</span>` : ''}
          </div>
        </td>
        <td><span class="badge badge-payment">${getMonthNameLabel(item.targetMonth)}</span></td>
        <td><span class="badge badge-payment">${escapeHtml(item.category || 'Geral')}</span></td>
        <td><span class="badge ${typeBadgeClass}">${typeLabel}</span></td>
        <td><span class="badge badge-payment">${escapeHtml(paymentInfo)}</span></td>
        <td class="amount-cell">${formatCurrency(item.amount)}</td>
        <td><span class="badge ${statusBadgeClass}">${statusLabel}</span></td>
      `;
      tbody.appendChild(tr);
    });
  }

  // --------------------------------------------------------------------------
  // CADASTRO E EDIÇÃO DE GASTOS (MODAL)
  // --------------------------------------------------------------------------
  function openNewExpenseModal() {
    const form = document.getElementById('formExpense');
    form.reset();

    document.getElementById('expenseEditId').value = '';
    document.getElementById('modalExpenseTitle').textContent = 'Novo Cadastro de Gasto';
    document.getElementById('expenseDate').value = getTodayDate();
    document.getElementById('expenseTargetMonth').value = appState.currentMonth;

    // Default tipo fixo
    document.getElementById('typeFixo').checked = true;
    updateExpenseModalFields();

    // Default à vista
    document.getElementById('termVista').checked = true;
    updatePaymentTermFields();

    openModal('modalExpense');
  }

  function openEditExpenseModal(id) {
    const expense = appState.data.expenses.find(e => e.id === id);
    if (!expense) return;

    document.getElementById('expenseEditId').value = expense.id;
    document.getElementById('modalExpenseTitle').textContent = 'Editar Gasto Cadastrado';

    if (expense.type === 'fixo') {
      document.getElementById('typeFixo').checked = true;
    } else {
      document.getElementById('typeVariavel').checked = true;
    }
    updateExpenseModalFields();

    if (expense.fixedAccountType) {
      document.getElementById('fixedAccountTypeSelect').value = expense.fixedAccountType;
    }
    document.getElementById('expenseDescription').value = expense.description || '';
    document.getElementById('expenseCategorySelect').value = expense.category || 'Outros';
    document.getElementById('expenseAmount').value = expense.amount || '';
    document.getElementById('expenseDate').value = expense.date || getTodayDate();
    document.getElementById('expenseTargetMonth').value = expense.targetMonth || appState.currentMonth;
    document.getElementById('expenseStatusSelect').value = expense.status || 'pago';

    if (expense.paymentTerm === 'prazo') {
      document.getElementById('termPrazo').checked = true;
    } else {
      document.getElementById('termVista').checked = true;
    }
    updatePaymentTermFields();

    document.getElementById('expensePaymentMethod').value = expense.paymentMethod || 'Pix';
    document.getElementById('expenseInstallmentCurrent').value = expense.installmentCurrent || 1;
    document.getElementById('expenseInstallmentTotal').value = expense.installmentTotal || 1;
    document.getElementById('expenseNotes').value = expense.notes || '';

    // Desabilitar opções de replicação em edição para evitar duplicatas acidentais
    document.getElementById('cardReplicateFixed').style.display = 'none';
    document.getElementById('cardGenerateInstallments').style.display = 'none';

    openModal('modalExpense');
  }

  function updateExpenseModalFields() {
    const isFixo = document.getElementById('typeFixo').checked;
    const containerFixed = document.getElementById('containerFixedType');
    const labelDesc = document.getElementById('labelDescription');
    const inputDesc = document.getElementById('expenseDescription');
    const cardReplicate = document.getElementById('cardReplicateFixed');

    if (isFixo) {
      containerFixed.style.display = 'block';
      labelDesc.textContent = 'Nome ou Identificação da Conta Fixa';
      inputDesc.placeholder = 'Ex: Aluguel Apartamento, Internet Vivo Fibra, Luz Enel...';
      cardReplicate.style.display = 'flex';
    } else {
      containerFixed.style.display = 'none';
      labelDesc.textContent = 'O que foi comprado? (Descrição do Gasto)';
      inputDesc.placeholder = 'Ex: Compras da semana Pão de Açúcar, Tênis Nike, Jantar no Outback...';
      cardReplicate.style.display = 'none';
    }
  }

  function updatePaymentTermFields() {
    const isPrazo = document.getElementById('termPrazo').checked;
    const containerInst = document.getElementById('containerInstallments');
    const cardGenerateInst = document.getElementById('cardGenerateInstallments');

    if (isPrazo) {
      containerInst.style.display = 'block';
      cardGenerateInst.style.display = 'flex';
    } else {
      containerInst.style.display = 'none';
      cardGenerateInst.style.display = 'none';
    }
  }

  function handleSaveExpense(e) {
    e.preventDefault();

    const editId = document.getElementById('expenseEditId').value;
    const isFixo = document.getElementById('typeFixo').checked;
    const fixedAccountType = isFixo ? document.getElementById('fixedAccountTypeSelect').value : '';
    const description = document.getElementById('expenseDescription').value.trim();
    const category = document.getElementById('expenseCategorySelect').value;
    const amount = parseFloat(document.getElementById('expenseAmount').value);
    const date = document.getElementById('expenseDate').value;
    const targetMonth = document.getElementById('expenseTargetMonth').value;
    const status = document.getElementById('expenseStatusSelect').value;

    const isPrazo = document.getElementById('termPrazo').checked;
    const paymentTerm = isPrazo ? 'prazo' : 'vista';
    const paymentMethod = document.getElementById('expensePaymentMethod').value;
    const installmentCurrent = isPrazo ? parseInt(document.getElementById('expenseInstallmentCurrent').value, 10) || 1 : 1;
    const installmentTotal = isPrazo ? parseInt(document.getElementById('expenseInstallmentTotal').value, 10) || 1 : 1;
    const notes = document.getElementById('expenseNotes').value.trim();

    if (!description || isNaN(amount) || amount <= 0 || !date || !targetMonth) {
      showToast('Por favor, preencha todos os campos obrigatórios corretamente.', 'error');
      return;
    }

    if (editId) {
      // Edição de registro existente
      const idx = appState.data.expenses.findIndex(e => e.id === editId);
      if (idx !== -1) {
        appState.data.expenses[idx] = {
          ...appState.data.expenses[idx],
          type: isFixo ? 'fixo' : 'variavel',
          fixedAccountType,
          description,
          category,
          amount,
          date,
          targetMonth,
          paymentTerm,
          paymentMethod,
          installmentCurrent,
          installmentTotal,
          status,
          notes
        };
        showToast('Gasto atualizado com sucesso!', 'success');
      }
    } else {
      // Novo Registro
      const newExpense = {
        id: 'exp_' + Date.now(),
        userId: appState.currentUserId,
        type: isFixo ? 'fixo' : 'variavel',
        fixedAccountType,
        description,
        category,
        amount,
        date,
        targetMonth,
        paymentTerm,
        paymentMethod,
        installmentCurrent,
        installmentTotal,
        status,
        notes,
        createdAt: new Date().toISOString()
      };

      appState.data.expenses.push(newExpense);

      // Inteligência 1: Replicar conta fixa para os próximos meses do ano se marcado
      const checkReplicate = document.getElementById('checkReplicateFixed').checked;
      if (isFixo && checkReplicate) {
        const [currY, currM] = targetMonth.split('-').map(Number);
        for (let m = currM + 1; m <= 12; m++) {
          const nextMStr = `${currY}-${String(m).padStart(2, '0')}`;
          const day = date.split('-')[2] || '05';
          appState.data.expenses.push({
            ...newExpense,
            id: 'exp_' + Date.now() + '_' + m,
            targetMonth: nextMStr,
            date: `${nextMStr}-${day}`,
            status: 'pendente'
          });
        }
      }

      // Inteligência 2: Gerar parcelas futuras automaticamente se for a prazo
      const checkInstallments = document.getElementById('checkGenerateInstallments').checked;
      if (isPrazo && checkInstallments && installmentTotal > installmentCurrent) {
        const [currY, currM] = targetMonth.split('-').map(Number);
        const day = date.split('-')[2] || '10';

        let nextYear = currY;
        let nextMonth = currM;

        for (let i = installmentCurrent + 1; i <= installmentTotal; i++) {
          nextMonth++;
          if (nextMonth > 12) {
            nextMonth = 1;
            nextYear++;
          }
          const nextMonthStr = `${nextYear}-${String(nextMonth).padStart(2, '0')}`;
          appState.data.expenses.push({
            ...newExpense,
            id: 'exp_' + Date.now() + '_inst_' + i,
            targetMonth: nextMonthStr,
            date: `${nextMonthStr}-${day}`,
            installmentCurrent: i,
            status: 'pendente'
          });
        }
      }

      showToast('Gasto cadastrado com sucesso!', 'success');
    }

    saveDatabaseLocally();
    closeModal('modalExpense');

    // Se o mês cadastrado for diferente do mês atual em exibição, navegar para ele
    if (targetMonth !== appState.currentMonth) {
      appState.currentMonth = targetMonth;
    }

    renderMonthlyView();
    if (isDashboardActive()) renderDashboardView();
  }

  // --------------------------------------------------------------------------
  // CADASTRO DE RECEITAS (MODAL)
  // --------------------------------------------------------------------------
  function openIncomeModal() {
    const form = document.getElementById('formIncome');
    form.reset();
    document.getElementById('incomeDate').value = getTodayDate();
    document.getElementById('incomeTargetMonth').value = appState.currentMonth;
    openModal('modalIncome');
  }

  function handleSaveIncome(e) {
    e.preventDefault();
    const description = document.getElementById('incomeDescription').value.trim();
    const amount = parseFloat(document.getElementById('incomeAmount').value);
    const date = document.getElementById('incomeDate').value;
    const targetMonth = document.getElementById('incomeTargetMonth').value;
    const category = document.getElementById('incomeCategory').value;

    if (!description || isNaN(amount) || amount <= 0 || !date || !targetMonth) {
      showToast('Por favor, informe a descrição e o valor da receita.', 'error');
      return;
    }

    const newIncome = {
      id: 'inc_' + Date.now(),
      userId: appState.currentUserId,
      description,
      amount,
      date,
      targetMonth,
      category,
      createdAt: new Date().toISOString()
    };

    appState.data.incomes.push(newIncome);
    saveDatabaseLocally();
    closeModal('modalIncome');
    renderMonthlyView();
    if (isDashboardActive()) renderDashboardView();
    showToast(`Receita de ${formatCurrency(amount)} cadastrada!`, 'success');
  }

  // --------------------------------------------------------------------------
  // EXPORTAÇÃO E IMPORTAÇÃO CSV & BACKUP JSON
  // --------------------------------------------------------------------------
  function exportExpensesToCsv(onlyCurrentMonth = false) {
    const allExpenses = getUserExpenses();
    const expensesToExport = onlyCurrentMonth 
      ? allExpenses.filter(e => e.targetMonth === appState.currentMonth)
      : allExpenses;

    if (expensesToExport.length === 0) {
      showToast('Nenhuma despesa para exportar no período selecionado.', 'error');
      return;
    }

    const user = getCurrentUser();
    const userName = user ? user.name : 'Payin';

    // Cabeçalho CSV
    const headers = [
      'ID',
      'Usuário',
      'Mês Competência',
      'Data Compra/Vencimento',
      'Tipo de Gasto',
      'O Que Foi Comprado / Descrição',
      'Tipo de Conta Fixa',
      'Categoria',
      'Valor (R$)',
      'Condição de Pagamento',
      'Meio de Pagamento',
      'Parcela Atual',
      'Total de Parcelas',
      'Status',
      'Observações'
    ];

    const rows = expensesToExport.map(e => [
      e.id,
      escapeCsvField(userName),
      e.targetMonth,
      e.date,
      e.type === 'fixo' ? 'Conta Fixa' : 'Conta Variável',
      escapeCsvField(e.description),
      escapeCsvField(e.fixedAccountType || ''),
      escapeCsvField(e.category),
      Number(e.amount).toFixed(2).replace('.', ','),
      e.paymentTerm === 'prazo' ? 'A Prazo' : 'À Vista',
      escapeCsvField(e.paymentMethod || ''),
      e.installmentCurrent || 1,
      e.installmentTotal || 1,
      e.status === 'pago' ? 'Pago' : 'Pendente',
      escapeCsvField(e.notes || '')
    ]);

    // Delimitador ';' padrão brasileiro do Excel
    const csvContent = '\uFEFF' + [
      headers.join(';'),
      ...rows.map(r => r.join(';'))
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const fileName = onlyCurrentMonth 
      ? `payin_gastos_${appState.currentMonth}_${userName.toLowerCase().replace(/\s+/g, '_')}.csv`
      : `payin_relatorio_geral_${userName.toLowerCase().replace(/\s+/g, '_')}.csv`;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast(`Arquivo "${fileName}" exportado com sucesso!`, 'success');
  }

  function escapeCsvField(val) {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  }

  function exportJsonBackup() {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(appState.data, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `payin_backup_${getTodayDate()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('Backup completo em JSON realizado!', 'success');
  }

  function handleFileImport(e) {
    const file = e.target.files[0];
    if (!file) return;

    document.getElementById('selectedFileName').textContent = file.name;
    const reader = new FileReader();

    if (file.name.endsWith('.json')) {
      reader.onload = function (evt) {
        try {
          const parsed = JSON.parse(evt.target.result);
          if (parsed.expenses && Array.isArray(parsed.expenses)) {
            appState.data = parsed;
            if (appState.data.users.length > 0) {
              appState.currentUserId = appState.data.users[0].id;
            }
            saveDatabaseLocally();
            renderUserHeader();
            renderMonthlyView();
            showToast('Backup JSON restaurado com sucesso!', 'success');
          } else {
            showToast('Formato de arquivo JSON inválido.', 'error');
          }
        } catch (err) {
          showToast('Erro ao ler arquivo JSON.', 'error');
        }
      };
      reader.readAsText(file);
    } else if (file.name.endsWith('.csv')) {
      reader.onload = function (evt) {
        try {
          parseAndImportCsv(evt.target.result);
        } catch (err) {
          showToast('Erro ao processar planilha CSV.', 'error');
        }
      };
      reader.readAsText(file, 'utf-8');
    } else {
      showToast('Formato não suportado. Selecione .csv ou .json.', 'error');
    }
  }

  function parseAndImportCsv(csvText) {
    const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) {
      showToast('O arquivo CSV está vazio ou não possui registros.', 'error');
      return;
    }

    let addedCount = 0;
    // Pular cabeçalho (linha 0)
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(';').map(col => col.replace(/^"|"$/g, '').trim());
      if (cols.length >= 8) {
        // Formato esperado de exportação
        const targetMonth = cols[2] || appState.currentMonth;
        const date = cols[3] || getTodayDate();
        const typeStr = (cols[4] || '').toLowerCase();
        const type = typeStr.includes('fix') ? 'fixo' : 'variavel';
        const description = cols[5] || 'Gasto importado';
        const fixedAccountType = cols[6] || '';
        const category = cols[7] || 'Outros';
        const amountStr = (cols[8] || '0').replace(',', '.');
        const amount = parseFloat(amountStr) || 0;
        const termStr = (cols[9] || '').toLowerCase();
        const paymentTerm = termStr.includes('prazo') ? 'prazo' : 'vista';
        const paymentMethod = cols[10] || 'Pix';
        const installmentCurrent = parseInt(cols[11], 10) || 1;
        const installmentTotal = parseInt(cols[12], 10) || 1;
        const statusStr = (cols[13] || '').toLowerCase();
        const status = statusStr.includes('pago') ? 'pago' : 'pendente';
        const notes = cols[14] || '';

        appState.data.expenses.push({
          id: 'exp_' + Date.now() + '_' + i,
          userId: appState.currentUserId,
          type,
          fixedAccountType,
          description,
          category,
          amount,
          date,
          targetMonth,
          paymentTerm,
          paymentMethod,
          installmentCurrent,
          installmentTotal,
          status,
          notes,
          createdAt: new Date().toISOString()
        });
        addedCount++;
      }
    }

    saveDatabaseLocally();
    renderMonthlyView();
    showToast(`${addedCount} despesas importadas do CSV com sucesso!`, 'success');
  }

  // --------------------------------------------------------------------------
  // CONTROLE DE TEMAS (CLARO / ESCURO)
  // --------------------------------------------------------------------------
  function initTheme() {
    const saved = localStorage.getItem(THEME_STORAGE_KEY) || 'light';
    setTheme(saved);
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'light' ? 'dark' : 'light';
    setTheme(next);
  }

  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);

    const sun = document.getElementById('themeIconSun');
    const moon = document.getElementById('themeIconMoon');
    if (theme === 'dark') {
      sun.style.display = 'none';
      moon.style.display = 'block';
    } else {
      sun.style.display = 'block';
      moon.style.display = 'none';
    }

    // Se dashboard estiver visível, atualizar gráficos para usar as novas cores
    if (isDashboardActive()) {
      renderDashboardView();
    }
  }

  // --------------------------------------------------------------------------
  // NAVEGAÇÃO ENTRE ABAS
  // --------------------------------------------------------------------------
  function setupTabs() {
    const tabButtons = document.querySelectorAll('.nav-tab-btn');
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-tab');
        switchTab(targetTab);
      });
    });
  }

  function switchTab(targetTabId) {
    document.querySelectorAll('.nav-tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach(p => p.style.display = 'none');

    const activeBtn = document.querySelector(`.nav-tab-btn[data-tab="${targetTabId}"]`);
    const activePane = document.getElementById(targetTabId);

    if (activeBtn) activeBtn.classList.add('active');
    if (activePane) activePane.style.display = 'block';

    if (targetTabId === 'tab-dashboard') {
      renderDashboardView();
    } else if (targetTabId === 'tab-monthly') {
      renderMonthlyView();
    }
  }

  function isDashboardActive() {
    const pane = document.getElementById('tab-dashboard');
    return pane && pane.style.display !== 'none';
  }

  // --------------------------------------------------------------------------
  // GESTÃO DE MODAIS & TOASTS
  // --------------------------------------------------------------------------
  function openModal(modalId) {
    const m = document.getElementById(modalId);
    if (m) m.classList.add('active');
  }

  function closeModal(modalId) {
    const m = document.getElementById(modalId);
    if (m) m.classList.remove('active');
  }

  function openUserModal() {
    renderUsersModalList();
    openModal('modalUser');
  }

  function closeUserModal() {
    closeModal('modalUser');
  }

  function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let iconSvg = '';
    if (type === 'success') {
      iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>';
    } else if (type === 'error') {
      iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';
    } else {
      iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';
    }

    toast.innerHTML = `
      <span style="display:flex; align-items:center;">${iconSvg}</span>
      <span>${escapeHtml(message)}</span>
    `;

    container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 20);

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // --------------------------------------------------------------------------
  // EVENT LISTENERS GERAIS
  // --------------------------------------------------------------------------
  function setupEventListeners() {
    // Tema
    document.getElementById('btnThemeToggle').addEventListener('click', toggleTheme);

    // Usuário
    document.getElementById('btnOpenUserModal').addEventListener('click', openUserModal);
    document.getElementById('btnCloseUserModal').addEventListener('click', closeUserModal);
    document.getElementById('formNewUser').addEventListener('submit', handleCreateUser);

    // Navegação de Mês
    document.getElementById('btnPrevMonth').addEventListener('click', () => navigateMonth(-1));
    document.getElementById('btnNextMonth').addEventListener('click', () => navigateMonth(1));
    document.getElementById('btnCurrentMonth').addEventListener('click', () => {
      appState.currentMonth = getTodayMonth();
      renderMonthlyView();
    });
    document.getElementById('monthPickerInput').addEventListener('change', (e) => setMonth(e.target.value));

    // Modais de Cadastro
    document.getElementById('btnOpenExpenseModal').addEventListener('click', openNewExpenseModal);
    document.getElementById('btnEmptyAddExpense').addEventListener('click', openNewExpenseModal);
    document.getElementById('btnCloseExpenseModal').addEventListener('click', () => closeModal('modalExpense'));
    document.getElementById('btnCancelExpenseModal').addEventListener('click', () => closeModal('modalExpense'));
    document.getElementById('formExpense').addEventListener('submit', handleSaveExpense);

    document.getElementById('btnOpenIncomeModal').addEventListener('click', openIncomeModal);
    document.getElementById('btnCloseIncomeModal').addEventListener('click', () => closeModal('modalIncome'));
    document.getElementById('btnCancelIncomeModal').addEventListener('click', () => closeModal('modalIncome'));
    document.getElementById('formIncome').addEventListener('submit', handleSaveIncome);

    // Alteração de Tipo no Modal de Gasto
    document.querySelectorAll('input[name="expenseType"]').forEach(r => {
      r.addEventListener('change', updateExpenseModalFields);
    });

    // Alteração de Condição de Pagamento no Modal de Gasto
    document.querySelectorAll('input[name="expensePaymentTerm"]').forEach(r => {
      r.addEventListener('change', updatePaymentTermFields);
    });

    // Filtros Rápidos
    document.getElementById('filterSearchInput').addEventListener('input', (e) => {
      appState.filterSearch = e.target.value.trim();
      renderFilteredExpensesTable(getUserExpenses().filter(e => e.targetMonth === appState.currentMonth));
    });

    document.querySelectorAll('#filterTypeGroup .filter-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#filterTypeGroup .filter-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        appState.filterType = btn.getAttribute('data-type');
        renderFilteredExpensesTable(getUserExpenses().filter(e => e.targetMonth === appState.currentMonth));
      });
    });

    document.querySelectorAll('#filterPaymentTermGroup .filter-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#filterPaymentTermGroup .filter-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        appState.filterTerm = btn.getAttribute('data-term');
        renderFilteredExpensesTable(getUserExpenses().filter(e => e.targetMonth === appState.currentMonth));
      });
    });

    document.getElementById('filterStatusSelect').addEventListener('change', (e) => {
      appState.filterStatus = e.target.value;
      renderFilteredExpensesTable(getUserExpenses().filter(e => e.targetMonth === appState.currentMonth));
    });

    document.getElementById('filterCategorySelect').addEventListener('change', (e) => {
      appState.filterCategory = e.target.value;
      renderFilteredExpensesTable(getUserExpenses().filter(e => e.targetMonth === appState.currentMonth));
    });

    document.getElementById('btnResetFilters').addEventListener('click', () => {
      appState.filterType = 'all';
      appState.filterTerm = 'all';
      appState.filterStatus = 'all';
      appState.filterCategory = 'all';
      appState.filterSearch = '';

      document.getElementById('filterSearchInput').value = '';
      document.getElementById('filterStatusSelect').value = 'all';
      document.getElementById('filterCategorySelect').value = 'all';
      document.querySelectorAll('#filterTypeGroup .filter-pill').forEach(b => b.classList.remove('active'));
      document.querySelector('#filterTypeGroup [data-type="all"]').classList.add('active');
      document.querySelectorAll('#filterPaymentTermGroup .filter-pill').forEach(b => b.classList.remove('active'));
      document.querySelector('#filterPaymentTermGroup [data-term="all"]').classList.add('active');

      renderFilteredExpensesTable(getUserExpenses().filter(e => e.targetMonth === appState.currentMonth));
      showToast('Filtros redefinidos.', 'info');
    });

    // Cliques na Tabela
    document.getElementById('monthExpensesTableBody').addEventListener('click', handleTableClick);

    // Dashboard Ano e Refresh
    document.getElementById('dashboardYearFilter').addEventListener('change', (e) => {
      appState.dashboardYear = e.target.value;
      renderDashboardView();
    });
    document.getElementById('btnRefreshCharts').addEventListener('click', () => {
      renderDashboardView();
      showToast('Gráficos atualizados!', 'info');
    });

    // Exportação e Importação
    document.getElementById('btnExportAllCsv').addEventListener('click', () => exportExpensesToCsv(false));
    document.getElementById('btnExportMonthCsv').addEventListener('click', () => exportExpensesToCsv(true));
    document.getElementById('btnExportJsonBackup').addEventListener('click', exportJsonBackup);
    document.getElementById('importFileInput').addEventListener('change', handleFileImport);

    // Fechar modais ao clicar no overlay
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          overlay.classList.remove('active');
        }
      });
    });
  }

  // --------------------------------------------------------------------------
  // INICIALIZAÇÃO DA APLICAÇÃO
  // --------------------------------------------------------------------------
  function init() {
    initTheme();
    loadDatabase();
    renderUserHeader();
    setupTabs();
    setupEventListeners();
    renderMonthlyView();
  }

  // Start quando DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
