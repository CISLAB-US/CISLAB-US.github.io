/**
 * CISL Content Loader
 * Loads dynamic content from JSON data files for public pages
 */

const CISL = {
    dataPath: 'data',

    // Fetch JSON data
    async fetchData(filename) {
        try {
            const response = await fetch(`${this.dataPath}/${filename}`);
            if (!response.ok) throw new Error(`Failed to load ${filename}`);
            return await response.json();
        } catch (error) {
            console.error(`Error loading ${filename}:`, error);
            return null;
        }
    },

    // Load News & Updates (for about.html)
    async loadNews(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const news = await this.fetchData('news.json');
        if (!news) return;

        container.innerHTML = news.map(item => `
            <div class="news-ticker__item">
                <span class="news-ticker__date">${item.date}</span>
                <span class="news-ticker__text">${item.text}</span>
            </div>
        `).join('');
    },

    // Load People (for people.html)
    async loadPeople(leadsId, fellowsId, alumniId) {
        const data = await this.fetchData('people.json');
        if (!data) return;

        // Render Research Fellows
        const fellowsContainer = document.getElementById(fellowsId);
        if (fellowsContainer && data.fellows) {
            fellowsContainer.innerHTML = data.fellows.map(person => this.renderPersonCard(person, false)).join('');
        }

        // Render Alumni
        const alumniContainer = document.getElementById(alumniId);
        if (alumniContainer && data.alumni && data.alumni.length > 0) {
            alumniContainer.innerHTML = data.alumni.map(person => this.renderPersonCard(person, false)).join('');
            alumniContainer.parentElement.style.display = 'block';
        }
    },

    renderPersonCard(person, isLead) {
        const linkedinHTML = person.links?.linkedin
            ? `<a href="${person.links.linkedin}" target="_blank" rel="noopener" class="person__linkedin">LinkedIn</a>`
            : '';

        const roleHTML = person.role
            ? `<div class="person__role">${person.role}</div>`
            : '';

        return `
            <div class="person ${isLead ? 'person--lead' : 'person--fellow'} card-accent">
                <img src="${person.photo}" alt="${person.name}" class="person__photo">
                <div class="person__name">${person.name}</div>
                ${roleHTML}
                <div class="person__keywords">${person.keywords}</div>
                ${linkedinHTML}
            </div>
        `;
    },

    // Load Projects (for projects.html)
    async loadProjects(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const projects = await this.fetchData('projects.json');
        if (!projects) return;

        container.innerHTML = projects.map(project => `
            <article class="project-card card-accent fade-in">
                <div class="project-card__header">
                    <h3>${project.title}</h3>
                    <span class="project-card__status project-card__status--${project.status}">${project.status}</span>
                </div>
                <p>${project.description}</p>
                <div class="project-card__keywords">
                    ${project.keywords.map(k => `<span>${k}</span>`).join('')}
                </div>
            </article>
        `).join('');
    },

    // Load Research Interests (for research.html)
    async loadResearch(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const research = await this.fetchData('research.json');
        if (!research) return;

        container.innerHTML = research.map(area => `
            <article class="research-area fade-in">
                <h3>${area.title}</h3>
                <p class="research-area__subtitle">${area.subtitle}</p>
                <p>${area.description}</p>
                <div class="research-area__keywords">
                    ${area.keywords.map(k => `<span>${k}</span>`).join('')}
                </div>
            </article>
        `).join('');
    },

    // Load Opportunities (for opportunities.html)
    async loadOpportunities(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const opportunities = await this.fetchData('opportunities.json');
        if (!opportunities) return;

        container.innerHTML = opportunities.map(opp => `
            <div class="opportunity-card">
                <h3>${opp.title} <span class="status-badge status-badge--${opp.status}">${opp.status}</span></h3>
                <p>${opp.description}</p>
                
                ${opp.background ? `
                    <h4>Preferred Background</h4>
                    <p>${opp.background}</p>
                ` : ''}
                
                ${opp.commitment ? `
                    <h4>Time Commitment</h4>
                    <p>${opp.commitment}</p>
                ` : ''}
                
                ${opp.benefits && opp.benefits.length > 0 ? `
                    <h4>What You'll Gain</h4>
                    <ul>
                        ${opp.benefits.map(b => `<li>${b}</li>`).join('')}
                    </ul>
                ` : ''}
                
                ${opp.screeningQuestions && opp.screeningQuestions.length > 0 ? `
                    <div class="screening-questions">
                        <h4>Screening Questions</h4>
                        <ol>
                            ${opp.screeningQuestions.map(q => `<li>${q}</li>`).join('')}
                        </ol>
                    </div>
                ` : ''}
                
                ${opp.downloadFile ? `
                    <div style="margin-top: var(--space-xl);">
                        <a href="${opp.downloadFile}" download class="download-btn">Download Job Description</a>
                    </div>
                ` : ''}
            </div>
        `).join('');
    },

    // Load Research Interests Summary (for about.html)
    async loadResearchSummary(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        // For about page, we use a simplified version - this could be extended
        // to load from a separate summary file or use the full research.json
    }
};

// Auto-initialize based on page
document.addEventListener('DOMContentLoaded', () => {
    const page = window.location.pathname.split('/').pop() || 'index.html';

    switch (page) {
        case 'about.html':
        case 'index.html':
            CISL.loadNews('news-content');
            break;
        case 'people.html':
            CISL.loadPeople('leads-content', 'fellows-content', 'alumni-content');
            break;
        case 'projects.html':
            CISL.loadProjects('projects-content');
            break;
        case 'research.html':
            CISL.loadResearch('research-content');
            break;
        case 'opportunities.html':
            CISL.loadOpportunities('opportunities-content');
            break;
    }
});
