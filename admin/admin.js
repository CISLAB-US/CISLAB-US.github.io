/**
 * CISL Admin Panel - GitHub API Integration
 * Manages content via GitHub API by updating JSON files in the repository
 */

// Configuration
const CONFIG = {
    owner: 'CISLAB-US',
    repo: 'CISLAB-US.github.io',
    branch: 'main',
    dataPath: 'data'
};

// State
let githubToken = localStorage.getItem('cisl_github_token') || null;
let currentSection = 'news';
let currentData = {};
let editingItem = null;
let editingDataType = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initAuthModal();
    initEditModal();
    checkConnection();
});

// Navigation
function initNavigation() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const section = btn.dataset.section;
            switchSection(section);
        });
    });
}

function switchSection(section) {
    currentSection = section;

    // Update nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.section === section);
    });

    // Update content sections
    document.querySelectorAll('.content-section').forEach(sec => {
        sec.classList.toggle('active', sec.id === `section-${section}`);
    });

    // Load data for section
    loadSectionData(section);
}

// Auth Modal
function initAuthModal() {
    const modal = document.getElementById('auth-modal');
    const connectBtn = document.getElementById('connect-btn');
    const saveTokenBtn = document.getElementById('save-token-btn');
    const cancelBtn = document.getElementById('cancel-auth-btn');

    connectBtn.addEventListener('click', () => modal.classList.add('active'));
    cancelBtn.addEventListener('click', () => modal.classList.remove('active'));

    saveTokenBtn.addEventListener('click', async () => {
        const token = document.getElementById('github-token').value.trim();
        if (token) {
            githubToken = token;
            localStorage.setItem('cisl_github_token', token);
            modal.classList.remove('active');
            await checkConnection();
        }
    });
}

async function checkConnection() {
    const statusEl = document.getElementById('auth-status');
    const connectBtn = document.getElementById('connect-btn');

    if (!githubToken) {
        statusEl.textContent = 'Not connected';
        statusEl.classList.remove('connected');
        connectBtn.textContent = 'Connect GitHub';
        return;
    }

    try {
        const response = await fetch('https://api.github.com/user', {
            headers: { 'Authorization': `token ${githubToken}` }
        });

        if (response.ok) {
            const user = await response.json();
            statusEl.textContent = `Connected as ${user.login}`;
            statusEl.classList.add('connected');
            connectBtn.textContent = 'Reconnect';
            loadSectionData(currentSection);
        } else {
            throw new Error('Invalid token');
        }
    } catch (error) {
        statusEl.textContent = 'Connection failed';
        statusEl.classList.remove('connected');
        connectBtn.textContent = 'Connect GitHub';
        localStorage.removeItem('cisl_github_token');
        githubToken = null;
    }
}

// GitHub API Functions
async function fetchFileContent(filename) {
    const url = `https://api.github.com/repos/${CONFIG.owner}/${CONFIG.repo}/contents/${CONFIG.dataPath}/${filename}`;

    const response = await fetch(url, {
        headers: {
            'Authorization': `token ${githubToken}`,
            'Accept': 'application/vnd.github.v3+json'
        }
    });

    if (!response.ok) throw new Error(`Failed to fetch ${filename}`);

    const data = await response.json();
    // Properly decode base64 as UTF-8 (atob only handles Latin-1, causing corruption of Unicode chars like ·)
    const content = decodeURIComponent(escape(atob(data.content)));
    return { content: JSON.parse(content), sha: data.sha };
}

