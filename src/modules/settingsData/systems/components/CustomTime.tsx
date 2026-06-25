/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";

export const CustomTimeDropdown = ({ value, options, onChange, disabled }: any) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          className="w-16 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-lg font-bold text-center text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
        >
          {value}
        </button>

        {isOpen && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          ></div>
        )}

        {isOpen && !disabled && (
          <div className="absolute top-full left-0 mt-1 w-full max-h-40 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 hide-scrollbar">
            {options.map((opt: string) => (
              <div
                key={opt}
                onClick={() => {
                  onChange(opt);
                  setIsOpen(false);
                }}
                className="px-2 py-2 text-gray-800 dark:text-white text-center text-sm font-bold hover:bg-emerald-50 dark:hover:bg-gray-700 cursor-pointer"
              >
                {opt}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };