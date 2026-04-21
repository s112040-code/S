// Mock Initial Data
const INITIAL_DRINKS = [
  { id: 1, name: '招牌珍珠奶茶', price: 55, category: '奶茶', icon: '🧋' },
  { id: 2, name: '黑糖珍珠鮮奶', price: 70, category: '鮮奶', icon: '🥛' },
  { id: 3, name: '經典美式咖啡', price: 60, category: '咖啡', icon: '☕' },
  { id: 4, name: '濃郁拿鐵', price: 80, category: '咖啡', icon: '☕' },
  { id: 5, name: '鮮榨柳橙綠', price: 65, category: '果茶', icon: '🥤' },
  { id: 6, name: '滿杯水果茶', price: 75, category: '果茶', icon: '🍹' },
  { id: 7, name: '靜岡抹茶拿鐵', price: 85, category: '特調', icon: '🍵' },
  { id: 8, name: '四季春青茶', price: 35, category: '純茶', icon: '🍵' }
];

const CATEGORIES = ['全部', '奶茶', '鮮奶', '咖啡', '果茶', '特調', '純茶'];

// State
let state = {
  cart: [],
  orders: [],
  currentCategory: '全部'
};

// Initialization
function init() {
  // Load data from localStorage
  const loadedOrders = localStorage.getItem('gogo_orders');
  if (loadedOrders) {
    state.orders = JSON.parse(loadedOrders);
  }

  // Initial render
  renderFilters();
  renderMenu();
  renderCart();
  renderBackendDashboard();
}

// Navigation View Switcher
function switchView(viewName) {
  // Update nav buttons
  document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById(`nav-${viewName}`).classList.add('active');

  // Update views
  document.querySelectorAll('.view-section').forEach(view => view.classList.remove('active'));
  document.getElementById(`view-${viewName}`).classList.add('active');

  // Refresh backend data if switching to it
  if (viewName === 'backend') {
    renderBackendDashboard();
  }
}

// ================= FRONTEND LOGIC =================

function renderFilters() {
  const container = document.getElementById('category-filters');
  container.innerHTML = CATEGORIES.map(cat => `
    <button class="filter-btn ${state.currentCategory === cat ? 'active' : ''}" 
            onclick="setCategory('${cat}')">
      ${cat}
    </button>
  `).join('');
}

function setCategory(cat) {
  state.currentCategory = cat;
  renderFilters();
  renderMenu();
}

function renderMenu() {
  const container = document.getElementById('menu-grid');
  const filteredDrinks = state.currentCategory === '全部' 
    ? INITIAL_DRINKS 
    : INITIAL_DRINKS.filter(d => d.category === state.currentCategory);

  container.innerHTML = filteredDrinks.map(drink => `
    <div class="menu-card" onclick="addToCart(${drink.id})">
      <div class="drink-icon">${drink.icon}</div>
      <div class="drink-info">
        <h3 class="drink-name">${drink.name}</h3>
        <div class="drink-price">$${drink.price}</div>
        <button class="add-btn">無情加入</button>
      </div>
    </div>
  `).join('');
}

function addToCart(drinkId) {
  const drink = INITIAL_DRINKS.find(d => d.id === drinkId);
  if (!drink) return;

  const existingItem = state.cart.find(item => item.id === drinkId);
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    state.cart.push({ ...drink, quantity: 1 });
  }

  renderCart();
  showToast(`已將 ${drink.name} 加入購物車`);
}

function updateCartQty(drinkId, delta) {
  const item = state.cart.find(i => i.id === drinkId);
  if (item) {
    item.quantity += delta;
    if (item.quantity <= 0) {
      state.cart = state.cart.filter(i => i.id !== drinkId);
    }
  }
  renderCart();
}

