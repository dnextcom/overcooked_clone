import { Recipes, RecipeType, RecipeSystem } from './Recipe.js';

export class OrderManager {
    constructor() {
        this.orders = [];
        this.maxOrders = 5;
        this.spawnTimer = 0;
        this.spawnInterval = 8; // Seconds
        this.score = 0;
    }

    update(dt) {
        this.spawnTimer += dt;
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnTimer = 0;
            if (this.orders.length < this.maxOrders) {
                this.generateOrder();
            }
        }

        // Timeout orders
        this.orders.forEach(o => o.remainingTime -= dt);
        this.orders = this.orders.filter(o => {
            if (o.remainingTime <= 0) {
                console.log("ORDER EXPIRED!");
                this.score -= 10;
                return false;
            }
            return true;
        });
    }

    generateOrder() {
        const types = Object.values(RecipeType);
        const randomType = types[Math.floor(Math.random() * types.length)];

        const order = {
            id: Date.now() + Math.random(),
            recipeType: randomType,
            duration: 60,
            remainingTime: 60
        };

        this.orders.push(order);
        console.log(`NEW ORDER: ${Recipes[randomType].name}`);
    }

    deliverPlate(plateItems) {
        // plateItems = array of Ingredient objects
        const deliveredRecipe = RecipeSystem.validateRecipe(plateItems);

        if (!deliveredRecipe) {
            console.log("INVALID RECIPE!");
            return false;
        }

        // Check if we have an active order for this recipe
        const orderIndex = this.orders.findIndex(o => o.recipeType === deliveredRecipe);

        if (orderIndex !== -1) {
            // Success!
            const order = this.orders[orderIndex];
            const points = Recipes[deliveredRecipe].score + Math.floor(order.remainingTime);
            this.score += points;
            console.log(`ORDER COMPLETE! +${points} pts`);

            // Remove order
            this.orders.splice(orderIndex, 1);
            return true;
        } else {
            console.log("NO ORDER FOR THIS RECIPE!");
            return false;
        }
    }
}
