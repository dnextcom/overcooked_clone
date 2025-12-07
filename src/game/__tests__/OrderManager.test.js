import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OrderManager } from '../OrderManager.js';
import { RecipeType, Recipes } from '../Recipe.js';
import { IngredientType } from '../Ingredient.js';

describe('OrderManager', () => {
    let orderManager;

    beforeEach(() => {
        orderManager = new OrderManager();
        // Reset console.log to avoid noise or mock if checking output
        vi.spyOn(console, 'log').mockImplementation(() => { });
    });

    it('should initialize with default values', () => {
        expect(orderManager.orders).toEqual([]);
        expect(orderManager.score).toBe(0);
        expect(orderManager.maxOrders).toBe(5);
    });

    it('should generate an order when timer exceeds interval', () => {
        // Force spawn
        orderManager.spawnTimer = orderManager.spawnInterval;
        orderManager.update(0.1);
        expect(orderManager.orders.length).toBe(1);
        expect(orderManager.spawnTimer).toBe(0);
    });

    it('should not generate order if max orders reached', () => {
        // Fill orders
        for (let i = 0; i < 5; i++) {
            orderManager.orders.push({ id: i });
        }

        orderManager.spawnTimer = orderManager.spawnInterval;
        orderManager.update(0.1);

        expect(orderManager.orders.length).toBe(5); // Still 5
    });

    it('should remove expired orders and penalize score', () => {
        // Add an order that is about to expire
        orderManager.orders.push({
            id: 123,
            recipeType: RecipeType.SALAD,
            remainingTime: 0.1
        });

        // Update with enough time to expire it
        orderManager.update(0.2);

        expect(orderManager.orders.length).toBe(0);
        expect(orderManager.score).toBe(-10); // Penalty is 10
    });

    describe('deliverPlate', () => {
        it('should succeed if delivery matches an active order', () => {
            // Add generic order
            orderManager.orders.push({
                id: 1,
                recipeType: RecipeType.SALAD,
                remainingTime: 60
            });

            const plate = [
                { type: IngredientType.CHOPPED_LETTUCE },
                { type: IngredientType.CHOPPED_TOMATO }
            ];

            const success = orderManager.deliverPlate(plate);

            expect(success).toBe(true);
            expect(orderManager.orders.length).toBe(0);
            // Score = Recipe Score (20) + Time Bonus (60) = 80
            expect(orderManager.score).toBe(80);
        });

        it('should fail if delivery does not match any order', () => {
            // Add burger order
            orderManager.orders.push({
                id: 1,
                recipeType: RecipeType.BURGER,
                remainingTime: 60
            });

            // Deliver salad
            const plate = [
                { type: IngredientType.CHOPPED_LETTUCE },
                { type: IngredientType.CHOPPED_TOMATO }
            ];

            const success = orderManager.deliverPlate(plate);

            expect(success).toBe(false);
            expect(orderManager.orders.length).toBe(1); // Order still there
            expect(orderManager.score).toBe(0);
        });

        it('should fail if plate is not a valid recipe at all', () => {
            orderManager.orders.push({
                id: 1,
                recipeType: RecipeType.SALAD,
                remainingTime: 60
            });

            const plate = [
                { type: IngredientType.TOMATO } // Whole tomato is not a recipe
            ];

            const success = orderManager.deliverPlate(plate);

            expect(success).toBe(false);
            expect(orderManager.orders.length).toBe(1);
        });
    });
});
