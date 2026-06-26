const user = JSON.parse(localStorage.getItem("user"));

if (!user) {
  window.location.href = "./login.html";
}

let editingCourseId = null;
let editingTopicId = null;
const paperTimers = {};
let activeTopicTimer = null;
let draggedTopic = null;

const defaultCourses = [
  "Accounting",
  "Corporate Laws & Other Laws",
  "Cost & Management Accounting",
  "Taxation",
  "Auditing & Assurance",
  "Enterprise Information Systems & Strategic Management"
];

const courseTopics = {
  "Accounting": [
    {name:"Financial Reporting",notes:"",timeSpent:0},
    {name:"Accounting Standards",notes:"",timeSpent:0},
    {name:"Business Combinations",notes:"",timeSpent:0},
    {name:"Consolidation Techniques",notes:"",timeSpent:0},
    {name:"Corporate Restructuring",notes:"",timeSpent:0}
  ],
  "Corporate Laws & Other Laws": [
    {name:"Company Law Compliance",notes:"",timeSpent:0},
    {name:"SEBI & LLP Rules",notes:"",timeSpent:0},
    {name:"Corporate Governance",notes:"",timeSpent:0},
    {name:"ROC Filings",notes:"",timeSpent:0},
    {name:"Environmental & Labour Laws",notes:"",timeSpent:0}
  ],
  "Cost & Management Accounting": [
    {name:"Costing Methods",notes:"",timeSpent:0},
    {name:"Budgeting and Forecasting",notes:"",timeSpent:0},
    {name:"Standard Costing",notes:"",timeSpent:0},
    {name:"Variance Analysis",notes:"",timeSpent:0},
    {name:"Cost Control Techniques",notes:"",timeSpent:0}
  ],
  "Taxation": [
    {name:"Income Tax Fundamentals",notes:"",timeSpent:0},
    {name:"GST Returns",notes:"",timeSpent:0},
    {name:"TDS and Advance Tax",notes:"",timeSpent:0},
    {name:"Tax Planning",notes:"",timeSpent:0},
    {name:"International Tax Basics",notes:"",timeSpent:0}
  ],
  "Auditing & Assurance": [
    {name:"Audit Planning",notes:"",timeSpent:0},
    {name:"Internal Controls",notes:"",timeSpent:0},
    {name:"Audit Documentation",notes:"",timeSpent:0},
    {name:"Audit Reports",notes:"",timeSpent:0},
    {name:"Assurance Engagements",notes:"",timeSpent:0}
  ],
  "Enterprise Information Systems & Strategic Management": [
    {name:"ERP and MIS",notes:"",timeSpent:0},
    {name:"Data Security",notes:"",timeSpent:0},
    {name:"E-commerce Systems",notes:"",timeSpent:0},
    {name:"Strategic Planning",notes:"",timeSpent:0},
    {name:"Risk Management",notes:"",timeSpent:0}
  ]
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  updateTodayDate();
  updateCountdown();
  ensureDefaultCourses().then(() => loadPapers());
  setInterval(updateCountdown, 1000);
});

function formatTime(seconds) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hrs.toString().padStart(2,'0')}:${mins.toString().padStart(2,'0')}:${secs.toString().padStart(2,'0')}`;
}

function formatTimeShort(seconds) {
  const total = Math.floor(seconds);
  const hrs = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>');
}

function updateTodayDate() {
  const today = new Date().toISOString().split('T')[0];
  const datElem = document.getElementById('today-date');
  if (datElem) datElem.textContent = today;
}

function updateCountdown() {
  const examDate = new Date('2026-09-01');
  const now = new Date();
  const diff = examDate - now;
  
  if (diff > 0) {
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    const daysElem = document.getElementById('countdown-days');
    const hoursElem = document.getElementById('countdown-hours');
    const minsElem = document.getElementById('countdown-mins');
    
    if (daysElem) daysElem.textContent = days;
    if (hoursElem) hoursElem.textContent = hours;
    if (minsElem) minsElem.textContent = mins;
  }
}

async function ensureDefaultCourses() {
  for (const name of defaultCourses) {
    try {
      const resp = await fetch(`http://localhost:5000/api/course/add-course`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          userId: user._id,
          courseName: name,
          progress: 0,
          notes: '',
          topics: courseTopics[name] || []
        })
      });
    } catch (e) {}
  }
}