async function updateFileContent(filename, content, sha, message) {
    const url = `https://api.github.com/repos/${CONFIG.owner}/${CONFIG.repo}/contents/${CONFIG.dataPath}/${filename}`;

    const response = await fetch(url, {
        method: 'PUT',
        headers: {
            'Authorization': `token ${githubToken}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            message,
            content: btoa(unescape(encodeURIComponent(JSON.stringify(content, null, 2)))),
            sha,
            branch: CONFIG.branch
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update file');
    }

    return await response.json();
}

// Data Loading
async function loadSectionData(section) {
    if (!githubToken) return;

    try {
        switch (section) {
            case 'news':
                await loadNewsData();
                break;
            case 'people':
                await loadPeopleData();
                break;
            case 'projects':
                await loadProjectsData();
                break;
            case 'research':
                await loadResearchData();
                break;
            case 'opportunities':
                await loadOpportunitiesData();
                break;
        }
    } catch (error) {
        console.error(`Failed to load ${section}:`, error);
    }
}

async function loadNewsData() {
    const { content, sha } = await fetchFileContent('news.json');
    currentData.news = { items: content, sha };
    renderNewsList(content);
}

async function loadPeopleData() {
    const { content, sha } = await fetchFileContent('people.json');
    currentData.people = { items: content, sha };
    renderPeopleList(content);
}

async function loadProjectsData() {
    const { content, sha } = await fetchFileContent('projects.json');
    currentData.projects = { items: content, sha };
    renderProjectsList(content);
}

async function loadResearchData() {
    const { content, sha } = await fetchFileContent('research.json');
    currentData.research = { items: content, sha };
    renderResearchList(content);
}

async function loadOpportunitiesData() {
    const { content, sha } = await fetchFileContent('opportunities.json');
    currentData.opportunities = { items: content, sha };
    renderOpportunitiesList(content);
}

// Render Functions
function renderNewsList(items) {
    const container = document.getElementById('news-list');
    container.innerHTML = items.map(item => `
        <div class="item-card">
            <div class="item-card__content">
                <div class="item-card__title">${item.text}</div>
                <div class="item-card__subtitle">${item.date}</div>
            </div>
            <div class="item-card__actions">
                <button class="btn btn--secondary btn--small" onclick="editItem('news', '${item.id}')">Edit</button>
            </div>
        </div>
    `).join('');
}

function renderPeopleList(data) {
    document.getElementById('leads-list').innerHTML = renderPersonCards(data.leads, 'lead');
    document.getElementById('fellows-list').innerHTML = renderPersonCards(data.fellows, 'fellow');
    document.getElementById('alumni-list').innerHTML = renderPersonCards(data.alumni || [], 'alumni');
}

function renderPersonCards(people, type) {
    return people.map(person => `
        <div class="item-card">
            <div class="item-card__content">
                <div class="item-card__title">${person.name}</div>
                <div class="item-card__subtitle">${person.keywords}</div>
            </div>
            <div class="item-card__actions">
                <button class="btn btn--secondary btn--small" onclick="editItem('people', '${person.id}', '${type}')">Edit</button>
            </div>
        </div>
    `).join('');
}

function renderProjectsList(items) {
    const container = document.getElementById('projects-list');
    container.innerHTML = items.map(item => `
        <div class="item-card">
            <div class="item-card__content">
                <div class="item-card__title">${item.title} <span class="status-badge status-badge--${item.status}">${item.status}</span></div>
                <div class="item-card__subtitle">${item.description.substring(0, 100)}...</div>
            </div>
            <div class="item-card__actions">
                <button class="btn btn--secondary btn--small" onclick="editItem('projects', '${item.id}')">Edit</button>
            </div>
        </div>
    `).join('');
}

function renderResearchList(items) {
    const container = document.getElementById('research-list');
    container.innerHTML = items.map(item => `
        <div class="item-card">
            <div class="item-card__content">
                <div class="item-card__title">${item.title}</div>
                <div class="item-card__subtitle">${item.subtitle}</div>
            </div>
            <div class="item-card__actions">
                <button class="btn btn--secondary btn--small" onclick="editItem('research', '${item.id}')">Edit</button>
            </div>
        </div>
    `).join('');
}

function renderOpportunitiesList(items) {
    const container = document.getElementById('opportunities-list');
    container.innerHTML = items.map(item => `
        <div class="item-card">
            <div class="item-card__content">
                <div class="item-card__title">${item.title} <span class="status-badge status-badge--${item.status}">${item.status}</span></div>
                <div class="item-card__subtitle">${item.commitment}</div>
            </div>
            <div class="item-card__actions">
                <button class="btn btn--secondary btn--small" onclick="editItem('opportunities', '${item.id}')">Edit</button>
            </div>
        </div>
    `).join('');
}

// Edit Modal
function initEditModal() {
    const modal = document.getElementById('edit-modal');
    const saveBtn = document.getElementById('save-edit-btn');
    const deleteBtn = document.getElementById('delete-btn');
    const cancelBtn = document.getElementById('cancel-edit-btn');

    cancelBtn.addEventListener('click', () => {
        modal.classList.remove('active');
        editingItem = null;
        editingDataType = null;
    });

    saveBtn.addEventListener('click', saveEdit);
    deleteBtn.addEventListener('click', deleteItem);
}

function showAddForm(dataType) {
    editingItem = null;
    editingDataType = dataType;

    const modal = document.getElementById('edit-modal');
    const title = document.getElementById('edit-modal-title');
    const form = document.getElementById('edit-form');

    title.textContent = `Add ${dataType.charAt(0).toUpperCase() + dataType.slice(1)}`;
    form.innerHTML = getFormHTML(dataType, {});

    document.getElementById('delete-btn').style.display = 'none';
    modal.classList.add('active');
}

function editItem(dataType, itemId, subType) {
    editingDataType = dataType;

    let item;
    if (dataType === 'people') {
        const people = currentData.people.items;
        item = [...people.leads, ...people.fellows, ...(people.alumni || [])].find(p => p.id === itemId);
        item._subType = subType;
    } else {
        item = currentData[dataType].items.find(i => i.id === itemId);
    }

    if (!item) return;
    editingItem = item;

    const modal = document.getElementById('edit-modal');
    const title = document.getElementById('edit-modal-title');
    const form = document.getElementById('edit-form');

    title.textContent = `Edit ${dataType.charAt(0).toUpperCase() + dataType.slice(1)}`;
    form.innerHTML = getFormHTML(dataType, item);

    document.getElementById('delete-btn').style.display = 'inline-block';
    modal.classList.add('active');
}

function getFormHTML(dataType, item) {
    switch (dataType) {
        case 'news':
            return `
                <div class="form-group">
                    <label>Date</label>
                    <input type="text" id="edit-date" value="${item.date || ''}" placeholder="e.g., Jan 2026">
                </div>
                <div class="form-group">
                    <label>Text</label>
                    <textarea id="edit-text" placeholder="News content">${item.text || ''}</textarea>
                </div>
            `;
        case 'people':
            return `
                <div class="form-group">
                    <label>Name</label>
                    <input type="text" id="edit-name" value="${item.name || ''}">
                </div>
                <div class="form-group">
                    <label>Photo Path</label>
                    <input type="text" id="edit-photo" value="${item.photo || ''}" placeholder="assets/images/headshots/Name_Headshot.png">
                </div>
                <div class="form-group">
                    <label>Keywords (Institution · Project)</label>
                    <input type="text" id="edit-keywords" value="${item.keywords || ''}">
                </div>
                <div class="form-group">
                    <label>Type</label>
                    <select id="edit-subtype">
                        <option value="leads" ${item._subType === 'lead' ? 'selected' : ''}>Research Lead</option>
                        <option value="fellows" ${item._subType === 'fellow' ? 'selected' : ''}>Research Fellow</option>
                        <option value="alumni" ${item._subType === 'alumni' ? 'selected' : ''}>Alumni</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>LinkedIn URL (optional)</label>
                    <input type="text" id="edit-linkedin" value="${item.links?.linkedin || ''}">
                </div>
            `;
        case 'projects':
            return `
                <div class="form-group">
                    <label>Title</label>
                    <input type="text" id="edit-title" value="${item.title || ''}">
                </div>
                <div class="form-group">
                    <label>Status</label>
                    <select id="edit-status">
                        <option value="active" ${item.status === 'active' ? 'selected' : ''}>Active</option>
                        <option value="exploratory" ${item.status === 'exploratory' ? 'selected' : ''}>Exploratory</option>
                        <option value="completed" ${item.status === 'completed' ? 'selected' : ''}>Completed</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Description</label>
                    <textarea id="edit-description">${item.description || ''}</textarea>
                </div>
                <div class="form-group">
                    <label>Keywords (comma-separated)</label>
                    <input type="text" id="edit-keywords" value="${(item.keywords || []).join(', ')}">
                </div>
            `;
        case 'research':
            return `
                <div class="form-group">
                    <label>Title</label>
                    <input type="text" id="edit-title" value="${item.title || ''}">
                </div>
                <div class="form-group">
                    <label>Subtitle</label>
                    <input type="text" id="edit-subtitle" value="${item.subtitle || ''}">
                </div>
                <div class="form-group">
                    <label>Description</label>
                    <textarea id="edit-description">${item.description || ''}</textarea>
                </div>
                <div class="form-group">
                    <label>Keywords (comma-separated)</label>
                    <input type="text" id="edit-keywords" value="${(item.keywords || []).join(', ')}">
                </div>
            `;
        case 'opportunities':
            return `
                <div class="form-group">
                    <label>Title</label>
                    <input type="text" id="edit-title" value="${item.title || ''}">
                </div>
                <div class="form-group">
                    <label>Status</label>
                    <select id="edit-status">
                        <option value="open" ${item.status === 'open' ? 'selected' : ''}>Open</option>
                        <option value="closed" ${item.status === 'closed' ? 'selected' : ''}>Closed</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Description</label>
                    <textarea id="edit-description">${item.description || ''}</textarea>
                </div>
                <div class="form-group">
                    <label>Time Commitment</label>
                    <input type="text" id="edit-commitment" value="${item.commitment || ''}">
                </div>
            `;
        default:
            return '';
    }
}

async function saveEdit() {
    try {
        let updatedItems;
        const isNew = !editingItem;

        switch (editingDataType) {
            case 'news':
                updatedItems = saveNewsEdit(isNew);
                break;
            case 'people':
                updatedItems = savePeopleEdit(isNew);
                break;
            case 'projects':
                updatedItems = saveProjectsEdit(isNew);
                break;
            case 'research':
                updatedItems = saveResearchEdit(isNew);
                break;
            case 'opportunities':
                updatedItems = saveOpportunitiesEdit(isNew);
                break;
        }

        const filename = `${editingDataType}.json`;
        const message = isNew ? `Add new ${editingDataType} item` : `Update ${editingDataType} item`;

        await updateFileContent(
            filename,
            updatedItems,
            currentData[editingDataType].sha,
            message
        );

        document.getElementById('edit-modal').classList.remove('active');
        editingItem = null;
        editingDataType = null;

        // Reload data
        await loadSectionData(currentSection);

    } catch (error) {
        alert('Failed to save: ' + error.message);
    }
}

function saveNewsEdit(isNew) {
    const date = document.getElementById('edit-date').value;
    const text = document.getElementById('edit-text').value;

    let items = [...currentData.news.items];

    if (isNew) {
        items.unshift({
            id: `news-${Date.now()}`,
            date,
            text
        });
    } else {
        const index = items.findIndex(i => i.id === editingItem.id);
        items[index] = { ...items[index], date, text };
    }

    return items;
}

function savePeopleEdit(isNew) {
    const name = document.getElementById('edit-name').value;
    const photo = document.getElementById('edit-photo').value;
    const keywords = document.getElementById('edit-keywords').value;
    const subType = document.getElementById('edit-subtype').value;
    const linkedin = document.getElementById('edit-linkedin').value;

    let data = { ...currentData.people.items };

    const newPerson = {
        id: isNew ? `person-${Date.now()}` : editingItem.id,
        name,
        photo,
        keywords,
        ...(linkedin && { links: { linkedin } })
    };

    if (isNew) {
        data[subType].push(newPerson);
    } else {
        // Remove from old category
        const oldType = editingItem._subType + 's';
        data[oldType] = data[oldType].filter(p => p.id !== editingItem.id);
        // Add to new category
        data[subType].push(newPerson);
    }

    return data;
}

function saveProjectsEdit(isNew) {
    const title = document.getElementById('edit-title').value;
    const status = document.getElementById('edit-status').value;
    const description = document.getElementById('edit-description').value;
    const keywords = document.getElementById('edit-keywords').value.split(',').map(k => k.trim()).filter(k => k);

    let items = [...currentData.projects.items];

    if (isNew) {
        items.push({
            id: `project-${Date.now()}`,
            title,
            status,
            description,
            keywords
        });
    } else {
        const index = items.findIndex(i => i.id === editingItem.id);
        items[index] = { ...items[index], title, status, description, keywords };
    }

    return items;
}

function saveResearchEdit(isNew) {
    const title = document.getElementById('edit-title').value;
    const subtitle = document.getElementById('edit-subtitle').value;
    const description = document.getElementById('edit-description').value;
    const keywords = document.getElementById('edit-keywords').value.split(',').map(k => k.trim()).filter(k => k);

    let items = [...currentData.research.items];

    if (isNew) {
        items.push({
            id: `research-${Date.now()}`,
            title,
            subtitle,
            description,
            keywords
        });
    } else {
        const index = items.findIndex(i => i.id === editingItem.id);
        items[index] = { ...items[index], title, subtitle, description, keywords };
    }

    return items;
}

function saveOpportunitiesEdit(isNew) {
    const title = document.getElementById('edit-title').value;
    const status = document.getElementById('edit-status').value;
    const description = document.getElementById('edit-description').value;
    const commitment = document.getElementById('edit-commitment').value;

    let items = [...currentData.opportunities.items];

    if (isNew) {
        items.push({
            id: `opp-${Date.now()}`,
            title,
            status,
            description,
            commitment,
            background: '',
            benefits: [],
            screeningQuestions: [],
            downloadFile: ''
        });
    } else {
        const index = items.findIndex(i => i.id === editingItem.id);
        items[index] = { ...items[index], title, status, description, commitment };
    }

    return items;
}

async function deleteItem() {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
        let updatedItems;

        if (editingDataType === 'people') {
            let data = { ...currentData.people.items };
            const subType = editingItem._subType + 's';
            data[subType] = data[subType].filter(p => p.id !== editingItem.id);
            updatedItems = data;
        } else {
            updatedItems = currentData[editingDataType].items.filter(i => i.id !== editingItem.id);
        }

        await updateFileContent(
            `${editingDataType}.json`,
            updatedItems,
            currentData[editingDataType].sha,
            `Delete ${editingDataType} item`
        );

        document.getElementById('edit-modal').classList.remove('active');
        editingItem = null;
        editingDataType = null;

        await loadSectionData(currentSection);

    } catch (error) {
        alert('Failed to delete: ' + error.message);
    }
}
