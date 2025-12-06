import { IngredientType } from './Ingredient.js';

export const RecipeType = {
    SALAD: 'Salad',
    BURGER: 'Burger'
};

export const Recipes = {
    [RecipeType.SALAD]: {
        name: 'House Salad',
        ingredients: [IngredientType.CHOPPED_LETTUCE, IngredientType.CHOPPED_TOMATO],
        score: 20
    },
    [RecipeType.BURGER]: {
        name: 'Just A Burger',
        ingredients: [IngredientType.BURGER], // Cooked burger
        score: 30
    }
};

export class RecipeSystem {
    static validateRecipe(plateIngredients) {
        // plateIngredients is an array of Ingredient objects
        const plateTypes = plateIngredients.map(i => i.type).sort();

        for (const [key, recipe] of Object.entries(Recipes)) {
            const recipeTypes = [...recipe.ingredients].sort();

            if (this.arraysEqual(plateTypes, recipeTypes)) {
                return key; // Returns RecipeType (e.g. 'Salad')
            }
        }
        return null;
    }

    static arraysEqual(a, b) {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) return false;
        }
        return true;
    }
}
