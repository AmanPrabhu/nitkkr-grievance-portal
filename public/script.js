/**
 * NATIONAL INSTITUTE OF TECHNOLOGY KURUKSHETRA
 * Central Student Grievance Redressal Portal - Client Scripts
 */

document.addEventListener('DOMContentLoaded', () => {
    initTicketId();
    setupTabNavigation();
    setupAnonymityToggle();
    setupResidenceToggle();
    setupCharacterCounter();
    setupFormSubmission();
    setupTrackingFeature();
    fetchStats();
});

// Generate official NIT KKR ticket ID
function generateTicketId() {
    const year = new Date().getFullYear();
    const random = Math.floor(10000 + Math.random() * 90000);
    return `NITKKR-GRV-${year}-${random}`;
}

function initTicketId() {
    const ticketId = generateTicketId();
    const displayEl = document.getElementById('ticketIdDisplay');
    const inputEl = document.getElementById('grievanceId');
    if (displayEl) displayEl.textContent = ticketId;
    if (inputEl) inputEl.value = ticketId;
}

// ================= TABS NAVIGATION =================
function setupTabNavigation() {
    const tabs = document.querySelectorAll('.nav-tab');
    const panels = document.querySelectorAll('.tab-panel');

    function activateTab(tabId) {
        tabs.forEach(t => {
            if (t.getAttribute('data-tab') === tabId) {
                t.classList.add('active');
            } else {
                t.classList.remove('active');
            }
        });

        panels.forEach(p => {
            if (p.id === tabId) {
                p.classList.remove('hidden');
            } else {
                p.classList.add('hidden');
            }
        });

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetId = tab.getAttribute('data-tab');
            activateTab(targetId);
        });
    });

    // Links triggering tabs (e.g. from footer)
    document.querySelectorAll('.footer-tab-trigger').forEach(trigger => {
        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            activateTab('tab-guidelines');
        });
    });
}

// ================= ANONYMITY SWITCH =================
function setupAnonymityToggle() {
    const anonToggle = document.getElementById('anonToggle');
    const studentName = document.getElementById('studentName');
    const rollNumber = document.getElementById('rollNumber');
    const email = document.getElementById('email');
    const phone = document.getElementById('phone');
    const anonStatusBadge = document.getElementById('anonStatusBadge');

    if (!anonToggle) return;

    anonToggle.addEventListener('change', () => {
        const isAnon = anonToggle.checked;

        if (isAnon) {
            studentName.value = '';
            rollNumber.value = '';
            email.value = '';
            phone.value = '';

            studentName.disabled = true;
            rollNumber.disabled = true;
            email.disabled = true;
            phone.disabled = true;

            studentName.placeholder = 'Identity Protected (Confidential)';
            rollNumber.placeholder = 'Identity Protected';
            email.placeholder = 'Optional for anonymous submission';

            anonStatusBadge.textContent = 'Anonymous Mode Active';
            anonStatusBadge.className = 'section-badge anon-active-badge';

            // Clear errors
            document.getElementById('nameError').textContent = '';
            document.getElementById('rollError').textContent = '';
            document.getElementById('emailError').textContent = '';
        } else {
            studentName.disabled = false;
            rollNumber.disabled = false;
            email.disabled = false;
            phone.disabled = false;

            studentName.placeholder = 'e.g. Aarav Sharma';
            rollNumber.placeholder = 'e.g. 12213045, 12410012, or Ph.D. ID';
            email.placeholder = 'e.g. 12213045@nitkkr.ac.in or personal email';

            anonStatusBadge.textContent = 'Official Details';
            anonStatusBadge.className = 'section-badge optional-badge';
        }
    });
}

// ================= RESIDENCE SELECTION =================
function setupResidenceToggle() {
    const residenceType = document.getElementById('residenceType');
    const hostelGroup = document.getElementById('hostelSelectGroup');
    const roomNoGroup = document.getElementById('roomNoGroup');
    const hostelName = document.getElementById('hostelName');

    if (!residenceType) return;

    residenceType.addEventListener('change', () => {
        if (residenceType.value === 'Day Scholar') {
            if (hostelGroup) hostelGroup.style.display = 'none';
            if (roomNoGroup) roomNoGroup.style.display = 'none';
            if (hostelName) hostelName.required = false;
        } else {
            if (hostelGroup) hostelGroup.style.display = 'flex';
            if (roomNoGroup) roomNoGroup.style.display = 'flex';
            if (hostelName) hostelName.required = true;
        }
    });
}

// ================= CHARACTER COUNTER =================
function setupCharacterCounter() {
    const descTextarea = document.getElementById('description');
    const charCounter = document.getElementById('charCounter');
    const MAX_CHARS = 2000;

    if (!descTextarea || !charCounter) return;

    descTextarea.addEventListener('input', () => {
        const length = descTextarea.value.length;
        charCounter.textContent = `${length} / ${MAX_CHARS} characters`;
        if (length > MAX_CHARS) {
            charCounter.style.color = '#b91c1c';
            descTextarea.value = descTextarea.value.substring(0, MAX_CHARS);
        } else {
            charCounter.style.color = '#64748b';
        }
    });
}

