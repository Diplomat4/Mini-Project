const stages = ['Manuscript', 'Prepress', 'Printing', 'Binding', 'Dispatch'];

let jobs = [
    {
        id: 'JOB-2026-001',
        client: 'Oxford Press',
        title: 'Advanced Calculus',
        type: 'Academic',
        quantity: 2000,
        stage: 2,
        priority: 'Normal',
        createdAt: Date.now() - 1000 * 60 * 30,
        timestamp: new Date().toLocaleTimeString()
    },
    {
        id: 'JOB-2026-002',
        client: 'Penguin Random House',
        title: 'Le Comte de Monte Cristo',
        type: 'Trade',
        quantity: 15000,
        stage: 1,
        priority: 'Urgent',
        createdAt: Date.now() - 1000 * 60 * 10,
        timestamp: new Date().toLocaleTimeString()
    }
];

const form = document.getElementById('jobForm');
const tableBody = document.querySelector('#jobsTable tbody');
const totalJobsEl = document.getElementById('totalJobs');
const prepressEl = document.getElementById('prepressCount');
const printEl = document.getElementById('printCount');
const dispatchEl = document.getElementById('dispatchCount');

const toastContainer = document.getElementById('toastContainer');
const modalOverlay = document.getElementById('appModal');
const modalTitleEl = document.getElementById('modalTitle');
const modalBodyEl = document.getElementById('modalBody');
const modalCloseBtn = document.getElementById('modalCloseBtn');
const modalCancelBtn = document.getElementById('modalCancelBtn');
const modalConfirmBtn = document.getElementById('modalConfirmBtn');

function showToast(title, message, variant = 'success', timeoutMs = 2800) {
    if (!toastContainer) return;
    const el = document.createElement('div');
    el.className = `toast toast-${variant}`;
    el.innerHTML = `
        <div class="toast-title">${String(title)}</div>
        <div class="toast-body">${String(message)}</div>
    `;
    toastContainer.appendChild(el);
    setTimeout(() => el.remove(), timeoutMs);
}

function confirmDialog({ title = 'Confirm', message = 'Are you sure?', confirmText = 'Confirm' } = {}) {
    return new Promise((resolve) => {
        if (!modalOverlay || !modalTitleEl || !modalBodyEl || !modalConfirmBtn || !modalCancelBtn || !modalCloseBtn) {
            resolve(window.confirm(message));
            return;
        }

        let settled = false;

        function close(result) {
            if (settled) return;
            settled = true;
            modalOverlay.classList.remove('is-open');
            modalOverlay.setAttribute('aria-hidden', 'true');
            cleanup();
            resolve(result);
        }

        function onKeydown(e) {
            if (e.key === 'Escape') close(false);
        }

        function onBackdrop(e) {
            if (e.target === modalOverlay) close(false);
        }

        function cleanup() {
            document.removeEventListener('keydown', onKeydown);
            modalOverlay.removeEventListener('click', onBackdrop);
            modalCloseBtn.removeEventListener('click', onCancel);
            modalCancelBtn.removeEventListener('click', onCancel);
            modalConfirmBtn.removeEventListener('click', onConfirm);
        }

        function onCancel() { close(false); }
        function onConfirm() { close(true); }

        modalTitleEl.textContent = title;
        modalBodyEl.textContent = message;
        modalConfirmBtn.textContent = confirmText;

        modalOverlay.classList.add('is-open');
        modalOverlay.setAttribute('aria-hidden', 'false');

        document.addEventListener('keydown', onKeydown);
        modalOverlay.addEventListener('click', onBackdrop);
        modalCloseBtn.addEventListener('click', onCancel);
        modalCancelBtn.addEventListener('click', onCancel);
        modalConfirmBtn.addEventListener('click', onConfirm);

        modalConfirmBtn.focus();
    });
}

function generateId() {
    return 'JOB-' + Math.floor(Math.random() * 10000).toString().padStart(4, '0');
}

function getJobFilters() {
    const search = (document.getElementById('jobSearch')?.value || '').trim().toLowerCase();
    const type = document.getElementById('jobTypeFilter')?.value || 'All';
    const stageName = document.getElementById('jobStageFilter')?.value || 'All';
    const sort = document.getElementById('jobSort')?.value || 'Newest';
    return { search, type, stageName, sort };
}

