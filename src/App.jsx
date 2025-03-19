import React, { useState, useEffect, createContext, useContext, useReducer } from 'react';

const FormBuilderContext = createContext();


const formReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_FIELD':
      return {
        ...state,
        fields: [...state.fields, { 
          id: Date.now().toString(), 
          ...action.payload 
        }]
      };
    case 'UPDATE_FIELD':
      return {
        ...state,
        fields: state.fields.map(field => 
          field.id === action.payload.id ? { ...field, ...action.payload } : field
        )
      };
    case 'REMOVE_FIELD':
      return {
        ...state,
        fields: state.fields.filter(field => field.id !== action.payload)
      };
    case 'REORDER_FIELDS':
      return {
        ...state,
        fields: action.payload
      };
    case 'SET_FORM_TITLE':
      return {
        ...state,
        title: action.payload
      };
    case 'LOAD_FORM':
      return action.payload;
    case 'RESET_FORM':
      return {
        title: 'Untitled Form',
        fields: []
      };
    default:
      return state;
  }
};

const FormBuilderProvider = ({ children }) => {
  const initialState = {
    title: 'Untitled Form',
    fields: []
  };

  const [formState, dispatch] = useReducer(formReducer, initialState);
  const [savedForms, setSavedForms] = useState([]);

  useEffect(() => {
    const storedForms = localStorage.getItem('savedForms');
    if (storedForms) {
      setSavedForms(JSON.parse(storedForms));
    }
  }, []);

  const saveForm = () => {
    const formToSave = {
      id: Date.now().toString(),
      ...formState
    };
    
    const updatedForms = [...savedForms.filter(form => 
      form.id !== formToSave.id), formToSave];
    
    setSavedForms(updatedForms);
    localStorage.setItem('savedForms', JSON.stringify(updatedForms));
    
    return formToSave.id;
  };

  const loadForm = (formId) => {
    const form = savedForms.find(form => form.id === formId);
    if (form) {
      dispatch({ type: 'LOAD_FORM', payload: form });
    }
  };

  const moveField = (index, direction) => {
    if (
      (direction === 'up' && index === 0) || 
      (direction === 'down' && index === formState.fields.length - 1)
    ) {
      return;
    }
    
    const newFields = [...formState.fields];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    [newFields[index], newFields[newIndex]] = [newFields[newIndex], newFields[index]];
    
    dispatch({ type: 'REORDER_FIELDS', payload: newFields });
  };

  return (
    <FormBuilderContext.Provider value={{
      formState,
      dispatch,
      savedForms,
      saveForm,
      loadForm,
      moveField
    }}>
      {children}
    </FormBuilderContext.Provider>
  );
};

const useFormBuilder = () => {
  const context = useContext(FormBuilderContext);
  if (!context) {
    throw new Error('useFormBuilder must be used within a FormBuilderProvider');
  }
  return context;
};

const fieldTypes = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'email', label: 'Email' },
  { value: 'date', label: 'Date' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'radio', label: 'Radio Buttons' },
  { value: 'select', label: 'Dropdown' },
  { value: 'textarea', label: 'Text Area' }
];

