let allRecipes = [];
let currentSlideIndex = 0;

// DOM Elements
const loader = document.getElementById("loader");
const mainContent = document.getElementById("mainContent");
const searchForm = document.querySelector("form");
const showRecipeContainer = document.querySelector("#showRecipe");
const filterCondition = document.querySelector(".filter-condition");
const sortButton = document.getElementById("sortButton");
const sortOptions = document.getElementById("sortOptions");

// Loader animation
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        loader.classList.add("hidden");
        mainContent.classList.remove("hidden");
    }, 2000);
});

// Form submission handler
searchForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const inpValue = e.target.querySelector('input[type="text"]').value.trim();
    if (inpValue) {
        fetchDataFromAPI(inpValue);
    } else {
        alert("Please enter an ingredient to search.");
    }
});

// Sort functionality
sortOptions.addEventListener('click', (e) => {
    if (e.target.classList.contains('dropdown-item')) {
        const sortValue = e.target.dataset.value;
        sortButton.textContent = `Sort by calories: ${e.target.textContent}`;
        sortRecipes(sortValue);
    }
});

// Sort recipes based on selected option
function sortRecipes(sortType) {
    let sortedRecipes = [...allRecipes];
    
    switch(sortType) {
        case 'Low to high':
            sortedRecipes.sort((a, b) => a.recipe.calories - b.recipe.calories);
            break;
        case 'High to low':
            sortedRecipes.sort((a, b) => b.recipe.calories - a.recipe.calories);
            break;
        default:
            // Default sorting (as received from API)
            break;
    }
    
    generateHTML(sortedRecipes);
}

async function fetchDataFromAPI(inpVal) {
    const app_id = "d8feb9b1";
    const app_key = "cd9cb2390f98fe12e951f5df71d0b41e";
    const encodedValue = encodeURIComponent(inpVal);
    const baseURL = `https://api.edamam.com/search?q=${encodedValue}&app_id=${app_id}&app_key=${app_key}&to=12`;

    try {
        const result = await fetch(baseURL);
        if (!result.ok) {
            throw new Error(`HTTP error! status: ${result.status}`);
        }
        const datas = await result.json();

        if (datas.hits && datas.hits.length > 0) {
            allRecipes = datas.hits;

            // Hide the slideshow only when data is fetched
            const slideshows = document.querySelectorAll(".slider");
            slideshows.forEach(slideshow => {
                slideshow.style.display = "none";
            });

            generateHTML(allRecipes);
            filterCondition.classList.remove("hidden"); // This line is important

            // Hide loader and show content
            loader.classList.add("hidden");
            mainContent.classList.remove("hidden");

        } else {
            alert("No recipes found. Please try a different ingredient.");
        }
    } catch (error) {
        console.error("Error fetching data:", error);
        alert("Failed to fetch data. Please try again.");
    }
}

// Generate Recipe Cards
function generateHTML(results) {
    if (!results || results.length === 0) {
        showRecipeContainer.innerHTML = '<p>No recipes found.</p>';
        return;
    }

    const recipeHTML = results.map(result => {
        const { recipe } = result;
        const calories = recipe.calories.toFixed(2);
        const ingredientsList = recipe.ingredientLines.map(ingredient => 
            `<li>${ingredient}</li>`
        ).join('');
        
        return `
            <div class="card">
                <div class="card-body">
                    <a href='${recipe.url}' target='_blank'>
                        <img src="${recipe.image}" alt="${recipe.label}">
                    </a>
                    <h6>${recipe.label}</h6>
                    <p>Calories: ${calories}</p>
                    <button class="save-recipe-btn" data-recipe='${JSON.stringify(recipe)}'>Save Recipe</button>
                    <div class="ingredients-preview">
                        <p class="ingredients-count">Ingredients: ${recipe.ingredientLines.length}</p>
                        <div class="ingredients-hover-preview">
                            <ul class="ingredients-list">${ingredientsList}</ul>
                        </div>
                    </div>
                </div>
            </div>`;
    }).join(''); 
    showRecipeContainer.innerHTML = recipeHTML;
    addSaveRecipeListeners();

    // Add event listeners for ingredient hover effect
    const ingredientElements = document.querySelectorAll('.ingredients');
    ingredientElements.forEach(ingredient => {
        ingredient.addEventListener('mouseenter', () => {
            const popUpCard = ingredient.querySelector('.pop-up-card');
            if (popUpCard) {
                popUpCard.style.display = 'block';
            }
        });

        ingredient.addEventListener('mouseleave', () => {
            const popUpCard = ingredient.querySelector('.pop-up-card');
            if (popUpCard) {
                popUpCard.style.display = 'none';
            }
        });
    });
}

// Dropdown Toggle
sortButton.addEventListener('click', (e) => {
    e.stopPropagation();
    sortOptions.classList.toggle('show');
});

// Close dropdown when clicking outside
document.addEventListener('click', () => {
    sortOptions.classList.remove('show');
});