function renderDashboard() {
    totalJobsEl.textContent = jobs.length;
    prepressEl.textContent = jobs.filter(j => j.stage === 1).length;
    printEl.textContent = jobs.filter(j => j.stage === 2).length;
    dispatchEl.textContent = jobs.filter(j => j.stage === 4).length;

    tableBody.innerHTML = '';

    const { search, type, stageName, sort } = getJobFilters();
    const stageIdx = stageName === 'All' ? null : stages.indexOf(stageName);

    let visibleJobs = [...jobs];
    if (type !== 'All') visibleJobs = visibleJobs.filter(j => j.type === type);
    if (stageIdx !== null && stageIdx >= 0) visibleJobs = visibleJobs.filter(j => j.stage === stageIdx);
    if (search) {
        visibleJobs = visibleJobs.filter(j => {
            const hay = `${j.id} ${j.client} ${j.title}`.toLowerCase();
            return hay.includes(search);
        });
    }

    visibleJobs.sort((a, b) => {
        const av = a.createdAt || 0;
        const bv = b.createdAt || 0;
        return sort === 'Oldest' ? (av - bv) : (bv - av);
    });

    if (visibleJobs.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-sub);">No active jobs in the MIS. Add one to start.</td></tr>`;
        return;
    }

    visibleJobs.forEach((job) => {
        const index = jobs.findIndex(j => j.id === job.id);
        const tr = document.createElement('tr');

        let badgeClass = 'badge-default';

        if (job.type === 'Academic') {
            badgeClass = 'badge-academic';
        } else if (job.type === 'Trade') {
            badgeClass = 'badge-trade';
        } else if (job.type === 'Promotional') {
            badgeClass = 'badge-promo';
        }

        const priorityBadge = job.priority === 'Urgent'
            ? `<span class="badge" style="background:#fee2e2; color:#991b1b; margin-left:8px;">Urgent</span>`
            : `<span class="badge" style="background:#e2e8f0; color:#334155; margin-left:8px;">Normal</span>`;

        let workflowHTML = `<div class="workflow-steps"><div class="workflow-bar"></div>`;

        stages.forEach((step, sIndex) => {
            let statusClass = '';
            let icon = '';

            if (sIndex < job.stage) {
                statusClass = 'completed';
                icon = '✓';
            } else if (sIndex === job.stage) {
                statusClass = 'active';
                icon = sIndex + 1;
            } else {
                icon = sIndex + 1;
            }

            workflowHTML += `
                <div class="step ${statusClass}">
                    <div class="step-dot">${icon}</div>
                    <div class="step-label" style="display: ${sIndex === job.stage ? 'block' : 'none'}">${step}</div>
                </div>
            `;
        });
        workflowHTML += `</div>`;

        tr.innerHTML = `
            <td><strong>${job.id}</strong></td>
            <td>
                <div style="font-weight:600">${job.title}${priorityBadge}</div>
                <div style="font-size:0.8rem; color:var(--text-sub)">${job.client} • ${job.quantity} units</div>
            </td>
            <td><span class="badge ${badgeClass}">${job.type}</span></td>
            <td style="font-weight: 500; color: var(--primary);">${stages[job.stage]}</td>
            <td style="width: 250px;">${workflowHTML}</td>
            <td>
                <button class="action-btn btn-advance" onclick="advanceStage(${index})" ${job.stage === 4 ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}>
                    Next &rarr;
                </button>
                <button class="action-btn btn-delete" onclick="deleteJob(${index})">
                    &times;
                </button>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

form.addEventListener('submit', (e) => {
    e.preventDefault();

    const newJob = {
        id: generateId(),
        client: document.getElementById('clientName').value,
        title: document.getElementById('jobTitle').value,
        type: document.getElementById('jobType').value,
        quantity: document.getElementById('quantity').value,
        priority: document.getElementById('priority').value || 'Normal',
        stage: 0,
        createdAt: Date.now(),
        timestamp: new Date().toLocaleTimeString()
    };

    jobs.unshift(newJob);
    renderDashboard();
    form.reset();
    showToast('Ticket created', `${newJob.id} • ${newJob.client}`, 'success');
});

window.advanceStage = function(index) {
    if (jobs[index].stage < 4) {
        jobs[index].stage++;
        renderDashboard();
        showToast('Stage updated', `${jobs[index].id} → ${stages[jobs[index].stage]}`, 'success');
    }
};

window.deleteJob = function(index) {
    confirmDialog({
        title: 'Cancel job?',
        message: `This will remove ${jobs[index].id} from the dashboard.`,
        confirmText: 'Cancel job'
    }).then((ok) => {
        if (!ok) return;
        const removed = jobs.splice(index, 1)[0];
        renderDashboard();
        showToast('Job cancelled', removed ? removed.id : 'Job removed', 'warning');
    });
};

function safeJsonParse(raw, fallback) {
    try {
        return JSON.parse(raw);
    } catch (e) {
        return fallback;
    }
}

function initManuscriptWorkspace() {
    const statusEl = document.getElementById('msStatus');
    const roleEl = document.getElementById('msRole');
    const stageEl = document.getElementById('msStage');
    const fileEl = document.getElementById('msFile');
    const dropzoneEl = document.getElementById('msDropzone');
    const selectedFileEl = document.getElementById('msSelectedFile');
    const noteEl = document.getElementById('msNote');
    const saveBtn = document.getElementById('msSaveBtn');
    const clearBtn = document.getElementById('msClearBtn');
    const msTableBody = document.querySelector('#msTable tbody');

    if (!roleEl || !stageEl || !fileEl || !dropzoneEl || !selectedFileEl || !noteEl || !saveBtn || !clearBtn || !msTableBody) {
        if (statusEl) statusEl.textContent = 'Status: not initialized (missing elements)';
        return;
    }

    const STORAGE_KEY = 'maks_manuscript_versions_v1';
    const TEST_KEY = '__maks_ls_test__';
    let storage = null;
    let canPersist = true;

    try {
        storage = window.localStorage;
        storage.setItem(TEST_KEY, '1');
        storage.removeItem(TEST_KEY);
    } catch (e) {
        canPersist = false;
        storage = null;
    }

    let versions = [];
    if (canPersist && storage) {
        versions = safeJsonParse(storage.getItem(STORAGE_KEY), []);
    }

    function persist() {
        if (!canPersist || !storage) return;
        storage.setItem(STORAGE_KEY, JSON.stringify(versions));
    }

    function fmtBytes(bytes) {
        if (!Number.isFinite(bytes)) return '';
        const units = ['B', 'KB', 'MB', 'GB'];
        let v = bytes;
        let u = 0;
        while (v >= 1024 && u < units.length - 1) {
            v /= 1024;
            u++;
        }
        return `${v.toFixed(v >= 10 || u === 0 ? 0 : 1)} ${units[u]}`;
    }

    function escapeHtml(s) {
        return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function msStatusBadge(status) {
        const s = String(status || 'Draft');
        if (s === 'Approved') return `<span class="badge" style="background:#dcfce7; color:#166534;">Approved</span>`;
        if (s === 'Proof Sent') return `<span class="badge" style="background:#fef9c3; color:#854d0e;">Proof Sent</span>`;
        return `<span class="badge" style="background:#e0e7ff; color:#3730a3;">Draft</span>`;
    }

    function render() {
        msTableBody.innerHTML = '';

        if (!versions.length) {
            msTableBody.innerHTML =
                `<tr><td colspan="7" style="text-align:center; padding: 1.25rem; color: var(--text-sub);">
                    No manuscript versions yet. Upload one to start the workflow.
                </td></tr>`;
            return;
        }

        versions.forEach((v, idx) => {
            const tr = document.createElement('tr');
            const fileLabel = v.fileName ? `${escapeHtml(v.fileName)} (${fmtBytes(v.fileSize)})` : '(no file)';

            tr.innerHTML = `
                <td><strong>v${versions.length - idx}</strong></td>
                <td>${fileLabel}</td>
                <td><span class="badge badge-default">${escapeHtml(v.role)}</span></td>
                <td>${msStatusBadge(v.status)}</td>
                <td style="max-width: 380px;">
                    <div style="color: var(--text-sub); font-size: 0.85rem; line-height: 1.35;">
                        ${v.note ? escapeHtml(v.note) : '<em style="color: var(--text-sub);">—</em>'}
                    </div>
                </td>
                <td style="white-space:nowrap;">${escapeHtml(v.time)}</td>
                <td>
                    ${v.status !== 'Approved' ? `<button class="action-btn btn-advance" data-ms-approve="${escapeHtml(v.id)}">Approve</button>` : ''}
                    <button class="action-btn btn-delete" data-ms-delete="${escapeHtml(v.id)}" aria-label="Delete version">×</button>
                </td>
            `;

            msTableBody.appendChild(tr);
        });
    }

    function addVersion() {
        const file = fileEl.files && fileEl.files[0];
        if (!file) {
            showToast('No file selected', 'Choose a file first, then upload as new version.', 'warning');
            return;
        }

        const entry = {
            id: `MS-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            role: roleEl.value || 'Author',
            status: stageEl.value || 'Draft',
            note: (noteEl.value || '').trim(),
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type || '',
            time: new Date().toLocaleString()
        };

        versions.unshift(entry);
        persist();
        render();

        fileEl.value = '';
        noteEl.value = '';
        selectedFileEl.textContent = 'No file selected';
        showToast('Version saved', `${entry.fileName} • ${entry.status}`, 'success');
    }

    function clearAll() {
        confirmDialog({
            title: 'Clear manuscript history?',
            message: 'This removes the manuscript version list stored in this browser.',
            confirmText: 'Clear history'
        }).then((ok) => {
            if (!ok) return;
            versions = [];
            persist();
            render();
            showToast('History cleared', 'Manuscript versions removed.', 'warning');
        });
    }

    function setSelectedFileLabel() {
        const file = fileEl.files && fileEl.files[0];
        selectedFileEl.textContent = file ? `${file.name} (${fmtBytes(file.size)})` : 'No file selected';
    }

    function wireDropzone() {
        function openPicker() { fileEl.click(); }
        dropzoneEl.addEventListener('click', openPicker);
        dropzoneEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openPicker();
            }
        });

        fileEl.addEventListener('change', setSelectedFileLabel);

        dropzoneEl.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropzoneEl.classList.add('is-dragover');
        });
        dropzoneEl.addEventListener('dragleave', () => {
            dropzoneEl.classList.remove('is-dragover');
        });
        dropzoneEl.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzoneEl.classList.remove('is-dragover');
            const files = e.dataTransfer && e.dataTransfer.files;
            if (files && files.length) {
                fileEl.files = files;
                setSelectedFileLabel();
            }
        });
    }

    saveBtn.addEventListener('click', addVersion);
    clearBtn.addEventListener('click', clearAll);

    msTableBody.addEventListener('click', (e) => {
        const delBtn = e.target && e.target.closest && e.target.closest('[data-ms-delete]');
        const approveBtn = e.target && e.target.closest && e.target.closest('[data-ms-approve]');

        if (approveBtn) {
            const id = approveBtn.getAttribute('data-ms-approve');
            versions = versions.map(v => v.id === id ? { ...v, status: 'Approved' } : v);
            persist();
            render();
            showToast('Approved', 'Marked version as approved.', 'success');
            return;
        }

        if (delBtn) {
            const id = delBtn.getAttribute('data-ms-delete');
            confirmDialog({
                title: 'Delete version?',
                message: 'This removes the version entry from this browser.',
                confirmText: 'Delete'
            }).then((ok) => {
                if (!ok) return;
                versions = versions.filter(v => v.id !== id);
                persist();
                render();
                showToast('Deleted', 'Version removed.', 'warning');
            });
        }
    });

    if (statusEl) {
        statusEl.textContent = canPersist ? 'Status: ready (saving to browser)' : 'Status: ready (session-only, storage blocked)';
    }

    wireDropzone();
    render();
}

function wireJobTableTools() {
    const ids = ['jobSearch', 'jobTypeFilter', 'jobStageFilter', 'jobSort'];
    ids.forEach((id) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener('input', renderDashboard);
        el.addEventListener('change', renderDashboard);
    });
}

renderDashboard();
initManuscriptWorkspace();
wireJobTableTools();