const FormBuilder = () => {
  const { formState, dispatch, savedForms, saveForm, loadForm, moveField } = useFormBuilder();
  const [selectedFormId, setSelectedFormId] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  const addField = (type) => {
    const newField = {
      type,
      label: `New ${type} field`,
      placeholder: '',
      required: false,
      options: type === 'radio' || type === 'select' ? [{ value: 'option1', label: 'Option 1' }] : []
    };
    
    dispatch({ type: 'ADD_FIELD', payload: newField });
  };

  const handleSaveForm = () => {
    const formId = saveForm();
    setSelectedFormId(formId);
    alert('Form saved successfully!');
  };

  const handleLoadForm = (e) => {
    const formId = e.target.value;
    if (formId) {
      loadForm(formId);
      setSelectedFormId(formId);
    }
  };

  const handleTitleChange = (e) => {
    dispatch({ type: 'SET_FORM_TITLE', payload: e.target.value });
  };

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Dynamic Form Builder</h1>
        <div className="flex gap-4">
          <button 
            onClick={() => setShowPreview(!showPreview)} 
            className="px-4 py-2 bg-purple-600 text-white rounded"
          >
            {showPreview ? 'Edit Form' : 'Preview Form'}
          </button>
          <button 
            onClick={handleSaveForm} 
            className="px-4 py-2 bg-green-600 text-white rounded"
          >
            Save Form
          </button>
        </div>
      </div>

      <div className="mb-6">
        <label className="block mb-2 font-semibold">Load a saved form:</label>
        <select 
          value={selectedFormId || ''} 
          onChange={handleLoadForm}
          className="w-full p-2 border rounded"
        >
          <option value="">Select a form</option>
          {savedForms.map(form => (
            <option key={form.id} value={form.id}>{form.title}</option>
          ))}
        </select>
      </div>

      <div className="mb-6">
        <label className="block mb-2 font-semibold">Form Title:</label>
        <input 
          type="text" 
          value={formState.title} 
          onChange={handleTitleChange}
          className="w-full p-2 border rounded"
          disabled={showPreview}
        />
      </div>

      {!showPreview ? (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-1 bg-gray-100 p-4 rounded">
            <h2 className="text-xl font-bold mb-4">Add Field</h2>
            <div className="space-y-2">
              {fieldTypes.map(fieldType => (
                <button
                  key={fieldType.value}
                  onClick={() => addField(fieldType.value)}
                  className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  {fieldType.label}
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-4 bg-white p-4 rounded border">
            <h2 className="text-xl font-bold mb-4">Form Fields</h2>
            {formState.fields.length === 0 ? (
              <div className="p-8 text-center text-gray-500 border-2 border-dashed rounded">
                Add fields from the left panel to build your form
              </div>
            ) : (
              <div className="space-y-4">
                {formState.fields.map((field, index) => (
                  <FieldEditor 
                    key={field.id} 
                    field={field} 
                    index={index}
                    moveField={moveField}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white p-6 rounded border">
          <h2 className="text-2xl font-bold mb-6">{formState.title}</h2>
          <FormPreview fields={formState.fields} />
        </div>
      )}
    </div>
  );
};

const FieldEditor = ({ field, index, moveField }) => {
  const { dispatch } = useFormBuilder();
  const [isExpanded, setIsExpanded] = useState(false);

  const updateField = (property, value) => {
    dispatch({
      type: 'UPDATE_FIELD',
      payload: { id: field.id, [property]: value }
    });
  };

  const removeField = () => {
    dispatch({ type: 'REMOVE_FIELD', payload: field.id });
  };

  const addOption = () => {
    const newOptions = [
      ...field.options,
      { value: `option${field.options.length + 1}`, label: `Option ${field.options.length + 1}` }
    ];
    updateField('options', newOptions);
  };

  const updateOption = (index, property, value) => {
    const newOptions = [...field.options];
    newOptions[index] = { ...newOptions[index], [property]: value };
    updateField('options', newOptions);
  };

  const removeOption = (index) => {
    const newOptions = field.options.filter((_, i) => i !== index);
    updateField('options', newOptions);
  };

  return (
    <div className="border p-4 rounded bg-gray-50">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <span className="font-bold">{field.type.charAt(0).toUpperCase() + field.type.slice(1)}</span>
          <span className="text-sm text-gray-500">({field.label})</span>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => moveField(index, 'up')} 
            className="p-1 bg-gray-200 rounded"
          >
            ↑
          </button>
          <button 
            onClick={() => moveField(index, 'down')} 
            className="p-1 bg-gray-200 rounded"
          >
            ↓
          </button>
          <button 
            onClick={() => setIsExpanded(!isExpanded)} 
            className="p-1 bg-gray-200 rounded"
          >
            {isExpanded ? '−' : '+'}
          </button>
          <button 
            onClick={removeField} 
            className="p-1 bg-red-500 text-white rounded"
          >
            ×
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-4">
          <div>
            <label className="block mb-1">Field Label:</label>
            <input 
              type="text" 
              value={field.label} 
              onChange={(e) => updateField('label', e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>

          {field.type !== 'checkbox' && field.type !== 'radio' && field.type !== 'select' && (
            <div>
              <label className="block mb-1">Placeholder:</label>
              <input 
                type="text" 
                value={field.placeholder || ''} 
                onChange={(e) => updateField('placeholder', e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>
          )}

          {(field.type === 'radio' || field.type === 'select') && (
            <div>
              <label className="block mb-1">Options:</label>
              <div className="space-y-2">
                {field.options.map((option, optionIndex) => (
                  <div key={optionIndex} className="flex gap-2">
                    <input 
                      type="text" 
                      value={option.label} 
                      onChange={(e) => updateOption(optionIndex, 'label', e.target.value)}
                      className="flex-grow p-2 border rounded"
                    />
                    <button 
                      onClick={() => removeOption(optionIndex)} 
                      className="p-2 bg-red-500 text-white rounded"
                      disabled={field.options.length <= 1}
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button 
                  onClick={addOption} 
                  className="p-2 bg-blue-500 text-white rounded"
                >
                  Add Option
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center">
            <input 
              type="checkbox" 
              id={`required-${field.id}`} 
              checked={field.required} 
              onChange={(e) => updateField('required', e.target.checked)}
              className="mr-2"
            />
            <label htmlFor={`required-${field.id}`}>Required field</label>
          </div>
        </div>
      )}
    </div>
  );
};

const FormPreview = ({ fields }) => {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});

  const handleChange = (fieldId, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
    
    if (errors[fieldId]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const newErrors = {};
    fields.forEach(field => {
      if (field.required && !formData[field.id]) {
        newErrors[field.id] = 'This field is required';
      }
    });
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    alert('Form submitted successfully!\n\n' + JSON.stringify(formData, null, 2));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {fields.map(field => (
        <div key={field.id} className="space-y-1">
          <label className="block font-medium">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          
          {field.type === 'text' && (
            <input 
              type="text" 
              placeholder={field.placeholder} 
              value={formData[field.id] || ''}
              onChange={(e) => handleChange(field.id, e.target.value)}
              className="w-full p-2 border rounded"
            />
          )}
          
          {field.type === 'number' && (
            <input 
              type="number" 
              placeholder={field.placeholder} 
              value={formData[field.id] || ''}
              onChange={(e) => handleChange(field.id, e.target.value)}
              className="w-full p-2 border rounded"
            />
          )}
          
          {field.type === 'email' && (
            <input 
              type="email" 
              placeholder={field.placeholder} 
              value={formData[field.id] || ''}
              onChange={(e) => handleChange(field.id, e.target.value)}
              className="w-full p-2 border rounded"
            />
          )}
          
          {field.type === 'date' && (
            <input 
              type="date" 
              value={formData[field.id] || ''}
              onChange={(e) => handleChange(field.id, e.target.value)}
              className="w-full p-2 border rounded"
            />
          )}
          
          {field.type === 'checkbox' && (
            <div className="flex items-center">
              <input 
                type="checkbox" 
                checked={formData[field.id] || false}
                onChange={(e) => handleChange(field.id, e.target.checked)}
                className="mr-2"
              />
              <span>{field.placeholder}</span>
            </div>
          )}
          
          {field.type === 'radio' && (
            <div className="space-y-2">
              {field.options.map((option, i) => (
                <div key={i} className="flex items-center">
                  <input 
                    type="radio" 
                    id={`${field.id}-${i}`}
                    name={field.id}
                    value={option.value}
                    checked={formData[field.id] === option.value}
                    onChange={() => handleChange(field.id, option.value)}
                    className="mr-2"
                  />
                  <label htmlFor={`${field.id}-${i}`}>{option.label}</label>
                </div>
              ))}
            </div>
          )}
          
          {field.type === 'select' && (
            <select 
              value={formData[field.id] || ''}
              onChange={(e) => handleChange(field.id, e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="">Select an option</option>
              {field.options.map((option, i) => (
                <option key={i} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}
          
          {field.type === 'textarea' && (
            <textarea 
              placeholder={field.placeholder} 
              value={formData[field.id] || ''}
              onChange={(e) => handleChange(field.id, e.target.value)}
              className="w-full p-2 border rounded"
              rows={4}
            />
          )}
          
          {errors[field.id] && (
            <p className="text-red-500 text-sm">{errors[field.id]}</p>
          )}
        </div>
      ))}
      
      {fields.length > 0 && (
        <button 
          type="submit" 
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Submit
        </button>
      )}
    </form>
  );
};

const App = () => {
  return (
    <FormBuilderProvider>
      <div className="min-h-screen bg-gray-100">
        <FormBuilder />
      </div>

    </FormBuilderProvider>
  );
};


export default App;