function renderCart() {
  const container = document.getElementById('cart-items');
  const countEl = document.getElementById('cart-count');
  const subtotalEl = document.getElementById('cart-subtotal');
  const totalEl = document.getElementById('cart-total');
  const checkoutBtn = document.getElementById('checkout-btn');

  // Calculate totals
  const totalItems = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  countEl.textContent = totalItems;
  subtotalEl.textContent = `$${totalPrice}`;
  totalEl.textContent = `$${totalPrice}`;

  // Button state
  checkoutBtn.disabled = totalItems === 0;

  if (state.cart.length === 0) {
    container.innerHTML = `<div class="empty-cart">您的購物車空空如也 🥺</div>`;
    return;
  }

  container.innerHTML = state.cart.map(item => `
    <div class="cart-item">
      <div class="cart-item-info">
        <div class="cart-item-title">${item.name}</div>
        <div class="cart-item-price">$${item.price}</div>
      </div>
      <div class="qty-controls">
        <button class="qty-btn" onclick="updateCartQty(${item.id}, -1)">-</button>
        <span>${item.quantity}</span>
        <button class="qty-btn" onclick="updateCartQty(${item.id}, 1)">+</button>
      </div>
    </div>
  `).join('');
}

function submitOrder() {
  if (state.cart.length === 0) return;

  const totalPrice = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  const newOrder = {
    id: `ORD-${Date.now().toString().slice(-6)}`,
    items: [...state.cart],
    total: totalPrice,
    timestamp: new Date().toISOString(),
    status: 'pending' // pending | completed
  };

  // Update order state
  state.orders.push(newOrder);
  
  // Save to persistence
  localStorage.setItem('gogo_orders', JSON.stringify(state.orders));

  // Clear cart
  state.cart = [];
  renderCart();

  showToast('🎉 訂單已送出成功！');
}

// ================= BACKEND LOGIC =================

function renderBackendDashboard() {
  // Reload data to ensure sync across tabs if needed
  const loadedOrders = localStorage.getItem('gogo_orders');
  if (loadedOrders) {
    state.orders = JSON.parse(loadedOrders);
  }

  // Calculate stats
  const completedOrders = state.orders.filter(o => o.status === 'completed');
  const pendingOrders = state.orders.filter(o => o.status === 'pending');
  const totalRevenue = completedOrders.reduce((sum, o) => sum + o.total, 0);

  document.getElementById('stat-revenue').textContent = `$${totalRevenue.toLocaleString()}`;
  document.getElementById('stat-orders-count').textContent = state.orders.length;
  document.getElementById('stat-pending-items').textContent = pendingOrders.length;

  renderBackendOrders();
}

function renderBackendOrders() {
  const tbody = document.getElementById('orders-tbody');
  
  if (state.orders.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 2rem;">目前沒有任何訂單</td></tr>`;
    return;
  }

  // Sort descending by timestamp
  const sortedOrders = [...state.orders].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  tbody.innerHTML = sortedOrders.map(order => {
    const timeString = new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const itemsSummary = order.items.map(i => `${i.name} x${i.quantity}`).join(', ');
    
    return `
      <tr>
        <td style="font-weight: 600;">${order.id}</td>
        <td>${timeString}</td>
        <td><div style="max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${itemsSummary}">${itemsSummary}</div></td>
        <td style="font-weight: bold; color: var(--primary);">$${order.total}</td>
        <td>
          <span class="status-badge ${order.status === 'completed' ? 'status-completed' : 'status-pending'}">
            ${order.status === 'completed' ? '已完成' : '製作中'}
          </span>
        </td>
        <td>
          ${order.status === 'pending' ? 
            `<button class="action-btn" onclick="completeOrder('${order.id}')">標記完成</button>` : 
            `<span style="color: var(--text-muted); font-size: 0.875rem;">無</span>`
          }
        </td>
      </tr>
    `;
  }).join('');
}

function completeOrder(orderId) {
  const order = state.orders.find(o => o.id === orderId);
  if (order) {
    order.status = 'completed';
    localStorage.setItem('gogo_orders', JSON.stringify(state.orders));
    renderBackendDashboard();
    showToast(`訂單 ${orderId} 已完成`);
  }
}

// ================= UTILS =================

let toastTimeout;
function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// Run app
document.addEventListener('DOMContentLoaded', init);
