import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { 
  getUsersByRole, 
  searchUsers, 
  registerCenterManager, 
  registerTeacher, 
  registerLearner,
  updateUserDetails,
  deactivateUser 
} from '../../services/userService';
import { centerService } from '../../services/centerService'; 
import { fetchCenterClasses } from '../../services/classService';
import { fetchSubjects } from '../../services/subjectService';

const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.user_role === 'Admin';

  const [activeTab, setActiveTab] = useState(isAdmin ? 'Center Manager' : 'Teacher');
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [centers, setCenters] = useState([]);
  const [centersLoading, setCentersLoading] = useState(false);

  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classesLoading, setClassesLoading] = useState(false);
  const [subjectsLoading, setSubjectsLoading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [generatingNumber, setGeneratingNumber] = useState(false);
  const [feedback, setFeedback] = useState({ error: null, success: null });

  // Creation State Controls
  const [showAddModal, setShowAddModal] = useState(false);
  const [generatedNumber, setGeneratedNumber] = useState('');
const [formData, setFormData] = useState({
  email: '',
  centerId: '',
  grade: '',
  highschool: '',
  classIds: [],
  subjectIds: [],
  grades: [] 
});

  // Edit / Modification State Controls
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    userId: '',
    firstName: '',
    lastName: '',
    email: '',
    role: '',
    grade: '',
    highschool: '',
    classIds: [],
    subjectIds: []
  });

  const [deactivateTarget, setDeactivateTarget] = useState(null);
  const [deactivateReason, setDeactivateReason] = useState('');

  // 1. Core Fetch: Sync master lists on tab switches
  const fetchUsers = async () => {
    setLoading(true);
    setFeedback({ error: null, success: null });
    try {
      console.log(`📡 [Network Request] GET /api/users?role=${activeTab}`);
      // Normalizes tab names to match your precise backend query expectations if needed
      let targetRole = activeTab;
      if (activeTab === 'Center Manager') targetRole = 'Center Manager';
      if (activeTab === 'Teacher') targetRole = 'Teacher';
      if (activeTab === 'Learner') targetRole = 'Learner';

      const result = await getUsersByRole(targetRole);

        // DEBUG LOGS
      console.log("📦 [Frontend] Step 2: Raw data object returned from service layer utility:", result);
      console.log("📊 [Frontend] Step 3: Extracted data array trying to set into state:", result?.data);
      console.log("📦 [Network Success] Parsed data payload returned:", result);
      
      // Since service returns response.data, 'result' is { data: [...] }
      // We unwrap result.data safely here
      const cleanUserArray = result?.data || [];
      setUsers(Array.isArray(cleanUserArray) ? cleanUserArray : []);
      
    } catch (err) {
      console.error("Error fetching user roster:", err);
      setFeedback((prev) => ({ ...prev, error: "Failed to load user records from the server." }));
      setUsers([]); // Clear stale state on failure
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [activeTab]);

  // 2. Center Hydration: Active during Admin-level allocation processes
  useEffect(() => {
    const fetchCentersData = async () => {
      if (!showAddModal && !showEditModal) return;
      if (activeTab === 'Center Manager' || (activeTab === 'Teacher' && isAdmin)) {
        setCentersLoading(true);
        try {
          const result = await centerService.getAllCenters();
          setCenters(Array.isArray(result) ? result : []);
        } catch (err) {
          console.error("Failed to fetch operational centers:", err);
          setFeedback((prev) => ({ ...prev, error: "Could not load the list of centers." }));
        } finally {
          setCentersLoading(false);
        }
      }
    };

    fetchCentersData();
  }, [showAddModal, showEditModal, activeTab, isAdmin]);

 // 3. Class Hydration (FIXED Property References)
  useEffect(() => {
    const getClassesData = async () => {
      if (!showAddModal && !showEditModal) return;
      if (activeTab !== 'Teacher' && activeTab !== 'Learner') return;
      
      // 🚀 FIXED: Changed from centerId to center_id
      const currentCenterId = showEditModal ? editFormData.center_id : formData.centerId;
      if (isAdmin && !currentCenterId) {
        setClasses([]);
        return;
      }

      setClassesLoading(true);
      try {
        const classList = await fetchCenterClasses();
        setClasses(Array.isArray(classList) ? classList : classList?.data || []);
      } catch (err) {
        console.error("Error fetching classrooms:", err);
      } finally {
        setClassesLoading(false);
      }
    };

    getClassesData();
    // Listening to center_id now
  }, [showAddModal, showEditModal, activeTab, formData.centerId, editFormData.center_id, isAdmin]);

  // 4. Subject Hydration (FIXED Grade Variable and State Scope)
  useEffect(() => {
    const getSubjectsData = async () => {
      if (!showAddModal && !showEditModal) return;
      if (activeTab !== 'Teacher' && activeTab !== 'Learner') return;

      // Ensure we access the right form key property
      const currentGrade = showEditModal ? editFormData.grade : formData.grade;
      
      // If a learner is being edited/added, filter subjects by their current grade selection.
      // If it's a teacher, load all available subjects so they can choose across multiple grades.
      const targetGradeQuery = activeTab === 'Learner' ? currentGrade : '';

      setSubjectsLoading(true);
      try {
        console.log(`📡 Fetching subjects for grade query: "${targetGradeQuery}"`);
        const subjectList = await fetchSubjects(targetGradeQuery);
        setSubjects(Array.isArray(subjectList) ? subjectList : subjectList?.data || []);
      } catch (err) {
        console.error("Error fetching academic curriculum parameters:", err);
      } finally {
        setSubjectsLoading(false);
      }
    };

    getSubjectsData();
    //Listens to the updated editFormData.grade flag
  }, [showAddModal, showEditModal, activeTab, formData.grade, editFormData.grade]);

  // 5. Search Execution Handler
  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      fetchUsers();
      return;
    }
    setLoading(true);
    try {
      const result = await searchUsers(searchQuery, activeTab);
      setUsers(result.data || []);
    } catch (err) {
      setFeedback((prev) => ({ ...prev, error: "Search query could not be completed." }));
    } finally {
      setLoading(false);
    }
  };

  // 6. Identity Number Generator Strategy
  const handleGenerateNumber = () => {
    if (!formData.email.trim()) {
      alert("Please enter a notification email address first before generating an identity tracking number.");
      return;
    }
    setGeneratingNumber(true);
    
    setTimeout(() => {
      const prefixMap = { 'Center Manager': '101', 'Teacher': '202', 'Learner': '303' };
      const currentPrefix = prefixMap[activeTab] || '909';
      const secureRandomSequence = Math.floor(1000 + Math.random() * 9000);
      
      setGeneratedNumber(`${currentPrefix}${secureRandomSequence}`);
      setGeneratingNumber(false);
    }, 600);
  };

  // Checkbox Selection Logic Utilities
  const handleCheckboxToggle = (field, id, isEdit = false) => {
    const targetState = isEdit ? editFormData : formData;
    const targetSetter = isEdit ? setEditFormData : setFormData;
    const existingValues = targetState[field] || [];

    if (existingValues.includes(id)) {
      targetSetter(prev => ({ ...prev, [field]: existingValues.filter(v => v !== id) }));
    } else {
      targetSetter(prev => ({ ...prev, [field]: [...existingValues, id] }));
    }
  };

  // 7. Onboarding Submission Pipe
  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!generatedNumber) {
      setFeedback((prev) => ({ ...prev, error: "Please click 'Generate Number' before submitting." }));
      return;
    }

    setActionLoading(true);
    setFeedback({ error: null, success: null });

    try {
      if (activeTab === 'Center Manager') {
        await registerCenterManager(formData.email, formData.centerId, generatedNumber);
      } else if (activeTab === 'Teacher') {
        const targetCenter = isAdmin ? formData.centerId : null;
        
        await registerTeacher(
          formData.email, 
          targetCenter, 
          generatedNumber, 
          formData.classIds, 
          formData.subjectIds,
          formData.grades
        );
      } else if (activeTab === 'Learner') {
        // Ensure the class ID is extracted cleanly and parsed to an integer if present
        const rawClassId = formData.classIds[0];
        const singleClassId = rawClassId ? parseInt(rawClassId, 10) : null;
        
        // Pass arrays through cleanly to match your updated registerLearner service
        await registerLearner(
          formData.email, 
          formData.grade, 
          formData.highschool, 
          generatedNumber, 
          singleClassId, 
          formData.subjectIds
        );
      }

      setFeedback({ 
        error: null, 
        success: `Invitation containing tracking identification key (${generatedNumber}) dispatched successfully!` 
      });
      
      setShowAddModal(false);
      setGeneratedNumber('');
      setFormData({ 
        email: '', 
        centerId: '', 
        grade: '', 
        highschool: '', 
        classIds: [],  
        subjectIds: [], 
        grades: []      
      });
      fetchUsers();
    } catch (err) {
      console.error("Registration UI submission error:", err);
      setFeedback((prev) => ({ ...prev, error: err.response?.data?.message || "Registration pipeline allocation failed." }));
    } finally {
      setActionLoading(false);
    }
  };

  // 8. Open Pre-populated Modification Form Viewport
  const openEditModal = (user) => {
    // Map assigned array arrays to string arrays cleanly
    const assignedClassIds = (user.assigned_classes || []).map(c => String(c.class_id));
    const assignedSubjectIds = (user.assigned_subjects || []).map(s => String(s.subject_id));
    
    // Safely extract grades array for Teachers (fallback to empty array if not defined)
    const assignedGrades = user.grades 
      ? user.grades.map(g => String(g)) 
      : [];

    setEditFormData({
      id: user.user_id,             // 🚀 FIXED: Changed from userId to id
      firstName: user.first_name || '',
      lastName: user.last_name || '',
      email: user.email || '',
      role: user.user_role,
      center_id: user.center_id ? String(user.center_id) : '', // 🚀 FIXED: Changed from centerId to center_id
      grade: user.grade ? String(user.grade) : '',
      highschool: user.highschool || '',
      classIds: assignedClassIds,
      subjectIds: assignedSubjectIds,
      grades: assignedGrades         // 🚀 FIXED: Included for teacher checkboxes mapping layout
    });
    
    setShowEditModal(true);
  };

  // 9. Persist Altered Profile Metrics
  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setFeedback({ error: null, success: null });

    try {
      await updateUserBaseDetails(
        editFormData.userId,
        editFormData.firstName,
        editFormData.lastName,
        editFormData.email,
        editFormData.role,
        editFormData.role === 'Learner' ? parseInt(editFormData.grade, 10) : null,
        editFormData.role === 'Learner' ? editFormData.highschool : null,
        editFormData.classIds,
        editFormData.subjectIds
      );

      setFeedback({ error: null, success: "Profile structural assignments modified and synced across active catalogs successfully." });
      setShowEditModal(false);
      fetchUsers();
    } catch (err) {
      setFeedback((prev) => ({ ...prev, error: err.response?.data?.message || "Profile parameters could not be altered." }));
    } finally {
      setActionLoading(false);
    }
  };

  // 10. Soft Deactivation State Commits
  const handleDeactivate = async () => {
    if (!deactivateReason.trim()) return;
    setActionLoading(true);
    try {
      await deactivateUser(deactivateTarget.user_id, deactivateReason);
      setFeedback({ error: null, success: "Account successfully placed inside deactivated audit status." });
      setDeactivateTarget(null);
      setDeactivateReason('');
      fetchUsers();
    } catch (err) {
      setFeedback((prev) => ({ ...prev, error: err.response?.data?.message || "Deactivation failed." }));
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px', fontFamily: 'sans-serif', backgroundColor: '#f9f9f9', minHeight: '80vh' }}>
      
      {/* HEADER ACTION BARS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', color: '#1a1a1a' }}>Identity & Access Management</h1>
          <p style={{ margin: '4px 0 0', color: '#666', fontSize: '14px' }}>Provision, inspect, and manage system participant operational credentials.</p>
        </div>
        
        <button
          onClick={() => {
            setGeneratedNumber('');
            setFormData({ 
              email: '', 
              centerId: '', 
              grade: '', 
              highschool: '', 
              classIds: [],  
              subjectIds: [],
              grades: []     
            });
            setShowAddModal(true);
          }}
          style={{ padding: '10px 18px', backgroundColor: '#1976d2', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          + Register New {activeTab}
        </button>
      </div>

      {/* SEGMENT TAB HEADERS */}
      <div style={{ display: 'flex', borderBottom: '2px solid #e0e0e0', marginBottom: '20px', gap: '10px' }}>
        {isAdmin ? (
          <button
            onClick={() => setActiveTab('Center Manager')}
            style={{ padding: '12px 20px', border: 'none', background: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '15px', color: activeTab === 'Center Manager' ? '#1976d2' : '#666', borderBottom: activeTab === 'Center Manager' ? '3px solid #1976d2' : 'none', marginBottom: '-2px' }}
          >
            Center Managers
          </button>
        ) : (
          <>
            <button
              onClick={() => setActiveTab('Teacher')}
              style={{ padding: '12px 20px', border: 'none', background: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '15px', color: activeTab === 'Teacher' ? '#1976d2' : '#666', borderBottom: activeTab === 'Teacher' ? '3px solid #1976d2' : 'none', marginBottom: '-2px' }}
            >
              Teachers
            </button>
            <button
              onClick={() => setActiveTab('Learner')}
              style={{ padding: '12px 20px', border: 'none', background: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '15px', color: activeTab === 'Learner' ? '#1976d2' : '#666', borderBottom: activeTab === 'Learner' ? '3px solid #1976d2' : 'none', marginBottom: '-2px' }}
            >
              Learners
            </button>
          </>
        )}
      </div>

      {/* STATUS NOTIFICATION ALERTS */}
      {feedback.error && <div style={{ padding: '12px', backgroundColor: '#ffebee', color: '#c62828', borderRadius: '4px', marginBottom: '15px', fontSize: '14px' }}>{feedback.error}</div>}
      {feedback.success && <div style={{ padding: '12px', backgroundColor: '#e8f5e9', color: '#2e7d32', borderRadius: '4px', marginBottom: '15px', fontSize: '14px' }}>{feedback.success}</div>}

      {/* LOOKUP INPUT FILTER CONTAINER */}
      <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <input
          type="text"
          placeholder={`Search ${activeTab} profiles by name or contact electronic mail address...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ flex: 1, padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px' }}
        />
        <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#e0e0e0', color: '#333', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}>Search</button>
        {searchQuery && <button type="button" onClick={() => { setSearchQuery(''); fetchUsers(); }} style={{ padding: '10px 15px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#757575' }}>Clear</button>}
      </form>

      {/* COMPACT CORE ROSTER TABLE VIEWPORT */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>Querying structural roster matrices...</div>
        ) : (
      <div style={{ overflowX: 'auto', backgroundColor: '#fff', borderRadius: '6px', border: '1px solid #e0e0e0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '1px solid #e0e0e0' }}>
              <th style={{ padding: '12px 16px', fontWeight: '600' }}>Full Name</th>
              <th style={{ padding: '12px 16px', fontWeight: '600' }}>Email Address</th>
              <th style={{ padding: '12px 16px', fontWeight: '600' }}>Center Affiliation</th>
              {activeTab === 'Learner' && <th style={{ padding: '12px 16px', fontWeight: '600' }}>Grade & High School</th>}
              <th style={{ padding: '12px 16px', fontWeight: '600' }}>Assigned Classes & Subjects</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={activeTab === 'Learner' ? 5 : 4} style={{ padding: '30px', textAlign: 'center', color: '#999' }}>
                  No active profiles discovered matching filter configurations.
                </td>
              </tr>
            ) : (
              users.map((u) => {
                const fullName = (u.is_profile_claimed || u.first_name)
                  ? `${u.first_name || ''} ${u.last_name || ''}`.trim() 
                  : <em style={{ color: '#ff9800', fontWeight: '500' }}>[Unclaimed Workspace Profile]</em>;

                // Maps perfectly to your database schema columns
                const systemId = u.learner_number || u.teacher_number || u.manager_number || u.admin_number || "Pending Init";

                return (
                  <tr key={u.user_id} style={{ borderBottom: '1px solid #eee', backgroundColor: u.is_active ? 'transparent' : '#fafafa' }}>
                    <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                      <div style={{ fontWeight: '600', color: '#2d3748' }}>{fullName}</div>
                      <div style={{ fontSize: '11px', color: '#999', marginTop: '3px' }}>
                        System ID: {systemId}
                      </div>
                      
                      {/* CONTEXTUAL ROW INTERACTION ACTIONS */}
                      <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                        <button onClick={() => openEditModal(u)} style={{ background: 'none', border: 'none', padding: 0, color: '#1976d2', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>Edit Profile</button>
                        {u.is_active ? (
                          <button onClick={() => setDeactivateTarget(u)} style={{ background: 'none', border: 'none', padding: 0, color: '#d32f2f', cursor: 'pointer', fontSize: '12px' }}>Deactivate</button>
                        ) : (
                          <span style={{ fontSize: '11px', color: '#e53e3e', fontStyle: 'italic' }}>Status Locked ({u.reason_for_deactivation || 'No audit reason'})</span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#4a5568', verticalAlign: 'top' }}>{u.email}</td>
                    <td style={{ padding: '14px 16px', color: '#4a5568', verticalAlign: 'top' }}>
                      {u.center_name || `Center ID: ${u.center_id}`}
                    </td>
                    
                    {/* DYNAMIC LEARNER METRICS COLUMNS */}
                    {activeTab === 'Learner' && (
                      <td style={{ padding: '14px 16px', color: '#4a5568', verticalAlign: 'top' }}>
                        <span style={{ fontWeight: '600' }}>Grade {u.grade || 'N/A'}</span>
                        <div style={{ color: '#718096', fontSize: '12px', marginTop: '2px' }}>{u.highschool || 'No highschool field defined'}</div>
                      </td>
                    )}
                    
                    {/* RELATIONAL MATRIX LIVE GRAPH DISPLAYS */}
                    <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                      {activeTab === 'Center Manager' ? (
                        <span style={{ fontSize: '12px', color: '#718096', fontStyle: 'italic' }}>Complete Center Control Scope</span>
                      ) : (
                        <>
                          {/* Classes Rendering Layer */}
                          <div style={{ marginBottom: '6px' }}>
                            <strong style={{ fontSize: '11px', color: '#718096', display: 'block', textTransform: 'uppercase' }}>Classes:</strong>
                            {u.assigned_classes && u.assigned_classes.length > 0 ? (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '2px' }}>
                                {u.assigned_classes.map((c) => (
                                  <span key={c.class_id} style={{ padding: '2px 6px', backgroundColor: '#ebf8ff', color: '#2b6cb0', borderRadius: '4px', fontSize: '11px', fontWeight: '500' }}>
                                    {c.class_name}
                                  </span>
                                ))}
                              </div>
                            ) : <span style={{ fontSize: '12px', color: '#a0aec0', fontStyle: 'italic' }}>None allocated</span>}
                          </div>

                          {/* Subjects Rendering Layer */}
                          <div>
                            <strong style={{ fontSize: '11px', color: '#718096', display: 'block', textTransform: 'uppercase' }}>Subjects:</strong>
                            {u.assigned_subjects && u.assigned_subjects.length > 0 ? (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '2px' }}>
                                {u.assigned_subjects.map((s) => (
                                  <span key={s.subject_id} style={{ padding: '2px 6px', backgroundColor: '#f0fff4', color: '#22543d', borderRadius: '4px', fontSize: '11px', fontWeight: '500' }}>
                                    {s.subject_name}
                                  </span>
                                ))}
                              </div>
                            ) : <span style={{ fontSize: '12px', color: '#a0aec0', fontStyle: 'italic' }}>None bound</span>}
                          </div>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
          )}

      {/* POPUP OVERLAY MODAL: INVITE USER PROFILE (Upgraded with Checkbox Arrays) */}
      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '8px', width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto', boxSizing: 'border-box' }}>
            <h3 style={{ margin: '0 0 18px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Register New {activeTab}</h3>
            
            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {/* 1. NOTIFICATION EMAIL ADDRESS */}
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 'bold', color: '#4a5568' }}>Notification Email Address</label>
                <input
                  type="email" required placeholder="e.g. participant@domain.za"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e0', borderRadius: '4px', boxSizing: 'border-box' }}
                />
              </div>

              {/* 2. OPERATIONAL CENTER SELECTION (ADMIN ONLY) */}
              {(isAdmin && (activeTab === 'Center Manager' || activeTab === 'Teacher')) && (
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 'bold', color: '#4a5568' }}>Operational Center Assignment</label>
                  <select
                    required value={formData.centerId}
                    onChange={(e) => setFormData(prev => ({ ...prev, centerId: e.target.value }))}
                    style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e0', borderRadius: '4px', backgroundColor: '#fff' }}
                  >
                    <option value="">-- {centersLoading ? 'Loading Centers...' : 'Choose Center'} --</option>
                    {centers.map((center) => (
                      <option key={center.center_id} value={center.center_id}>{center.center_name} (ID: {center.center_id})</option>
                    ))}
                  </select>
                </div>
              )}

              {/* 3. LEARNER SPECIFIC METRICS: GRADE AND HIGHSCHOOL */}
              {activeTab === 'Learner' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 'bold', color: '#4a5568' }}>Grade Level</label>
                    <select
                      required value={formData.grade}
                      onChange={(e) => setFormData(prev => ({ ...prev, grade: e.target.value, subjectIds: [] }))}
                      style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e0', borderRadius: '4px', backgroundColor: '#fff' }}
                    >
                      <option value="">-- Select --</option>
                      <option value="10">Grade 10</option>
                      <option value="11">Grade 11</option>
                      <option value="12">Grade 12</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 'bold', color: '#4a5568' }}>High School Affiliation</label>
                    <input
                      type="text" required placeholder="e.g. High School Name"
                      value={formData.highschool}
                      onChange={(e) => setFormData(prev => ({ ...prev, highschool: e.target.value }))}
                      style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e0', borderRadius: '4px' }}
                    />
                  </div>
                </div>
              )}

              {/* 4. TEACHER SPECIFIC METRICS: GRADES ARRAY (STATIC MULTI-SELECT) */}
              {activeTab === 'Teacher' && (
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 'bold', color: '#4a5568' }}>Allocate Teaching Grades (Multi-Select)</label>
                  <div style={{ border: '1px solid #cbd5e0', borderRadius: '4px', padding: '10px', maxHeight: '100px', overflowY: 'auto', backgroundColor: '#fff' }}>
                    {[10, 11, 12].map((gradeNum) => (
                      <label key={gradeNum} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', fontSize: '13px', cursor: 'pointer', color: '#2d3748' }}>
                        <input
                          type="checkbox"
                          checked={formData.grades?.includes(gradeNum)}
                          onChange={(e) => {
                            const currentGrades = formData.grades || [];
                            const updatedGrades = e.target.checked
                              ? [...currentGrades, gradeNum]
                              : currentGrades.filter(g => g !== gradeNum);
                            setFormData(prev => ({ ...prev, grades: updatedGrades }));
                          }}
                        />
                        Grade {gradeNum}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. OPERATIONAL CLASSES INFRASTRUCTURE MATRIX */}
              {(activeTab === 'Teacher' || activeTab === 'Learner') && (
                <>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 'bold', color: '#4a5568' }}>
                      {activeTab === 'Teacher' ? 'Allocate Teaching Classes (Multi-Select)' : 'Assign Cohort Room Class (Select One)'}
                    </label>
                    <div style={{ border: '1px solid #cbd5e0', borderRadius: '4px', padding: '10px', maxHeight: '100px', overflowY: 'auto', backgroundColor: '#fff' }}>
                      {classes.map((cls) => (
                        <label key={cls.class_id} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', fontSize: '13px', cursor: 'pointer', color: '#2d3748' }}>
                          <input
                            type="checkbox"
                            checked={formData.classIds.includes(cls.class_id)}
                            onChange={() => {
                              if (activeTab === 'Learner') {
                                // Force a single item array for single selection matching
                                setFormData(prev => ({ ...prev, classIds: [cls.class_id] }));
                              } else {
                                handleCheckboxToggle('classIds', cls.class_id, false);
                              }
                            }}
                          />
                          {cls.class_name}
                        </label>
                      ))}
                      {classes.length === 0 && <small style={{ color: '#a0aec0' }}>No functional rooms available.</small>}
                    </div>
                  </div>

                  {/* 6. CURRICULUM SUBJECTS MATRIX */}
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 'bold', color: '#4a5568' }}>Bind Curriculum Catalogs (Multi-Select)</label>
                    <div style={{ border: '1px solid #cbd5e0', borderRadius: '4px', padding: '10px', maxHeight: '120px', overflowY: 'auto', backgroundColor: '#fff' }}>
                      {subjects.map((sub) => (
                        <label key={sub.subject_id} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', fontSize: '13px', cursor: 'pointer', color: '#2d3748' }}>
                          <input
                            type="checkbox"
                            checked={formData.subjectIds.includes(sub.subject_id)}
                            onChange={() => handleCheckboxToggle('subjectIds', sub.subject_id, false)}
                          />
                          {sub.subject_name} {sub.grade ? `(Gr ${sub.grade})` : ''}
                        </label>
                      ))}
                      {subjects.length === 0 && <small style={{ color: '#a0aec0' }}>{activeTab === 'Learner' ? 'Please verify grade parameters first.' : 'No active courses loaded.'}</small>}
                    </div>
                  </div>
                </>
              )}
              
              {/* 7. ID SEQUENCE CODE GENERATION PANEL */}
              <div style={{ marginTop: '4px', padding: '14px', backgroundColor: '#f7fafc', borderRadius: '6px', border: '1px dashed #cbd5e0' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifycontent: 'space-between', marginBottom: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#2d3748' }}>Identity Number Sequence</label>
                  <button 
                    type="button" onClick={handleGenerateNumber}
                    disabled={generatingNumber || !formData.email.trim()}
                    style={{ padding: '6px 12px', fontSize: '12px', backgroundColor: '#2b6cb0', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}
                  >
                    {generatingNumber ? 'Generating...' : `Generate ID`}
                  </button>
                </div>
                <input
                  type="text" readOnly placeholder="Click code generator gate above" value={generatedNumber}
                  style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e0', backgroundColor: '#edf2f7', borderRadius: '4px', boxSizing: 'border-box', fontSize: '16px', fontWeight: 'bold', textAlign: 'center', color: '#2b6cb0' }}
                />
              </div>

              {/* 8. ACTIONS MODAL FOOTER */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px', borderTop: '1px solid #eee', paddingTop: '14px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ padding: '10px 16px', border: '1px solid #cbd5e0', background: '#fff', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                <button 
                  type="submit" 
                  style={{ padding: '10px 20px', background: !generatedNumber || actionLoading ? '#a0aec0' : '#2e7d32', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }} 
                  disabled={actionLoading || !generatedNumber}
                >
                  {actionLoading ? 'Mailing Profile...' : 'Submit & Dispatched Access'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

  {/* POPUP OVERLAY MODAL: PREFILLED COMPONENT PROFILE EDITOR */}
    {showEditModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '8px', width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto', boxSizing: 'border-box', color: '#2d3748' }}>
            <h3 style={{ margin: '0 0 18px', borderBottom: '1px solid #eee', paddingBottom: '10px', color: '#1a202c' }}>Update Operational Workspace</h3>
            
            <form onSubmit={handleUpdateUser} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 'bold', color: '#4a5568' }}>First Name</label>
                  <input
                    type="text" required value={editFormData.firstName || ''}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e0', borderRadius: '4px', backgroundColor: '#fff', color: '#2d3748' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 'bold', color: '#4a5568' }}>Last Name</label>
                  <input
                    type="text" required value={editFormData.lastName || ''}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e0', borderRadius: '4px', backgroundColor: '#fff', color: '#2d3748' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 'bold', color: '#4a5568' }}>Email Address Target</label>
                <input
                  type="email" required value={editFormData.email || ''}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, email: e.target.value }))}
                  style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e0', borderRadius: '4px', backgroundColor: '#fff', color: '#2d3748' }}
                />
              </div>

              {/* ADMIN OPTION: REASSIGN CENTER MANAGERS / USERS TO DIFFERENT CENTERS */}
              {editFormData.role === 'Center Manager' && (
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 'bold', color: '#4a5568' }}>Center Affiliation Assignment</label>
                  <select
                    value={editFormData.center_id || ''}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, center_id: e.target.value }))}
                    style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e0', borderRadius: '4px', backgroundColor: '#fff', color: '#2d3748' }}
                  >
                    <option value="" disabled style={{ color: '#2d3748' }}>Select Operational Center Venue</option>
                    {centers && centers.map((ctr) => (
                      <option key={ctr.center_id} value={String(ctr.center_id)} style={{ color: '#2d3748' }}>
                        {ctr.center_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {editFormData.role === 'Learner' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 'bold', color: '#4a5568' }}>Grade Matrix</label>
                    <select
                      required value={editFormData.grade || ''}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, grade: e.target.value }))}
                      style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e0', borderRadius: '4px', backgroundColor: '#fff', color: '#2d3748' }}
                    >
                      <option value="10" style={{ color: '#2d3748' }}>Grade 10</option>
                      <option value="11" style={{ color: '#2d3748' }}>Grade 11</option>
                      <option value="12" style={{ color: '#2d3748' }}>Grade 12</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 'bold', color: '#4a5568' }}>High School Context</label>
                    <input
                      type="text" required value={editFormData.highschool || ''}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, highschool: e.target.value }))}
                      style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e0', borderRadius: '4px', backgroundColor: '#fff', color: '#2d3748' }}
                    />
                  </div>
                </div>
              )}

              {/* TEACHER LOGIC: MODIFY ASSIGNED GRADES */}
              {editFormData.role === 'Teacher' && (
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 'bold', color: '#4a5568' }}>Assigned Grades Scope (Multi-Select)</label>
                  <div style={{ border: '1px solid #cbd5e0', borderRadius: '4px', padding: '10px', maxHeight: '100px', overflowY: 'auto', backgroundColor: '#fff' }}>
                    {['10', '11', '12'].map((gr) => (
                      <label key={gr} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', fontSize: '13px', cursor: 'pointer', color: '#2d3748' }}>
                        <input
                          type="checkbox"
                          checked={editFormData.grades && editFormData.grades.includes(gr)}
                          onChange={() => {
                            const currentGrades = editFormData.grades || [];
                            const updatedGrades = currentGrades.includes(gr)
                              ? currentGrades.filter(g => g !== gr)
                              : [...currentGrades, gr];
                            setEditFormData(prev => ({ ...prev, grades: updatedGrades }));
                          }}
                        />
                        Grade {gr}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* CLASSES AND SUBJECTS SELECTION SCENARIOS */}
              {(editFormData.role === 'Teacher' || editFormData.role === 'Learner') && (
                <>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 'bold', color: '#4a5568' }}>
                      {editFormData.role === 'Teacher' ? 'Modify Assigned Classes (Multi-Select)' : 'Change Classroom Venue Allocation'}
                    </label>
                    <div style={{ border: '1px solid #cbd5e0', borderRadius: '4px', padding: '10px', maxHeight: '100px', overflowY: 'auto', backgroundColor: '#fff' }}>
                      {classes.map((cls) => (
                        <label key={cls.class_id} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', fontSize: '13px', cursor: 'pointer', color: '#2d3748' }}>
                          <input
                            type="checkbox"
                            checked={editFormData.classIds && editFormData.classIds.includes(String(cls.class_id))}
                            onChange={() => {
                              if (editFormData.role === 'Learner') {
                                // Learner is single-select enforced via array layout configuration
                                setEditFormData(prev => ({ ...prev, classIds: [String(cls.class_id)] }));
                              } else {
                                const currentClassIds = editFormData.classIds || [];
                                const updatedClassIds = currentClassIds.includes(String(cls.class_id))
                                  ? currentClassIds.filter(id => id !== String(cls.class_id))
                                  : [...currentClassIds, String(cls.class_id)];
                                setEditFormData(prev => ({ ...prev, classIds: updatedClassIds }));
                              }
                            }}
                          />
                          {cls.class_name}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 'bold', color: '#4a5568' }}>Synchronize Subject Catalogs (Multi-Select)</label>
                    <div style={{ border: '1px solid #cbd5e0', borderRadius: '4px', padding: '10px', maxHeight: '120px', overflowY: 'auto', backgroundColor: '#fff' }}>
                      {subjects.map((sub) => (
                        <label key={sub.subject_id} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', fontSize: '13px', cursor: 'pointer', color: '#2d3748' }}>
                          <input
                            type="checkbox"
                            checked={editFormData.subjectIds && editFormData.subjectIds.includes(String(sub.subject_id))}
                            onChange={() => {
                              const currentSubjectIds = editFormData.subjectIds || [];
                              const updatedSubjectIds = currentSubjectIds.includes(String(sub.subject_id))
                                ? currentSubjectIds.filter(id => id !== String(sub.subject_id))
                                : [...currentSubjectIds, String(sub.subject_id)];
                              setEditFormData(prev => ({ ...prev, subjectIds: updatedSubjectIds }));
                            }}
                          />
                          {sub.subject_name} {sub.grade ? `(Gr ${sub.grade})` : ''}
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '14px', borderTop: '1px solid #eee', paddingTop: '14px' }}>
                <button type="button" onClick={() => setShowEditModal(false)} style={{ padding: '10px 16px', border: '1px solid #cbd5e0', background: '#fff', borderRadius: '4px', cursor: 'pointer', color: '#2d3748' }}>Cancel</button>
                <button type="submit" style={{ padding: '10px 20px', background: '#1976d2', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }} disabled={actionLoading}>
                  {actionLoading ? 'Saving changes...' : 'Save Configuration Parameters'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POPUP OVERLAY MODAL: DEACTIVATION REASON */}
      {deactivateTarget && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '8px', width: '100%', maxWidth: '400px', boxSizing: 'border-box' }}>
            <h3 style={{ margin: '0 0 10px', color: '#c62828' }}>Deactivate System Profile</h3>
            <p style={{ margin: '0 0 14px', fontSize: '13px', color: '#666' }}>Are you sure you want to lock access for <strong>{deactivateTarget.email}</strong>?</p>
            <textarea
              required rows="3" value={deactivateReason}
              onChange={(e) => setDeactivateReason(e.target.value)}
              placeholder="Provide administrative audit reason..."
              style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', marginBottom: '16px', fontFamily: 'sans-serif', fontSize: '13px' }}
            />
            <div style={{ display: 'flex', justifyContent: 'end', gap: '10px' }}>
              <button type="button" onClick={() => setDeactivateTarget(null)} style={{ padding: '8px 14px', border: '1px solid #ccc', background: '#fff', borderRadius: '4px' }} disabled={actionLoading}>Cancel</button>
              <button type="button" onClick={handleDeactivate} style={{ padding: '8px 16px', background: '#d32f2f', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold' }} disabled={actionLoading || !deactivateReason.trim()}>
                {actionLoading ? 'Processing...' : 'Confirm Lockout'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default UserManagement;