// ================= FORM SUBMISSION =================
function setupFormSubmission() {
    const form = document.getElementById('grievanceForm');
    const submitBtn = document.getElementById('submitBtn');
    const btnSpinner = submitBtn.querySelector('.btn-spinner');
    const btnText = submitBtn.querySelector('.btn-text');
    const resultCard = document.getElementById('submissionResult');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Clear all previous error messages
        document.querySelectorAll('.error-msg').forEach(el => el.textContent = '');

        const isAnon = document.getElementById('anonToggle').checked;
        const grievanceId = document.getElementById('grievanceId').value;
        const studentName = document.getElementById('studentName').value.trim();
        const rollNumber = document.getElementById('rollNumber').value.trim();
        const email = document.getElementById('email').value.trim();
        const phone = document.getElementById('phone').value.trim();

        const program = document.getElementById('program').value;
        const department = document.getElementById('department').value;
        const yearSemester = document.getElementById('yearSemester').value;

        const residenceType = document.getElementById('residenceType').value;
        const hostelName = document.getElementById('hostelName').value;
        const roomNumber = document.getElementById('roomNumber').value.trim();

        const category = document.getElementById('category').value;
        const priority = document.getElementById('priority').value;
        const subject = document.getElementById('subject').value.trim();
        const description = document.getElementById('description').value.trim();
        const declaration = document.getElementById('declaration').checked;

        let hasError = false;

        // Validation for non-anonymous mode
        if (!isAnon) {
            if (!studentName) {
                document.getElementById('nameError').textContent = 'Please provide your full name or toggle anonymous submission.';
                hasError = true;
            }
            if (!rollNumber) {
                document.getElementById('rollError').textContent = 'Please enter your NIT KKR roll number or scholar ID.';
                hasError = true;
            }
            if (!email) {
                document.getElementById('emailError').textContent = 'Contact email is required for communication updates.';
                hasError = true;
            }
        }

        if (!category) {
            document.getElementById('categoryError').textContent = 'Please select the area of concern.';
            hasError = true;
        }

        if (!subject) {
            document.getElementById('subjectError').textContent = 'Please provide a brief subject or headline.';
            hasError = true;
        }

        if (!description || description.length < 15) {
            document.getElementById('descError').textContent = 'Please describe the issue in detail (at least 15 characters).';
            hasError = true;
        }

        if (!declaration) {
            document.getElementById('declarationError').textContent = 'You must confirm the truthfulness of your submission.';
            hasError = true;
        }

        if (hasError) {
            const firstErr = document.querySelector('.error-msg:not(:empty)');
            if (firstErr) {
                firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }

        // Prepare Payload
        const payload = {
            grievanceId,
            studentName: isAnon ? "Anonymous Student" : studentName,
            rollNumber: isAnon ? "Confidential" : rollNumber,
            email: isAnon ? "" : email,
            phone: isAnon ? "" : phone,
            program,
            department,
            yearSemester,
            residenceType,
            hostelName: residenceType === 'Day Scholar' ? 'Day Scholar' : hostelName,
            roomNumber,
            category,
            priority,
            subject,
            description,
            isAnonymous: isAnon
        };

        // Loading state
        submitBtn.disabled = true;
        btnSpinner.classList.remove('hidden');

        try {
            const response = await fetch('/api/grievances', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (response.ok && result.success) {
                // Render Success Card
                document.getElementById('registeredTicketId').textContent = grievanceId;
                document.getElementById('registeredDept').textContent = department || 'Dean Student Welfare Office';
                resultCard.classList.remove('hidden');

                // Scroll to success card smoothly
                resultCard.scrollIntoView({ behavior: 'smooth', block: 'center' });

                // Reset Form and generate fresh Ticket ID for next submission
                form.reset();
                initTicketId();

                // Setup copy and track buttons
                document.getElementById('copyTicketBtn').onclick = () => {
                    navigator.clipboard.writeText(grievanceId);
                    alert(`Reference ID ${grievanceId} copied to clipboard!`);
                };

                document.getElementById('trackNowBtn').onclick = () => {
                    // Switch to track tab
                    const trackTab = document.querySelector('[data-tab="tab-track"]');
                    if (trackTab) trackTab.click();
                    const trackInput = document.getElementById('trackSearchInput');
                    if (trackInput) {
                        trackInput.value = grievanceId;
                        document.getElementById('trackSubmitBtn').click();
                    }
                };

                // Update Stats
                fetchStats();
            } else {
                alert(result.error || 'Submission failed. Please check inputs and try again.');
            }
        } catch (error) {
            console.error('Error submitting grievance:', error);
            alert('Could not establish connection to the server. Please check your network or try again shortly.');
        } finally {
            submitBtn.disabled = false;
            btnSpinner.classList.add('hidden');
        }
    });
}

