<<<<<<< HEAD
// app.js
// Main Application Logic and UI bindings

document.addEventListener('DOMContentLoaded', () => {
    // --- State ---
    let currentProblemIdView = null;
    let revProblem = null;

    // --- DOM Elements ---
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.page-section');
    const themeToggle = document.getElementById('theme-toggle');
    const toastContainer = document.getElementById('toast-container');

    // Forms & Inputs
    const addForm = document.getElementById('add-problem-form');
    const extractBtn = document.getElementById('extract-title-btn');
    const linkInput = document.getElementById('problem-link');
    const titleInput = document.getElementById('problem-title');

    // --- Initialization ---
    initTheme();
    renderDashboard();
    setupRouting();

    // --- Routing ---
    function setupRouting() {
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const target = item.getAttribute('data-target');
                navigateTo(target);
            });
        });
    }

    function navigateTo(sectionId) {
        // Update active nav
        navItems.forEach(nav => nav.classList.remove('active'));
        const navTarget = document.querySelector(`.nav-item[data-target="${sectionId === 'problem-detail' ? 'tracker' : sectionId}"]`);
        if (navTarget) navTarget.classList.add('active');

        // Update active section
        sections.forEach(sec => sec.classList.remove('active'));
        document.getElementById(sectionId).classList.add('active');

        // Trigger section specific logic
        if (sectionId === 'dashboard') renderDashboard();
        if (sectionId === 'tracker') renderTracker();
        if (sectionId === 'revision') renderRevisionMode();
    }

    // --- Theming ---
    function initTheme() {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);
        updateThemeIcon(savedTheme);

        themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateThemeIcon(newTheme);
        });
    }

    function updateThemeIcon(theme) {
        const icon = themeToggle.querySelector('i');
        icon.className = theme === 'dark' ? 'ph ph-sun' : 'ph ph-moon';
    }

    // --- Toast Notifications ---
    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = document.createElement('i');
        icon.className = type === 'success' ? 'ph ph-check-circle' : 'ph ph-warning-circle';
        
        const text = document.createElement('span');
        text.textContent = message;

        toast.appendChild(icon);
        toast.appendChild(text);

        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'fadeOut 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // --- Title & Difficulty Extraction ---
    extractBtn.addEventListener('click', async () => {
        const url = linkInput.value;
        if (!url) {
            showToast('Please enter a link first', 'error');
            return;
        }

        try {
            // e.g. https://leetcode.com/problems/two-sum/
            const urlObj = new URL(url);
            const pathParts = urlObj.pathname.split('/').filter(p => p);
            
            const problemsIndex = pathParts.indexOf('problems');
            if (problemsIndex !== -1 && pathParts.length > problemsIndex + 1) {
                const slug = pathParts[problemsIndex + 1];
                
                // Set loading state
                extractBtn.textContent = '...';
                extractBtn.disabled = true;

                // We will use a triple-fallback approach to bypass strict CORS rules and rate limits
                const query = `query questionTitle($titleSlug: String!) {
                    question(titleSlug: $titleSlug) {
                        title
                        difficulty
                    }
                }`;

                try {
                    let titleVal = '';
                    let diffVal = '';
                    
                    try {
                        // Attempt 1: Direct hitting LeetCode (Works on Live Server or when CORS handles properly)
                        const response = await fetch('https://leetcode.com/graphql', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                operationName: 'questionTitle',
                                variables: { titleSlug: slug },
                                query: query
                            })
                        });
                        if (!response.ok) throw new Error("Network response was not ok");
                        const data = await response.json();
                        
                        if (data && data.data && data.data.question) {
                            titleVal = data.data.question.title;
                            diffVal = data.data.question.difficulty;
                        } else {
                            throw new Error("Missing data");
                        }
                    } catch (e1) {
                        try {
                            // Attempt 2: Use alfa-leetcode API (Often works but has strict 429 rate limits)
                            const response = await fetch(`https://alfa-leetcode-api.onrender.com/select?titleSlug=${slug}`);
                            if (!response.ok) throw new Error("Alfa API failed");
                            const apiData = await response.json();
                            if (apiData && apiData.questionTitle) {
                                titleVal = apiData.questionTitle;
                                diffVal = apiData.difficulty;
                            } else {
                                throw new Error("Not found in Alfa API");
                            }
                        } catch (e2) {
                            // Attempt 3: Use AllOrigins GET Proxy
                            const leetcodeReq = 'https://leetcode.com/graphql?query=' + encodeURIComponent(query) + '&operationName=questionTitle&variables=' + encodeURIComponent(JSON.stringify({ titleSlug: slug }));
                            const proxyUrl = 'https://api.allorigins.win/get?url=' + encodeURIComponent(leetcodeReq);
                            
                            const response = await fetch(proxyUrl);
                            if (!response.ok) throw new Error("Proxy response was not ok");
                            const proxyData = await response.json();
                            
                            const parsedContents = JSON.parse(proxyData.contents);
                            if (parsedContents && parsedContents.data && parsedContents.data.question) {
                                titleVal = parsedContents.data.question.title;
                                diffVal = parsedContents.data.question.difficulty;
                            } else {
                                throw new Error("Not found in AllOrigins proxy API");
                            }
                        }
                    }
                    
                    titleInput.value = titleVal;
                    document.getElementById('problem-difficulty').value = diffVal;
                    document.getElementById('perceived-difficulty').value = diffVal; // Pre-select
                    showToast('Extracted successfully');
                    
                } catch (apiError) {
                    console.log("All three APIs failed, falling back to slug parsing", apiError);
                    // Fallback to URL parsing for title if APIs fail entirely
                    const formattedTitle = slug.split('-').map(word => 
                        word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ');
                    
                    titleInput.value = formattedTitle;
                    document.getElementById('problem-difficulty').value = 'Unknown';
                    showToast('Title extracted, difficulty requires manual input due to network block', 'warning');
                }

            } else {
                showToast('Could not extract title from URL', 'error');
            }
        } catch (e) {
            showToast('Invalid URL', 'error');
        } finally {
            extractBtn.textContent = 'Extract';
            extractBtn.disabled = false;
        }
    });

    // --- Add Problem ---
    addForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const diffInput = document.getElementById('problem-difficulty').value;

        const problem = {
            link: document.getElementById('problem-link').value,
            title: document.getElementById('problem-title').value,
            difficulty: document.getElementById('perceived-difficulty').value, // Used for tracker filtering and colors
            lcDifficulty: diffInput || 'Unknown', // Stored for accurate stats if needed
            topic: document.getElementById('problem-topic').value,
            mistakeType: document.getElementById('mistake-type').value,
            whatWentWrong: document.getElementById('what-went-wrong').value,
            correctApproach: document.getElementById('correct-approach').value,
            timeTaken: document.getElementById('time-taken').value || 'N/A',
            confidence: document.getElementById('confidence-level').value,
            needsRevision: document.getElementById('needs-revision').checked,
            date: new Date().toLocaleDateString()
        };

        StorageManager.addProblem(problem);
        showToast('Problem saved successfully!');
        
        // Reset form
        addForm.reset();
        document.getElementById('confidence-level').nextElementSibling.value = 3;
        
        navigateTo('dashboard');
    });

    // --- Dashboard ---
    function renderDashboard() {
        const stats = StorageManager.getStats();
        const problems = StorageManager.getProblems();
        
        document.getElementById('stat-total').textContent = stats.total;
        document.getElementById('stat-mastered').textContent = stats.mastered;
        document.getElementById('stat-revise').textContent = stats.revise;
        document.getElementById('stat-streak').textContent = `${StorageManager.getStreak()} days`;

        const recentList = document.getElementById('recent-problems-list');
        recentList.innerHTML = '';

        if (problems.length === 0) {
            recentList.innerHTML = '<div class="empty-state">No problems tracked yet.</div>';
            return;
        }

        // Show last 5 problems
        const recent = [...problems].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
        
        recent.forEach(prob => {
            const el = document.createElement('div');
            el.className = 'card';
            el.style.marginBottom = '1rem';
            el.style.display = 'flex';
            el.style.justifyContent = 'space-between';
            el.style.alignItems = 'center';
            el.style.padding = '1rem 1.5rem';

            el.innerHTML = `
                <div>
                    <span class="badge diff-bg-${prob.difficulty.toLowerCase()} diff-${prob.difficulty.toLowerCase()}" style="margin-right:0.5rem">${prob.difficulty}</span>
                    <strong style="cursor:pointer;" onclick="viewProblem('${prob.id}')">${prob.title}</strong>
                </div>
                <div style="color: var(--text-muted); font-size: 0.85rem;">
                    ${prob.topic}
                </div>
            `;
            recentList.appendChild(el);
        });

        // Expose view method globally
        window.viewProblem = (id) => {
            currentProblemIdView = id;
            renderProblemDetail(id);
            navigateTo('problem-detail');
        };
    }

    // --- Tracker ---
    const trackerFilterDiff = document.getElementById('filter-difficulty');
    const trackerFilterRev = document.getElementById('filter-revision');

    trackerFilterDiff.addEventListener('change', renderTracker);
    trackerFilterRev.addEventListener('change', renderTracker);

    function renderTracker() {
        const tbody = document.getElementById('tracker-body');
        tbody.innerHTML = '';
        
        let problems = StorageManager.getProblems();

        // Apply filters
        const diffVal = trackerFilterDiff.value;
        const revVal = trackerFilterRev.value;

        if (diffVal) problems = problems.filter(p => p.difficulty === diffVal);
        if (revVal) problems = problems.filter(p => p.needsRevision.toString() === revVal);

        // Sort descending
        problems.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));

        if (problems.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="empty-state">No problems found.</td></tr>`;
            return;
        }

        problems.forEach(prob => {
            const tr = document.createElement('tr');
            
            const revBadge = prob.needsRevision 
                ? '<span class="badge warning">Needs Revision</span>' 
                : '<span class="badge success">Mastered</span>';

            tr.innerHTML = `
                <td style="font-weight: 500;">${prob.title}</td>
                <td><span class="diff-${prob.difficulty.toLowerCase()}">${prob.difficulty}</span></td>
                <td><span class="badge outline">${prob.topic}</span></td>
                <td>${prob.mistakeType}</td>
                <td>${revBadge}</td>
                <td>${prob.date}</td>
                <td class="action-btns">
                    <button onclick="viewProblem('${prob.id}')" title="View"><i class="ph ph-eye"></i></button>
                    <button class="delete-btn" onclick="deleteProblem('${prob.id}')" title="Delete"><i class="ph ph-trash"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        window.deleteProblem = (id) => {
            if(confirm('Are you sure you want to delete this problem?')) {
                StorageManager.deleteProblem(id);
                showToast('Problem deleted.');
                renderTracker();
                renderDashboard();
            }
        };
    }

    // --- Problem Detail ---
    const btnBack = document.getElementById('back-to-tracker');
    btnBack.addEventListener('click', () => navigateTo('tracker'));

    document.getElementById('btn-toggle-mastered').addEventListener('click', () => {
        if (!currentProblemIdView) return;
        const problems = StorageManager.getProblems();
        const prob = problems.find(p => p.id === currentProblemIdView);
        if (prob) {
            const newState = !prob.needsRevision;
            StorageManager.updateProblem(currentProblemIdView, { needsRevision: newState });
            renderProblemDetail(currentProblemIdView);
            showToast(newState ? 'Added back to Revision.' : 'Marked as Mastered!');
        }
    });

    document.getElementById('btn-delete-problem').addEventListener('click', () => {
        if (!currentProblemIdView) return;
        if(confirm('Delete this entry?')) {
            StorageManager.deleteProblem(currentProblemIdView);
            showToast('Deleted');
            navigateTo('tracker');
        }
    });

    function renderProblemDetail(id) {
        const prob = StorageManager.getProblems().find(p => p.id === id);
        if (!prob) return;

        document.getElementById('detail-title').textContent = prob.title;
        document.getElementById('detail-link').href = prob.link;
        
        const diffEl = document.getElementById('detail-difficulty');
        diffEl.textContent = prob.difficulty;
        diffEl.className = `badge diff-bg-${prob.difficulty.toLowerCase()} diff-${prob.difficulty.toLowerCase()}`;
        
        document.getElementById('detail-topic').textContent = prob.topic;
        document.getElementById('detail-mistake').textContent = prob.mistakeType;

        document.getElementById('detail-wrong-notes').textContent = prob.whatWentWrong;
        document.getElementById('detail-correct-notes').textContent = prob.correctApproach;

        document.getElementById('detail-date').textContent = prob.date;
        document.getElementById('detail-time').textContent = `${prob.timeTaken} mins`;
        document.getElementById('detail-confidence').textContent = `${prob.confidence} / 5 Confidence`;

        const masterBtn = document.getElementById('btn-toggle-mastered');
        if (prob.needsRevision) {
            masterBtn.textContent = 'Mark as Mastered';
            masterBtn.className = 'btn primary full-width';
        } else {
            masterBtn.textContent = 'Need to Revise Again';
            masterBtn.className = 'btn warning full-width';
        }
    }

    // --- Revision Mode ---
    const revEmpty = document.getElementById('revision-empty');
    const revList = document.getElementById('revision-list');

    function renderRevisionMode() {
        const toRevise = StorageManager.getProblems().filter(p => p.needsRevision);
        
        if (toRevise.length === 0) {
            revEmpty.classList.remove('hidden');
            revList.classList.add('hidden');
            return;
        }

        revEmpty.classList.add('hidden');
        revList.classList.remove('hidden');

        // Show all problems, starting from newest to older
        toRevise.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));

        revList.innerHTML = '';

        toRevise.forEach(revProblem => {
            const card = document.createElement('div');
            card.className = 'card flashcard';
            
            card.innerHTML = `
                <div class="flashcard-front">
                    <div class="flashcard-header">
                        <span class="badge diff-bg-${revProblem.difficulty.toLowerCase()} diff-${revProblem.difficulty.toLowerCase()}">${revProblem.difficulty}</span>
                        <span class="badge outline">${revProblem.topic}</span>
                    </div>
                    <h2>${revProblem.title}</h2>
                    <a href="${revProblem.link}" target="_blank" class="btn sm outline">Open in LeetCode</a>
                    
                    <div class="rev-mistake-hint">
                        <strong>Your Mistake:</strong> <span>${revProblem.mistakeType}</span>
                    </div>
                    
                    <button class="btn primary full-width mt-4 rev-reveal-btn">Reveal Solution</button>
                </div>
                
                <div class="flashcard-back hidden">
                    <div class="rev-section">
                        <h3>What you did wrong</h3>
                        <p>${revProblem.whatWentWrong}</p>
                    </div>
                    <div class="rev-section">
                        <h3>Correct Approach</h3>
                        <p>${revProblem.correctApproach}</p>
                    </div>
                    
                    <div class="rev-actions">
                        <button class="btn warning rev-confused-btn">Still Confused</button>
                        <button class="btn success rev-remember-btn">I Remember Now!</button>
                    </div>
                </div>
            `;

            // Setup events per card
            const revFront = card.querySelector('.flashcard-front');
            const revBack = card.querySelector('.flashcard-back');
            const revRevealBtn = card.querySelector('.rev-reveal-btn');
            const revConfusedBtn = card.querySelector('.rev-confused-btn');
            const revRememberBtn = card.querySelector('.rev-remember-btn');

            revRevealBtn.addEventListener('click', () => {
                revFront.classList.add('hidden');
                revBack.classList.remove('hidden');
            });

            revConfusedBtn.addEventListener('click', () => {
                showToast('Kept in revision list.');
                // Flip back to front or let it stay open?
                // Let's hide back and show front so they can re-read if they want later.
                revFront.classList.remove('hidden');
                revBack.classList.add('hidden');
            });

            revRememberBtn.addEventListener('click', () => {
                StorageManager.updateProblem(revProblem.id, { needsRevision: false });
                showToast('Marked as mastered!');
                renderRevisionMode();
            });

            revList.appendChild(card);
        });
    }
});