// After successful search and populating results
function showSearchResults(results) {
    // Populate recipe cards
    const showRecipeElement = document.getElementById('showRecipe');
    
    // Assuming your search populates cards
    const sortButton = document.getElementById('sortButton');
    
    if (results && results.length > 0) {
        sortButton.classList.add('show'); // Or use sortButton.style.visibility = 'visible';
    } else {
        sortButton.classList.remove('show'); // Or use sortButton.style.visibility = 'hidden';
    }
}

function addSaveRecipeListeners() {
    const saveButtons = document.querySelectorAll('.save-recipe-btn');
    saveButtons.forEach(button => {
        button.addEventListener('click', () => {
            const recipeData = JSON.parse(button.dataset.recipe);
            saveRecipeToLocalStorage(recipeData);
            alert(`Saved "${recipeData.label}" to your favorites!`);
        });
    });
}


function saveRecipeToLocalStorage(recipe) {
    let savedRecipes = JSON.parse(localStorage.getItem('savedRecipes')) || [];

    // Check for duplicates
    const isDuplicate = savedRecipes.some(saved => saved.url === recipe.url);
    if (!isDuplicate) {
        savedRecipes.push(recipe);
        localStorage.setItem('savedRecipes', JSON.stringify(savedRecipes));
    }
}

document.getElementById('viewSavedRecipesBtn').addEventListener('click', () => {
    // Hide the loader when showing saved recipes
    loader.classList.add("hidden");
    mainContent.classList.remove("hidden");

    showSavedRecipes();
});

function showSavedRecipes() {
    const savedRecipes = JSON.parse(localStorage.getItem('savedRecipes')) || [];
    
    if (savedRecipes.length === 0) {
        showRecipeContainer.innerHTML = '<p>No saved recipes yet!</p>';
        return;
    }

    const savedHTML = savedRecipes.map(recipe => `
        <div class="card">
            <div class="card-body">
                <a href='${recipe.url}' target='_blank'>
                    <img src="${recipe.image}" alt="${recipe.label}">
                </a>
                <h6>${recipe.label}</h6>
                <p>Calories: ${recipe.calories.toFixed(2)}</p>
                <button class="remove-recipe-btn" data-url='${recipe.url}'>Remove</button>
            </div>
        </div>
    `).join('');

    showRecipeContainer.innerHTML = savedHTML;

    // Add listeners to remove buttons
    addRemoveRecipeListeners();
}

function addRemoveRecipeListeners() {
    const removeButtons = document.querySelectorAll('.remove-recipe-btn');
    removeButtons.forEach(button => {
        button.addEventListener('click', () => {
            const recipeUrl = button.dataset.url;
            removeRecipeFromLocalStorage(recipeUrl);
            showSavedRecipes(); // Re-render saved recipes
        });
    });
}


function removeRecipeFromLocalStorage(url) {
    let savedRecipes = JSON.parse(localStorage.getItem('savedRecipes')) || [];
    savedRecipes = savedRecipes.filter(recipe => recipe.url !== url); // Filter out the recipe
    localStorage.setItem('savedRecipes', JSON.stringify(savedRecipes)); // Save updated list
}
document.getElementById('viewSavedRecipesBtn').addEventListener('click', showSavedRecipes);

document.getElementById('surpriseBtn').addEventListener('click', fetchRandomRecipe);

async function fetchRandomRecipe() {
    const app_id = 'd8feb9b1';
    const app_key = 'cd9cb2390f98fe12e951f5df71d0b41e';
    const randomQuery = getRandomQuery(); // Generate a random query keyword
    const baseURl = `https://api.edamam.com/search?q=${randomQuery}&app_id=${app_id}&app_key=${app_key}&to=1`;

    try {
        const result = await fetch(baseURl);
        const data = await result.json();
        if (data.hits.length > 0) {
            generateHTML(data.hits); // Use your existing function to display results
        } else {
            alert("No recipes found, try again!");
        }
    } catch (error) {
        console.error("Error fetching recipe:", error);
    }
}

// Helper function to generate random keywords
function getRandomQuery() {
    const keywords = ["chicken", "pasta", "salad", "soup", "paneer", "cake", "curry", "rice", "bread", "smoothie"];
    return keywords[Math.floor(Math.random() * keywords.length)];
}

tippy('.ingredients', {
    allowHTML: true,          // Enable HTML content in tooltip
    interactive: true,        // Allow interaction (hover or scroll)
    theme: 'light-border',    // Tooltip theme
    placement: 'top',         // Position tooltip above
    maxWidth: '300px',        // Limit tooltip width
    delay: [100, 100],        // Delay before appearing/disappearing
});

document.addEventListener('DOMContentLoaded', () => {
    const refreshLogo = document.querySelector('.logo-refresh');
    refreshLogo.addEventListener('click', () => {
        location.reload();
    });
});