// ================= TRACKING FEATURE =================
function setupTrackingFeature() {
    const trackBtn = document.getElementById('trackSubmitBtn');
    const trackInput = document.getElementById('trackSearchInput');
    const trackError = document.getElementById('trackError');
    const trackResultCard = document.getElementById('trackResultCard');

    async function executeTrack() {
        const id = trackInput.value.trim();
        trackError.textContent = '';

        if (!id) {
            trackError.textContent = 'Please enter a valid Grievance Ticket ID.';
            return;
        }

        trackBtn.disabled = true;
        trackBtn.textContent = 'Searching...';

        try {
            const response = await fetch(`/api/grievances/track/${encodeURIComponent(id)}`);
            const data = await response.json();

            if (response.ok && data.success) {
                const item = data.data;

                // Populate Fields
                document.getElementById('trackCategory').textContent = item.category || 'General';
                document.getElementById('trackSubject').textContent = item.subject || 'Student Grievance';
                
                const dateStr = item.timestamp 
                    ? new Date(item.timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' }) + ' IST'
                    : 'Recently';
                document.getElementById('trackTimestamp').textContent = `Logged on: ${dateStr}`;

                document.getElementById('trackStatusBadge').textContent = item.status || 'Submitted';
                document.getElementById('trackIdVal').textContent = item.grievance_id;
                document.getElementById('trackApplicantVal').textContent = item.student_display || (item.is_anonymous ? 'Anonymous' : 'Student');
                document.getElementById('trackDeptVal').textContent = item.department || 'Dean SW Cell';
                document.getElementById('trackHostelVal').textContent = item.residence_type === 'Day Scholar' ? 'Day Scholar' : (item.hostel_name || 'Campus Resident');
                document.getElementById('trackPriorityVal').textContent = item.priority || 'Moderate';
                document.getElementById('trackRemarksVal').textContent = item.admin_remarks || 'Grievance is currently assigned and being processed by the competent authority.';

                // Stepper Progression
                updateStepper(item.status);

                trackResultCard.classList.remove('hidden');
                trackResultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            } else {
                trackResultCard.classList.add('hidden');
                trackError.textContent = data.error || 'No matching record found for this Reference ID.';
            }
        } catch (err) {
            console.error('Tracking query failed:', err);
            trackError.textContent = 'Error connecting to the grievance database.';
        } finally {
            trackBtn.disabled = false;
            trackBtn.textContent = 'Track Status';
        }
    }

    trackBtn.addEventListener('click', executeTrack);
    trackInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            executeTrack();
        }
    });
}

function updateStepper(status) {
    const step1 = document.getElementById('step1');
    const step2 = document.getElementById('step2');
    const step3 = document.getElementById('step3');
    const step4 = document.getElementById('step4');

    const line1 = document.getElementById('line1');
    const line2 = document.getElementById('line2');
    const line3 = document.getElementById('line3');

    // Reset
    [step1, step2, step3, step4].forEach(s => {
        s.classList.remove('active', 'completed');
    });
    [line1, line2, line3].forEach(l => l.classList.remove('active'));

    const s = (status || '').toLowerCase();

    if (s === 'submitted') {
        step1.classList.add('active');
    } else if (s.includes('review') || s.includes('investigat')) {
        step1.classList.add('completed');
        line1.classList.add('active');
        step2.classList.add('active');
    } else if (s.includes('action') || s.includes('progress')) {
        step1.classList.add('completed');
        line1.classList.add('active');
        step2.classList.add('completed');
        line2.classList.add('active');
        step3.classList.add('active');
    } else if (s.includes('resolve') || s.includes('closed')) {
        step1.classList.add('completed');
        line1.classList.add('active');
        step2.classList.add('completed');
        line2.classList.add('active');
        step3.classList.add('completed');
        line3.classList.add('active');
        step4.classList.add('completed');
    } else {
        step1.classList.add('active');
    }
}

// ================= LIVE STATS =================
async function fetchStats() {
    try {
        const response = await fetch('/api/stats');
        if (response.ok) {
            const stats = await response.json();
            const totalEl = document.getElementById('statTotal');
            const resolvedEl = document.getElementById('statResolved');
            const inProgressEl = document.getElementById('statInProgress');

            if (totalEl) totalEl.textContent = stats.total || '0';
            if (resolvedEl) resolvedEl.textContent = stats.resolved || '0';
            if (inProgressEl) inProgressEl.textContent = stats.inProgress || '0';
        }
    } catch (e) {
        console.warn('Stats fetch skipped:', e);
    }
}