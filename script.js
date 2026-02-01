// Self-Updating Portfolio Engine
// Fetches projects from GitHub API automatically

const GITHUB_USERNAME = "umesh0518";
const GITHUB_API = `https://api.github.com/users/${GITHUB_USERNAME}/repos`;

// Configuration for filtering projects
const CONFIG = {
  sortBy: "updated", // 'stars', 'updated', or 'created'
  minStars: 0,
  excludeForked: true,
  maxProjects: 12,
  // Optional: Only show repos with these topics
  requiredTopics: [], // e.g., ['portfolio-worthy', 'featured']
};

/**
 * Fetch repositories from GitHub API
 */
async function fetchGitHubRepos() {
  try {
    const response = await fetch(
      `${GITHUB_API}?per_page=100&sort=${CONFIG.sortBy}`,
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const repos = await response.json();
    return repos;
  } catch (error) {
    console.error("Error fetching repos:", error);
    return [];
  }
}

/**
 * Filter repositories based on configuration
 */
function filterRepos(repos) {
  return repos.filter((repo) => {
    // Exclude forks if configured
    if (CONFIG.excludeForked && repo.fork) {
      return false;
    }

    // Filter by minimum stars
    if (repo.stargazers_count < CONFIG.minStars) {
      return false;
    }

    // Filter by required topics (if specified)
    if (CONFIG.requiredTopics.length > 0) {
      const hasRequiredTopic = CONFIG.requiredTopics.some(
        (topic) => repo.topics && repo.topics.includes(topic),
      );
      if (!hasRequiredTopic) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Sort repositories based on configuration
 */
function sortRepos(repos) {
  switch (CONFIG.sortBy) {
    case "stars":
      return repos.sort((a, b) => b.stargazers_count - a.stargazers_count);
    case "updated":
      return repos.sort(
        (a, b) => new Date(b.updated_at) - new Date(a.updated_at),
      );
    case "created":
      return repos.sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at),
      );
    default:
      return repos;
  }
}

/**
 * Format date to readable string
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 7) {
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months} month${months > 1 ? "s" : ""} ago`;
  } else {
    const years = Math.floor(diffDays / 365);
    return `${years} year${years > 1 ? "s" : ""} ago`;
  }
}

/**
 * Get language color for visual representation
 */
function getLanguageColor(language) {
  const colors = {
    JavaScript: "#f1e05a",
    TypeScript: "#2b7489",
    Python: "#3572A5",
    Java: "#b07219",
    "C++": "#f34b7d",
    C: "#555555",
    HTML: "#e34c26",
    CSS: "#563d7c",
    Go: "#00ADD8",
    Rust: "#dea584",
    Ruby: "#701516",
    PHP: "#4F5D95",
    Swift: "#ffac45",
    Kotlin: "#F18E33",
    Dart: "#00B4AB",
    Shell: "#89e051",
    "Jupyter Notebook": "#DA5B0B",
  };
  return colors[language] || "#000000";
}

/**
 * Create HTML for a single project card
 */
function createProjectCard(repo) {
  const description = repo.description || "No description available";
  const language = repo.language || "Unknown";
  const stars = repo.stargazers_count;
  const forks = repo.forks_count;
  const updated = formatDate(repo.updated_at);
  const topics = repo.topics || [];

  return `
        <div class="project-card">
            <h3>${repo.name.replace(/-/g, " ").replace(/_/g, " ")}</h3>
            <p>${description}</p>
            
            <div class="project-meta">
                <span style="background: ${getLanguageColor(language)}; color: ${language === "JavaScript" ? "#000" : "#fff"};">
                    ${language}
                </span>
                ${topics
                  .slice(0, 3)
                  .map((topic) => `<span>${topic}</span>`)
                  .join("")}
            </div>
            
            <div class="project-stats">
                <span>Stars: ${stars}</span>
                <span>Forks: ${forks}</span>
                <span>Updated: ${updated}</span>
            </div>
            
            <a href="${repo.html_url}" target="_blank" class="link">
                View on GitHub →
            </a>
            ${
              repo.homepage
                ? `
                <a href="${repo.homepage}" target="_blank" class="link" style="margin-left: 15px;">
                    Live Demo →
                </a>
            `
                : ""
            }
        </div>
    `;
}

/**
 * Render projects to the DOM
 */
function renderProjects(repos) {
  const projectsGrid = document.getElementById("projects-grid");

  if (repos.length === 0) {
    projectsGrid.innerHTML = `
            <div class="loading">
                No projects found. Check back soon!
            </div>
        `;
    return;
  }

  // Limit to max projects
  const displayRepos = repos.slice(0, CONFIG.maxProjects);

  projectsGrid.innerHTML = displayRepos
    .map((repo) => createProjectCard(repo))
    .join("");
}

/**
 * Main initialization function
 */
async function init() {
  console.log("Initializing self-updating portfolio...");

  try {
    // Fetch repos from GitHub
    const repos = await fetchGitHubRepos();
    console.log(`Fetched ${repos.length} repositories`);

    // Filter repos
    const filteredRepos = filterRepos(repos);
    console.log(`Filtered to ${filteredRepos.length} repositories`);

    // Sort repos
    const sortedRepos = sortRepos(filteredRepos);

    // Render to page
    renderProjects(sortedRepos);
    console.log("Portfolio updated successfully!");

    // Update the notice
    const updateNotice = document.querySelector(".update-notice");
    if (updateNotice) {
      updateNotice.textContent = `Last updated: ${new Date().toLocaleString()} | Showing ${Math.min(sortedRepos.length, CONFIG.maxProjects)} projects`;
    }
  } catch (error) {
    console.error("Error initializing portfolio:", error);
    const projectsGrid = document.getElementById("projects-grid");
    projectsGrid.innerHTML = `
            <div class="loading">
                Failed to load projects. Please try again later.
            </div>
        `;
  }
}

/**
 * Smooth scroll for navigation
 */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute("href"));
      if (target) {
        target.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    });
  });
}

/**
 * Add scroll animations
 */
function initScrollAnimations() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = "1";
          entry.target.style.transform = "translateY(0)";
        }
      });
    },
    {
      threshold: 0.1,
    },
  );

  document
    .querySelectorAll(
      ".project-card, .timeline-item, .research-card, .skill-category",
    )
    .forEach((el) => {
      el.style.opacity = "0";
      el.style.transform = "translateY(20px)";
      el.style.transition = "opacity 0.6s ease, transform 0.6s ease";
      observer.observe(el);
    });
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    init();
    initSmoothScroll();
    setTimeout(initScrollAnimations, 500);
  });
} else {
  init();
  initSmoothScroll();
  setTimeout(initScrollAnimations, 500);
}

// Optional: Auto-refresh every 5 minutes to show latest updates
// Uncomment if you want the page to auto-update
// setInterval(init, 5 * 60 * 1000);
