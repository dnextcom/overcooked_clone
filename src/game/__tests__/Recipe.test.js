import { describe, it, expect } from 'vitest';
import { RecipeSystem, RecipeType, Recipes } from '../Recipe.js';
import { IngredientType } from '../Ingredient.js';

describe('RecipeSystem', () => {
    describe('validateRecipe', () => {
        it('should identify a Salad', () => {
            const plate = [
                { type: IngredientType.CHOPPED_LETTUCE },
                { type: IngredientType.CHOPPED_TOMATO }
            ];
            const result = RecipeSystem.validateRecipe(plate);
            expect(result).toBe(RecipeType.SALAD);
        });

        it('should identify a Burger', () => {
            const plate = [
                { type: IngredientType.BURGER }
            ];
            const result = RecipeSystem.validateRecipe(plate);
            expect(result).toBe(RecipeType.BURGER);
        });

        it('should return null for incomplete Salad', () => {
            const plate = [
                { type: IngredientType.CHOPPED_LETTUCE }
            ];
            const result = RecipeSystem.validateRecipe(plate);
            expect(result).toBeNull();
        });

        it('should return null for valid components but wrong recipe (e.g. just chopped tomato)', () => {
            const plate = [
                { type: IngredientType.CHOPPED_TOMATO }
            ];
            const result = RecipeSystem.validateRecipe(plate);
            expect(result).toBeNull();
        });

        it('should return null for mixed nonsense', () => {
            const plate = [
                { type: IngredientType.CHOPPED_LETTUCE },
                { type: IngredientType.BURGER }
            ];
            const result = RecipeSystem.validateRecipe(plate);
            expect(result).toBeNull();
        });

        it('should be order independent', () => {
            const plate = [
                { type: IngredientType.CHOPPED_TOMATO },
                { type: IngredientType.CHOPPED_LETTUCE }
            ];
            const result = RecipeSystem.validateRecipe(plate);
            expect(result).toBe(RecipeType.SALAD); // Salad defined as Lettuce, Tomato in Recipe.js, but logic sorts them
        });
    });
});
