import { initializeApp } from 'https://www.gstatic.com/firebasejs/13.4.0/firebase-app.js';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js';
import {
  collection,
  doc,
  getFirestore,
  onSnapshot,
  writeBatch,
} from 'https://www.gstatic.com/firebasejs/13.4.0/firebase-firestore.js';
import { firebaseConfig } from './firebase-config.js';

(() => {
  const dataCollections = ['sales', 'expenses', 'shopping', 'debtors'];
  const currency = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
  const dateFormatter = new Intl.DateTimeFormat('pt-BR');
  const weekdays = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];
  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  const elements = {
    loginView: document.querySelector('#loginView'),
    loginForm: document.querySelector('#loginForm'),
    loginMessage: document.querySelector('#loginMessage'),
    passwordInput: document.querySelector('#password'),
    appShell: document.querySelector('#appShell'),
    toast: document.querySelector('#toast'),
    logoutButton: document.querySelector('#logoutButton'),
    summaryPeriod: document.querySelector('#summaryPeriod'),
    totalSales: document.querySelector('#totalSales'),
    totalReceived: document.querySelector('#totalReceived'),
    totalReceivable: document.querySelector('#totalReceivable'),
    totalExpenses: document.querySelector('#totalExpenses'),
    totalBalance: document.querySelector('#totalBalance'),
    weekdaysBody: document.querySelector('#weekdaysBody'),
    weekdaysEmpty: document.querySelector('#weekdaysEmpty'),
    monthlyTitle: document.querySelector('#monthlyTitle'),
    monthsBody: document.querySelector('#monthsBody'),
    saleForm: document.querySelector('#saleForm'),
    salesBody: document.querySelector('#salesBody'),
    salesEmpty: document.querySelector('#salesEmpty'),
    salesTableWrap: document.querySelector('#salesTableWrap'),
    expenseForm: document.querySelector('#expenseForm'),
    expensesBody: document.querySelector('#expensesBody'),
    expensesEmpty: document.querySelector('#expensesEmpty'),
    expensesTableWrap: document.querySelector('#expensesTableWrap'),
    shoppingForm: document.querySelector('#shoppingForm'),
    shoppingList: document.querySelector('#shoppingList'),
    shoppingEmpty: document.querySelector('#shoppingEmpty'),
    debtorForm: document.querySelector('#debtorForm'),
    debtorsBody: document.querySelector('#debtorsBody'),
    debtorsEmpty: document.querySelector('#debtorsEmpty'),
    debtorsTableWrap: document.querySelector('#debtorsTableWrap'),
    openDebtsTotal: document.querySelector('#openDebtsTotal'),
    overdueDebtsTotal: document.querySelector('#overdueDebtsTotal'),
    debtorCount: document.querySelector('#debtorCount'),
  };

  let data = emptyData();
  let currentUser = null;
  let auth = null;
  let db = null;
  let stopDataSync = () => {};
  let toastTimer;

  function emptyData() {
    return { sales: [], expenses: [], shopping: [], debtors: [] };
  }

  function watchData(user) {
    stopDataSync();
    const loadedCollections = new Set();
    let initialLoadComplete = false;
    const unsubscribe = dataCollections.map((name) => onSnapshot(
      collection(db, 'users', user.uid, name),
      (snapshot) => {
        if (currentUser?.uid !== user.uid) {
          return;
        }
        data[name] = snapshot.docs.map((record) => ({ ...record.data(), id: record.id }));
        loadedCollections.add(name);
        if (!initialLoadComplete && loadedCollections.size === dataCollections.length) {
          initialLoadComplete = true;
          elements.loginMessage.hidden = true;
          setAuthenticated(true);
        } else if (initialLoadComplete) {
          renderAll();
        }
      },
      (error) => {
        if (currentUser?.uid !== user.uid) {
          return;
        }
        setAuthenticated(false);
        elements.loginMessage.textContent = getFirebaseErrorMessage(error);
        elements.loginMessage.hidden = false;
      },
    ));
    stopDataSync = () => unsubscribe.forEach((stop) => stop());
  }

  async function saveData(nextData) {
    if (!db || !currentUser) {
      showToast('Entre na conta autorizada antes de salvar.', 'erro');
      return false;
    }

    try {
      const batch = writeBatch(db);
      for (const name of dataCollections) {
        const previousRecords = new Map(data[name].map((record) => [record.id, record]));
        const nextRecords = new Map(nextData[name].map((record) => [record.id, record]));

        for (const [id, record] of nextRecords) {
          if (!previousRecords.has(id) || JSON.stringify(previousRecords.get(id)) !== JSON.stringify(record)) {
            batch.set(doc(db, 'users', currentUser.uid, name, id), record);
          }
        }
        for (const id of previousRecords.keys()) {
          if (!nextRecords.has(id)) {
            batch.delete(doc(db, 'users', currentUser.uid, name, id));
          }
        }
      }

      await batch.commit();
      data = nextData;
      return true;
    } catch (error) {
      showToast(getFirebaseErrorMessage(error), 'erro');
      return false;
    }
  }

  function getFirebaseErrorMessage(error) {
    const messages = {
      'auth/invalid-credential': 'E-mail ou senha incorretos.',
      'auth/invalid-login-credentials': 'E-mail ou senha incorretos.',
      'auth/user-disabled': 'Esta conta está desativada. Fale com quem administra o Firebase.',
      'auth/too-many-requests': 'Muitas tentativas. Aguarde um pouco e tente novamente.',
      'auth/network-request-failed': 'Sem conexão com o Firebase. Verifique a internet e tente novamente.',
      'permission-denied': 'O Firestore bloqueou o acesso. Confira o UID autorizado em firestore.rules.',
      unavailable: 'O Firebase está temporariamente indisponível. Tente novamente.',
    };
    if (!messages[error.code]) {
      console.error('Falha ao comunicar com o Firebase.', error);
    }
    return messages[error.code] || 'Não foi possível comunicar com o Firebase. Tente novamente.';
  }

  function showToast(message, category = 'ok') {
    window.clearTimeout(toastTimer);
    elements.toast.textContent = message;
    elements.toast.className = `flash ${category}`;
    elements.toast.hidden = false;
    toastTimer = window.setTimeout(() => {
      elements.toast.hidden = true;
    }, 3200);
  }

  function setAuthenticated(authenticated) {
    elements.loginView.hidden = authenticated;
    elements.appShell.hidden = !authenticated;
    if (authenticated) {
      renderAll();
    }
  }

  function startFirebase() {
    const missingConfig = ['apiKey', 'authDomain', 'projectId', 'appId'].some((key) =>
      !firebaseConfig[key] || firebaseConfig[key].startsWith('PREENCHA_'),
    );
    if (missingConfig) {
      elements.loginMessage.textContent = 'Configure os dados do app Web em static/firebase-config.js antes de entrar.';
      elements.loginMessage.hidden = false;
      return;
    }

    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    onAuthStateChanged(auth, (user) => {
      currentUser = user;
      if (!user) {
        stopDataSync();
        data = emptyData();
        setAuthenticated(false);
        return;
      }

      data = emptyData();
      setAuthenticated(false);
      watchData(user);
    }, (error) => {
      elements.loginMessage.textContent = getFirebaseErrorMessage(error);
      elements.loginMessage.hidden = false;
    });
  }

  function makeId() {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function makeCell(value) {
    const cell = document.createElement('td');
    cell.textContent = value;
    return cell;
  }

  function parseAmount(value) {
    const normalized = String(value).trim().replace(/\s/g, '');
    const amount = normalized.includes(',')
      ? Number(normalized.replace(/\./g, '').replace(',', '.'))
      : Number(normalized);
    return Number.isFinite(amount) ? Math.round(amount * 100) / 100 : NaN;
  }

  function parseDate(value) {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  function formatDate(value) {
    return dateFormatter.format(parseDate(value));
  }

  function getRange(period, now = new Date()) {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(start);
    if (period === 'week') {
      const daysSinceMonday = (start.getDay() + 6) % 7;
      start.setDate(start.getDate() - daysSinceMonday);
      end.setTime(start.getTime());
      end.setDate(end.getDate() + 6);
    } else if (period === 'month') {
      start.setDate(1);
      end.setMonth(end.getMonth() + 1, 0);
    } else {
      start.setMonth(0, 1);
      end.setMonth(11, 31);
    }
    return { start, end };
  }

  function dateInRange(value, range) {
    const date = parseDate(value);
    return date >= range.start && date <= range.end;
  }

  function summarize(sales, expenses, receivedSales) {
    const sold = sales.reduce((total, sale) => total + sale.amount, 0);
    const received = receivedSales.reduce((total, sale) => total + sale.amount, 0);
    const receivable = sales.reduce((total, sale) => total + (sale.status === 'pendente' ? sale.amount : 0), 0);
    const spent = expenses.reduce((total, expense) => total + expense.amount, 0);
    return { sold, received, receivable, spent, balance: received - spent };
  }

  function renderSummary() {
    const now = new Date();
    const period = elements.summaryPeriod.value;
    const range = getRange(period, now);
    const sales = data.sales.filter((sale) => dateInRange(sale.date, range));
    const receivedSales = data.sales.filter((sale) =>
      sale.status === 'recebido' && dateInRange(sale.receivedAt || sale.date, range),
    );
    const expenses = data.expenses.filter((expense) => dateInRange(expense.date, range));
    const totals = summarize(sales, expenses, receivedSales);

    elements.totalSales.textContent = currency.format(totals.sold);
    elements.totalReceived.textContent = currency.format(totals.received);
    elements.totalReceivable.textContent = currency.format(totals.receivable);
    elements.totalExpenses.textContent = currency.format(totals.spent);
    elements.totalBalance.textContent = currency.format(totals.balance);

    elements.weekdaysBody.replaceChildren();
    let hasWeekdayEntries = false;
    weekdays.forEach((name, index) => {
      const weekdaySales = sales.filter((sale) => (parseDate(sale.date).getDay() + 6) % 7 === index);
      const weekdayReceived = receivedSales.filter((sale) =>
        (parseDate(sale.receivedAt || sale.date).getDay() + 6) % 7 === index,
      );
      const weekdayExpenses = expenses.filter((expense) => (parseDate(expense.date).getDay() + 6) % 7 === index);
      const weekdayTotals = summarize(weekdaySales, weekdayExpenses, weekdayReceived);
      if (weekdayTotals.sold || weekdayTotals.received || weekdayTotals.receivable || weekdayTotals.spent) {
        hasWeekdayEntries = true;
      }
      const row = document.createElement('tr');
      row.append(
        makeCell(name),
        makeCell(currency.format(weekdayTotals.sold)),
        makeCell(currency.format(weekdayTotals.received)),
        makeCell(currency.format(weekdayTotals.receivable)),
        makeCell(currency.format(weekdayTotals.spent)),
        makeCell(currency.format(weekdayTotals.balance)),
      );
      elements.weekdaysBody.append(row);
    });
    elements.weekdaysEmpty.hidden = hasWeekdayEntries;

    elements.monthsBody.replaceChildren();
    for (let month = 0; month < 12; month += 1) {
      const monthSales = data.sales.filter((sale) => {
        const date = parseDate(sale.date);
        return date.getFullYear() === now.getFullYear() && date.getMonth() === month;
      });
      const monthExpenses = data.expenses.filter((expense) => {
        const date = parseDate(expense.date);
        return date.getFullYear() === now.getFullYear() && date.getMonth() === month;
      });
      const monthReceived = data.sales.filter((sale) => {
        const date = parseDate(sale.receivedAt || sale.date);
        return sale.status === 'recebido' && date.getFullYear() === now.getFullYear() && date.getMonth() === month;
      });
      const monthTotals = summarize(monthSales, monthExpenses, monthReceived);
      const row = document.createElement('tr');
      row.append(
        makeCell(monthNames[month]),
        makeCell(currency.format(monthTotals.sold)),
        makeCell(currency.format(monthTotals.received)),
        makeCell(currency.format(monthTotals.receivable)),
        makeCell(currency.format(monthTotals.spent)),
        makeCell(currency.format(monthTotals.balance)),
      );
      elements.monthsBody.append(row);
    }
    elements.monthlyTitle.textContent = `Balanço por mês — ${now.getFullYear()}`;
  }

  function renderSales() {
    const sales = [...data.sales].sort((first, second) => second.date.localeCompare(first.date));
    elements.salesBody.replaceChildren();
    elements.salesEmpty.hidden = sales.length > 0;
    elements.salesTableWrap.hidden = sales.length === 0;

    for (const sale of sales) {
      const row = document.createElement('tr');
      row.append(
        makeCell(formatDate(sale.date)),
        makeCell(sale.item),
        makeCell(sale.buyer),
        makeCell(currency.format(sale.amount)),
      );
      const statusCell = document.createElement('td');
      const status = document.createElement('span');
      status.className = 'status';
      status.textContent = sale.status === 'recebido' ? 'Recebido' : 'A receber';
      statusCell.append(status);
      row.append(statusCell);

      const actionsCell = document.createElement('td');
      const actions = document.createElement('div');
      actions.className = 'actions';
      if (sale.status !== 'recebido') {
        const receiveButton = document.createElement('button');
        receiveButton.type = 'button';
        receiveButton.className = 'secondary';
        receiveButton.dataset.action = 'receive';
        receiveButton.dataset.id = sale.id;
        receiveButton.textContent = 'Marcar recebido';
        actions.append(receiveButton);
      }
      const deleteButton = document.createElement('button');
      deleteButton.type = 'button';
      deleteButton.className = 'danger';
      deleteButton.dataset.action = 'delete';
      deleteButton.dataset.id = sale.id;
      deleteButton.textContent = 'Excluir';
      actions.append(deleteButton);
      actionsCell.append(actions);
      row.append(actionsCell);
      elements.salesBody.append(row);
    }
  }

  function renderExpenses() {
    const expenses = [...data.expenses].sort((first, second) => second.date.localeCompare(first.date));
    elements.expensesBody.replaceChildren();
    elements.expensesEmpty.hidden = expenses.length > 0;
    elements.expensesTableWrap.hidden = expenses.length === 0;
    for (const expense of expenses) {
      const row = document.createElement('tr');
      row.append(makeCell(formatDate(expense.date)), makeCell(expense.description), makeCell(currency.format(expense.amount)));
      const actionsCell = document.createElement('td');
      const deleteButton = document.createElement('button');
      deleteButton.type = 'button';
      deleteButton.className = 'danger';
      deleteButton.dataset.action = 'delete';
      deleteButton.dataset.id = expense.id;
      deleteButton.textContent = 'Excluir';
      actionsCell.append(deleteButton);
      row.append(actionsCell);
      elements.expensesBody.append(row);
    }
  }

  function renderShopping() {
    elements.shoppingList.replaceChildren();
    elements.shoppingEmpty.hidden = data.shopping.length > 0;
    const shopping = [...data.shopping].sort((first, second) => Number(first.done) - Number(second.done));
    for (const item of shopping) {
      const row = document.createElement('li');
      row.className = item.done ? 'shopping-item done' : 'shopping-item';
      const label = document.createElement('label');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = Boolean(item.done);
      checkbox.dataset.action = 'toggle';
      checkbox.dataset.id = item.id;
      const text = document.createElement('span');
      const name = document.createElement('strong');
      name.textContent = item.item;
      text.append(name);
      if (item.note) {
        const note = document.createElement('small');
        note.textContent = item.note;
        text.append(note);
      }
      label.append(checkbox, text);
      const deleteButton = document.createElement('button');
      deleteButton.type = 'button';
      deleteButton.className = 'danger';
      deleteButton.dataset.action = 'delete';
      deleteButton.dataset.id = item.id;
      deleteButton.textContent = 'Remover';
      row.append(label, deleteButton);
      elements.shoppingList.append(row);
    }
  }

  function renderDebtors() {
    const pendingDebts = data.debtors.filter((debt) => debt.status !== 'pago');
    const overdueDebts = pendingDebts.filter((debt) => debt.dueDate < todayString());
    const peopleOwing = new Set(pendingDebts.map((debt) => debt.name.trim().toLocaleLowerCase('pt-BR')));
    const openTotal = pendingDebts.reduce((total, debt) => total + debt.amount, 0);
    const overdueTotal = overdueDebts.reduce((total, debt) => total + debt.amount, 0);

    elements.openDebtsTotal.textContent = currency.format(openTotal);
    elements.overdueDebtsTotal.textContent = currency.format(overdueTotal);
    elements.debtorCount.textContent = String(peopleOwing.size);

    const debts = [...data.debtors].sort((first, second) => {
      if (first.status === 'pago' && second.status !== 'pago') return 1;
      if (first.status !== 'pago' && second.status === 'pago') return -1;
      return first.dueDate.localeCompare(second.dueDate);
    });
    elements.debtorsBody.replaceChildren();
    elements.debtorsEmpty.hidden = debts.length > 0;
    elements.debtorsTableWrap.hidden = debts.length === 0;

    for (const debt of debts) {
      const row = document.createElement('tr');
      row.append(
        makeCell(debt.name),
        makeCell(debt.description),
        makeCell(currency.format(debt.amount)),
        makeCell(formatDate(debt.dueDate)),
      );
      const statusCell = document.createElement('td');
      const status = document.createElement('span');
      status.className = 'status';
      status.textContent = debt.status === 'pago'
        ? 'Pago'
        : debt.dueDate < todayString() ? 'Vencido' : 'Em aberto';
      statusCell.append(status);
      row.append(statusCell);

      const actionsCell = document.createElement('td');
      const actions = document.createElement('div');
      actions.className = 'actions';
      if (debt.status !== 'pago') {
        const paidButton = document.createElement('button');
        paidButton.type = 'button';
        paidButton.className = 'secondary';
        paidButton.dataset.action = 'paid';
        paidButton.dataset.id = debt.id;
        paidButton.textContent = 'Marcar pago';
        actions.append(paidButton);
      }
      const deleteButton = document.createElement('button');
      deleteButton.type = 'button';
      deleteButton.className = 'danger';
      deleteButton.dataset.action = 'delete';
      deleteButton.dataset.id = debt.id;
      deleteButton.textContent = 'Excluir';
      actions.append(deleteButton);
      actionsCell.append(actions);
      row.append(actionsCell);
      elements.debtorsBody.append(row);
    }
  }

  function renderAll() {
    renderSummary();
    renderSales();
    renderExpenses();
    renderShopping();
    renderDebtors();
  }

  elements.loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!auth) {
      elements.loginMessage.textContent = 'Configure o Firebase antes de entrar.';
      elements.loginMessage.hidden = false;
      return;
    }

    const formData = new FormData(elements.loginForm);
    const email = String(formData.get('email') || '').trim();
    const password = String(formData.get('senha') || '');

    if (!email || password.length < 6) {
      elements.loginMessage.textContent = 'Informe um e-mail válido e a senha da conta.';
      elements.loginMessage.hidden = false;
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      elements.loginForm.reset();
      elements.loginMessage.hidden = true;
    } catch (error) {
      elements.loginMessage.textContent = getFirebaseErrorMessage(error);
      elements.loginMessage.hidden = false;
    }
  });

  elements.logoutButton.addEventListener('click', async () => {
    if (!auth) {
      return;
    }
    try {
      await signOut(auth);
    } catch (error) {
      showToast(getFirebaseErrorMessage(error), 'erro');
    }
  });

  document.querySelectorAll('[data-view]').forEach((button) => {
    button.addEventListener('click', () => {
      document.querySelectorAll('[data-view]').forEach((item) => {
        const selected = item === button;
        item.classList.toggle('active', selected);
        if (selected) {
          item.setAttribute('aria-current', 'page');
        } else {
          item.removeAttribute('aria-current');
        }
      });
      document.querySelectorAll('[data-view-panel]').forEach((panel) => {
        panel.hidden = panel.dataset.viewPanel !== button.dataset.view;
      });
    });
  });

  elements.summaryPeriod.addEventListener('change', renderSummary);

  elements.saleForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(elements.saleForm);
    const item = String(formData.get('item') || '').trim();
    const buyer = String(formData.get('comprador') || '').trim();
    const amount = parseAmount(formData.get('valor'));
    const date = String(formData.get('data') || '');
    const status = String(formData.get('status') || '');
    if (!item || !buyer || !date || !Number.isFinite(amount) || amount <= 0 || !['pendente', 'recebido'].includes(status)) {
      showToast('Confira a descrição, quem comprou, o valor e a data.', 'erro');
      return;
    }
    const sale = { id: makeId(), item, buyer, amount, date, status, receivedAt: status === 'recebido' ? date : null };
    if (!await saveData({ ...data, sales: [...data.sales, sale] })) {
      return;
    }
    elements.saleForm.reset();
    elements.saleForm.elements.data.value = todayString();
    renderAll();
    showToast('Venda anotada.');
  });

  elements.expenseForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(elements.expenseForm);
    const description = String(formData.get('descricao') || '').trim();
    const amount = parseAmount(formData.get('valor'));
    const date = String(formData.get('data') || '');
    if (!description || !date || !Number.isFinite(amount) || amount <= 0) {
      showToast('Confira a descrição, o valor e a data da saída.', 'erro');
      return;
    }
    const expense = { id: makeId(), description, amount, date };
    if (!await saveData({ ...data, expenses: [...data.expenses, expense] })) {
      return;
    }
    elements.expenseForm.reset();
    elements.expenseForm.elements.data.value = todayString();
    renderAll();
    showToast('Saída anotada.');
  });

  elements.shoppingForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(elements.shoppingForm);
    const item = String(formData.get('item') || '').trim();
    const note = String(formData.get('observacao') || '').trim();
    if (!item) {
      showToast('Informe o que precisa comprar.', 'erro');
      return;
    }
    const shoppingItem = { id: makeId(), item, note, done: false };
    if (!await saveData({ ...data, shopping: [...data.shopping, shoppingItem] })) {
      return;
    }
    elements.shoppingForm.reset();
    renderShopping();
    showToast('Item adicionado à lista.');
  });

  elements.debtorForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(elements.debtorForm);
    const name = String(formData.get('nome') || '').trim();
    const description = String(formData.get('descricao') || '').trim();
    const amount = parseAmount(formData.get('valor'));
    const dueDate = String(formData.get('vencimento') || '');
    if (!name || !description || !dueDate || !Number.isFinite(amount) || amount <= 0) {
      showToast('Confira o nome, a descrição, o valor e a data combinada.', 'erro');
      return;
    }
    const debt = { id: makeId(), name, description, amount, dueDate, status: 'pendente' };
    if (!await saveData({ ...data, debtors: [...data.debtors, debt] })) {
      return;
    }
    elements.debtorForm.reset();
    elements.debtorForm.elements.vencimento.value = todayString();
    renderDebtors();
    showToast('Devedor anotado.');
  });

  elements.salesBody.addEventListener('click', async (event) => {
    const button = event.target.closest('button[data-action]');
    if (!button) {
      return;
    }
    const sale = data.sales.find((item) => item.id === button.dataset.id);
    if (!sale) {
      return;
    }
    const sales = button.dataset.action === 'receive'
      ? data.sales.map((item) => item.id === sale.id ? { ...item, status: 'recebido', receivedAt: todayString() } : item)
      : data.sales.filter((item) => item.id !== sale.id);
    if (!await saveData({ ...data, sales })) {
      return;
    }
    renderAll();
    showToast(button.dataset.action === 'receive' ? 'Venda marcada como recebida.' : 'Venda excluída.');
  });

  elements.expensesBody.addEventListener('click', async (event) => {
    const button = event.target.closest('button[data-action="delete"]');
    if (!button) {
      return;
    }
    const expenses = data.expenses.filter((item) => item.id !== button.dataset.id);
    if (!await saveData({ ...data, expenses })) {
      return;
    }
    renderAll();
    showToast('Saída excluída.');
  });

  elements.shoppingList.addEventListener('change', async (event) => {
    const checkbox = event.target.closest('input[data-action="toggle"]');
    if (!checkbox) {
      return;
    }
    const shopping = data.shopping.map((item) =>
      item.id === checkbox.dataset.id ? { ...item, done: checkbox.checked } : item,
    );
    if (await saveData({ ...data, shopping })) {
      renderShopping();
    }
  });

  elements.shoppingList.addEventListener('click', async (event) => {
    const button = event.target.closest('button[data-action="delete"]');
    if (!button) {
      return;
    }
    const shopping = data.shopping.filter((item) => item.id !== button.dataset.id);
    if (!await saveData({ ...data, shopping })) {
      return;
    }
    renderShopping();
    showToast('Lembrete removido.');
  });

  elements.debtorsBody.addEventListener('click', async (event) => {
    const button = event.target.closest('button[data-action]');
    if (!button) {
      return;
    }
    const debt = data.debtors.find((item) => item.id === button.dataset.id);
    if (!debt) {
      return;
    }
    const debtors = button.dataset.action === 'paid'
      ? data.debtors.map((item) => item.id === debt.id ? { ...item, status: 'pago', paidAt: todayString() } : item)
      : data.debtors.filter((item) => item.id !== debt.id);
    if (!await saveData({ ...data, debtors })) {
      return;
    }
    renderDebtors();
    showToast(button.dataset.action === 'paid' ? 'Dívida marcada como paga.' : 'Registro devedor excluído.');
  });

  function todayString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  elements.saleForm.elements.data.value = todayString();
  elements.expenseForm.elements.data.value = todayString();
  elements.debtorForm.elements.vencimento.value = todayString();
  document.querySelectorAll('[data-view-panel]').forEach((panel) => {
    panel.hidden = panel.dataset.viewPanel !== 'resumo';
  });
  startFirebase();
})();
