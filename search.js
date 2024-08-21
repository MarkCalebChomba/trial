const searchInput = document.getElementById('searchInput');
const searchSuggestions = document.getElementById('searchSuggestions');
const searchForm = document.getElementById('searchForm');

const categories = [
    'Electronics',
    'Kitchenware',
    'Furniture',
    'Fashion',
    'Beauty',
    'Rentals',
    'Service Men',
    'Foodstuffs',
    'Phones',
    'Accessories',
    'Pharmaceutical',
    'Wigs'
    // Add more categories as needed
];

// Mock data for suggestions
const suggestions = [
    'Profile Name 1',
    'Profile Name 2',
    'Product Description 1',
    'Product Description 2',
    'Category 1',
    'Category 2',
    'Category 3',
    // Add more suggestions as needed
];

// Function to filter suggestions based on search input
function filterSuggestions(input) {
    return suggestions.filter(suggestion => suggestion.toLowerCase().includes(input.toLowerCase()));
}

// Function to display suggestions
function displaySuggestions(filteredSuggestions) {
    searchSuggestions.innerHTML = '';
    filteredSuggestions.forEach(suggestion => {
        const suggestionItem = document.createElement('div');
        suggestionItem.classList.add('suggestion-item');
        suggestionItem.textContent = suggestion;
        suggestionItem.addEventListener('click', () => {
            searchInput.value = suggestion;
            searchSuggestions.style.display = 'none';
        });
        searchSuggestions.appendChild(suggestionItem);
    });
    if (filteredSuggestions.length > 0) {
        searchSuggestions.style.display = 'block';
    } else {
        searchSuggestions.style.display = 'none';
    }
}

// Event listener for search input
searchInput.addEventListener('input', () => {
    const input = searchInput.value.trim();
    if (input.length === 0) {
        searchSuggestions.style.display = 'none';
    } else {
        const filteredSuggestions = filterSuggestions(input);
        displaySuggestions(filteredSuggestions);
    }
});

// Event listener for form submission (search)
searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const searchTerm = searchInput.value.trim();
    // Perform search action here based on searchTerm (e.g., filter content)
    console.log('Searching for:', searchTerm);
    // Reset suggestions
    searchInput.value = '';
    searchSuggestions.style.display = 'none';
});
