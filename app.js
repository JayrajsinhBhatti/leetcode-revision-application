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

    // --- Title Extraction ---
    extractBtn.addEventListener('click', () => {
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
                // Convert typical slug 'two-sum' to 'Two Sum'
                const formattedTitle = slug.split('-').map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ');
                
                titleInput.value = formattedTitle;
                showToast('Title extracted successfully');
            } else {
                showToast('Could not extract title from URL', 'error');
            }
        } catch (e) {
            showToast('Invalid URL', 'error');
        }
    });

    // --- Add Problem ---
    addForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const problem = {
            link: document.getElementById('problem-link').value,
            title: document.getElementById('problem-title').value,
            difficulty: document.getElementById('problem-difficulty').value,
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
    const revCard = document.getElementById('revision-card');
    const revFront = revCard.querySelector('.flashcard-front');
    const revBack = revCard.querySelector('.flashcard-back');
    const revRevealBtn = document.getElementById('rev-reveal-btn');
    const revConfusedBtn = document.getElementById('rev-confused-btn');
    const revRememberBtn = document.getElementById('rev-remember-btn');

    revRevealBtn.addEventListener('click', () => {
        revFront.classList.add('hidden');
        revBack.classList.remove('hidden');
    });

    revConfusedBtn.addEventListener('click', () => {
        showToast('Kept in revision list.');
        renderRevisionMode();
    });

    revRememberBtn.addEventListener('click', () => {
        if (revProblem) {
            StorageManager.updateProblem(revProblem.id, { needsRevision: false });
            showToast('Marked as mastered!');
            renderRevisionMode();
        }
    });

    function renderRevisionMode() {
        revFront.classList.remove('hidden');
        revBack.classList.add('hidden');

        const toRevise = StorageManager.getProblems().filter(p => p.needsRevision);
        
        if (toRevise.length === 0) {
            revEmpty.classList.remove('hidden');
            revCard.classList.add('hidden');
            return;
        }

        revEmpty.classList.add('hidden');
        revCard.classList.remove('hidden');

        // Pick random
        const randomIndex = Math.floor(Math.random() * toRevise.length);
        revProblem = toRevise[randomIndex];

        document.getElementById('rev-difficulty').textContent = revProblem.difficulty;
        document.getElementById('rev-difficulty').className = `badge diff-bg-${revProblem.difficulty.toLowerCase()} diff-${revProblem.difficulty.toLowerCase()}`;
        document.getElementById('rev-topic').textContent = revProblem.topic;
        document.getElementById('rev-title').textContent = revProblem.title;
        document.getElementById('rev-link').href = revProblem.link;
        document.getElementById('rev-mistake-type').textContent = revProblem.mistakeType;

        document.getElementById('rev-wrong').textContent = revProblem.whatWentWrong;
        document.getElementById('rev-correct').textContent = revProblem.correctApproach;
    }
});
