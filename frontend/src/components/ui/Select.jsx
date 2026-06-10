import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import './Select.css';

const Select = ({ value, onChange, name, children, className, style, disabled, ...props }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Parse children to extract options
  const options = React.Children.toArray(children)
    .filter(child => child.type === 'option')
    .map(child => ({
      value: child.props.value,
      label: child.props.children,
      disabled: child.props.disabled
    }));

  const selectedOption = options.find(opt => opt.value === value) || options[0];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (option) => {
    if (disabled || option.disabled) return;
    setIsOpen(false);
    if (onChange) {
      // Simulate event object
      onChange({
        target: { name, value: option.value }
      });
    }
  };

  const cleanClassName = (className || '')
    .replace(/\bform-select\b/g, '')
    .replace(/\baud-select\b/g, '')
    .replace(/\bcp-select\b/g, '')
    .replace(/\baal-select\b/g, '')
    .trim();

  // Determine if it should be auto-width based on old classes
  const isInline = (className || '').includes('aud-select') || (className || '').includes('aal-select');
  const containerStyle = { ...style };
  if (isInline) {
    containerStyle.minWidth = '140px';
    containerStyle.width = 'auto';
  }

  return (
    <div className={`custom-select-container ${cleanClassName}`} style={containerStyle} ref={containerRef}>
      {/* Hidden native select for form submissions / accessibility */}
      <select name={name} value={value} onChange={onChange} style={{ display: 'none' }} disabled={disabled} {...props}>
        {children}
      </select>
      
      <div 
        className={`custom-select-trigger ${isOpen ? 'open' : ''} ${disabled ? 'disabled' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className="custom-select-value">{selectedOption ? selectedOption.label : 'Select...'}</span>
        <ChevronDown size={16} className="custom-select-icon" />
      </div>

      {isOpen && !disabled && (
        <div className="custom-select-dropdown animate-scale-in">
          <ul className="custom-select-list">
            {options.map((opt, i) => (
              <li 
                key={i}
                className={`custom-select-item ${opt.value === value ? 'selected' : ''} ${opt.disabled ? 'disabled' : ''}`}
                onClick={() => handleSelect(opt)}
              >
                {opt.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Select;