async function loadPapers() {
  try {
    const resp = await fetch(`http://localhost:5000/api/course/get-courses/${user._id}`);
    const papers = await resp.json();
    
    // Calculate stats
    let totalTime = 0;
    let totalTopics = 0;
    let totalProgress = 0;
    
    papers.forEach(paper => {
      paper.topics.forEach(topic => {
        totalTime += topic.timeSpent || 0;
        totalTopics++;
      });
      totalProgress += paper.progress || 0;
    });
    
    const avgProgress = papers.length > 0 ? Math.round(totalProgress / papers.length) : 0;
    
    // Update stats
    document.getElementById('stat-total-time').textContent = formatTime(totalTime);
    document.getElementById('stat-today-time').textContent = '00:00';
    document.getElementById('stat-topics-count').textContent = totalTopics;
    document.getElementById('stat-days-tracked').textContent = '0';
    
    // Render papers
    const papersList = document.getElementById('papers-list');
    papersList.innerHTML = '';
    
    papers.forEach(paper => {
      const paperHtml = createPaperItem(paper);
      papersList.innerHTML += paperHtml;
    });
    
    // Restore expanded states
    papers.forEach(paper => {
      const expanded = localStorage.getItem(`paper-expanded-${paper._id}`);
      if (expanded === '1') {
        const content = document.getElementById(`paper-content-${paper._id}`);
        if (content) content.classList.add('expanded');
      }
    });
    
  } catch (err) {
    console.error('Error loading papers:', err);
  }
}

function createPaperItem(paper) {
  const topicTime = paper.topics.reduce((sum, t) => sum + (t.timeSpent || 0), 0);
  const topicCount = paper.topics.length;
  
  return `
    <div class="paper-item" id="paper-${paper._id}">
      <div class="paper-status">
        <div class="status-indicator checked">✓</div>
        <div class="status-indicator pending"></div>
        <div class="status-indicator warning"></div>
        <div class="status-indicator danger"></div>
      </div>
      
      <div class="paper-name">${escapeHtml(paper.courseName)}</div>
      
      <div class="paper-timer">${formatTime(topicTime)}</div>
      
      <div class="paper-actions">
        <button class="action-btn edit" onclick="openEditPaper('${paper._id}', '${escapeHtml(paper.courseName)}', ${paper.progress || 0})">
          ✏ Edit
        </button>
        <button class="action-btn delete" onclick="deletePaper('${paper._id}')">
          🗑 Delete
        </button>
        <button class="action-btn timer" onclick="togglePaperContent('${paper._id}')">
          ▼ Topics
        </button>
      </div>
      
      <div class="paper-content" id="paper-content-${paper._id}">
        <div class="paper-topics">
          <div class="topics-title">Topics (${topicCount})</div>
          <div class="topics-list" id="topics-list-${paper._id}">
            ${paper.topics.map((topic, idx) => `
              <div class="topic-item" draggable="true" data-topic-id="${topic._id || paper._id + '-' + idx}" data-paper-id="${paper._id}" data-topic-index="${idx}" ondragstart="handleTopicDragStart(event)" ondragend="handleTopicDragEnd(event)" ondragover="handleTopicDragOver(event)" ondrop="handleTopicDrop(event)" ondragleave="handleTopicDragLeave(event)">
                <div class="topic-name">${escapeHtml(topic.name)}</div>
                <div class="topic-controls">
                  <div class="timer-display">${formatTime(topic.timeSpent || 0)}</div>
                  <button class="topic-btn" onclick="startTopicTimer('${paper._id}', '${topic._id || paper._id + '-' + idx}')">▶</button>
                  <button class="topic-btn" onclick="stopTopicTimer('${paper._id}', '${topic._id || paper._id + '-' + idx}')">⏹</button>
                  <button class="topic-btn" onclick="openEditTopicModal('${paper._id}', '${topic._id || paper._id + '-' + idx}', '${escapeHtml(topic.name)}')">✏</button>
                  <button class="topic-btn delete" onclick="deleteTopic('${paper._id}', '${topic._id || paper._id + '-' + idx}')">✕</button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
        
        <div class="paper-notes">
          <div class="notes-label">Paper Notes</div>
          <textarea class="notes-textarea" id="notes-${paper._id}" placeholder="Add notes for this paper...">${escapeHtml(paper.notes || '')}</textarea>
          <div class="notes-actions">
            <button class="btn-save-notes" onclick="savePaperNotes('${paper._id}')">Save Notes</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function togglePaperContent(paperId) {
  const content = document.getElementById(`paper-content-${paperId}`);
  if (content) {
    content.classList.toggle('expanded');
    const isExpanded = content.classList.contains('expanded');
    localStorage.setItem(`paper-expanded-${paperId}`, isExpanded ? '1' : '0');
  }
}

function openEditPaper(paperId, paperName, progress) {
  editingCourseId = paperId;
  document.getElementById('courseId').value = paperId;
  document.getElementById('courseName').value = paperName;
  document.getElementById('courseProgress').value = progress;
  document.getElementById('courseModalTitle').textContent = 'Edit Paper';
  document.getElementById('courseModal').classList.add('show');
}

function openCourseModal() {
  editingCourseId = null;
  document.getElementById('courseId').value = '';
  document.getElementById('courseName').value = '';
  document.getElementById('courseProgress').value = '';
  document.getElementById('courseModalTitle').textContent = 'Add Paper';
  document.getElementById('courseModal').classList.add('show');
}

function closeCourseModal() {
  document.getElementById('courseModal').classList.remove('show');
}

async function saveCourse() {
  const courseId = document.getElementById('courseId').value;
  const courseName = document.getElementById('courseName').value;
  const progress = parseInt(document.getElementById('courseProgress').value) || 0;
  
  if (!courseName.trim()) {
    alert('Please enter a paper name');
    return;
  }
  
  try {
    if (courseId) {
      // Update
      await fetch(`http://localhost:5000/api/course/update-course/${courseId}`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({progress})
      });
    } else {
      // Add new
      await fetch(`http://localhost:5000/api/course/add-course`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          userId: user._id,
          courseName: courseName,
          progress: progress,
          topics: []
        })
      });
    }
    
    closeCourseModal();
    loadPapers();
  } catch (err) {
    console.error('Error saving course:', err);
  }
}

