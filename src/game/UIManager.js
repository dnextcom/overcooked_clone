import { Recipes } from './Recipe.js';

export class UIManager {
    constructor() {
        // Cache DOM elements
        this.scoreEl = document.getElementById('score-value');
        this.timerEl = document.getElementById('timer-value');
        this.ordersContainer = document.getElementById('orders-container');

        this.activeOrders = new Map(); // id -> DOM Element
    }

    update(score, timer, orders) {
        if (this.scoreEl) this.scoreEl.innerText = score;
        if (this.timerEl) {
            this.timerEl.innerText = timer;
        }

        this.syncOrders(orders);
    }

    syncOrders(orders) {
        // Track current IDs
        const currentIds = new Set(orders.map(o => o.id));

        // Remove old
        for (const [id, el] of this.activeOrders) {
            if (!currentIds.has(id)) {
                el.remove();
                this.activeOrders.delete(id);
            }
        }

        // Add/Update new
        for (const order of orders) {
            if (!this.activeOrders.has(order.id)) {
                const el = this.createOrderElement(order);
                this.ordersContainer.appendChild(el);
                this.activeOrders.set(order.id, el);
            } else {
                // Update timer bar
                const el = this.activeOrders.get(order.id);
                const bar = el.querySelector('.timer-bar-fill');
                const pct = (order.remainingTime / order.duration) * 100;
                bar.style.width = `${pct}%`;

                if (pct < 25) bar.style.backgroundColor = 'red';
                else if (pct < 50) bar.style.backgroundColor = 'orange';
            }
        }
    }

    createOrderElement(order) {
        const div = document.createElement('div');
        div.className = 'order-card';

        const recipe = Recipes[order.recipeType];

        div.innerHTML = `
            <div class="order-title">${recipe.name}</div>
            <div class="order-ingredients">
                ${recipe.ingredients.map(i => `<div class="icon-${i}"></div>`).join('')}
            </div>
            <div class="timer-bar"><div class="timer-bar-fill"></div></div>
        `;
        return div;
    }
}
