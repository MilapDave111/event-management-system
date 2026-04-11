import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../model/auth/auth.context'; 

import '../styles/GlobalHub.css'; 
import '../styles/Management.css'; 
import '../styles/EventManager.css'; 
import '../styles/kanban.css'; 

const TaskManagerHub = () => {
  const { user } = useAuth(); 
  
  const [activeTab, setActiveTab] = useState('kanban'); 
  const [kanbanView, setKanbanView] = useState(user?.role === 'EVENT_STAFF' ? 'my_tasks' : 'staff'); 
  const [selectedTaskDetails, setSelectedTaskDetails] = useState(null); 

  const [tasks, setTasks] = useState([]);
  const [events, setEvents] = useState([]);
  const [subTeams, setSubTeams] = useState([]);
  const [staff, setStaff] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [currentUser, setCurrentUser] = useState(null); 
  
  const [isAssigning, setIsAssigning] = useState(false);
  const [isLoading, setIsLoading] = useState(true); 
  
  const [taskForm, setTaskForm] = useState({ 
    title: '', priority: 'High', assigned_to: '', due_date: '', event_id: '', sub_team_id: '', description: '' 
  });
  
  const [subTasks, setSubTasks] = useState([]);
  const [subTaskInput, setSubTaskInput] = useState('');
  
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null); 

  const [proofModalTask, setProofModalTask] = useState(null); 
  const [proofFile, setProofFile] = useState(null);
  const [isSubmittingProof, setIsSubmittingProof] = useState(false);

const API_TASKS = 'http://localhost:5000/api/events/tasks'; // Updated to match your route prefix
const API_LOGS = 'http://localhost:5000/api/events/tasks/logs'; // Updated to match your route prefix
  const API_EVENTS = 'http://localhost:5000/api/events/my-events'; 
  const API_SUBTEAMS = 'http://localhost:5000/api/events'; 
  const API_STAFF = 'http://localhost:5000/api/events/list-staff'; 
 

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  });

 const fetchAllProjectData = async () => {
    try {
      setIsLoading(true);
      
      const token = localStorage.getItem('token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setCurrentUser(payload);
      }

      const [taskRes, eventRes, staffRes, logRes] = await Promise.all([
        fetch(API_TASKS, { headers: getAuthHeaders() }),
        fetch(API_EVENTS, { headers: getAuthHeaders() }),
        fetch(API_STAFF, { headers: getAuthHeaders() }), 
        fetch(API_LOGS, { headers: getAuthHeaders() }).catch(() => null) 
      ]);

      const taskJson = await taskRes.json();
      const eventJson = await eventRes.json();
      const staffJson = await staffRes.json();
      
      // --- DEBUGGING CONSOLE LOGS ---
      console.group("🔍 Kanban Data Debugging");
      console.log("1. Raw Tasks from API:", taskJson);
      console.log("2. All Events:", eventJson);
      console.log("3. Current User Role:", user?.role);
      console.groupEnd();

      let logJson = { success: false, data: [] };
      if (logRes && logRes.ok) {
        logJson = await logRes.json();
      }

      if (taskJson.success || Array.isArray(taskJson)) {
        const fetchedTasks = taskJson.data || taskJson;
        
        const formattedTasks = fetchedTasks.map(task => ({
          ...task,
          id: String(task.id),
          tags: [{ label: task.priority === 'High' ? 'Urgent' : 'General', bg: '#f1f5f9', color: '#475569' }], 
          avatars: ['U'], 
          comments: 0,
          attachments: task.attachment_url || task.proof_url ? 1 : 0 
        }));

        console.log("4. Formatted Tasks (State Check):", formattedTasks);
        setTasks(formattedTasks);
      }
      
      if (eventJson.success || Array.isArray(eventJson)) {
        setEvents(eventJson.data || eventJson);
      }
      
      if (staffJson.success || Array.isArray(staffJson)) {
        setStaff(staffJson.data || staffJson);
      }
      
      if (logJson.success || Array.isArray(logJson)) {
        setAuditLogs(logJson.data || logJson);
      }

    } catch (error) {
      console.error("Error fetching project data:", error);
      toast.error("Failed to load project data from database");
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    fetchAllProjectData();
  }, []);