async function deletePaper(paperId) {
  if (!confirm('Delete this paper?')) return;
  
  try {
    await fetch(`http://localhost:5000/api/course/delete-course/${paperId}`, {method: 'DELETE'});
    loadPapers();
  } catch (err) {
    console.error('Error deleting paper:', err);
  }
}

async function deleteTopic(paperId, topicId) {
  if (!confirm('Delete this topic?')) return;
  
  try {
    await fetch(`http://localhost:5000/api/course/delete-topic/${paperId}/${topicId}`, {method: 'DELETE'});
    loadPapers();
  } catch (err) {
    console.error('Error deleting topic:', err);
  }
}

async function savePaperNotes(paperId) {
  const notes = document.getElementById(`notes-${paperId}`).value;
  
  try {
    await fetch(`http://localhost:5000/api/course/update-course/${paperId}`, {
      method: 'PUT',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({notes})
    });
    alert('Notes saved!');
  } catch (err) {
    console.error('Error saving notes:', err);
  }
}

function startTopicTimer(paperId, topicId) {
  const timerKey = `${paperId}||${topicId}`;
  
  if (!paperTimers[timerKey]) {
    paperTimers[timerKey] = {seconds: 0, intervalId: null};
  }
  
  if (paperTimers[timerKey].intervalId) return;
  
  paperTimers[timerKey].intervalId = setInterval(() => {
    paperTimers[timerKey].seconds++;
    updateTimerDisplay(paperId, topicId);
  }, 1000);
}

function stopTopicTimer(paperId, topicId) {
  const timerKey = `${paperId}||${topicId}`;
  
  if (paperTimers[timerKey]) {
    clearInterval(paperTimers[timerKey].intervalId);
    
    const seconds = paperTimers[timerKey].seconds;
    if (seconds > 0) {
      persistTopicTime(paperId, topicId, seconds);
      paperTimers[timerKey].seconds = 0;
    }
  }
  
  updateTimerDisplay(paperId, topicId);
}

async function persistTopicTime(paperId, topicId, seconds) {
  try {
    await fetch(`http://localhost:5000/api/course/update-topic/${paperId}/${topicId}`, {
      method: 'PUT',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({timeSpent: seconds})
    });
    loadPapers();
  } catch (err) {
    console.error('Error persisting time:', err);
  }
}

function updateTimerDisplay(paperId, topicId) {
  const timerKey = `${paperId}||${topicId}`;
  const elem = document.querySelector(`#paper-${paperId} .topic-item:nth-child(${parseInt(topicId.split('-')[1] || 0) + 1}) .timer-display`);
  
  if (elem && paperTimers[timerKey]) {
    elem.textContent = formatTime(paperTimers[timerKey].seconds);
  }
}

