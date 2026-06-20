import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import companyService from '../../services/companyService';
import ApplicationForm from './ApplicationForm';
import toast from 'react-hot-toast';
import { 
  FiSearch, 
  FiMapPin, 
  FiArrowLeft,
  FiBriefcase,
  FiUsers,
  FiGlobe,
  FiMail,
  FiPhone,
  FiArrowRight,
  FiInfo,
  FiClock,
  FiDollarSign,
  FiCalendar,
  FiExternalLink,
  FiSend,
  FiX
} from 'react-icons/fi';
import './StudentCompanies.css';

const StudentCompanies = () => {
  const { user } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [companyInternships, setCompanyInternships] = useState([]);
  const [loadingInternships, setLoadingInternships] = useState(false);
  const [loadingCompanyDetails, setLoadingCompanyDetails] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [modalInternship, setModalInternship] = useState(null);
  const [selectedInternship, setSelectedInternship] = useState(null);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [appliedInternships, setAppliedInternships] = useState(new Set());

  useEffect(() => {
    loadCompanies();
    loadAppliedInternships();
  }, []);

  useEffect(() => {
    filterCompanies();
  }, [searchTerm, companies]);

  const loadAppliedInternships = async () => {
    try {
      const applications = await companyService.getStudentApplications(user.id);
      const appliedIds = new Set(applications.map(app => app.internshipId));
      setAppliedInternships(appliedIds);
    } catch (error) {
      console.error('Error loading applied internships:', error);
    }
  };

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const data = await companyService.getTopCompanies();
      console.log('Companies loaded:', data);
      
      const processedCompanies = (data || []).map(company => ({
        id: company.id,
        companyName: company.companyName || company.name || 'Company',
        location: company.location || 'Not specified',
        description: company.description || 'Leading company offering internship opportunities.',
        email: company.email || company.user?.email || null,
        phone: company.phone || company.user?.phone || null,
        website: company.website || null,
        internshipCount: company.internshipCount || 0
      }));
      
      setCompanies(processedCompanies);
      setFiltered(processedCompanies);
    } catch (error) {
      console.error('Error loading companies:', error);
      toast.error('Failed to load companies');
      setCompanies([]);
      setFiltered([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompleteCompanyDetails = async (companyId) => {
    try {
      // Try to get company by ID
      try {
        const companyData = await companyService.getCompanyById(companyId);
        console.log('Company data from API:', companyData);
        
        if (companyData) {
          // Check different possible data structures
          let description = '';
          let email = '';
          let phone = '';
          let website = '';
          let location = '';
          
          // Extract from data.data if nested
          const company = companyData.data || companyData;
          
          description = company.description || company.companyDescription || '';
          email = company.email || company.user?.email || '';
          phone = company.phone || company.user?.phone || '';
          website = company.website || '';
          location = company.location || '';
          
          return {
            description: description,
            email: email,
            phone: phone,
            website: website,
            location: location
          };
        }
      } catch (e) {
        console.log('Error fetching company by ID:', e);
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching company details:', error);
      return null;
    }
  };

  const loadCompanyDetails = async (company) => {
    setLoadingCompanyDetails(true);
    try {
      console.log('🔍 Loading details for company:', company.companyName);
      
      // Start with basic company info from list
      let detailedCompany = { ...company };
      
      // Try to fetch additional details
      const additionalDetails = await fetchCompleteCompanyDetails(company.id);
      
      if (additionalDetails) {
        detailedCompany = {
          ...detailedCompany,
          description: additionalDetails.description || company.description,
          email: additionalDetails.email || company.email,
          phone: additionalDetails.phone || company.phone,
          website: additionalDetails.website || company.website,
          location: additionalDetails.location || company.location
        };
      }
      
      // Also try to get info from internships if needed
      if (!detailedCompany.description || detailedCompany.description === 'Leading company offering internship opportunities.') {
        try {
          const internships = await companyService.getAllOpenInternships();
          const companyInternshipsData = internships.filter(i => 
            i.companyId === company.id || i.company?.id === company.id
          );
          
          if (companyInternshipsData.length > 0 && companyInternshipsData[0].company) {
            const internshipCompany = companyInternshipsData[0].company;
            if (internshipCompany.description) {
              detailedCompany.description = internshipCompany.description;
            }
            if (internshipCompany.email) {
              detailedCompany.email = internshipCompany.email;
            }
            if (internshipCompany.phone) {
              detailedCompany.phone = internshipCompany.phone;
            }
          }
        } catch (e) {
          console.log('Could not get company info from internships');
        }
      }
      
      // Ensure all fields have values
      setSelectedCompany({
        id: detailedCompany.id,
        companyName: detailedCompany.companyName,
        location: detailedCompany.location || 'Location not specified',
        description: detailedCompany.description || 'No description available.',
        email: detailedCompany.email || 'Not available',
        phone: detailedCompany.phone || 'Not available',
        website: detailedCompany.website || null,
        internshipCount: detailedCompany.internshipCount
      });
      
    } catch (error) {
      console.error('Error loading company details:', error);
      // Set fallback company data
      setSelectedCompany({
        ...company,
        description: company.description || 'No description available.',
        email: company.email || 'Not available',
        phone: company.phone || 'Not available',
        website: company.website || null
      });
      toast.error('Could not load complete company details');
    } finally {
      setLoadingCompanyDetails(false);
    }
  };

  const loadCompanyInternships = async (companyId) => {
    setLoadingInternships(true);
    try {
      console.log('🔍 Loading internships for company ID:', companyId);
      
      const allInternships = await companyService.getAllOpenInternships();
      console.log('All internships count:', allInternships.length);
      
      const filteredInternships = allInternships.filter(internship => {
        const internshipCompanyId = internship.companyId || 
                                   internship.company?.id || 
                                   internship.company_id;
        return Number(internshipCompanyId) === Number(companyId);
      });
      
      console.log(`✅ Found ${filteredInternships.length} internships`);
      
      const processedInternships = filteredInternships.map(internship => ({
        ...internship,
        location: internship.location || 'Remote',
        duration: internship.duration || '3 months',
        stipend: internship.stipend || 0,
        numberOfOpenings: internship.numberOfOpenings || 1,
        requiredSkills: internship.requiredSkills || '',
        description: internship.description || 'No description available.',
        type: internship.type || 'Online',
        status: internship.status || 'OPEN',
        endDate: internship.endDate
      }));
      
      setCompanyInternships(processedInternships);
      
      if (processedInternships.length === 0) {
        toast('No internships available for this company', {
          icon: 'ℹ️',
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('❌ Error loading company internships:', error);
      setCompanyInternships([]);
      toast.error('Could not load internships. Please try again.');
    } finally {
      setLoadingInternships(false);
    }
  };

  const handleCompanyClick = async (company) => {
    setSelectedCompany(null);
    setCompanyInternships([]);
    
    await loadCompanyDetails(company);
    await loadCompanyInternships(company.id);
  };

  const handleBackClick = () => {
    setSelectedCompany(null);
    setCompanyInternships([]);
  };

  const handleShowDetails = (internship) => {
    setModalInternship(internship);
    setShowDetailsModal(true);
  };

  const handleCloseModal = () => {
    setShowDetailsModal(false);
    setModalInternship(null);
  };

  const handleApplyClick = (internship) => {
    if (appliedInternships.has(internship.id)) {
      toast.error('You have already applied for this internship');
      return;
    }
    
    if (isDeadlinePassed(internship.endDate)) {
      toast.error('Application deadline has passed');
      return;
    }
    
    setSelectedInternship(internship);
    setShowApplicationForm(true);
    setShowDetailsModal(false);
  };

  const handleApplicationClose = () => {
    setShowApplicationForm(false);
    setSelectedInternship(null);
  };

  const handleApplicationSuccess = () => {
    loadAppliedInternships();
    loadCompanyInternships(selectedCompany?.id);
  };

  const filterCompanies = () => {
    if (!searchTerm.trim()) {
      setFiltered(companies);
      return;
    }
    const term = searchTerm.toLowerCase();
    const filteredCompanies = companies.filter(company =>
      company.companyName?.toLowerCase().includes(term) ||
      company.location?.toLowerCase().includes(term)
    );
    setFiltered(filteredCompanies);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const isDeadlineNear = (endDate) => {
    if (!endDate) return false;
    const today = new Date();
    const deadline = new Date(endDate);
    const diffTime = deadline - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays > 0;
  };

  const isDeadlinePassed = (endDate) => {
    if (!endDate) return false;
    const today = new Date();
    const deadline = new Date(endDate);
    return deadline < today;
  };

  const getInitials = (name) => {
    if (!name) return 'CO';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const getColor = (name) => {
    const colors = [
      '#0a2540', '#1e5a8a', '#2c6e9e', '#3a7b9f',
      '#1e4a76', '#2c5f8a', '#0a3a5a', '#1e6a8a'
    ];
    if (!name) return colors[0];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading companies...</p>
      </div>
    );
  }

  return (
    <div className="companies-page">
      {/* Header */}
      <div className="page-header">
        <Link to="/student/dashboard" className="back-link">
          <FiArrowLeft /> Dashboard
        </Link>
        <h1 className="page-title">Top Hiring Companies</h1>
        <p className="page-subtitle">Explore internships from leading companies</p>
      </div>

      {!selectedCompany ? (
        /* Companies List View */
        <>
          {/* Search Section */}
          <div className="search-section">
            <div className="search-box">
              <FiSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search companies by name or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            <div className="companies-count">
              <FiUsers /> {filtered.length} companies
            </div>
          </div>

          {/* Companies Grid */}
          {filtered.length === 0 ? (
            <div className="empty-state">
              <FiBriefcase className="empty-icon" />
              <h3>No companies found</h3>
              <p>Try adjusting your search criteria</p>
              <button className="clear-btn" onClick={() => setSearchTerm('')}>
                Clear Search
              </button>
            </div>
          ) : (
            <div className="companies-grid">
              {filtered.map((company) => (
                <div 
                  key={company.id} 
                  className="company-card clickable"
                  onClick={() => handleCompanyClick(company)}
                >
                  <div className="company-card-inner">
                    <div className="company-header-row">
                      <div 
                        className="company-logo"
                        style={{ backgroundColor: getColor(company.companyName) }}
                      >
                        <span className="company-initials">{getInitials(company.companyName)}</span>
                      </div>
                      {company.internshipCount > 0 && (
                        <div className="hiring-badge">
                          <span className="hiring-dot"></span>
                          Hiring Now
                        </div>
                      )}
                    </div>
                    
                    <h3 className="company-name">{company.companyName}</h3>
                    
                    <div className="company-location">
                      <FiMapPin className="location-icon" /> 
                      <span>{company.location || 'Location not specified'}</span>
                    </div>
                    
                    <div className="company-description-preview">
                      <p>
                        {company.description 
                          ? (company.description.length > 120 
                              ? `${company.description.substring(0, 120)}...` 
                              : company.description)
                          : 'Leading company in the industry offering great internship opportunities for students.'}
                      </p>
                    </div>
                    
                    <div className="card-footer">
                      <span className="view-link">
                        View Open Positions <FiArrowRight className="footer-icon" />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        /* Company Detail View */
        <div className="company-detail-view">
          <button className="back-to-companies" onClick={handleBackClick}>
            <FiArrowLeft /> Back to Companies
          </button>

          {loadingCompanyDetails ? (
            <div className="loading-details">
              <div className="small-spinner"></div>
              <p>Loading company details...</p>
            </div>
          ) : (
            <>
              {/* Company Profile Card */}
              <div className="company-profile-card">
                <div className="profile-header">
                  <div 
                    className="profile-logo"
                    style={{ backgroundColor: getColor(selectedCompany.companyName) }}
                  >
                    <span className="profile-initials">{getInitials(selectedCompany.companyName)}</span>
                  </div>
                  <div className="profile-info">
                    <h2 className="profile-company-name">{selectedCompany.companyName}</h2>
                    <div className="profile-meta">
                      <span className="profile-location">
                        <FiMapPin /> {selectedCompany.location || 'Location not specified'}
                      </span>
                      {selectedCompany.website && selectedCompany.website !== '#' && (
                        <a 
                          href={selectedCompany.website.startsWith('http') ? selectedCompany.website : `https://${selectedCompany.website}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="profile-website-link"
                        >
                          <FiGlobe /> {selectedCompany.website}
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                <div className="profile-description">
                  <h3><FiInfo /> About Company</h3>
                  <p className="company-description">
                    {selectedCompany.description || 'No description available.'}
                  </p>
                </div>

                <div className="profile-contact">
                  <h3>Contact Information</h3>
                  <div className="contact-grid">
                    <div className="contact-item">
                      <FiMail className="contact-icon" />
                      <span>{selectedCompany.email || 'Not available'}</span>
                    </div>
                    <div className="contact-item">
                      <FiPhone className="contact-icon" />
                      <span>{selectedCompany.phone || 'Not available'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Internships Section */}
              <div className="company-internships-section">
                <h3 className="internships-section-title">
                  <FiBriefcase /> Internships at {selectedCompany.companyName}
                </h3>

                {loadingInternships ? (
                  <div className="loading-internships">
                    <div className="small-spinner"></div>
                    <p>Loading internships...</p>
                  </div>
                ) : companyInternships.length === 0 ? (
                  <div className="no-internships">
                    <p>No internships available at this company right now.</p>
                  </div>
                ) : (
                  <div className="internships-grid">
                    {companyInternships.map((internship) => {
                      const isApplied = appliedInternships.has(internship.id);
                      const deadlineNear = isDeadlineNear(internship.endDate) && !isDeadlinePassed(internship.endDate);
                      const deadlinePassed = isDeadlinePassed(internship.endDate);
                      
                      return (
                        <div key={internship.id} className={`internship-card-modern ${isApplied ? 'applied' : ''}`}>
                          {isApplied && (
                            <div className="applied-badge-small">
                              Applied
                            </div>
                          )}
                          
                          <h3 className="card-title">{internship.title}</h3>

                          <div className="company-info">
                            <FiBriefcase className="company-icon" />
                            <span>{selectedCompany.companyName}</span>
                          </div>

                          <div className="details-section">
                            <div className="detail-item">
                              <FiMapPin className="detail-icon" />
                              <span><strong>Location:</strong> {internship.location || 'Not specified'}</span>
                            </div>
                            <div className="detail-item">
                              <FiClock className="detail-icon" />
                              <span><strong>Duration:</strong> {internship.duration || 'Not specified'}</span>
                            </div>
                            <div className="detail-item">
                              <FiDollarSign className="detail-icon" />
                              <span><strong>Stipend:</strong> ₹{internship.stipend}/month</span>
                            </div>
                          </div>

                          <div className="date-section">
                            <div className="date-label">APPLICATIONS END</div>
                            <div className="date-value">
                              <FiCalendar className="date-icon" />
                              <span>{formatDate(internship.endDate)}</span>
                              {deadlineNear && !deadlinePassed && (
                                <span className="deadline-badge">Closing Soon</span>
                              )}
                              {deadlinePassed && (
                                <span className="deadline-badge passed">Expired</span>
                              )}
                            </div>
                          </div>

                          <button 
                            className="show-details-btn"
                            onClick={() => handleShowDetails(internship)}
                          >
                            <FiExternalLink /> Show Details
                          </button>

                          <button 
                            className={`apply-now-btn ${isApplied ? 'applied' : ''} ${deadlinePassed ? 'disabled' : ''}`}
                            onClick={() => handleApplyClick(internship)}
                            disabled={isApplied || deadlinePassed}
                          >
                            {isApplied ? (
                              'Already Applied'
                            ) : deadlinePassed ? (
                              'Applications Closed'
                            ) : (
                              <>Apply Now <FiSend /></>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && modalInternship && (
        <div className="details-modal-overlay" onClick={handleCloseModal}>
          <div className="details-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={handleCloseModal}>
              <FiX />
            </button>
            
            <div className="modal-header">
              <h2 className="modal-title">{modalInternship.title}</h2>
              <div className="modal-company">
                <FiBriefcase className="modal-company-icon" />
                <span>{selectedCompany?.companyName || 'Company'}</span>
              </div>
            </div>

            <div className="modal-body">
              <div className="modal-details-grid">
                <div className="modal-detail-card">
                  <FiMapPin className="modal-detail-icon" />
                  <div className="modal-detail-content">
                    <span className="modal-detail-label">Location</span>
                    <span className="modal-detail-value">{modalInternship.location || 'Not specified'}</span>
                  </div>
                </div>
                
                <div className="modal-detail-card">
                  <FiClock className="modal-detail-icon" />
                  <div className="modal-detail-content">
                    <span className="modal-detail-label">Duration</span>
                    <span className="modal-detail-value">{modalInternship.duration || 'Not specified'}</span>
                  </div>
                </div>
                
                <div className="modal-detail-card">
                  <FiDollarSign className="modal-detail-icon" />
                  <div className="modal-detail-content">
                    <span className="modal-detail-label">Stipend</span>
                    <span className="modal-detail-value">₹{modalInternship.stipend}/month</span>
                  </div>
                </div>
                
                <div className="modal-detail-card">
                  <FiUsers className="modal-detail-icon" />
                  <div className="modal-detail-content">
                    <span className="modal-detail-label">Openings</span>
                    <span className="modal-detail-value">{modalInternship.numberOfOpenings || 0}</span>
                  </div>
                </div>
                
                <div className="modal-detail-card">
                  <FiBriefcase className="modal-detail-icon" />
                  <div className="modal-detail-content">
                    <span className="modal-detail-label">Work Type</span>
                    <span className="work-type-badge">{modalInternship.type || 'Online'}</span>
                  </div>
                </div>
                
                <div className="modal-detail-card">
                  <FiCalendar className="modal-detail-icon" />
                  <div className="modal-detail-content">
                    <span className="modal-detail-label">Apply By</span>
                    <span className="modal-detail-value deadline-value">
                      {formatDate(modalInternship.endDate)}
                      {isDeadlineNear(modalInternship.endDate) && !isDeadlinePassed(modalInternship.endDate) && (
                        <span className="deadline-badge modal-deadline">Closing Soon</span>
                      )}
                      {isDeadlinePassed(modalInternship.endDate) && (
                        <span className="deadline-badge passed modal-deadline">Expired</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {modalInternship.description && (
                <div className="modal-section">
                  <h3 className="modal-section-title">Description</h3>
                  <p className="modal-description">{modalInternship.description}</p>
                </div>
              )}

              {modalInternship.requiredSkills && (
                <div className="modal-section">
                  <h3 className="modal-section-title">Required Skills</h3>
                  <div className="modal-skills">
                    {modalInternship.requiredSkills?.split(',').map((skill, idx) => (
                      <span key={idx} className="modal-skill-tag">{skill.trim()}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="modal-close-footer-btn" onClick={handleCloseModal}>
                Close
              </button>
              <button 
                className="modal-apply-now-btn"
                onClick={() => {
                  handleCloseModal();
                  handleApplyClick(modalInternship);
                }}
                disabled={appliedInternships.has(modalInternship.id) || isDeadlinePassed(modalInternship.endDate)}
              >
                {appliedInternships.has(modalInternship.id) ? 'Already Applied' : 'Apply Now'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Application Form Modal */}
      {showApplicationForm && selectedInternship && (
        <ApplicationForm
          internship={selectedInternship}
          onClose={handleApplicationClose}
          onSuccess={handleApplicationSuccess}
        />
      )}
    </div>
  );
};

export default StudentCompanies;