// Inside TaskManagerHub.jsx
useEffect(() => {
  if (taskForm.event_id) {
    fetch(`${API_SUBTEAMS}/${taskForm.event_id}/sub-teams`, { headers: getAuthHeaders() })
      .then(res => res.json())
      .then(json => {
        // Freny's code handles both raw arrays and {success, data} objects
        if (json.success || Array.isArray(json)) {
          setSubTeams(json.data || json); 
        }
      })
      .catch(err => console.error("Error fetching sub-teams", err));
  } else {
    setSubTeams([]); // Clear sub-teams if no event is selected
  }
}, [taskForm.event_id]);
  const handleDragStart = (e, taskId) => {
    if (user?.role === 'EVENT_STAFF' && kanbanView !== 'my_tasks') return;
    if (user?.role !== 'EVENT_STAFF' && kanbanView !== 'manager') return;
    e.dataTransfer.setData('taskId', taskId);
    e.currentTarget.style.opacity = '0.5';
  };

  const handleDragEnd = (e) => {
    e.currentTarget.style.opacity = '1';
  };

  const submitTaskStatusUpdate = async (taskId, newStatus, proofString = null) => {
    const originalTasks = [...tasks];
    setTasks(prevTasks => prevTasks.map(task => task.id === taskId ? { ...task, status: newStatus, proof_url: proofString || task.proof_url } : task));

    try {
      const response = await fetch(`${API_TASKS}/${taskId}/status`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: newStatus, proof_url: proofString })
      });
      const json = await response.json();
      if (json.success || response.ok) {
        toast.success(`Moved to ${newStatus}`);
        fetchAllProjectData(); 
      } else {
        setTasks(originalTasks); 
        toast.error("Failed to update status in database");
      }
    } catch (error) {
      setTasks(originalTasks); 
      toast.error("Network error while updating task");
    }
  };

  const handleDrop = async (e, newStatus) => {
    if (user?.role === 'EVENT_STAFF' && kanbanView !== 'my_tasks') return;
    if (user?.role !== 'EVENT_STAFF' && kanbanView !== 'manager') return;
    
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (!taskId) return;

    if (newStatus === 'completed' && user?.role === 'EVENT_STAFF') {
      setProofModalTask(taskId);
      return; 
    }

    await submitTaskStatusUpdate(taskId, newStatus);
  };

  const allowDrop = (e) => {
    if (user?.role === 'EVENT_STAFF' && kanbanView === 'my_tasks') {
      e.preventDefault();
    } else if (user?.role !== 'EVENT_STAFF' && kanbanView === 'manager') {
      e.preventDefault();
    }
  };

  const handleAddSubTask = () => {
    if (subTaskInput.trim()) {
      setSubTasks([...subTasks, { id: Date.now(), title: subTaskInput, completed: false }]);
      setSubTaskInput('');
    }
  };

  const handleRemoveSubTask = (id) => setSubTasks(subTasks.filter(st => st.id !== id));

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      toast.success(`Attached: ${e.target.files[0].name}`);
    }
  };

  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.readAsDataURL(file);
      fileReader.onload = () => resolve(fileReader.result);
      fileReader.onerror = (error) => reject(error);
    });
  };

  const handleProofSubmit = async () => {
    if (!proofFile) {
      toast.error("You must attach a proof file to complete this task!");
      return;
    }

    setIsSubmittingProof(true);
    try {
      toast.loading("Uploading proof...", { id: 'proofUpload' });
      const proofString = await convertFileToBase64(proofFile);
      
      await submitTaskStatusUpdate(proofModalTask, 'completed', proofString);
      
      toast.success("Proof uploaded and task completed!", { id: 'proofUpload' });
      setProofModalTask(null);
      setProofFile(null);
    } catch (error) {
      toast.error("Failed to upload proof.", { id: 'proofUpload' });
    } finally {
      setIsSubmittingProof(false);
    }
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    
    // Time-lock validation
    const selectedEvent = events.find(evt => String(evt.id) === String(taskForm.event_id));
    if (selectedEvent && selectedEvent.end_date) {
      if (new Date(selectedEvent.end_date) < new Date()) {
        toast.error("This event has already ended! You cannot assign tasks.");
        return;
      }
    }

    setIsAssigning(true);
    
    try {
      let attachmentString = null;
      if (selectedFile) {
        toast.loading("Converting file for upload...", { id: 'fileUpload' });
        attachmentString = await convertFileToBase64(selectedFile);
        toast.success("File ready!", { id: 'fileUpload' });
      }

      // REPLACE the payload part in handleAssignSubmit with this:
const payload = { 
  title: taskForm.title, // Explicitly map title
  description: taskForm.description,
  priority: taskForm.priority,
  event_id: taskForm.event_id,
  assigned_to: taskForm.assigned_to,
  sub_team_id: taskForm.sub_team_id,
  due_date: taskForm.due_date,
  status: 'todo', // Force lowercase 'todo' to match DB
  subTasks,
  attachment_url: attachmentString 
};

      const response = await fetch(API_TASKS, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      
      if (response.status === 413) {
        throw new Error("Payload Too Large. Please increase express.json limit in server.js");
      }

      const json = await response.json();
      if (json.success || response.ok) {
        toast.success("Task Assigned Successfully!");
        setTaskForm({ title: '', priority: 'High', assigned_to: '', due_date: '', event_id: '', sub_team_id: '', description: '' });
        setSubTasks([]);
        setSelectedFile(null); 
        if(fileInputRef.current) fileInputRef.current.value = ""; 
        fetchAllProjectData(); 
        setActiveTab('kanban'); 
        setKanbanView('staff'); 
      } else {
        toast.error(json.message || "Failed to create task");
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Network error while creating task");
    } finally {
      setIsAssigning(false);
    }
  };

  const handleManagerReviewTask = async (taskId, isApproved) => {
    const newStatus = isApproved ? 'approved' : 'todo';
    let rejectionReason = null;

    if (!isApproved) {
      rejectionReason = window.prompt("Provide a reason for sending this task back to To-Do:");
      if (rejectionReason === null) return; 
    }

    const originalTasks = [...tasks];
    setTasks(prevTasks => prevTasks.map(task => 
      task.id === taskId 
        ? { ...task, status: newStatus, rejection_reason: rejectionReason || task.rejection_reason } 
        : task
    ));

    try {
      const response = await fetch(`${API_TASKS}/${taskId}/status`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: newStatus, rejection_reason: rejectionReason })
      });
      
      if (response.ok) {
        toast.success(isApproved ? "Task Approved!" : "Task sent back to To-Do");
        fetchAllProjectData(); 
      } else {
        setTasks(originalTasks); 
        toast.error("Failed to update review status");
      }
    } catch (error) {
      setTasks(originalTasks); 
      toast.error("Network error while reviewing task");
    }
  };

  const handleViewDocument = (url) => {
    try {
      const link = document.createElement('a');
      link.href = url;
      link.download = 'Task_Document'; 
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      toast.error("Failed to open document safely.");
    }
  };

 const renderKanbanColumn = (status, title, dotClass) => {
    const filteredTasks = tasks.filter(t => {
      // FIX: Handle both single string status and arrays (like ['completed', 'approved'])
      const statusMatch = Array.isArray(status) 
        ? status.includes(t.status) 
        : t.status === status;

      if (!statusMatch) return false;
      if (!currentUser) return true;

      if (user?.role === 'EVENT_STAFF') {
        if (kanbanView === 'my_tasks') return String(t.assigned_to) === String(currentUser.id);
        return true; 
      } else {
        if (kanbanView === 'manager') return String(t.assigned_to) === String(currentUser.id);
        return String(t.assigned_to) !== String(currentUser.id);
      }
    });
    
    // When dropping into a column that accepts multiple statuses (like Completed),
    // we default the new status to the first item in the array ('completed').
    const dropStatus = Array.isArray(status) ? status[0] : status;
    const isDraggable = user?.role === 'EVENT_STAFF' ? kanbanView === 'my_tasks' : kanbanView === 'manager';

    return (
      <div 
        className="kanban-column"
        onDragOver={isDraggable ? allowDrop : undefined} 
        onDrop={isDraggable ? (e) => handleDrop(e, dropStatus) : undefined}
      >
        <div className="kanban-col-header">
          <div className="kanban-col-title-wrap">
            <div className={`kanban-dot ${dotClass}`}></div>
            <h3 className="kanban-col-title">{title}</h3>
            <span className="kanban-col-count">{filteredTasks.length}</span>
          </div>
        </div>

        <div className="kanban-scroll-area">
          {filteredTasks.map(task => (
            <div 
              key={task.id} 
              className="kanban-card"
              draggable={isDraggable} 
              onDragStart={isDraggable ? (e) => handleDragStart(e, task.id) : undefined} 
              onDragEnd={isDraggable ? handleDragEnd : undefined}
              onClick={() => setSelectedTaskDetails(task)} 
            >
              <div className="kanban-card-top">
                <div className="kanban-tags">
                  {task.tags && task.tags.map((tag, idx) => (
                    <span key={idx} className="kanban-tag">{tag.label}</span>
                  ))}
                </div>
                <span className={`kanban-priority ${task.priority?.toLowerCase() || 'medium'}`}>
                  {task.priority || 'Medium'}
                </span>
              </div>
              
              <h4 className="kanban-card-title">{task.title}</h4>
              <p className="kanban-card-desc">{task.description}</p>

              {/* APPROVAL STATUS MESSAGES */}
              <div className="kanban-approval-status" style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid #f1f5f9' }}>
                {task.status === 'completed' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#64748b', fontSize: '11px', fontWeight: '500' }}>
                    <span style={{ color: '#f59e0b' }}>●</span> Approval Pending
                  </div>
                )}
                {task.status === 'approved' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#10b981', fontSize: '11px', fontWeight: '600' }}>
                    <span>✅</span> Review Accepted
                  </div>
                )}
              </div>
              
              {task.rejection_reason && task.status === 'todo' && (
                <div className="kanban-rejection-alert">
                  <strong>⚠️ Rejected:</strong> {task.rejection_reason}
                </div>
              )}
              
              <div className="kanban-card-footer">
                <div className="kanban-avatars">
                  {task.avatars && task.avatars.map((av, idx) => (
                    <div key={idx} className="kanban-avatar">{av}</div>
                  ))}
                </div>
                <div className="kanban-meta-icons">
                  {task.comments > 0 && <span>💬 {task.comments}</span>}
                  {task.attachments > 0 && <span>📎 {task.attachments}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const availableTabs = user?.role === 'EVENT_STAFF' 
    ? ['kanban', 'review'] 
    : ['kanban', 'assign', 'review', 'logs'];

  return (
    <div className="org-hub-container">
      {/* TOP NAV TABS */}
      <div className="management-ribbon ribbon-left">
        {availableTabs.map(tab => (
          <div key={tab} className={`nav-card nav-card-sm ${activeTab === tab ? 'active-state' : ''}`} onClick={() => setActiveTab(tab)}>
            <span className="card-label">
              {tab === 'kanban' ? 'Kanban Board' : tab === 'assign' ? 'Assign Task' : tab === 'review' ? 'Review Tasks' : 'Audit Logs'}
            </span>
          </div>
        ))}
      </div>

      <div className={`hub-workspace ${activeTab === 'assign' ? 'workspace-flush' : 'workspace-padded'}`}>

        {/* ======================= TAB 1: KANBAN BOARD ======================= */}
        {activeTab === 'kanban' && (
          <div className="kanban-tab-content">
            <div className="kanban-header-controls">
              <div className="kanban-search-wrapper">
                <input type="text" placeholder="Search tasks..." className="kanban-search-input" />
                <span className="kanban-search-icon">🔍</span>
              </div>
              <div>
                {user?.role === 'EVENT_STAFF' && (
                  <div className="kanban-view-toggles">
                    <button className={`kanban-toggle-btn ${kanbanView === 'my_tasks' ? 'active' : ''}`} onClick={() => setKanbanView('my_tasks')}>My Tasks</button>
                    <button className={`kanban-toggle-btn ${kanbanView === 'team_tasks' ? 'active' : ''}`} onClick={() => setKanbanView('team_tasks')}>Team View</button>
                  </div>
                )}
              </div>
            </div>

            {isLoading ? (
              <div className="kanban-loading-text">
                <h3>Loading project data from Database...</h3>
              </div>
            ) : (
              <div className="kanban-board">
  {/* Change 'todo' to match your DB lowercase exactly */}
  {renderKanbanColumn('todo', 'To Do', 'status-todo')}
  
  {/* Freny's code uses 'progress' - check if your DB uses 'progress' or 'in_progress' */}
  {renderKanbanColumn('progress', 'In Progress', 'status-progress')}
  
  {/* Change 'completed' to match your handleProofSubmit logic */}
{renderKanbanColumn(['completed', 'approved'], 'Completed', 'status-completed')}
</div>
            )}
          </div>
        )}

        {activeTab === 'assign' && user?.role !== 'EVENT_STAFF' && (
  <div className="assign-wrapper">
    <div className="assign-card">
      <div className="assign-header">
        <h2 className="assign-title">Create & Assign Task</h2>
        <button className="assign-close-btn" onClick={() => setActiveTab('kanban')}>✕</button>
      </div>

      <form onSubmit={handleAssignSubmit} className="assign-form-body">
        <div className="strict-2-col-grid">
          <div className="form-col-main">
            
            {/* 1. TASK TITLE - Moved outside and above other fields */}
            <div className="input-wrap">
              <label className="form-label">Task Title <span className="required-star">*</span></label>
              <input 
                className="form-input" 
                placeholder="Enter Task Title" 
                value={taskForm.title} 
                onChange={e => setTaskForm({...taskForm, title: e.target.value})} 
                required 
              />
            </div>

            {/* 2. SUB TEAM SELECTION */}
            <div className="input-wrap">
              <label className="form-label">Sub Team</label>
              <div className="select-wrapper">
                <select 
                  className="form-input form-select" 
                  value={taskForm.sub_team_id} 
                  onChange={e => setTaskForm({...taskForm, sub_team_id: e.target.value})}
                >
                  <option value="">No Specific Sub-Team</option>
                  {subTeams.map((team) => (
                    <option key={team.id} value={team.id}>{team.team_name}</option>
                  ))}
                </select>
                <div className="select-arrow">▼</div>
              </div>
            </div>

                    <div className="input-wrap">
                      <label className="form-label">Description</label>
                      <div className="rich-text-wrapper">
                        <div className="rich-text-toolbar">
                          <b className="toolbar-icon">B</b> <i className="toolbar-icon">I</i> <u className="toolbar-icon">U</u>
                          <span className="toolbar-divider"></span>
                          <span className="toolbar-icon">🔗</span> <span className="toolbar-icon">📝</span> <span className="toolbar-icon">⋮≡</span>
                        </div>
                        <textarea 
                          className="rich-text-area"
                          placeholder="Add detailed description..." 
                          value={taskForm.description} 
                          onChange={e => setTaskForm({...taskForm, description: e.target.value})} 
                        />
                      </div>
                    </div>

                    <div className="input-wrap">
                      <div className="subtask-header">
                        <label className="form-label">Subtasks</label>
                        <button type="button" className="subtask-add-btn" onClick={handleAddSubTask}>+ Add subtask</button>
                      </div>
                      
                      <div className="subtask-input-box">
                        <span className="subtask-plus">+</span>
                        <input 
                          className="subtask-input"
                          placeholder="Type subtask and hit enter..." 
                          value={subTaskInput} 
                          onChange={e => setSubTaskInput(e.target.value)} 
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSubTask(); } }} 
                        />
                      </div>

                      {subTasks.length > 0 && (
                        <div className="subtask-list">
                          {subTasks.map((st, i) => (
                            <div key={st.id} className={`subtask-item ${i !== subTasks.length - 1 ? 'subtask-item-bordered' : ''}`}>
                              <span className="subtask-text"><input type="checkbox" disabled /> {st.title}</span>
                              <span className="subtask-remove" onClick={() => handleRemoveSubTask(st.id)}>✕</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="input-wrap">
                      <label className="form-label">Attachments</label>
                      <div className={`kanban-dropzone ${selectedFile ? 'active' : ''}`}>
                        {selectedFile ? (
                          <p className="dropzone-text active">📎 {selectedFile.name}</p>
                        ) : (
                          <p className="dropzone-text">
                            Drag & drop files or <span className="dropzone-browse">Browse</span>
                          </p>
                        )}
                        <input 
                          type="file"
                          className="dropzone-file-input"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-col-side">
                    <div className="input-wrap">
                      <label className="form-label">Main Event Team <span className="required-star">*</span></label>
                      <div className="select-wrapper">
                        <select className="form-input form-select" value={taskForm.event_id} onChange={e => setTaskForm({...taskForm, event_id: e.target.value})} required>
                          <option value="">Select Event...</option>
                          {events.map((evt) => {
                            const isEnded = evt.end_date ? new Date(evt.end_date) < new Date() : false;
                            return (
                              <option key={evt.id} value={evt.id} disabled={isEnded}>
                                {evt.title} {isEnded ? '(Event Ended)' : ''}
                              </option>
                            );
                          })}
                        </select>
                        <div className="select-arrow">▼</div>
                      </div>
                    </div>

                    <div className="input-wrap">
                      <label className="form-label">Sub Team</label>
                      <div className="select-wrapper">
                        <select className="form-input form-select" value={taskForm.sub_team_id} onChange={e => setTaskForm({...taskForm, sub_team_id: e.target.value})}>
                          <option value="">No Specific Sub-Team</option>
                          {subTeams.map((team) => (
                            <option key={team.id} value={team.id}>{team.team_name}</option>
                          ))}
                        </select>
                        <div className="select-arrow">▼</div>
                      </div>
                    </div>

                    <div className="input-wrap">
                      <label className="form-label">Assign To <span className="required-star">*</span></label>
                      <div className="select-wrapper">
                        <select className="form-input form-select" value={taskForm.assigned_to} onChange={e => setTaskForm({...taskForm, assigned_to: e.target.value})} required>
                          <option value="">+ Assign to staff...</option>
                          {staff.map((user) => (
                            <option key={user.id} value={user.id}>{user.full_name}</option>
                          ))}
                        </select>
                        <div className="select-arrow">▼</div>
                      </div>
                    </div>

                    <div className="input-wrap">
                      <label className="form-label">Priority</label>
                      <div className="select-wrapper">
                        <select className="form-input form-select priority-select" value={taskForm.priority} onChange={e => setTaskForm({...taskForm, priority: e.target.value})}>
                          <option value="High">High</option>
                          <option value="Medium">Medium</option>
                          <option value="Low">Low</option>
                        </select>
                        <div className={`priority-dot-indicator dot-${taskForm.priority?.toLowerCase() || 'medium'}`}></div>
                        <div className="select-arrow">▼</div>
                      </div>
                    </div>

                    <div className="input-wrap">
                      <label className="form-label">Due Date</label>
                      <input type="date" className="form-input" value={taskForm.due_date} onChange={e => setTaskForm({...taskForm, due_date: e.target.value})} />
                    </div>

                    <div className="input-wrap">
                      <label className="form-label">Manager Name</label>
                      <input type="text" className="form-input" value="Auto-assigned based on Event" disabled />
                    </div>
                  </div>
                </div>

                <div className="form-footer">
                  <button type="button" className="btn-cancel" onClick={() => setActiveTab('kanban')}>Cancel</button>
                  <button type="submit" className="btn-submit" disabled={isAssigning}>
                    {isAssigning ? 'Creating...' : 'Create & Assign Task'}
                  </button>
                </div>

              </form>
            </div>
          </div>
        )}

        {/* ======================= TAB 3: REVIEW TASK ======================= */}
        {activeTab === 'review' && (
          <div className="review-wrapper">
            <h2 className="manager-title">
              {user?.role === 'EVENT_STAFF' ? 'My Task Reviews' : 'Review Completed Tasks'}
            </h2>
            
            {user?.role === 'EVENT_STAFF' ? (
              <div className="manage-staff-table-card table-card-flat">
                <table className="staff-table">
                  <thead>
                    <tr>
                      <th>Task Title</th>
                      <th>Last Updated</th>
                      <th>Review Status</th>
                      <th>Feedback / Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* STAFF REVIEW TABLE WITH ADVANCED REASON LOGIC */}
                    {tasks.filter(t => String(t.assigned_to) === String(currentUser?.id) && (['completed', 'approved', 'reassigned'].includes(t.status) || (t.status === 'todo' && t.rejection_reason))).length > 0 ? (
                      tasks.filter(t => String(t.assigned_to) === String(currentUser?.id) && (['completed', 'approved', 'reassigned'].includes(t.status) || (t.status === 'todo' && t.rejection_reason))).map((t, index) => (
                        <tr key={t.id || index}>
                          <td><span className="text-bold">{t.title}</span></td>
                          <td>{new Date(t.updated_at || t.created_at).toLocaleDateString()}</td>
                          <td>
                            <span className={`status-badge ${t.status === 'completed' ? 'status-draft' : t.status === 'approved' ? 'status-active' : 'status-rejected'} badge-no-margin`}>
                              {t.status === 'completed' ? 'UNDER REVIEW' : t.status === 'todo' ? 'REJECTED' : t.status.toUpperCase()}
                            </span>
                          </td>
                          <td>
                            {t.status === 'completed' && <span className="text-muted text-italic">Pending manager review...</span>}
                            {t.status === 'approved' && !t.rejection_reason && <span className="text-muted">No reason (Directly Approved)</span>}
                            {t.status === 'approved' && t.rejection_reason && <span><span className="text-green text-bold">Approved.</span> Previous Feedback: {t.rejection_reason}</span>}
                            {(t.status === 'todo' || t.status === 'reassigned') && t.rejection_reason && <span className="text-red">{t.rejection_reason}</span>}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="4" className="table-empty-state">You have no tasks currently under review.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="manage-staff-table-card table-card-flat">
                <table className="staff-table">
                  <thead>
                    <tr>
                      <th>Task Title</th>
                      <th>Assigned Staff</th>
                      <th>Due Date</th>
                      <th>Staff Proof</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.filter(t => t.status === 'completed').length > 0 ? (
                      tasks.filter(t => t.status === 'completed').map((t, index) => (
                        <tr key={t.id || index}>
                          <td><span className="text-bold">{t.title}</span></td>
                          <td>{t.assigned_name || staff.find(s => String(s.id) === String(t.assigned_to))?.full_name || 'Unknown'}</td>
                          <td>{t.due_date ? new Date(t.due_date).toLocaleDateString() : t.end_date ? new Date(t.end_date).toLocaleDateString() : 'N/A'}</td>
                          
                          <td>
                            {t.proof_url ? (
                              <button className="btn-view-proof" onClick={() => handleViewDocument(t.proof_url)}>📄 View Proof</button>
                            ) : (
                              <span className="text-muted text-italic">No proof</span>
                            )}
                          </td>

                          <td>
                            <div className="table-action-btns">
                              <button className="btn-approve" onClick={() => handleManagerReviewTask(t.id, true)}>Approve</button>
                              <button className="btn-reject" onClick={() => handleManagerReviewTask(t.id, false)}>Reject / Reassign</button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="5" className="table-empty-state">No completed tasks waiting for review at this time.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ======================= TAB 4: AUDIT LOGS ======================= */}
        {activeTab === 'logs' && user?.role !== 'EVENT_STAFF' && (
          <div className="review-wrapper">
            <h2 className="manager-title">Task Audit Logs & Notifications</h2>
            <div className="manage-staff-table-card table-card-flat">
              <table className="staff-table">
                <thead><tr><th>Timestamp</th><th>Action</th><th>Details</th><th>User/System</th></tr></thead>
                <tbody>
                  {auditLogs.length > 0 ? (
                    auditLogs.map((log, index) => (
                      <tr key={log.id || index}>
                        <td>{new Date(log.created_at || Date.now()).toLocaleString()}</td>
                        <td><span className="status-badge status-draft badge-no-margin">{log.action_type || log.action || 'UPDATE'}</span></td>
                        <td><span className="text-bold">{log.details || log.description || 'System Log'}</span></td>
                        <td>{log.user_name || log.performed_by || 'Admin'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="4" className="table-empty-state">No logs available yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* ======================= ASK FOR PROOF MODAL ======================= */}
      {proofModalTask && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h2 className="modal-title">Upload Proof of Completion</h2>
            <p className="modal-desc">Please attach a photo or document to prove this task is done. Your manager will review this.</p>

            <div className={`kanban-dropzone ${proofFile ? 'active' : ''}`} style={{ marginBottom: '20px' }}>
              {proofFile ? (
                <p className="dropzone-text active">📎 {proofFile.name}</p>
              ) : (
                <p className="dropzone-text">Click here to upload your proof</p>
              )}
              <input type="file" className="dropzone-file-input" onChange={(e) => setProofFile(e.target.files[0])} />
            </div>

            <div className="modal-actions">
              <button className="btn-modal-cancel" onClick={() => { setProofModalTask(null); setProofFile(null); }}>Cancel</button>
              <button className="btn-modal-submit" onClick={handleProofSubmit} disabled={isSubmittingProof}>
                {isSubmittingProof ? 'Uploading...' : 'Submit Proof'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================= VIEW TASK DETAILS POPUP MODAL ======================= */}
      {selectedTaskDetails && (
        <div className="modal-overlay" onClick={() => setSelectedTaskDetails(null)}>
          <div className="modal-box modal-large" onClick={e => e.stopPropagation()}>
            <button className="modal-close-icon" onClick={() => setSelectedTaskDetails(null)}>✕</button>
            
            <div className="modal-badges">
              <span className={`modal-badge-status kanban-priority ${selectedTaskDetails.priority?.toLowerCase() || 'medium'}`}>
                {selectedTaskDetails.priority || 'Medium'} Priority
              </span>
              <span className="modal-badge-status">
                {selectedTaskDetails.status.replace('-', ' ')}
              </span>
            </div>

            <h2 className="modal-title large">{selectedTaskDetails.title}</h2>

            {selectedTaskDetails.rejection_reason && selectedTaskDetails.status === 'todo' && (
              <div className="modal-rejection-box">
                <h4 className="modal-rejection-title">⚠️ Manager Feedback (Rejected)</h4>
                <p className="modal-rejection-text">{selectedTaskDetails.rejection_reason}</p>
              </div>
            )}
            
            <div className="modal-section-box">
              <h4 className="modal-section-title">Description</h4>
              <p className="modal-section-text">{selectedTaskDetails.description || 'No description provided.'}</p>
            </div>

            <div className="modal-meta-grid">
              <div className="modal-meta-box">
                <h4 className="modal-meta-label">Assigned By</h4>
                <p className="modal-meta-value">{selectedTaskDetails.assigned_by_name || 'Event Manager'}</p>
              </div>
              <div className="modal-meta-box">
                <h4 className="modal-meta-label">Manager Instructions</h4>
                {selectedTaskDetails.attachment_url ? (
                  <span className="modal-link-btn" onClick={() => handleViewDocument(selectedTaskDetails.attachment_url)}>📎 View Document</span>
                ) : (
                  <p className="modal-section-text text-muted text-italic">No materials attached</p>
                )}

                {selectedTaskDetails.proof_url && (
                  <div style={{ marginTop: '10px' }}>
                    <h4 className="modal-meta-label">Completion Proof</h4>
                    <span className="modal-link-btn green" onClick={() => handleViewDocument(selectedTaskDetails.proof_url)}>✅ View Staff Proof</span>
                  </div>
                )}
              </div>
            </div>

            {selectedTaskDetails.subtasks && selectedTaskDetails.subtasks.length > 0 && selectedTaskDetails.subtasks[0] !== null && (
              <div className="modal-checklist-wrap">
                <h4 className="modal-checklist-title">Task Checklist</h4>
                <div className="modal-checklist-list">
                  {selectedTaskDetails.subtasks.map((st, index) => (
                    <div key={st?.id || index} className="modal-checklist-item">
                      <input type="checkbox" disabled checked={st?.completed || false} />
                      <span className="modal-section-text">{st?.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="modal-meta-grid">
              <div className="modal-meta-box">
                <h4 className="modal-meta-label">Assigned To (Staff)</h4>
                <p className="modal-meta-value">{selectedTaskDetails.assigned_name || staff.find(s => String(s.id) === String(selectedTaskDetails.assigned_to))?.full_name || 'Unassigned'}</p>
              </div>
              <div className="modal-meta-box">
                <h4 className="modal-meta-label">Due Date</h4>
                <p className="modal-meta-value red">
                   {selectedTaskDetails.due_date ? new Date(selectedTaskDetails.due_date).toLocaleDateString() : selectedTaskDetails.end_date ? new Date(selectedTaskDetails.end_date).toLocaleDateString() : 'No Due Date'}
                </p>
              </div>
            </div>

            <div className="modal-footer-box">
              <button className="btn-close-details" onClick={() => setSelectedTaskDetails(null)}>Close Details</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default TaskManagerHub;