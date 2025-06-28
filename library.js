// --- Configuration ---
// IMPORTANT: Replace this URL with the actual URL of your CSV file on GitHub.
// Find it by navigating to the file in your GitHub repo and clicking the "Raw" button.
// Copy the URL from your browser's address bar.
const CSV_FILE_URL = 'https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/YOUR_BRANCH/library-data.csv'; // <-- UPDATE THIS URL

const searchInput = document.getElementById('search-input');
const categoryFilter = document.getElementById('category-filter');
const libraryListDiv = document.getElementById('library-list');

let allLibraryData = []; // To store the full dataset
let uniqueCategories = new Set(); // To store unique categories for the filter

// --- Functions ---

/**
 * Fetches CSV data, parses it, populates the filter, and displays items.
 */
async function initializeLibrary() {
    try {
        const response = await fetch(CSV_FILE_URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const csvText = await response.text();
        parseCsvData(csvText);
        populateCategoryFilter();
        displayItems(allLibraryData); // Display all items initially
    } catch (error) {
        console.error("Error loading library data:", error);
        libraryListDiv.innerHTML = `<div class="no-results">Error loading library data. Please check the console or the CSV URL.</div>`;
    }
}

/**
 * Parses the CSV text content into an array of objects.
 * Assumes the first row is the header (title,category,description,url).
 * Handles potential issues like quotes and commas within fields.
 */
function parseCsvData(csvText) {
    // Simple CSV parsing - might need adjustments for complex CSVs
    // Consider using a library like PapaParse for more robust parsing
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase()); // Get headers and normalize

    // Find column indices dynamically
    const titleIndex = headers.indexOf('title');
    const categoryIndex = headers.indexOf('category');
    const descriptionIndex = headers.indexOf('description');
    const urlIndex = headers.indexOf('url');

    // Check if essential headers exist
    if (titleIndex === -1 || categoryIndex === -1 || descriptionIndex === -1 || urlIndex === -1) {
        console.error("CSV missing required headers: title, category, description, url");
        throw new Error("Invalid CSV format: Missing required headers.");
    }


    allLibraryData = lines.slice(1).map(line => {
        // Basic parsing, might break if fields contain commas within quotes
        // For robustness, use a dedicated CSV parser library (e.g., PapaParse)
        let values = [];
        let currentVal = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                // Handle escaped quotes ("")
                if (inQuotes && line[i+1] === '"') {
                    currentVal += '"';
                    i++; // Skip the next quote
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                values.push(currentVal.trim());
                currentVal = '';
            } else {
                currentVal += char;
            }
        }
        values.push(currentVal.trim()); // Add the last value

        // Ensure we have enough values, pad with empty strings if necessary
        while (values.length <= Math.max(titleIndex, categoryIndex, descriptionIndex, urlIndex)) {
            values.push('');
        }

        const category = values[categoryIndex];
        uniqueCategories.add(category); // Add to our set of unique categories

        return {
            title: values[titleIndex],
            category: category,
            description: values[descriptionIndex],
            url: values[urlIndex]
        };
    });

    // Sort categories alphabetically after collecting them
    uniqueCategories = new Set([...uniqueCategories].sort());
}

/**
 * Populates the category filter dropdown (<select>) element.
 */
function populateCategoryFilter() {
    // Clear existing options except the default "All"
    categoryFilter.innerHTML = '<option value="all">All Categories</option>';

    uniqueCategories.forEach(category => {
        if (category) { // Avoid adding empty categories if any exist
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categoryFilter.appendChild(option);
        }
    });
}

/**
 * Displays a list of library items in the DOM.
 * @param {Array<Object>} itemsToDisplay - Array of library item objects.
 */
function displayItems(itemsToDisplay) {
    libraryListDiv.innerHTML = ''; // Clear previous results

    if (itemsToDisplay.length === 0) {
        libraryListDiv.innerHTML = '<div class="no-results">No items found matching your criteria.</div>';
        return;
    }

    itemsToDisplay.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.classList.add('library-item');

        itemDiv.innerHTML = `
            <h3>${escapeHtml(item.title)}</h3>
            <p><strong>Category:</strong> ${escapeHtml(item.category)}</p>
            <p>${escapeHtml(item.description)}</p>
            <p><a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">Visit Link</a></p>
        `;
        libraryListDiv.appendChild(itemDiv);
    });
}

/**
 * Filters and searches the library data based on input values.
 */
function filterAndSearch() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    const selectedCategory = categoryFilter.value;

    const filteredData = allLibraryData.filter(item => {
        // Category filter check
        const categoryMatch = selectedCategory === 'all' || item.category === selectedCategory;

        // Search term check (in title OR description)
        const searchMatch = searchTerm === '' ||
                           item.title.toLowerCase().includes(searchTerm) ||
                           item.description.toLowerCase().includes(searchTerm) ||
                           item.category.toLowerCase().includes(searchTerm); // Also search category

        return categoryMatch && searchMatch;
    });

    displayItems(filteredData);
}

/**
 * Helper function to escape HTML special characters to prevent XSS.
 * @param {string} unsafe - The potentially unsafe string.
 * @returns {string} - The escaped string.
 */
function escapeHtml(unsafe) {
    if (!unsafe) return ''; // Handle null or undefined input
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
 }


// --- Event Listeners ---

// Filter when search term changes
searchInput.addEventListener('input', filterAndSearch);

// Filter when category selection changes
categoryFilter.addEventListener('change', filterAndSearch);

// --- Initialization ---
// Fetch data and set up the library when the page loads
document.addEventListener('DOMContentLoaded', initializeLibrary);
