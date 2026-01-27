'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Upload, Send, CheckCircle } from 'lucide-react';

interface FormField {
  field_id: string;
  field_name: string;
  field_type: string;
  field_label: string;
  field_description: string | null;
  is_required: boolean;
  field_options: string[];
  validation_rules: any;
}

export default function HackathonSubmitPage() {
  const params = useParams();
  const router = useRouter();
  const hackathonId = params.hackathonId as string;

  // Extract form type from URL query parameter (e.g., ?form=team_formation)
  const [searchParams] = useState(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search);
    }
    return new URLSearchParams();
  });
  const formKey = searchParams.get('form') || 'default';

  const [hackathon, setHackathon] = useState<any>(null);
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [files, setFiles] = useState<Record<string, File>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  // Store polls for poll_id field options
  const [polls, setPolls] = useState<Array<{ poll_id: string; name: string }>>([]);

  useEffect(() => {
    fetchHackathonAndForm();
  }, [hackathonId, formKey]);

  const fetchHackathonAndForm = async () => {
    try {
      // Fetch hackathon details
      const hackathonRes = await fetch(`/api/v1/public/hackathons/${hackathonId}`);
      if (hackathonRes.ok) {
        const hackathonData = await hackathonRes.json();
        setHackathon(hackathonData.hackathon);
      }

      // Fetch form fields filtered by form_key (e.g., ?form=team_formation)
      const formRes = await fetch(`/api/v1/public/hackathons/${hackathonId}/form?form=${formKey}`);
      if (formRes.ok) {
        const formData = await formRes.json();
        // For project_details form, filter out team_name, team_members, and description fields
        let fields = formData.fields;
        if (formKey === 'project_details') {
          fields = fields.filter((field: FormField) => 
            field.field_name !== 'team_name' && 
            field.field_name !== 'team_members' && 
            field.field_name !== 'team_description' &&
            field.field_name !== 'description'
          );
        }
        setFormFields(fields);

        // If there's a poll_id field, fetch available polls for this hackathon
        const hasPollField = formData.fields.some((f: FormField) => f.field_name === 'poll_id');
        if (hasPollField) {
          try {
            // Fetch polls from public API
            const pollsRes = await fetch(`/api/v1/public/hackathons/${hackathonId}/polls`);
            if (pollsRes.ok) {
              const pollsData = await pollsRes.json();
              setPolls(pollsData.polls || []);
            }
          } catch (err) {
            console.error('Error fetching polls:', err);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching hackathon:', error);
      setError('Failed to load hackathon');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (fieldName: string, value: any) => {
    setFormData({ ...formData, [fieldName]: value });
  };

  const handleFileChange = (fieldName: string, file: File | null) => {
    if (file) {
      setFiles({ ...files, [fieldName]: file });
    } else {
      const newFiles = { ...files };
      delete newFiles[fieldName];
      setFiles(newFiles);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      // For project_details form, skip team member validation
      // Team lead verification is done on the server side
      const isProjectDetailsForm = formKey === 'project_details';
      
      // Validate team members fields - ensure at least one team lead is selected
      // Skip this validation for project_details form
      if (!isProjectDetailsForm) {
        for (const field of formFields) {
          if (field.field_type === 'team_members' && field.is_required) {
            const members = formData[field.field_name];
            if (!members || !Array.isArray(members) || members.length === 0) {
              setError(`Please add at least one team member for ${field.field_label}`);
              setSubmitting(false);
              return;
            }
            
            // Check if at least one member is marked as team lead
            const hasTeamLead = members.some((member: any) => member.isLead === true);
            if (!hasTeamLead) {
              setError(`Please designate at least one team member as Team Lead for ${field.field_label}`);
              setSubmitting(false);
              return;
            }
            
            // Validate required fields for each member
            for (let i = 0; i < members.length; i++) {
              const member = members[i];
              if (!member.email || !member.firstName || !member.lastName) {
                setError(`Please fill in all required fields for team member ${i + 1} in ${field.field_label}`);
                setSubmitting(false);
                return;
              }
            }
          }
        }
      }
      
      // For project_details form, ensure email is provided for team lead verification
      if (isProjectDetailsForm) {
        const submitterEmail = formData.submitted_by || formData.email;
        if (!submitterEmail) {
          setError('Email is required. Only team leads can submit project details.');
          setSubmitting(false);
          return;
        }
      }

      const submitFormData = new FormData();

      // Extract poll_id if provided (for project submissions)
      const pollId = formData.poll_id || null;

      // Add form data (excluding poll_id from JSON, it will be handled separately)
      // For project_details form, also exclude team-related fields
      for (const [key, value] of Object.entries(formData)) {
        if (key === 'poll_id') {
          // poll_id is handled separately in the API
          continue;
        }
        // For project_details form, exclude team-related fields
        if (isProjectDetailsForm && 
            (key === 'team_name' || key === 'team_members' || key === 'team_description' || key === 'description')) {
          continue;
        }
        if (typeof value === 'object') {
          submitFormData.append(key, JSON.stringify(value));
        } else {
          submitFormData.append(key, value);
        }
      }

      // Add poll_id explicitly if provided
      if (pollId) {
        submitFormData.append('poll_id', pollId);
      }

      // Add files
      for (const [key, file] of Object.entries(files)) {
        submitFormData.append(key, file);
      }

      const response = await fetch(`/api/v1/public/hackathons/${hackathonId}/submit`, {
        method: 'POST',
        body: submitFormData,
      });

      if (response.ok) {
        setSubmitted(true);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Submission failed');
      }
    } catch (error: any) {
      console.error('Submission error:', error);
      setError('Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (field: FormField) => {
    const commonProps = {
      id: field.field_name,
      required: field.is_required,
      className: 'w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent',
    };

    switch (field.field_type) {
      case 'text':
        return (
          <input
            type="text"
            {...commonProps}
            value={formData[field.field_name] || ''}
            onChange={(e) => handleInputChange(field.field_name, e.target.value)}
            placeholder={field.field_description || ''}
          />
        );

      case 'long_text':
        return (
          <textarea
            {...commonProps}
            rows={4}
            value={formData[field.field_name] || ''}
            onChange={(e) => handleInputChange(field.field_name, e.target.value)}
            placeholder={field.field_description || ''}
          />
        );

      case 'url':
        return (
          <input
            type="url"
            {...commonProps}
            value={formData[field.field_name] || ''}
            onChange={(e) => handleInputChange(field.field_name, e.target.value)}
            placeholder={field.field_description || 'https://'}
          />
        );

      case 'file':
        return (
          <div>
            <input
              type="file"
              {...commonProps}
              onChange={(e) => handleFileChange(field.field_name, e.target.files?.[0] || null)}
              accept={field.validation_rules?.allowedTypes?.join(',') || '*'}
            />
            {files[field.field_name] && (
              <p className="text-sm text-gray-600 mt-2">
                Selected: {files[field.field_name].name} ({(files[field.field_name].size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
            <p className="text-xs text-gray-500 mt-1">Max file size: 5MB</p>
          </div>
        );

      case 'select':
        // Special handling for poll_id field: show poll names instead of IDs
        if (field.field_name === 'poll_id') {
          return (
            <select
              {...commonProps}
              value={formData[field.field_name] || ''}
              onChange={(e) => {
                // Extract poll_id from "poll_id:poll_name" format or use value directly
                const value = e.target.value;
                const pollId = value.includes(':') ? value.split(':')[0] : value;
                handleInputChange(field.field_name, pollId || null);
              }}
            >
              <option value="">General Hackathon Submission (No specific poll)</option>
              {polls.map((poll) => (
                <option key={poll.poll_id} value={poll.poll_id}>
                  {poll.name}
                </option>
              ))}
            </select>
          );
        }
        // Standard select field
        return (
          <select
            {...commonProps}
            value={formData[field.field_name] || ''}
            onChange={(e) => handleInputChange(field.field_name, e.target.value)}
          >
            <option value="">Select an option</option>
            {field.field_options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      /**
       * Specialised UI for team member collection.
       * This renders a small table where each row represents a team member
       * and allows one member to be marked as the team lead.
       */
      case 'team_members': {
        type TeamMemberRow = {
          email: string;
          firstName: string;
          lastName: string;
          phone: string;
          role: string;
          isLead: boolean;
        };

        // Initialize with one empty member row if no data exists
        // First member defaults to team lead if it's the only member
        let members: TeamMemberRow[] = formData[field.field_name] || [];
        
        // Ensure at least one member exists
        if (members.length === 0) {
          members = [{ email: '', firstName: '', lastName: '', phone: '', role: '', isLead: true }];
        }
        
        // If no member is marked as lead and there's at least one member, mark the first as lead
        const hasLead = members.some(m => m.isLead === true);
        if (!hasLead && members.length > 0) {
          members = members.map((m, idx) => ({ ...m, isLead: idx === 0 }));
          // Update form data to reflect this change
          handleInputChange(field.field_name, members);
        }

        const updateMember = (index: number, patch: Partial<TeamMemberRow>) => {
          const next = members.map((member, idx) =>
            idx === index ? { ...member, ...patch } : member,
          );
          // Ensure only one lead at a time.
          if (patch.isLead) {
            for (let i = 0; i < next.length; i += 1) {
              next[i].isLead = i === index;
            }
          }
          handleInputChange(field.field_name, next);
        };

        const addMember = () => {
          const next = [
            ...members,
            { email: '', firstName: '', lastName: '', phone: '', role: 'Member', isLead: false },
          ];
          handleInputChange(field.field_name, next);
        };

        const removeMember = (index: number) => {
          const next = members.filter((_, idx) => idx !== index);
          // If we removed the team lead and there are still members, make the first one the lead
          if (members[index].isLead && next.length > 0) {
            next[0].isLead = true;
          }
          // Ensure at least one member remains
          if (next.length === 0) {
            next.push({ email: '', firstName: '', lastName: '', phone: '', role: '', isLead: true });
          }
          handleInputChange(field.field_name, next);
        };

        return (
          <div className="space-y-4">
            {/* Header with instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-900 font-medium mb-1">
                📋 Team Member Information
              </p>
              <p className="text-xs text-blue-800">
                Add each team member with their details. One member must be designated as the Team Lead.
              </p>
            </div>

            {/* Team Member Cards */}
            {members.map((member, index) => (
              <div
                key={index}
                className={`border-2 rounded-lg p-5 transition-all ${
                  member.isLead 
                    ? 'border-blue-500 bg-blue-50 shadow-md' 
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                {/* Member Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                      member.isLead 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-200 text-gray-700'
                    }`}>
                      {index + 1}
                    </div>
                    <h4 className="font-semibold text-gray-900">
                      Team Member {index + 1}
                      {member.isLead && (
                        <span className="ml-2 px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                          Team Lead
                        </span>
                      )}
                    </h4>
                  </div>
                  {members.length > 1 && (
                    <button
                      type="button"
                      className="text-xs text-red-600 hover:text-red-800 font-medium px-2 py-1 hover:bg-red-50 rounded"
                      onClick={() => removeMember(index)}
                    >
                      Remove
                    </button>
                  )}
                </div>

                {/* Member Fields Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      className={commonProps.className}
                      value={member.email}
                      placeholder="member@example.com"
                      required={index === 0}
                      onChange={(event) =>
                        updateMember(index, { email: event.target.value })
                      }
                    />
                  </div>

                  {/* First Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      className={commonProps.className}
                      value={member.firstName}
                      placeholder="John"
                      required={index === 0}
                      onChange={(event) =>
                        updateMember(index, { firstName: event.target.value })
                      }
                    />
                  </div>

                  {/* Last Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      className={commonProps.className}
                      value={member.lastName}
                      placeholder="Doe"
                      required={index === 0}
                      onChange={(event) =>
                        updateMember(index, { lastName: event.target.value })
                      }
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      className={commonProps.className}
                      value={member.phone}
                      placeholder="+1234567890"
                      onChange={(event) =>
                        updateMember(index, { phone: event.target.value })
                      }
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Include country code (e.g., +1, +44)
                    </p>
                  </div>

                  {/* Role */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role
                    </label>
                    <input
                      type="text"
                      className={commonProps.className}
                      value={member.role}
                      placeholder="e.g., Developer, Designer, PM"
                      onChange={(event) =>
                        updateMember(index, { role: event.target.value })
                      }
                    />
                  </div>

                  {/* Team Lead Selection */}
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 p-3 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors w-full">
                      <input
                        type="radio"
                        name={`team-lead-${field.field_name}`}
                        className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500"
                        checked={member.isLead}
                        onChange={() => updateMember(index, { isLead: true })}
                      />
                      <div className="flex-1">
                        <span className={`text-sm font-medium ${
                          member.isLead ? 'text-blue-700' : 'text-gray-700'
                        }`}>
                          Designate as Team Lead
                        </span>
                        {member.isLead && (
                          <p className="text-xs text-blue-600 mt-0.5">
                            This member is the team lead
                          </p>
                        )}
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            ))}

            {/* Add Member Button */}
            <button
              type="button"
              className="w-full py-3 px-4 text-sm font-semibold text-blue-700 bg-blue-50 border-2 border-dashed border-blue-400 rounded-lg hover:bg-blue-100 hover:border-blue-500 transition-all flex items-center justify-center gap-2"
              onClick={addMember}
            >
              <span className="text-lg">+</span>
              Add Another Team Member
            </button>

            {/* Helper Text */}
            <p className="text-xs text-gray-500 text-center">
              You can add multiple team members. At least one member must be designated as the Team Lead.
            </p>
          </div>
        );
      }

      default:
        return (
          <input
            type="text"
            {...commonProps}
            value={formData[field.field_name] || ''}
            onChange={(e) => handleInputChange(field.field_name, e.target.value)}
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Submission Successful!</h1>
          <p className="text-gray-600 mb-6">
            Your project has been submitted to {hackathon?.name}. You'll receive confirmation via email.
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{hackathon?.name || 'Submit Your Project'}</h1>
          {hackathon?.description && (
            <p className="text-gray-600">{hackathon.description}</p>
          )}
          {hackathon?.submission_deadline && (
            <p className="text-sm text-gray-500 mt-2">
              Deadline: {new Date(hackathon.submission_deadline).toLocaleString()}
            </p>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
            {error}
          </div>
        )}

        {/* Submission Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Project Submission</h2>

          <div className="space-y-6">
            {formFields.map((field) => (
              <div key={field.field_id}>
                <label htmlFor={field.field_name} className="block text-sm font-medium text-gray-700 mb-2">
                  {field.field_label}
                  {field.is_required && <span className="text-red-500 ml-1">*</span>}
                </label>
                {field.field_description && (
                  <p className="text-sm text-gray-500 mb-2">{field.field_description}</p>
                )}
                {renderField(field)}
              </div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t">
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Submit Project
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