function showTab(tabName) {
  document.querySelectorAll('.nav-tab').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
  
  if (tabName === 'dashboard') {
    const papersSection = document.getElementById('papers-section');
    if (papersSection) papersSection.style.display = 'block';
  } else {
    // Handle other tabs (Analytics, Planner, etc.)
    alert('Coming soon: ' + tabName);
  }
}

// DRAG AND DROP HANDLERS
function handleTopicDragStart(e) {
  draggedTopic = {
    id: e.target.getAttribute('data-topic-id'),
    paperId: e.target.getAttribute('data-paper-id'),
    element: e.target
  };
  e.target.style.opacity = '0.5';
  e.dataTransfer.effectAllowed = 'move';
}

function handleTopicDragEnd(e) {
  e.target.style.opacity = '1';
  document.querySelectorAll('.topic-item').forEach(item => {
    item.style.borderTop = 'none';
  });
}

function handleTopicDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  if (e.target.classList.contains('topic-item') && e.target !== draggedTopic.element) {
    e.target.style.borderTop = '3px solid var(--accent)';
  }
}

function handleTopicDragLeave(e) {
  if (e.target.classList.contains('topic-item')) {
    e.target.style.borderTop = 'none';
  }
}

async function handleTopicDrop(e) {
  e.preventDefault();
  e.target.style.borderTop = 'none';
  
  if (!draggedTopic || draggedTopic.element === e.target) return;
  
  const dropTarget = e.target.closest('.topic-item');
  if (!dropTarget) return;
  
  const dropPaperId = dropTarget.getAttribute('data-paper-id');
  if (dropPaperId !== draggedTopic.paperId) return;
  
  const topicsList = document.getElementById(`topics-list-${draggedTopic.paperId}`);
  const items = Array.from(topicsList.querySelectorAll('.topic-item'));
  const draggedIndex = items.indexOf(draggedTopic.element);
  const dropIndex = items.indexOf(dropTarget);
  
  if (draggedIndex > dropIndex) {
    dropTarget.parentNode.insertBefore(draggedTopic.element, dropTarget);
  } else {
    dropTarget.parentNode.insertBefore(draggedTopic.element, dropTarget.nextSibling);
  }
  
  // Save new order to backend
  await reorderTopics(draggedTopic.paperId);
  draggedTopic = null;
}

async function reorderTopics(paperId) {
  try {
    const topicsList = document.getElementById(`topics-list-${paperId}`);
    const items = Array.from(topicsList.querySelectorAll('.topic-item'));
    const newOrder = items.map((item, idx) => ({
      index: idx,
      topicId: item.getAttribute('data-topic-id')
    }));
    
    // You can save this order to localStorage or backend as needed
    localStorage.setItem(`topics-order-${paperId}`, JSON.stringify(newOrder));
  } catch (err) {
    console.error('Error reordering topics:', err);
  }
}

// EDIT TOPIC MODAL
function openEditTopicModal(paperId, topicId, topicName) {
  editingCourseId = paperId;
  editingTopicId = topicId;
  
  const modal = document.getElementById('editTopicModal');
  if (!modal) {
    console.error('Edit topic modal not found');
    return;
  }
  
  document.getElementById('editTopicName').value = topicName;
  modal.classList.add('show');
}

function closeEditTopicModal() {
  const modal = document.getElementById('editTopicModal');
  if (modal) modal.classList.remove('show');
  editingCourseId = null;
  editingTopicId = null;
}

async function saveEditTopic() {
  const newName = document.getElementById('editTopicName').value.trim();
  
  if (!newName) {
    alert('Please enter a topic name');
    return;
  }
  
  try {
    // Update the topic name in the UI
    const topicElements = document.querySelectorAll(`[data-topic-id="${editingTopicId}"]`);
    topicElements.forEach(elem => {
      const nameElem = elem.querySelector('.topic-name');
      if (nameElem) nameElem.textContent = newName;
    });
    
    // Update in backend
    await fetch(`http://localhost:5000/api/course/update-topic/${editingCourseId}/${editingTopicId}`, {
      method: 'PUT',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({name: newName})
    });
    
    closeEditTopicModal();
  } catch (err) {
    console.error('Error saving topic:', err);
    alert('Error saving topic name');
  }
}

async function addNewTopic(paperId) {
  const topicName = prompt('Enter topic name:');
  if (!topicName || !topicName.trim()) return;
  
  try {
    await fetch(`http://localhost:5000/api/course/add-topic/${paperId}`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({name: topicName.trim()})
    });
    
    loadPapers();
  } catch (err) {
    console.error('Error adding topic:', err);
    alert('Error adding topic');
  }
}
