document.addEventListener("DOMContentLoaded", () => {
  // Hamburger menu logic
  const hamburger = document.getElementById("hamburger-btn");
  const navLinks = document.querySelector(".nav-links");
  if (hamburger && navLinks) {
    hamburger.addEventListener("click", () => {
      navLinks.classList.toggle("open");
      hamburger.classList.toggle("open");
    });
  }

  // Navbar color logic: black only on slideshow
  const navbar = document.querySelector('.navbar');
  const slideshow = document.getElementById('slideshow');
  function updateNavbarOnScroll() {
    if (!navbar || !slideshow) return;
    const slideBottom = slideshow.getBoundingClientRect().bottom;
    if (slideBottom > 0) {
      navbar.classList.add('on-slideshow');
    } else {
      navbar.classList.remove('on-slideshow');
    }
  }
  window.addEventListener('scroll', updateNavbarOnScroll);
  updateNavbarOnScroll();

  // --- Hero Rotating Headline Animation ---
  const rotatingHeadlines = [
    "Find your next dream job",
    "Upload Resume, Let AI Guide You",
    "Smart Recommendations for You"
  ];
  let headlineIdx = 0;
  const rotatingEl = document.querySelector('.hero-rotating');
  if (rotatingEl) {
    setInterval(() => {
      headlineIdx = (headlineIdx + 1) % rotatingHeadlines.length;
      rotatingEl.style.opacity = 0;
      setTimeout(() => {
        rotatingEl.textContent = rotatingHeadlines[headlineIdx];
        rotatingEl.style.opacity = 1;
      }, 350);
    }, 3200);
  }

  // --- Animated Slider Text Below Slideshow ---
  const sliderPhrases = [
    "Search, Match, Apply — Effortlessly",
    "Let AI Guide Your Job Hunt",
    "Tailored Opportunities, Real Results"
  ];
  const sliderText = document.getElementById('sliderText');
  let sliderIndex = 0;
  let isTransitioning = false;

  function showSliderText(idx) {
    if (!sliderText) return;
    if (isTransitioning) return;
    isTransitioning = true;
    sliderText.classList.add('hide');
    setTimeout(() => {
      sliderText.textContent = sliderPhrases[idx];
      sliderText.classList.remove('hide');
      sliderText.style.animation = 'none';
      // Force reflow for restart animation
      void sliderText.offsetWidth;
      sliderText.style.animation = null;
      isTransitioning = false;
    }, 350);
  }

  function nextSliderText() {
    sliderIndex = (sliderIndex + 1) % sliderPhrases.length;
    showSliderText(sliderIndex);
  }

  if (sliderText) {
    showSliderText(sliderIndex);
    setInterval(nextSliderText, 2500);
  }

  // Job board logic
  const uploadInput = document.getElementById("resume-upload-input");
  const uploadBtn = document.querySelector("#resume-upload .upload-btn");
  const uploadBox = document.querySelector(".upload-box");
  const jobListings = document.getElementById("job-listings");
  const predictedRoleDiv = document.getElementById("predicted-role");
  const roleNameSpan = document.getElementById("role-name");
  const jobResultsTitle = document.getElementById("job-results-title");
  const searchBar = document.getElementById("jobSearchInput");
  const searchBtn = document.getElementById("job-search-btn");

  let uploadedFile = null;
  let extractedText = "";
  let predictedRole = null;

  // Show uploaded file name and remove option
  function showUploadedFile(file) {
    uploadBox.innerHTML = `
      <div class="uploaded-file">
        <span>${file.name}</span>
        <button class="remove-file-btn" title="Remove file">&times;</button>
      </div>
    `;
    document.querySelector(".remove-file-btn").onclick = () => {
      uploadedFile = null;
      extractedText = "";
      predictedRole = null;
      uploadInput.value = "";
      uploadBox.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 48 48" width="48" height="48">
          <path d="M24 34V14M24 14l-8 8M24 14l8 8"/>
        </svg>
      `;
      predictedRoleDiv.style.display = "none";
      roleNameSpan.textContent = "";
      jobResultsTitle.textContent = "";
      jobListings.innerHTML = "";
    };
  }

  if (uploadInput) {
    uploadInput.addEventListener("change", handleResumeUpload);
  }

  function handleResumeUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    uploadedFile = file;
    showUploadedFile(file);

    const reader = new FileReader();

    if (file.name.endsWith(".txt")) {
      reader.onload = e => {
        extractedText = e.target.result;
      };
      reader.readAsText(file);

    } else if (file.name.endsWith(".pdf")) {
      if (typeof pdfjsLib === "undefined") {
        showError("PDF processing library not loaded.");
        return;
      }
      reader.onload = e => {
        const typedarray = new Uint8Array(e.target.result);
        pdfjsLib.getDocument(typedarray).promise.then(pdf => {
          pdf.getPage(1).then(page => {
            page.getTextContent().then(textContent => {
              extractedText = textContent.items.map(item => item.str).join(" ");
            });
          });
        }).catch(err => {
          console.error("Error reading PDF:", err);
          showError("Failed to process PDF.");
        });
      };
      reader.readAsArrayBuffer(file);

    } else if (file.name.endsWith(".docx")) {
      if (typeof mammoth === "undefined") {
        showError("DOCX processing library not loaded.");
        return;
      }
      reader.onload = e => {
        mammoth.extractRawText({ arrayBuffer: e.target.result })
          .then(result => {
            extractedText = result.value;
          })
          .catch(err => {
            console.error("Error reading DOCX:", err);
            showError("Failed to process DOCX.");
          });
      };
      reader.readAsArrayBuffer(file);

    } else {
      showError("Unsupported file type. Upload .pdf, .docx or .txt");
    }
  }

  // Only process and show jobs when user clicks Upload Resume button
  if (uploadBtn) {
    uploadBtn.addEventListener("click", (e) => {
      if (!uploadedFile) {
        // Only open file picker if no file is uploaded
        uploadInput.click();
        return;
      }
      if (!extractedText) {
        showError("Resume is still being processed. Please wait a moment.");
        return;
      }
      processResumeText(extractedText);
    });
  }

  // Main job search bar logic (now the only search bar)
  if (searchBar && searchBtn) {
    function doSearch() {
      const keyword = searchBar.value.trim();
      if (keyword) {
        saveSearchKeyword(keyword);
        jobResultsTitle.innerHTML = `Here are the job roles available for <span id="matched-role">${keyword}</span>:`;
        searchJobs(keyword);
        showKeywordStats(keyword);
      }
    }
    searchBtn.addEventListener("click", doSearch);
    searchBar.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        doSearch();
      }
    });
  }

  function processResumeText(text) {
    if (typeof predictJobRoleFromText !== "function") {
      showError("Prediction function is undefined.");
      console.error("❌ predictJobRoleFromText is not defined.");
      return;
    }

    predictedRole = predictJobRoleFromText(text);

    if (predictedRole) {
      predictedRoleDiv.style.display = "block";
      roleNameSpan.textContent = predictedRole;

      jobResultsTitle.innerHTML = `Here are the job roles available for <span id="matched-role">${predictedRole}</span>:`;

      if (searchBar) searchBar.value = predictedRole;
      saveSearchKeyword(predictedRole);
      searchJobs(predictedRole);
      showKeywordStats(predictedRole);
    } else {
      predictedRoleDiv.style.display = "block";
      roleNameSpan.textContent = "No suitable role found";
      jobResultsTitle.textContent = "No matching roles found for your resume.";
      jobListings.innerHTML = `<p class="no-results">No jobs found for your resume.</p>`;
    }
  }

  function showError(message) {
    predictedRoleDiv.style.display = "block";
    roleNameSpan.textContent = "Error";
    jobResultsTitle.textContent = message;
    jobListings.innerHTML = `<p class="error">${message}</p>`;
  }

  function saveSearchKeyword(keyword) {
    let keywordStats = JSON.parse(localStorage.getItem("keywordStats")) || {};
    keywordStats[keyword] = (keywordStats[keyword] || 0) + 1;
    localStorage.setItem("keywordStats", JSON.stringify(keywordStats));
  }

  function showKeywordStats(keyword) {
    const stats = JSON.parse(localStorage.getItem("keywordStats")) || {};
    const list = document.getElementById("keyword-stats-list");
    if (!list) return;
    list.innerHTML = "";
    if (!keyword || !stats[keyword]) {
      list.style.display = "none";
      return;
    }
    list.style.display = "block";
    const item = document.createElement("li");
    item.textContent = `${keyword} – ${stats[keyword]} searches`;
    list.appendChild(item);
  }

  function searchJobs(keyword) {
    fetch(`https://hirebuddy-6ncf.onrender.com/search?role=${encodeURIComponent(keyword)}`)
      .then(response => response.json())
      .then(jobs => {
        renderJobs(jobs);
      })
      .catch(error => {
        console.error("Error fetching job data:", error);
        jobListings.innerHTML = `<p class="error">Failed to load job data.</p>`;
      });
  }

  // --- Modern Job Card Rendering with Tags and Icons ---
  function renderJobs(jobs) {
    if (jobs.length === 0) {
      jobListings.innerHTML = `<p class="no-results">No jobs found for your search.</p>`;
      return;
    }

    jobListings.innerHTML = jobs.map(job => {
      // Tag logic (example: you may want to adjust this based on your data)
      let tags = [];
      if (job.description && /remote/i.test(job.description)) tags.push('<span class="job-tag remote">Remote</span>');
      if (job.description && /intern/i.test(job.description)) tags.push('<span class="job-tag intern">Intern</span>');
      if (job.description && /full.?time/i.test(job.description)) tags.push('<span class="job-tag fulltime">Full-time</span>');

      return `
      <div class="job-card fade-in">
        <div class="job-card-header">
          <span class="job-card-title"><span class="icon">💼</span> ${job.job_title}</span>
        </div>
        <div class="job-card-company"><span class="icon">🏢</span> ${job.company_name}</div>
        <div class="job-card-location"><span class="icon">📍</span> ${job.job_location}</div>
        <div class="job-card-tags">${tags.join(' ')}</div>
        <div class="job-card-description"><span class="icon">📝</span> ${job.description}</div>
        <div class="job-card-actions">
          <a href="${job.apply_link}" target="_blank" class="apply-btn">Apply Now</a>
        </div>
      </div>
      `;
    }).join("");
  }

  function predictJobRoleFromText(text) {
    const lowerText = text.toLowerCase();
    const roles = {
      "frontend developer": [
        "html", "css", "javascript", "react", "next.js", "tailwind", "frontend", "ui", "frontend development"
      ],
      "backend developer": [
        "python", "django", "flask", "node", "express", "rest api", "sql", "postgres", "mongodb", "backend", "server-side", "web development"
      ],
      "data scientist": [
        "machine learning", "deep learning", "data analysis", "data science", "pandas", "numpy", "sklearn", "tensorflow", "ai", "artificial intelligence", "neural networks"
      ],
      "ui/ux designer": [
        "figma", "adobe xd", "wireframes", "prototypes", "user experience", "interface", "visual design", "ui/ux"
      ]
    };

    const roleScores = {};
    for (const role in roles) {
      const keywords = roles[role];
      let score = 0;
      for (const keyword of keywords) {
        if (lowerText.includes(keyword)) {
          score++;
        }
      }
      roleScores[role] = score;
    }

    const sorted = Object.entries(roleScores).sort((a, b) => b[1] - a[1]);
    const [topRole, score] = sorted[0];
    return score > 0 ? topRole : null;
  }

  // --- Google-style Search Bar Dropdown with Debounce and Full Integration ---
  (function () {
    const searchInput = document.getElementById("jobSearchInput");
    const searchBtn = document.getElementById("job-search-btn");
    const jobResultsTitle = document.getElementById("job-results-title");
    const jobListings = document.getElementById("job-listings");

    if (!searchInput) return;

    // Wrap input in a relative container for dropdown positioning
    let parent = searchInput.parentElement;
    if (!parent.classList.contains('search-bar-parent')) {
      const wrapper = document.createElement('div');
      wrapper.className = 'search-bar-parent';
      wrapper.style.position = 'relative';
      wrapper.style.flex = '1';
      parent.insertBefore(wrapper, searchInput);
      wrapper.appendChild(searchInput);
      parent = wrapper;
    } else {
      parent.style.position = 'relative';
    }

    // Create dropdown container
    const dropdown = document.createElement("div");
    dropdown.className = "search-dropdown";
    dropdown.style.display = "none";
    parent.appendChild(dropdown);

    // Debounce utility
    function debounce(fn, delay) {
      let timer;
      return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
      };
    }

    // LocalStorage helpers
    function getHistory() {
      return JSON.parse(localStorage.getItem("searchHistory") || "[]");
    }
    function setHistory(arr) {
      localStorage.setItem("searchHistory", JSON.stringify(arr));
    }
    function addToHistory(term) {
      term = term.trim();
      if (!term) return;
      let history = getHistory();
      history = history.filter(t => t.toLowerCase() !== term.toLowerCase());
      history.unshift(term);
      if (history.length > 15) history = history.slice(0, 15);
      setHistory(history);
    }
    function removeFromHistory(term) {
      let history = getHistory();
      history = history.filter(t => t.toLowerCase() !== term.toLowerCase());
      setHistory(history);
    }

    // Dropdown rendering
    function renderDropdown(matches) {
      dropdown.innerHTML = "";
      if (!matches.length) {
        dropdown.style.display = "none";
        return;
      }
      matches.forEach(term => {
        const item = document.createElement("div");
        item.className = "search-dropdown-item";
        item.tabIndex = 0;

        // Suggestion text
        const text = document.createElement("span");
        text.textContent = term;
        text.className = "search-dropdown-text";
        text.onclick = () => {
          searchInput.value = term;
          dropdown.style.display = "none";
          triggerSearch(term);
        };

        // Remove 'X' icon
        const remove = document.createElement("span");
        remove.textContent = "✕";
        remove.title = "Remove";
        remove.className = "search-dropdown-remove";
        remove.onclick = (e) => {
          e.stopPropagation();
          removeFromHistory(term);
          updateDropdown();
        };

        item.appendChild(text);
        item.appendChild(remove);

        item.onmouseenter = () => item.classList.add("active");
        item.onmouseleave = () => item.classList.remove("active");

        item.onmousedown = e => e.preventDefault(); // Prevent blur

        item.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            searchInput.value = term;
            dropdown.style.display = "none";
            triggerSearch(term);
          }
        });

        dropdown.appendChild(item);
      });
      dropdown.style.display = "block";
    }

    // Update dropdown based on input value
    function updateDropdown() {
      const val = searchInput.value.trim().toLowerCase();
      let history = getHistory();
      let matches = [];
      if (!val) {
        matches = history;
      } else {
        matches = history.filter(t => t.toLowerCase().includes(val));
      }
      renderDropdown(matches);
    }

    // Hide dropdown
    function hideDropdown() {
      dropdown.style.display = "none";
    }

    // Show dropdown (if matches)
    function showDropdown() {
      updateDropdown();
    }

    // Debounced input handler
    const debouncedUpdateDropdown = debounce(updateDropdown, 80);

    // Event listeners
    searchInput.addEventListener("input", debouncedUpdateDropdown);
    searchInput.addEventListener("focus", showDropdown);

    // Hide dropdown on blur, but allow click on dropdown
    searchInput.addEventListener("blur", () => {
      setTimeout(hideDropdown, 120);
    });

    // Hide dropdown on Escape or click outside
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") hideDropdown();
    });
    document.addEventListener("mousedown", (e) => {
      if (!dropdown.contains(e.target) && e.target !== searchInput) {
        hideDropdown();
      }
    });

    // Keyboard navigation for dropdown
    searchInput.addEventListener("keydown", (e) => {
      if (!["ArrowDown", "ArrowUp"].includes(e.key)) return;
      const items = Array.from(dropdown.querySelectorAll(".search-dropdown-item"));
      if (!items.length) return;
      let idx = items.findIndex(item => item.classList.contains("active"));
      if (e.key === "ArrowDown") {
        idx = (idx + 1) % items.length;
      } else if (e.key === "ArrowUp") {
        idx = (idx - 1 + items.length) % items.length;
      }
      items.forEach(item => item.classList.remove("active"));
      items[idx].classList.add("active");
      items[idx].focus();
      e.preventDefault();
    });

    // Save to history and trigger search
    function triggerSearch(val) {
      val = val.trim();
      if (!val) return;
      addToHistory(val);
      if (jobResultsTitle) {
        jobResultsTitle.innerHTML = `Here are the job roles available for <span id="matched-role">${val}</span>:`;
      }
      if (typeof searchJobs === "function") {
        searchJobs(val);
      }
      if (typeof showKeywordStats === "function") {
        showKeywordStats(val);
      }
    }

    // Search on Enter or button click
    function handleSearchEvent() {
      const val = searchInput.value.trim();
      if (val) {
        triggerSearch(val);
        hideDropdown();
      }
    }
    if (searchBtn) {
      searchBtn.addEventListener("click", handleSearchEvent);
    }
    searchInput.addEventListener("keydown", e => {
      if (e.key === "Enter") {
        handleSearchEvent();
      }
    });
  })();
});