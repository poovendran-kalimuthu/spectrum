import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import './Select.css';

const Select = ({ value, onChange, name, children, className, style, disabled, ...props }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Parse children to extract options
  const options = React.Children.toArray(children)
    .filter(child => child.type === 'option')
    .map(child => ({
      value: child.props.value,
      label: child.props.children,
      disabled: child.props.disabled
    }));

  const selectedOption = options.find(opt => opt.value === value) || options[0];

  const filteredOptions = options.filter(opt =>
    String(opt.label || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const safeHighlightedIndex = Math.min(
    Math.max(0, highlightedIndex),
    Math.max(0, filteredOptions.length - 1)
  );

  // Reset highlight to 0 when searchTerm changes
  useEffect(() => {
    setHighlightedIndex(0);
  }, [searchTerm]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const focusNextElement = (currentEl) => {
    const focusableSelector = 'input:not([disabled]):not([type=hidden]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]:not([disabled]), .custom-select-trigger:not(.disabled)';
    const focusables = Array.from(document.querySelectorAll(focusableSelector));
    const visibleFocusables = focusables.filter(el => {
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && window.getComputedStyle(el).display !== 'none';
    });
    const index = visibleFocusables.indexOf(currentEl);
    if (index !== -1 && index < visibleFocusables.length - 1) {
      visibleFocusables[index + 1].focus();
    }
  };

  const handleSelect = (option) => {
    if (disabled || option.disabled) return;
    if (onChange) {
      onChange({
        target: { name, value: option.value }
      });
    }
    setIsOpen(false);
    setSearchTerm('');
    // Automatically focus the next element
    setTimeout(() => {
      if (containerRef.current) {
        focusNextElement(containerRef.current);
      }
    }, 50);
  };

  const handleKeyDown = (e) => {
    if (disabled) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else {
        setHighlightedIndex(prev => Math.min(filteredOptions.length - 1, prev + 1));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (isOpen) {
        setHighlightedIndex(prev => Math.max(0, prev - 1));
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (isOpen) {
        if (filteredOptions[safeHighlightedIndex]) {
          handleSelect(filteredOptions[safeHighlightedIndex]);
        }
      } else {
        setIsOpen(true);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      setSearchTerm('');
    } else if (e.key === 'Tab') {
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  const cleanClassName = (className || '')
    .replace(/\bform-select\b/g, '')
    .replace(/\baud-select\b/g, '')
    .replace(/\bcp-select\b/g, '')
    .replace(/\baal-select\b/g, '')
    .trim();

  const isInline = (className || '').includes('aud-select') || (className || '').includes('aal-select');
  const containerStyle = { ...style };
  if (isInline) {
    containerStyle.minWidth = '140px';
    containerStyle.width = 'auto';
  }

  const handleTriggerClick = (e) => {
    if (disabled) return;
    if (e.target !== inputRef.current) {
      setIsOpen(!isOpen);
    }
  };

  return (
    <div className={`custom-select-container ${cleanClassName}`} style={containerStyle} ref={containerRef}>
      <select name={name} value={value} onChange={onChange} style={{ display: 'none' }} disabled={disabled} {...props}>
        {children}
      </select>
      
      <div 
        className={`custom-select-trigger ${isOpen ? 'open' : ''} ${disabled ? 'disabled' : ''}`}
        onClick={handleTriggerClick}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', position: 'relative' }}
      >
        <input
          ref={inputRef}
          type="text"
          disabled={disabled}
          value={isOpen ? searchTerm : (selectedOption ? selectedOption.label : '')}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            if (!disabled) {
              setIsOpen(true);
              setSearchTerm('');
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={selectedOption ? selectedOption.label : 'Select...'}
          style={{
            border: 'none',
            background: 'transparent',
            width: '100%',
            outline: 'none',
            fontSize: 'inherit',
            fontFamily: 'inherit',
            color: 'inherit',
            padding: 0,
            cursor: disabled ? 'not-allowed' : 'text'
          }}
        />
        <ChevronDown size={16} className="custom-select-icon" style={{ pointerEvents: 'none', marginLeft: '8px' }} />
      </div>

      {isOpen && !disabled && (
        <div className="custom-select-dropdown animate-scale-in">
          <ul className="custom-select-list" style={{ maxHeight: '200px', overflowY: 'auto', margin: 0, padding: '4px' }}>
            {filteredOptions.length === 0 ? (
              <li style={{ padding: '8px 12px', fontSize: '0.78rem', color: 'var(--clr-text-muted)', textAlign: 'center' }}>
                No options found
              </li>
            ) : (
              filteredOptions.map((opt, i) => (
                <li 
                  key={i}
                  className={`custom-select-item ${opt.value === value ? 'selected' : ''} ${opt.disabled ? 'disabled' : ''} ${i === safeHighlightedIndex ? 'highlighted' : ''}`}
                  onClick={() => handleSelect(opt)}
                  onMouseEnter={() => setHighlightedIndex(i)}
                  style={{
                    padding: '6px 10px',
                    fontSize: '0.78rem',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    background: i === safeHighlightedIndex ? 'var(--clr-surface-2)' : (opt.value === value ? 'var(--clr-accent-light)' : 'transparent'),
                    color: opt.value === value ? 'var(--clr-accent)' : 'var(--clr-text-heading)',
                    fontWeight: opt.value === value ? '600' : 'normal'
                  }}
                >
                  {opt.label}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Select;
