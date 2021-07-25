import { Injectable } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http"
import { RecipeService } from "../recipes/recipe.service";
import { Recipe } from "../recipes/recipe.model";
import { exhaustMap, map, take, tap } from "rxjs/operators";
import { AuthService } from "../auth/auth.service";

@Injectable({ providedIn: 'root' })
export class DataStorageService {
  FIREBASE_URL = 'https://ng-course-recipe-book-2272d-default-rtdb.asia-southeast1.firebasedatabase.app/recipes.json';

  constructor(
    private http: HttpClient,
    private recipeService: RecipeService,
    private authService: AuthService
  ) { }

  storeRecipes() {
    const recipes = this.recipeService.getRecipes();
    this.http.put(this.FIREBASE_URL, recipes).subscribe(
      response => {
        console.log(response);
      }
    );
  }

  fetchRecipes() {
    return this.http.get<Recipe[]>(this.FIREBASE_URL).pipe(
      map(recipes => {
        return recipes.map(recipe => {
          return { ...recipe, ingredients: recipe.ingredients ? recipe.ingredients : [] };
        });
      }),
      tap(recipes => {
        this.recipeService.setRecipes(recipes);
      })
    );
  }
}