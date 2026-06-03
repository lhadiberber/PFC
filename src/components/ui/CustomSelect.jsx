import React, { useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";

function getOptionLabel(option) {
  const children = option.props.children;
  if (Array.isArray(children)) {
    return children.join("");
  }
  return children;
}

function getOptionValue(option) {
  return option.props.value ?? getOptionLabel(option);
}

function collectOptions(children) {
  const options = [];

  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;

    if (child.type === "option") {
      options.push(child);
      return;
    }

    if (child.props?.children) {
      options.push(...collectOptions(child.props.children));
    }
  });

  return options;
}

export default function CustomSelect({
  children,
  className = "",
  disabled = false,
  id,
  name,
  onChange,
  required = false,
  value = "",
  ...rest
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef(null);
  const optionItems = useMemo(
    () =>
      collectOptions(children)
        .map((option) => ({
          disabled: Boolean(option.props.disabled),
          label: getOptionLabel(option),
          value: String(getOptionValue(option)),
        })),
    [children]
  );
  const selectedValue = String(value ?? "");
  const selectedOption =
    optionItems.find((option) => option.value === selectedValue) || optionItems[0];

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const emitChange = (nextValue) => {
    if (onChange) {
      onChange({
        target: {
          id,
          name,
          value: nextValue,
        },
      });
    }
  };

  const handleSelect = (option) => {
    if (option.disabled) return;
    emitChange(option.value);
    setIsOpen(false);
  };

  return (
    <div
      ref={selectRef}
      className={`custom-select ${disabled ? "is-disabled" : ""}`.trim()}
      data-required={required ? "true" : undefined}
    >
      {name ? <input type="hidden" name={name} value={selectedValue} /> : null}
      <button
        {...rest}
        id={id}
        type="button"
        className={`custom-select-trigger ${className}`.trim()}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => {
          if (!disabled) {
            setIsOpen((current) => !current);
          }
        }}
      >
        <span className="custom-select-value">{selectedOption?.label || ""}</span>
        <svg
          className={`custom-select-chevron ${isOpen ? "open" : ""}`.trim()}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      <ul className={`custom-select-menu ${isOpen ? "open" : ""}`.trim()} role="listbox">
        {optionItems.map((option) => (
          <li
            key={`${option.value}-${option.label}`}
            className={`${option.value === selectedValue ? "active" : ""} ${
              option.disabled ? "is-disabled" : ""
            }`.trim()}
            role="option"
            aria-selected={option.value === selectedValue}
            aria-disabled={option.disabled}
            tabIndex={isOpen && !option.disabled ? 0 : -1}
            onClick={() => handleSelect(option)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                handleSelect(option);
              }
            }}
          >
            {option.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

CustomSelect.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  disabled: PropTypes.bool,
  id: PropTypes.string,
  name: PropTypes.string,
  onChange: PropTypes.func,
  required: PropTypes.bool,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};
