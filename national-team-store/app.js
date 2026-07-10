/**
 * Nations Gear - Mock Data & Logic
 */

const products = [
    // Morocco
    {
        id: "w-mar-1",
        category: "watch",
        title: "Atlas Lions Chronograph",
        team: "Morocco",
        price: 159.99,
        imageUrl: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
        features: ["Sapphire Crystal", "Water Resistant 100m", "Red & Green Detail"]
    },
    {
        id: "t-mar-1",
        category: "t-shirt",
        title: "Morocco Official Home Jersey",
        team: "Morocco",
        price: 89.99,
        imageUrl: "https://images.unsplash.com/photo-1581655353564-df123a1eb820?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
        features: ["S, M, L, XL", "Moisture-wicking", "Recycled Polyester"]
    },
    {
        id: "s-mar-1",
        category: "shoes",
        title: "Atlas Edition Sneakers",
        team: "Morocco",
        price: 129.99,
        imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
        features: ["Size 39-46", "Responsive Cushioning", "Breathable Mesh"]
    },
    
    // Spain
    {
        id: "w-esp-1",
        category: "watch",
        title: "La Roja Classic Timepiece",
        team: "Spain",
        price: 145.00,
        imageUrl: "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
        features: ["Automatic Movement", "Premium Leather", "Gold Accents"]
    },
    {
        id: "t-esp-1",
        category: "t-shirt",
        title: "Spain Authentic Away Jersey",
        team: "Spain",
        price: 95.00,
        imageUrl: "https://images.unsplash.com/photo-1574634534894-89d7576c8259?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
        features: ["S, M, L, XL", "Athletic Fit", "Ultra Lightweight"]
    },
    {
        id: "s-esp-1",
        category: "shoes",
        title: "Spain Heritage Trainers",
        team: "Spain",
        price: 110.00,
        imageUrl: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
        features: ["Size 40-45", "Suede Upper", "Classic Gum Sole"]
    },
    
    // France
    {
        id: "w-fra-1",
        category: "watch",
        title: "Les Bleus Sport Edition",
        team: "France",
        price: 175.00,
        imageUrl: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
        features: ["Smart Features", "Silicone Band", "Heart Rate Monitor"]
    },
    {
        id: "t-fra-1",
        category: "t-shirt",
        title: "France Retro Graphic Tee",
        team: "France",
        price: 45.00,
        imageUrl: "https://images.unsplash.com/photo-1562157873-818bc0726f68?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
        features: ["XS, S, M, L, XL", "100% Cotton", "Vintage Wash"]
    },
    {
        id: "s-fra-1",
        category: "shoes",
        title: "France Championship Cleats",
        team: "France",
        price: 199.99,
        imageUrl: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
        features: ["Size 38-46", "Carbon Fiber Plate", "Firm Ground"]
    }
];

document.addEventListener("DOMContentLoaded", () => {
    const productGrid = document.getElementById("product-grid");
    const filterButtons = document.querySelectorAll(".filter-btn");

    // Dark mode toggle logic
    const themeToggleDarkIcon = document.getElementById('theme-toggle-dark-icon');
    const themeToggleLightIcon = document.getElementById('theme-toggle-light-icon');
    const themeToggleBtn = document.getElementById('theme-toggle');

    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        themeToggleLightIcon.classList.remove('hidden');
    } else {
        themeToggleDarkIcon.classList.remove('hidden');
    }

    themeToggleBtn.addEventListener('click', function() {
        themeToggleDarkIcon.classList.toggle('hidden');
        themeToggleLightIcon.classList.toggle('hidden');

        if (localStorage.theme === 'dark') {
            document.documentElement.classList.remove('dark');
            localStorage.theme = 'light';
        } else {
            document.documentElement.classList.add('dark');
            localStorage.theme = 'dark';
        }
    });

    // Function to map team name to specific badge colors
    const getBadgeStyle = (team) => {
        switch(team) {
            case "Morocco": return "bg-red-100 text-red-700 ring-red-600/20";
            case "Spain": return "bg-amber-100 text-amber-700 ring-amber-600/20";
            case "France": return "bg-blue-100 text-blue-700 ring-blue-600/20";
            default: return "bg-slate-100 text-slate-700 ring-slate-600/20";
        }
    };

    // Render products based on active filter
    function renderProducts(filter = "all") {
        // Simple fade out effect simulation (clear innerHTML quickly)
        productGrid.innerHTML = "";
        
        const filteredProducts = filter === "all" 
            ? products 
            : products.filter(p => p.category === filter);

        if (filteredProducts.length === 0) {
            productGrid.innerHTML = `<div class="col-span-full py-16 text-center text-slate-500 dark:text-slate-400 font-medium text-lg">No products found in this category.</div>`;
            return;
        }

        filteredProducts.forEach(product => {
            const badgeStyle = getBadgeStyle(product.team);
            const featuresHtml = product.features.map(f => `
                <span class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 mb-1 mr-1">
                    ${f}
                </span>
            `).join("");

            const card = document.createElement("div");
            card.className = "product-card bg-white dark:bg-slate-800 rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-700 flex flex-col h-full group";
            
            card.innerHTML = `
                <div class="relative h-72 overflow-hidden bg-slate-100 dark:bg-slate-900">
                    <img src="${product.imageUrl}" alt="${product.title}" loading="lazy" class="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-110">
                    
                    <div class="absolute top-4 right-4 z-10">
                        <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ring-1 ring-inset ${badgeStyle} shadow-sm backdrop-blur-sm bg-white/80 dark:bg-slate-900/80">
                            ${product.team}
                        </span>
                    </div>
                </div>
                
                <div class="p-6 flex flex-col flex-grow relative">
                    <div class="absolute -top-6 right-6 bg-white dark:bg-slate-800 rounded-full p-2 shadow-md">
                        <div class="bg-slate-900 dark:bg-blue-600 text-white rounded-full h-10 w-10 flex items-center justify-center">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
                        </div>
                    </div>

                    <div class="text-xs text-blue-600 dark:text-blue-400 uppercase tracking-widest font-bold mb-2">${product.category.replace("-", " ")}</div>
                    <h3 class="text-xl font-extrabold text-slate-900 dark:text-white mb-3 leading-tight group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">${product.title}</h3>
                    
                    <div class="mb-6 flex-grow">
                        <div class="flex flex-wrap gap-1 mt-2">
                            ${featuresHtml}
                        </div>
                    </div>
                    
                    <div class="mt-auto pt-5 flex items-center justify-between border-t border-slate-100 dark:border-slate-700">
                        <span class="text-2xl font-black text-slate-900 dark:text-white">$${product.price.toFixed(2)}</span>
                        <button class="text-sm font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors uppercase tracking-wider">
                            Details &rarr;
                        </button>
                    </div>
                </div>
            `;
            productGrid.appendChild(card);
        });
    }

    // Initial render
    renderProducts();

    // Attach event listeners to filter buttons
    filterButtons.forEach(button => {
        button.addEventListener("click", () => {
            // Update active styling
            filterButtons.forEach(btn => btn.classList.remove("active"));
            button.classList.add("active");

            // Filter and render
            const filterValue = button.getAttribute("data-filter");
            renderProducts(filterValue);
        });
    });
});
